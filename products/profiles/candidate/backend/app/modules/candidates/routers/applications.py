"""
Applications API Router
"""
import datetime
import os
import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, selectinload

from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import get_current_user
from app.modules.shared.pagination import paginate_query

router = APIRouter(prefix="/api/v1/applications", tags=["applications"])


def _check_application_window(workflow_id: str, db: Session) -> None:
    """Enforce application window from approved ApplicationRequest. Raises HTTPException if outside window."""
    req = (
        db.query(models.ApplicationRequest)
        .filter(
            models.ApplicationRequest.workflow_id == workflow_id,
            models.ApplicationRequest.status == "APPROVED",
        )
        .first()
    )
    if not req or (req.scheduled_open_at is None and req.scheduled_close_at is None):
        return
    now = datetime.datetime.utcnow()
    if req.scheduled_open_at and now < req.scheduled_open_at:
        raise HTTPException(
            status_code=400,
            detail="Application window has not opened yet",
        )
    if req.scheduled_close_at and now > req.scheduled_close_at:
        raise HTTPException(
            status_code=400,
            detail="Application window has closed",
        )


def _check_eligibility(student_id: str, job_id: str, db: Session) -> None:
    """Enforce job-level eligibility (min CGPA, max backlogs). Raises HTTPException if ineligible."""
    student = db.query(models.User).filter(models.User.id == student_id).first()
    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        return
    if job.min_cgpa is not None and student and student.cgpa is not None:
        if student.cgpa < job.min_cgpa:
            raise HTTPException(
                status_code=400,
                detail=f"Minimum CGPA requirement ({job.min_cgpa}) not met",
            )
    if job.max_backlogs is not None and student:
        backlogs = getattr(student, "backlog_count", 0) or 0
        if backlogs > job.max_backlogs:
            raise HTTPException(
                status_code=400,
                detail=f"Maximum backlogs allowed ({job.max_backlogs}) exceeded",
            )

@router.get("/", summary="List applications with pagination")
def get_applications(
    student_id: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    workflow_id: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db)
):
    """Get applications with optional filtering and pagination."""
    query = db.query(models.Application)
    if student_id:
        query = query.filter(models.Application.student_id == student_id)
    if job_id:
        query = query.filter(models.Application.job_id == job_id)
    if workflow_id:
        query = query.filter(models.Application.workflow_id == workflow_id)
    query = query.options(
        selectinload(models.Application.student),
        selectinload(models.Application.job),
        selectinload(models.Application.workflow),
    ).order_by(models.Application.submitted_at.desc())
    items, total = paginate_query(query, limit, offset)
    return {"items": items, "total": total}

