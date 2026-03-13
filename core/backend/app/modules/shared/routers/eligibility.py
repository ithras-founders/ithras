"""Placement eligibility API: evaluate, override requests."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from .. import models, database
from ..auth import get_current_user, require_permission_with_subscription

router = APIRouter(prefix="/api/v1/eligibility", tags=["eligibility"])


class OverrideCreate(BaseModel):
    student_id: str
    job_id: Optional[str] = None
    cycle_id: Optional[str] = None
    reason: Optional[str] = None


def _evaluate_job_eligibility(student: models.User, job: models.JobPosting) -> tuple[bool, list[str]]:
    """Evaluate student against job min_cgpa, max_backlogs. Returns (eligible, reasons)."""
    reasons = []
    if job.min_cgpa is not None and student.cgpa is not None:
        if student.cgpa < job.min_cgpa:
            reasons.append(f"CGPA {student.cgpa} below minimum {job.min_cgpa}")
    backlogs = getattr(student, "backlog_count", 0) or 0
    if job.max_backlogs is not None and backlogs > job.max_backlogs:
        reasons.append(f"Backlogs {backlogs} exceed maximum {job.max_backlogs}")
    return (len(reasons) == 0, reasons)


@router.get("/evaluate")
def evaluate_eligibility(
    student_id: str = Query(...),
    job_id: Optional[str] = Query(None),
    cycle_id: Optional[str] = Query(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Evaluate whether a student is eligible for a job/cycle. Uses job-level rules (min_cgpa, max_backlogs)."""
    student = db.query(models.User).filter(models.User.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if job_id:
        job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        eligible, reasons = _evaluate_job_eligibility(student, job)
        return {"eligible": eligible, "reasons": reasons, "job_id": job_id}
    if cycle_id:
        # Cycle-level: check batch eligibility via policy
        from ..services.governance_engine import check_batch_eligibility
        ok, err = check_batch_eligibility(student_id, cycle_id, db)
        return {"eligible": ok, "reasons": [err] if not ok else [], "cycle_id": cycle_id}

    raise HTTPException(status_code=400, detail="Provide job_id or cycle_id")


@router.get("/override-requests")
def list_override_requests(
    status: Optional[str] = Query(None),
    cycle_id: Optional[str] = Query(None),
    current_user=Depends(require_permission_with_subscription("placement.eligibility.view")),
    db: Session = Depends(database.get_db),
):
    """List eligibility override requests (placement team)."""
    query = db.query(models.EligibilityOverrideRequest)
    if status:
        query = query.filter(models.EligibilityOverrideRequest.status == status)
    if cycle_id:
        query = query.filter(models.EligibilityOverrideRequest.cycle_id == cycle_id)
    items = query.order_by(models.EligibilityOverrideRequest.created_at.desc()).limit(50).all()
    return {"items": [{"id": r.id, "student_id": r.student_id, "job_id": r.job_id, "cycle_id": r.cycle_id, "status": r.status, "reason": r.reason} for r in items]}


@router.post("/override-requests")
def create_override_request(
    data: OverrideCreate,
    current_user=Depends(require_permission_with_subscription("placement.eligibility.override")),
    db: Session = Depends(database.get_db),
):
    """Request eligibility override for a student."""
    req_id = f"eor_{uuid.uuid4().hex[:16]}"
    req = models.EligibilityOverrideRequest(
        id=req_id,
        student_id=data.student_id,
        job_id=data.job_id,
        cycle_id=data.cycle_id,
        requested_by=current_user.id,
        reason=data.reason,
        status="PENDING",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"id": req.id, "student_id": req.student_id, "status": req.status}


@router.put("/override-requests/{request_id}/approve")
def approve_override(
    request_id: str,
    current_user=Depends(require_permission_with_subscription("placement.eligibility.override")),
    db: Session = Depends(database.get_db),
):
    """Approve an eligibility override request."""
    import datetime
    req = db.query(models.EligibilityOverrideRequest).filter(models.EligibilityOverrideRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Override request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")
    req.status = "APPROVED"
    req.decided_by = current_user.id
    req.decided_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Approved", "id": req.id}


@router.put("/override-requests/{request_id}/reject")
def reject_override(
    request_id: str,
    current_user=Depends(require_permission_with_subscription("placement.eligibility.override")),
    db: Session = Depends(database.get_db),
):
    """Reject an eligibility override request."""
    import datetime
    req = db.query(models.EligibilityOverrideRequest).filter(models.EligibilityOverrideRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Override request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request already processed")
    req.status = "REJECTED"
    req.decided_by = current_user.id
    req.decided_at = datetime.datetime.utcnow()
    db.commit()
    return {"message": "Rejected", "id": req.id}
