"""
Calendar Slots API Router
"""
import sys
import os
# Add core backend to path for imports
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from app.modules.shared import models, database, schemas
from ..services.availability_calculator import AvailabilityCalculator

router = APIRouter(prefix="/api/v1/calendar-slots", tags=["calendar-slots"])

@router.get("/", response_model=List[schemas.CalendarSlotSchema])
def get_calendar_slots(
    company_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Get calendar slots with optional filtering"""
    query = db.query(models.CalendarSlot)
    
    if company_id:
        query = query.filter(models.CalendarSlot.company_id == company_id)
    if institution_id:
        query = query.filter(models.CalendarSlot.institution_id == institution_id)
    if job_id:
        query = query.filter(models.CalendarSlot.job_id == job_id)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
            query = query.filter(models.CalendarSlot.start_time >= start_dt)
        except:
            pass
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
            query = query.filter(models.CalendarSlot.end_time <= end_dt)
        except:
            pass
    
    return query.all()

@router.get("/{slot_id}", response_model=schemas.CalendarSlotSchema)
def get_calendar_slot(slot_id: str, db: Session = Depends(database.get_db)):
    """Get a specific calendar slot"""
    slot = db.query(models.CalendarSlot).filter(models.CalendarSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Calendar slot not found")
    return slot

@router.get("/{slot_id}/availability")
def get_slot_availability(
    slot_id: str,
    company_id: str = Query(...),
    process_stage: str = Query("BEFORE_APPLICATIONS"),
    db: Session = Depends(database.get_db)
):
    """Get availability count for a slot"""
    calculator = AvailabilityCalculator(db)
    availability = calculator.calculate_availability(slot_id, company_id, process_stage)
    return availability

@router.post("/", response_model=schemas.CalendarSlotSchema)
def create_calendar_slot(
    slot_data: schemas.CalendarSlotCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Create a new calendar slot"""
    slot_id = f"slot_{uuid.uuid4().hex[:12]}"
    
    # Calculate duration if not provided
    if not slot_data.duration_minutes:
        duration = (slot_data.end_time - slot_data.start_time).total_seconds() / 60
    else:
        duration = slot_data.duration_minutes
    
    db_slot = models.CalendarSlot(
        id=slot_id,
        company_id=slot_data.company_id,
        job_id=slot_data.job_id,
        institution_id=slot_data.institution_id,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        duration_minutes=int(duration),
        slot_type=slot_data.slot_type or "INTERVIEW",
        max_capacity=slot_data.max_capacity,
        status=slot_data.status or "AVAILABLE"
    )
    
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot

@router.put("/{slot_id}", response_model=schemas.CalendarSlotSchema)
def update_calendar_slot(
    slot_id: str,
    slot_update: schemas.CalendarSlotUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a calendar slot"""
    db_slot = db.query(models.CalendarSlot).filter(models.CalendarSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="Calendar slot not found")
    
    for key, value in slot_update.dict(exclude_unset=True).items():
        setattr(db_slot, key, value)
    
    db.commit()
    db.refresh(db_slot)
    return db_slot

@router.delete("/{slot_id}")
def delete_calendar_slot(slot_id: str, db: Session = Depends(database.get_db)):
    """Cancel/delete a calendar slot"""
    db_slot = db.query(models.CalendarSlot).filter(models.CalendarSlot.id == slot_id).first()
    if not db_slot:
        raise HTTPException(status_code=404, detail="Calendar slot not found")
    
    db_slot.status = "CANCELLED"
    db.commit()
    return {"message": "Slot cancelled successfully"}

@router.post("/{slot_id}/book", response_model=schemas.SlotBookingSchema)
def book_slot(
    slot_id: str,
    booking_data: schemas.SlotBookingCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Book a calendar slot"""
    slot = db.query(models.CalendarSlot).filter(models.CalendarSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Calendar slot not found")
    
    if slot.status != "AVAILABLE":
        raise HTTPException(status_code=400, detail="Slot is not available for booking")
    
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    db_booking = models.SlotBooking(
        id=booking_id,
        slot_id=slot_id,
        company_id=booking_data.company_id,
        notes=booking_data.notes,
        status="CONFIRMED"
    )
    
    slot.status = "BOOKED"
    slot.booked_count = (slot.booked_count or 0) + 1
    
    db.add(db_booking)
    db.commit()
    db.refresh(db_booking)
    return db_booking