@router.get("/{application_id}", response_model=schemas.ApplicationSchema, summary="Get application by ID")
def get_application(application_id: str, db: Session = Depends(database.get_db)):
    """Get a specific application."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    return application

@router.post("/", response_model=schemas.ApplicationSchema, summary="Submit application")
def create_application(
    application_data: schemas.ApplicationCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Submit a new application"""
    # Verify CV exists
    cv = db.query(models.CV).filter(models.CV.id == application_data.cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    
    # Verify workflow exists and is active
    workflow = db.query(models.Workflow).filter(models.Workflow.id == application_data.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    if workflow.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Workflow is not active for applications")

    # Enforce application window from approved ApplicationRequest
    _check_application_window(application_data.workflow_id, db)

    # Enforce job-level eligibility (min CGPA, max backlogs)
    _check_eligibility(application_data.student_id, application_data.job_id, db)

    # Enforce batch eligibility (policy.global_caps.eligible_batches)
    from app.modules.shared.services.governance_engine import check_batch_eligibility
    job = db.query(models.JobPosting).filter(models.JobPosting.id == application_data.job_id).first()
    cycle_id = job.cycle_id if job else None
    batch_ok, batch_err = check_batch_eligibility(application_data.student_id, cycle_id, db)
    if not batch_ok:
        raise HTTPException(status_code=400, detail="Your batch is not eligible for this placement cycle")

    # Block applications if student has already accepted an offer (Day 0 blocks Day 1)
    accepted_offer = (
        db.query(models.Offer)
        .filter(
            models.Offer.candidate_id == application_data.student_id,
            models.Offer.status == "ACCEPTED",
        )
        .first()
    )
    if accepted_offer:
        raise HTTPException(
            status_code=400,
            detail="You have already accepted an offer and cannot apply to additional roles",
        )

    # Check if application already exists
    existing = db.query(models.Application).filter(
        models.Application.student_id == application_data.student_id,
        models.Application.workflow_id == application_data.workflow_id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Application already exists")
    
    # Get first stage
    first_stage = db.query(models.WorkflowStage).filter(
        models.WorkflowStage.workflow_id == application_data.workflow_id
    ).order_by(models.WorkflowStage.stage_number).first()
    
    application_id = f"app_{uuid.uuid4().hex[:12]}"
    db_application = models.Application(
        id=application_id,
        student_id=application_data.student_id,
        job_id=application_data.job_id,
        workflow_id=application_data.workflow_id,
        cv_id=application_data.cv_id,
        current_stage_id=first_stage.id if first_stage else None,
        status="SUBMITTED"
    )
    
    db.add(db_application)

    # Emit initial timeline event
    event_id = f"ate_{uuid.uuid4().hex[:12]}"
    db.add(models.ApplicationTimelineEvent(
        id=event_id,
        application_id=application_id,
        event_type="SUBMITTED",
        payload={"workflow_id": application_data.workflow_id, "job_id": application_data.job_id},
        actor_id=application_data.student_id,
    ))

    if first_stage:
        progress_id = f"progress_{uuid.uuid4().hex[:12]}"
        db_progress = models.ApplicationStageProgress(
            id=progress_id,
            application_id=application_id,
            stage_id=first_stage.id,
            status="PENDING"
        )
        db.add(db_progress)
    
    student = db.query(models.User).filter(models.User.id == application_data.student_id).first()
    log_audit(
        db, user_id=application_data.student_id, action="APPLICATION_CREATED",
        entity_type="application", entity_id=application_id,
        institution_id=student.institution_id if student else None,
        details={"workflow_id": application_data.workflow_id, "job_id": application_data.job_id},
    )
    db.commit()
    db.refresh(db_application)
    return db_application

@router.put("/{application_id}", response_model=schemas.ApplicationSchema)
def update_application(
    application_id: str,
    update_data: schemas.ApplicationUpdateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Update application status (e.g. withdraw). Student can withdraw own; placement can update status."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    changes = update_data.model_dump(exclude_unset=True)
    if "status" in changes:
        application.status = changes["status"]
    if "current_stage_id" in changes:
        application.current_stage_id = changes["current_stage_id"]
    application.updated_at = __import__("datetime").datetime.utcnow()
    log_audit(
        db, user_id=current_user.id, action="APPLICATION_UPDATED",
        entity_type="application", entity_id=application_id,
        details={"changed": list(changes.keys())},
    )
    db.commit()
    db.refresh(application)
    return application


@router.delete("/{application_id}")
def delete_application(
    application_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Delete/withdraw an application. Student can withdraw own; placement can delete."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    db.delete(application)
    log_audit(
        db, user_id=current_user.id, action="APPLICATION_DELETED",
        entity_type="application", entity_id=application_id,
        details={},
    )
    db.commit()
    return {"message": "Application deleted"}


@router.get("/{application_id}/cv")
def download_application_cv(application_id: str, db: Session = Depends(database.get_db)):
    """Download CV PDF for an application"""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    cv = db.query(models.CV).filter(models.CV.id == application.cv_id).first()
    if not cv or not cv.pdf_url:
        raise HTTPException(status_code=404, detail="CV PDF not found")
    
    # Extract file path from URL (assuming /uploads/...)
    file_path = cv.pdf_url.replace("/uploads/", "")
    full_path = os.path.join("/app/uploads", file_path)
    
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="CV file not found on server")
    
    return FileResponse(full_path, media_type="application/pdf", filename=f"cv_{application_id}.pdf")


@router.get("/{application_id}/timeline", summary="Get application timeline")
def get_application_timeline(
    application_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Return unified timeline for the application (events + stage progress + offers)."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.student_id != current_user.id and getattr(current_user, "role", None) not in ("PLACEMENT_TEAM", "PLACEMENT_ADMIN", "RECRUITER", "SYSTEM_ADMIN"):
        raise HTTPException(status_code=403, detail="Access denied")

    events = (
        db.query(models.ApplicationTimelineEvent)
        .filter(models.ApplicationTimelineEvent.application_id == application_id)
        .order_by(models.ApplicationTimelineEvent.created_at)
        .all()
    )
    offer = (
        db.query(models.Offer)
        .filter(models.Offer.application_id == application_id)
        .order_by(models.Offer.created_at.desc())
        .first()
    )
    timeline = []
    for e in events:
        timeline.append({
            "id": e.id,
            "event_type": e.event_type,
            "payload": e.payload,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "source": "event",
        })
    if offer:
        timeline.append({
            "id": offer.id,
            "event_type": "OFFER_RECEIVED" if offer.status == "PENDING" else f"OFFER_{offer.status}",
            "payload": {"ctc": offer.ctc, "deadline": offer.deadline.isoformat() if offer.deadline else None},
            "created_at": offer.created_at.isoformat() if offer.created_at else None,
            "source": "offer",
        })
    timeline.sort(key=lambda x: x["created_at"] or "")
    return {"application_id": application_id, "items": timeline}


@router.get("/{application_id}/attachments", summary="List application attachments")
def list_attachments(
    application_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List attachments for an application."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.student_id != current_user.id and getattr(current_user, "role", None) not in ("PLACEMENT_TEAM", "PLACEMENT_ADMIN", "RECRUITER", "SYSTEM_ADMIN"):
        raise HTTPException(status_code=403, detail="Access denied")
    items = (
        db.query(models.ApplicationAttachment)
        .filter(models.ApplicationAttachment.application_id == application_id)
        .order_by(models.ApplicationAttachment.created_at.desc())
        .all()
    )
    return {"items": [schemas.ApplicationAttachmentSchema.model_validate(a) for a in items]}


@router.post("/{application_id}/attachments", response_model=schemas.ApplicationAttachmentSchema, summary="Add attachment")
def add_attachment(
    application_id: str,
    data: schemas.ApplicationAttachmentCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add an attachment to an application (candidate or placement)."""
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.student_id != current_user.id and getattr(current_user, "role", None) not in ("PLACEMENT_TEAM", "PLACEMENT_ADMIN", "RECRUITER", "SYSTEM_ADMIN"):
        raise HTTPException(status_code=403, detail="Access denied")
    att_id = f"atta_{uuid.uuid4().hex[:12]}"
    att = models.ApplicationAttachment(
        id=att_id,
        application_id=application_id,
        name=data.name,
        asset_type=data.asset_type or "document",
        url=data.url,
        file_path=data.file_path,
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    return att


@router.delete("/{application_id}/attachments/{attachment_id}")
def delete_attachment(
    application_id: str,
    attachment_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Remove an attachment."""
    att = db.query(models.ApplicationAttachment).filter(
        models.ApplicationAttachment.id == attachment_id,
        models.ApplicationAttachment.application_id == application_id,
    ).first()
    if not att:
        raise HTTPException(status_code=404, detail="Attachment not found")
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if application and application.student_id != current_user.id and getattr(current_user, "role", None) not in ("PLACEMENT_TEAM", "PLACEMENT_ADMIN", "RECRUITER", "SYSTEM_ADMIN"):
        raise HTTPException(status_code=403, detail="Access denied")
    db.delete(att)
    db.commit()
    return {"message": "Attachment removed"}


@router.get("/{application_id}/stages", summary="Get stage progress for an application")
def get_application_stage_progress(
    application_id: str,
    db: Session = Depends(database.get_db),
):
    """Return all workflow stages for this application with per-stage progress status.

    Each entry includes stage info (name, type, number) and progress status
    (PENDING, IN_PROGRESS, PASSED, FAILED) plus the current_stage indicator.
    """
    application = db.query(models.Application).filter(models.Application.id == application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    stages = (
        db.query(models.WorkflowStage)
        .filter(models.WorkflowStage.workflow_id == application.workflow_id)
        .order_by(models.WorkflowStage.stage_number)
        .all()
    )

    progress_rows = (
        db.query(models.ApplicationStageProgress)
        .filter(models.ApplicationStageProgress.application_id == application_id)
        .all()
    )
    progress_map = {p.stage_id: p for p in progress_rows}

    result = []
    for stage in stages:
        prog = progress_map.get(stage.id)
        result.append({
            "stage_id": stage.id,
            "stage_number": stage.stage_number,
            "name": stage.name,
            "stage_type": stage.stage_type,
            "is_current": stage.id == application.current_stage_id,
            "progress_status": prog.status if prog else "NOT_STARTED",
            "moved_at": prog.moved_at.isoformat() if prog and prog.moved_at else None,
        })
    return {
        "application_id": application_id,
        "application_status": application.status,
        "stages": result,
    }
