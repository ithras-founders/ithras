"""
Availability Calculator Service
Calculates student availability for calendar slots based on process stage
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from datetime import datetime, timedelta
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models


class AvailabilityCalculator:
    """Calculate student availability for calendar slots"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_availability(
        self, 
        slot_id: str, 
        company_id: str, 
        process_stage: str = "BEFORE_APPLICATIONS"
    ) -> Dict[str, Any]:
        """
        Calculate availability count for a slot based on process stage
        
        Args:
            slot_id: Calendar slot ID
            company_id: Company ID requesting availability
            process_stage: Stage of the process (BEFORE_APPLICATIONS, APPLICATIONS_SUBMITTED, SHORTLISTED)
        
        Returns:
            Dict with availability_count, unavailable_count, and details
        """
        slot = self.db.query(models.CalendarSlot).filter(
            models.CalendarSlot.id == slot_id
        ).first()
        
        if not slot:
            return {"availability_count": 0, "unavailable_count": 0, "total_count": 0}
        
        institution_id = slot.institution_id
        
        # Get student pool based on process stage
        student_ids = self._get_student_pool(slot_id, company_id, process_stage, institution_id)
        
        if not student_ids:
            return {"availability_count": 0, "unavailable_count": 0, "total_count": 0}
        
        total_count = len(student_ids)
        
        # Get unavailable students
        unavailable_students = self.get_unavailable_students(slot_id, company_id, student_ids)
        timetable_blocked = sum(1 for u in unavailable_students if u.get("reason") == "TIMETABLE_BLOCKED")
        other_company = sum(1 for u in unavailable_students if u.get("reason") == "OTHER_COMPANY_BOOKED")
        unavailable_count = len(unavailable_students)
        available_count = total_count - unavailable_count

        return {
            "availability_count": available_count,
            "unavailable_count": unavailable_count,
            "total_count": total_count,
            "process_stage": process_stage,
            "timetable_blocked": timetable_blocked,
            "other_company_booked": other_company,
        }
    
    def _get_student_pool(
        self, 
        slot_id: str, 
        company_id: str, 
        process_stage: str, 
        institution_id: str
    ) -> List[str]:
        """
        Get the relevant student pool based on process stage
        
        Returns:
            List of student IDs
        """
        slot = self.db.query(models.CalendarSlot).filter(
            models.CalendarSlot.id == slot_id
        ).first()
        
        if not slot:
            return []
        
        # Base query: students in the institution
        base_query = self.db.query(models.User.id).filter(
            and_(
                models.User.role == "CANDIDATE",
                models.User.institution_id == institution_id
            )
        )
        
        if process_stage == "BEFORE_APPLICATIONS":
            # Total student pool
            return [row[0] for row in base_query.all()]
        
        elif process_stage == "APPLICATIONS_SUBMITTED":
            # Only applicants for this workflow/job
            if slot.job_id:
                # Get workflow from job
                job = self.db.query(models.JobPosting).filter(
                    models.JobPosting.id == slot.job_id
                ).first()
                
                if job:
                    # Try to find workflow by job_id
                    workflow = self.db.query(models.Workflow).filter(
                        models.Workflow.job_id == slot.job_id
                    ).first()
                    
                    if workflow:
                        applications = self.db.query(models.Application.student_id).filter(
                            models.Application.workflow_id == workflow.id
                        ).all()
                        return [row[0] for row in applications]
            
            # Fallback: all students if no workflow found
            return [row[0] for row in base_query.all()]
        
        elif process_stage == "SHORTLISTED":
            # Only shortlisted students for this workflow/job
            if slot.job_id:
                job = self.db.query(models.JobPosting).filter(
                    models.JobPosting.id == slot.job_id
                ).first()
                
                if job:
                    workflow = self.db.query(models.Workflow).filter(
                        models.Workflow.job_id == slot.job_id
                    ).first()
                    
                    if workflow:
                        # Get applications that are shortlisted or in progress
                        applications = self.db.query(models.Application.student_id).filter(
                            and_(
                                models.Application.workflow_id == workflow.id,
                                models.Application.status.in_(["SHORTLISTED", "IN_PROGRESS"])
                            )
                        ).all()
                        return [row[0] for row in applications]
            
            # Fallback: check shortlists table
            shortlists = self.db.query(models.Shortlist.candidate_id).filter(
                models.Shortlist.job_id == slot.job_id
            ).all()
            return [row[0] for row in shortlists]
        
        # Default: return all students
        return [row[0] for row in base_query.all()]
    
    def get_unavailable_students(
        self, 
        slot_id: str, 
        company_id: str, 
        student_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get list of unavailable students for a slot with reasons
        
        Args:
            slot_id: Calendar slot ID
            company_id: Company ID requesting availability
            student_ids: Optional list of student IDs to check (if None, checks all)
        
        Returns:
            List of dicts with student_id and reason
        """
        slot = self.db.query(models.CalendarSlot).filter(
            models.CalendarSlot.id == slot_id
        ).first()
        
        if not slot:
            return []
        
        unavailable = []
        
        # If student_ids not provided, get all students in institution
        if student_ids is None:
            students = self.db.query(models.User.id).filter(
                and_(
                    models.User.role == "CANDIDATE",
                    models.User.institution_id == slot.institution_id
                )
            ).all()
            student_ids = [row[0] for row in students]
        
        slot_start = slot.start_time
        slot_end = slot.end_time
        slot_day_of_week = slot_start.weekday()  # 0 = Monday, 6 = Sunday
        slot_start_time = slot_start.time()
        slot_end_time = slot_end.time()
        
        for student_id in student_ids:
            reason = self.check_student_availability(student_id, slot_id, company_id, slot)
            if reason:
                unavailable.append({
                    "student_id": student_id,
                    "reason": reason["reason"],
                    "related_company_id": reason.get("related_company_id")
                })
        
        return unavailable
    
    def check_student_availability(
        self, 
        student_id: str, 
        slot_id: str, 
        company_id: str,
        slot: Optional[models.CalendarSlot] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Check if a specific student is available for a slot
        
        Returns:
            None if available, dict with reason if unavailable
        """
        if slot is None:
            slot = self.db.query(models.CalendarSlot).filter(
                models.CalendarSlot.id == slot_id
            ).first()
        
        if not slot:
            return None
        
        slot_start = slot.start_time
        slot_end = slot.end_time
        slot_day_of_week = slot_start.weekday()
        slot_start_time = slot_start.time()
        slot_end_time = slot_end.time()
        
        # Check timetable blocks
        timetable_blocks = self.db.query(models.TimetableBlock).filter(
            and_(
                models.TimetableBlock.student_id == student_id,
                models.TimetableBlock.day_of_week == slot_day_of_week
            )
        ).all()
        
        for block in timetable_blocks:
            # Parse time strings (HH:MM format)
            block_start = datetime.strptime(block.start_time, "%H:%M").time()
            block_end = datetime.strptime(block.end_time, "%H:%M").time()
            
            # Check if slot overlaps with timetable block
            if self._times_overlap(slot_start_time, slot_end_time, block_start, block_end):
                # Check if block is active for this date
                if block.recurring:
                    if block.start_date and slot_start.date() < block.start_date.date():
                        continue
                    if block.end_date and slot_start.date() > block.end_date.date():
                        continue
                    return {
                        "reason": "TIMETABLE_BLOCKED",
                        "related_company_id": None
                    }
                else:
                    # Non-recurring: check if date matches
                    if block.start_date and slot_start.date() == block.start_date.date():
                        return {
                            "reason": "TIMETABLE_BLOCKED",
                            "related_company_id": None
                        }
        
        # Check if student is booked by another company for this slot
        other_bookings = self.db.query(models.SlotBooking).filter(
            and_(
                models.SlotBooking.slot_id == slot_id,
                models.SlotBooking.company_id != company_id,
                models.SlotBooking.status == "CONFIRMED"
            )
        ).all()
        
        # Check if this student has an application/shortlist with the booking company
        for booking in other_bookings:
            # Check if student has application/shortlist with that company
            booking_company = booking.company_id
            
            # Check applications
            applications = self.db.query(models.Application).filter(
                and_(
                    models.Application.student_id == student_id,
                    models.Application.workflow_id.in_(
                        self.db.query(models.Workflow.id).filter(
                            models.Workflow.company_id == booking_company
                        )
                    )
                )
            ).first()
            
            if applications:
                return {
                    "reason": "OTHER_COMPANY_BOOKED",
                    "related_company_id": booking_company
                }
            
            # Check shortlists
            shortlists = self.db.query(models.Shortlist).filter(
                and_(
                    models.Shortlist.candidate_id == student_id,
                    models.Shortlist.job_id.in_(
                        self.db.query(models.JobPosting.id).filter(
                            models.JobPosting.company_id == booking_company
                        )
                    )
                )
            ).first()
            
            if shortlists:
                return {
                    "reason": "OTHER_COMPANY_BOOKED",
                    "related_company_id": booking_company
                }
        
        return None  # Student is available
    
    def _times_overlap(
        self, 
        start1: datetime.time, 
        end1: datetime.time, 
        start2: datetime.time, 
        end2: datetime.time
    ) -> bool:
        """Check if two time ranges overlap"""
        return start1 < end2 and start2 < end1
