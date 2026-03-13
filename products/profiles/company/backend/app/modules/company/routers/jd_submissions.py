"""
JD Submissions API Router - full governed flow:
  Recruiter drafts JD -> creates submission -> PT reviews -> approves/rejects -> job goes live.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime
from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user, require_role
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/jd-submissions", tags=["jd-submissions"])


@router.get("/", summary="List JD submissions")
def list_jd_submissions(
    company_id: Optional[str] = Query(None),
    workflow_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="PENDING | APPROVED | REJECTED"),
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """List JD submissions with optional filters. status=PENDING for review queue."""
    query = db.query(models.JDSubmission)
    if company_id:
        query = query.filter(models.JDSubmission.company_id == company_id)
    if workflow_id:
        query = query.filter(models.JDSubmission.workflow_id == workflow_id)
    if status:
        if status == "PENDING":
            query = query.filter(models.JDSubmission.approved_at.is_(None))
        elif status == "APPROVED":
            query = query.filter(models.JDSubmission.approved_at.isnot(None))
    return query.order_by(models.JDSubmission.submitted_at.desc()).all()


@router.post("/", response_model=schemas.JDSubmissionSchema)
def create_jd_submission(
    submission_data: schemas.JDSubmissionCreateSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Recruiter submits JD and compensation form for PT review."""
    workflow = db.query(models.Workflow).filter(models.Workflow.id == submission_data.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")

    submission_id = f"jd_{uuid.uuid4().hex[:12]}"
    db_submission = models.JDSubmission(
        id=submission_id,
        workflow_id=submission_data.workflow_id,
        company_id=submission_data.company_id,
        job_title=submission_data.job_title,
        job_description=submission_data.job_description,
        sector=submission_data.sector,
        slot=submission_data.slot,
        fixed_comp=submission_data.fixed_comp,
        variable_comp=submission_data.variable_comp,
        esops_vested=submission_data.esops_vested,
        joining_bonus=submission_data.joining_bonus,
        performance_bonus=submission_data.performance_bonus,
        is_top_decile=submission_data.is_top_decile or False,
    )
    db.add(db_submission)

    approval_id = f"approval_{uuid.uuid4().hex[:12]}"
    db_approval = models.WorkflowApproval(
        id=approval_id,
        workflow_id=submission_data.workflow_id,
        company_id=submission_data.company_id,
        approval_type="JD_SUBMISSION",
        requested_by=current_user.id,
        requested_data={"submission_id": submission_id},
        status="PENDING",
    )
    db.add(db_approval)

    log_audit(
        db, user_id=current_user.id, action="JD_SUBMITTED",
        entity_type="jd_submission", entity_id=submission_id,
        company_id=submission_data.company_id,
        details={"job_title": submission_data.job_title},
    )
    db.commit()
    db.refresh(db_submission)
    return db_submission


@router.get("/{submission_id}", response_model=schemas.JDSubmissionSchema)
def get_jd_submission(submission_id: str, db: Session = Depends(database.get_db)):
    """Get a specific JD submission."""
    submission = db.query(models.JDSubmission).filter(models.JDSubmission.id == submission_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="JD submission not found")
    return submission


@router.put("/{submission_id}/approve", response_model=schemas.JDSubmissionSchema)
def approve_jd_submission(
    submission_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_role("PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
):
    """PT approves JD submission. Creates a live JobPosting and activates the workflow."""
    db_submission = db.query(models.JDSubmission).filter(models.JDSubmission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="JD submission not found")
    if db_submission.approved_at:
        raise HTTPException(status_code=400, detail="JD submission already approved")

    db_submission.approved_at = datetime.utcnow()

    workflow = db.query(models.Workflow).filter(models.Workflow.id == db_submission.workflow_id).first()

    # Create a live JobPosting from the approved JD
    job_id = f"job_{uuid.uuid4().hex[:12]}"
    db_job = models.JobPosting(
        id=job_id,
        company_id=db_submission.company_id,
        institution_id=workflow.institution_id if workflow else None,
        title=db_submission.job_title,
        sector=db_submission.sector or "General",
        slot=db_submission.slot or "Slot 1",
        fixed_comp=db_submission.fixed_comp or 0,
        variable_comp=db_submission.variable_comp or 0,
        esops_vested=db_submission.esops_vested or 0,
        joining_bonus=db_submission.joining_bonus or 0,
        performance_bonus=db_submission.performance_bonus or 0,
        is_top_decile=db_submission.is_top_decile,
        jd_status="Approved",
    )
    db.add(db_job)

    if workflow:
        workflow.status = "ACTIVE"
        workflow.job_id = job_id

    # Mark the corresponding WorkflowApproval as approved
    approval = db.query(models.WorkflowApproval).filter(
        models.WorkflowApproval.workflow_id == db_submission.workflow_id,
        models.WorkflowApproval.approval_type == "JD_SUBMISSION",
        models.WorkflowApproval.status == "PENDING",
    ).first()
    if approval:
        approval.status = "APPROVED"
        approval.approved_by = current_user.id
        approval.approved_at = datetime.utcnow()

    log_audit(
        db, user_id=current_user.id, action="JD_APPROVED",
        entity_type="jd_submission", entity_id=submission_id,
        company_id=db_submission.company_id,
        details={"job_id": job_id, "job_title": db_submission.job_title},
    )
    db.commit()
    db.refresh(db_submission)
    return db_submission


@router.put("/{submission_id}/reject")
def reject_jd_submission(
    submission_id: str,
    rejection_reason: str = Query("", description="Reason for rejection"),
    db: Session = Depends(database.get_db),
    current_user=Depends(require_role("PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
):
    """PT rejects JD submission."""
    db_submission = db.query(models.JDSubmission).filter(models.JDSubmission.id == submission_id).first()
    if not db_submission:
        raise HTTPException(status_code=404, detail="JD submission not found")
    if db_submission.approved_at:
        raise HTTPException(status_code=400, detail="JD submission already approved, cannot reject")

    approval = db.query(models.WorkflowApproval).filter(
        models.WorkflowApproval.workflow_id == db_submission.workflow_id,
        models.WorkflowApproval.approval_type == "JD_SUBMISSION",
        models.WorkflowApproval.status == "PENDING",
    ).first()
    if approval:
        approval.status = "REJECTED"
        approval.approved_by = current_user.id
        approval.approved_at = datetime.utcnow()
        approval.rejection_reason = rejection_reason

    log_audit(
        db, user_id=current_user.id, action="JD_REJECTED",
        entity_type="jd_submission", entity_id=submission_id,
        company_id=db_submission.company_id,
        details={"reason": rejection_reason},
    )
    db.commit()
    return {"message": "JD submission rejected", "reason": rejection_reason}
