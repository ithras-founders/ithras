"""
Schedule interview: create calendar slot and book candidate.
Bridges recruitment workflow with calendar.
"""
import os
import sys
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import models, database
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import get_current_user, require_role

router = APIRouter(prefix="/api/v1/recruitment", tags=["schedule"])


class ScheduleInterviewRequest(BaseModel):
    candidate_id: str
    application_id: str | None = None
    workflow_id: str
    job_id: str
    company_id: str
    institution_id: str
    start_time: str  # ISO 8601
    end_time: str | None = None
    duration_minutes: int = 30


@router.post("/schedule-interview")
def schedule_interview(
    req: ScheduleInterviewRequest,
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Create calendar slot and book it for the candidate. Links to application."""
    try:
        start_dt = datetime.fromisoformat(req.start_time.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid start_time format")
    end_dt = start_dt
    if req.end_time:
        try:
            end_dt = datetime.fromisoformat(req.end_time.replace("Z", "+00:00"))
        except ValueError:
            pass
    if end_dt <= start_dt:
        from datetime import timedelta
        end_dt = start_dt + timedelta(minutes=req.duration_minutes)

    slot_id = f"slot_{uuid.uuid4().hex[:12]}"
    slot = models.CalendarSlot(
        id=slot_id,
        company_id=req.company_id,
        job_id=req.job_id,
        institution_id=req.institution_id,
        start_time=start_dt,
        end_time=end_dt,
        duration_minutes=req.duration_minutes,
        slot_type="INTERVIEW",
        max_capacity=1,
        booked_count=0,
        status="AVAILABLE",
    )
    db.add(slot)

    notes = f"candidate_id={req.candidate_id}"
    if req.application_id:
        notes += f",application_id={req.application_id}"
    notes += f",workflow_id={req.workflow_id}"

    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    booking = models.SlotBooking(
        id=booking_id,
        slot_id=slot_id,
        company_id=req.company_id,
        notes=notes,
        status="CONFIRMED",
    )
    db.add(booking)
    slot.status = "BOOKED"
    slot.booked_count = 1

    log_audit(
        db, user_id=current_user.id, action="INTERVIEW_SCHEDULED",
        entity_type="slot_booking", entity_id=booking_id,
        company_id=req.company_id,
        details={"candidate_id": req.candidate_id, "application_id": req.application_id, "slot_id": slot_id},
    )
    db.commit()
    db.refresh(slot)
    db.refresh(booking)
    return {
        "slot_id": slot_id,
        "booking_id": booking_id,
        "start_time": slot.start_time.isoformat(),
        "end_time": slot.end_time.isoformat(),
    }
