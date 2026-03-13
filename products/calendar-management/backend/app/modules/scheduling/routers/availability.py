"""
Availability API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database
from ..services.availability_calculator import AvailabilityCalculator

router = APIRouter(prefix="/api/v1/availability", tags=["availability"])


@router.get("/aggregate")
def get_availability_aggregate(
    institution_id: Optional[str] = Query(None),
    company_ids: Optional[str] = Query(None),
    process_stage: Optional[str] = Query("BEFORE_APPLICATIONS"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """System admin: aggregate calendar slots and timetable blocks with availability summary."""
    from datetime import datetime
    slots_query = db.query(models.CalendarSlot)
    blocks_query = db.query(models.TimetableBlock)

    if institution_id:
        slots_query = slots_query.filter(models.CalendarSlot.institution_id == institution_id)
        # TimetableBlock: filter by students in institution
        student_ids = [r[0] for r in db.query(models.User.id).filter(
            models.User.institution_id == institution_id,
            models.User.role == "CANDIDATE"
        ).all()]
        if student_ids:
            blocks_query = blocks_query.filter(models.TimetableBlock.student_id.in_(student_ids))
        else:
            blocks_query = blocks_query.filter(1 == 0)

    if company_ids:
        cids = [c.strip() for c in company_ids.split(",") if c.strip()]
        if cids:
            slots_query = slots_query.filter(models.CalendarSlot.company_id.in_(cids))

    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            slots_query = slots_query.filter(models.CalendarSlot.start_time >= start_dt)
        except Exception:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            slots_query = slots_query.filter(models.CalendarSlot.end_time <= end_dt)
        except Exception:
            pass

    slots = slots_query.all()
    blocks = blocks_query.all()

    # Build slot summaries with availability if company_ids provided
    slot_summaries = []
    cids = [c.strip() for c in (company_ids or "").split(",") if c.strip()]
    calculator = AvailabilityCalculator(db) if cids else None

    for slot in slots:
        s = {
            "id": slot.id,
            "start_time": slot.start_time.isoformat() if slot.start_time else None,
            "end_time": slot.end_time.isoformat() if slot.end_time else None,
            "slot_type": slot.slot_type,
            "status": slot.status,
            "company_id": slot.company_id,
            "institution_id": slot.institution_id,
        }
        if calculator and cids and slot.company_id in cids:
            try:
                av = calculator.calculate_availability(slot.id, slot.company_id, process_stage or "BEFORE_APPLICATIONS")
                s["available"] = av.get("availability_count", 0)
                s["unavailable"] = av.get("unavailable_count", 0)
                s["total_candidates"] = av.get("total_count", 0)
                s["timetable_blocked"] = av.get("timetable_blocked", 0)
                s["other_company_booked"] = av.get("other_company_booked", 0)
            except Exception:
                s["available"] = s["unavailable"] = s["total_candidates"] = s["timetable_blocked"] = s["other_company_booked"] = 0
        slot_summaries.append(s)

    total_available = sum(s.get("available", 0) for s in slot_summaries)
    total_tentative = sum(s.get("other_company_booked", 0) for s in slot_summaries)
    total_unavailable = sum(s.get("timetable_blocked", s.get("unavailable", 0)) for s in slot_summaries)
    if total_tentative == 0 and all("timetable_blocked" not in s for s in slot_summaries):
        total_unavailable = sum(s.get("unavailable", 0) for s in slot_summaries)

    return {
        "slots": slot_summaries,
        "timetable_blocks": [
            {"id": b.id, "student_id": b.student_id, "day_of_week": b.day_of_week, "block_type": b.block_type}
            for b in blocks[:500]
        ],
        "summary": {
            "total_slots": len(slots),
            "total_blocks": len(blocks),
            "total_available": total_available,
            "total_unavailable": total_unavailable,
            "total_tentative": total_tentative,
        },
    }

@router.get("/slot/{slot_id}")
def get_slot_availability(
    slot_id: str,
    company_id: str = Query(...),
    process_stage: str = Query("BEFORE_APPLICATIONS"),
    db: Session = Depends(database.get_db)
):
    """Get availability details for a slot"""
    calculator = AvailabilityCalculator(db)
    availability = calculator.calculate_availability(slot_id, company_id, process_stage)
    unavailable_students = calculator.get_unavailable_students(slot_id, company_id)
    
    return {
        **availability,
        "unavailable_details": unavailable_students
    }

@router.get("/student/{student_id}")
def get_student_availability(
    student_id: str,
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Get student availability calendar"""
    from datetime import datetime
    
    # Get student timetable blocks
    blocks = db.query(models.TimetableBlock).filter(
        models.TimetableBlock.student_id == student_id
    ).all()
    
    # Get slots booked by companies (where student might be unavailable)
    # This would require checking applications/shortlists
    # For now, return timetable blocks
    
    return {
        "student_id": student_id,
        "timetable_blocks": [
            {
                "id": block.id,
                "day_of_week": block.day_of_week,
                "start_time": block.start_time,
                "end_time": block.end_time,
                "block_type": block.block_type,
                "recurring": block.recurring
            }
            for block in blocks
        ]
    }


@router.get("/student-slots")
def get_student_relevant_slots(
    student_id: str = Query(...),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Slots from companies/workflows the student has applied to or is shortlisted for."""
    from datetime import datetime, timedelta
    # Get student's applications (workflow_ids)
    apps = db.query(models.Application).filter(
        models.Application.student_id == student_id,
        models.Application.status.in_(["SUBMITTED", "IN_PROGRESS", "SHORTLISTED"])
    ).all()
    workflow_ids = list({a.workflow_id for a in apps})
    if not workflow_ids:
        return {"slots": [], "student_id": student_id}

    # Get job_ids from workflows
    workflows = db.query(models.Workflow).filter(models.Workflow.id.in_(workflow_ids)).all()
    job_ids = list({w.job_id for w in workflows if w.job_id})
    if not job_ids:
        return {"slots": [], "student_id": student_id}

    # Get calendar slots for those jobs
    query = db.query(models.CalendarSlot).filter(models.CalendarSlot.job_id.in_(job_ids))
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(models.CalendarSlot.start_time >= start_dt)
        except Exception:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(models.CalendarSlot.end_time <= end_dt)
        except Exception:
            pass
    slots = query.all()
    return {
        "student_id": student_id,
        "slots": [
            {
                "id": s.id,
                "start_time": s.start_time.isoformat() if s.start_time else None,
                "end_time": s.end_time.isoformat() if s.end_time else None,
                "slot_type": s.slot_type,
                "status": s.status,
                "company_id": s.company_id,
                "job_id": s.job_id,
            }
            for s in slots
        ],
    }
