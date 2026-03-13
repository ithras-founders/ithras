"""
Application Requests API Router
Placement team requests to open workflows for applications; recruiters approve.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
import sys
import os

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/application-requests", tags=["application-requests"])


@router.get("/", response_model=List[schemas.ApplicationRequestSchema])
def get_application_requests(
    status: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    workflow_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
):
    """Get application requests with optional filtering."""
    query = db.query(models.ApplicationRequest)
    if status:
        query = query.filter(models.ApplicationRequest.status == status)
    if company_id:
        query = query.filter(models.ApplicationRequest.company_id == company_id)
    if workflow_id:
        query = query.filter(models.ApplicationRequest.workflow_id == workflow_id)
    if institution_id:
        query = query.filter(models.ApplicationRequest.institution_id == institution_id)
    return query.order_by(models.ApplicationRequest.created_at.desc()).all()


@router.get("/{request_id}", response_model=schemas.ApplicationRequestSchema)
def get_application_request(request_id: str, db: Session = Depends(database.get_db)):
    """Get a specific application request."""
    req = db.query(models.ApplicationRequest).filter(models.ApplicationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Application request not found")
    return req


@router.post("/", response_model=schemas.ApplicationRequestSchema)
def create_application_request(
    data: schemas.ApplicationRequestCreateSchema,
    db: Session = Depends(database.get_db),
):
    """Create a new application request (placement team)."""
    workflow = db.query(models.Workflow).filter(models.Workflow.id == data.workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    if workflow.company_id != data.company_id:
        raise HTTPException(status_code=400, detail="Workflow does not belong to this company")

    req_id = f"appreq_{uuid.uuid4().hex[:12]}"
    db_req = models.ApplicationRequest(
        id=req_id,
        workflow_id=data.workflow_id,
        company_id=data.company_id,
        institution_id=data.institution_id,
        requested_by=data.requested_by,
        request_type="OPEN_APPLICATIONS",
        status="PENDING",
        scheduled_open_at=data.scheduled_open_at,
        scheduled_close_at=data.scheduled_close_at,
    )
    db.add(db_req)
    log_audit(
        db,
        user_id=data.requested_by,
        action="APPLICATION_REQUEST_CREATED",
        entity_type="application_request",
        entity_id=req_id,
        institution_id=data.institution_id,
        company_id=data.company_id,
        details={"workflow_id": data.workflow_id},
    )
    db.commit()
    db.refresh(db_req)
    return db_req


@router.put("/{request_id}/approve", response_model=schemas.ApplicationRequestSchema)
def approve_application_request(
    request_id: str,
    approver_id: str = Query(...),
    db: Session = Depends(database.get_db),
):
    """Approve an application request (recruiter)."""
    req = db.query(models.ApplicationRequest).filter(models.ApplicationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Application request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = "APPROVED"
    req.approved_by = approver_id
    req.approved_at = datetime.utcnow()

    log_audit(
        db,
        user_id=approver_id,
        action="APPLICATION_REQUEST_APPROVED",
        entity_type="application_request",
        entity_id=request_id,
        institution_id=req.institution_id,
        company_id=req.company_id,
        details={"workflow_id": req.workflow_id},
    )
    db.commit()
    db.refresh(req)
    return req


@router.put("/{request_id}/reject", response_model=schemas.ApplicationRequestSchema)
def reject_application_request(
    request_id: str,
    approver_id: str = Query(...),
    rejection_reason: str = Query(...),
    db: Session = Depends(database.get_db),
):
    """Reject an application request (recruiter)."""
    req = db.query(models.ApplicationRequest).filter(models.ApplicationRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Application request not found")
    if req.status != "PENDING":
        raise HTTPException(status_code=400, detail="Request is not pending")

    req.status = "REJECTED"
    req.approved_by = approver_id
    req.approved_at = datetime.utcnow()
    req.rejection_reason = rejection_reason

    log_audit(
        db,
        user_id=approver_id,
        action="APPLICATION_REQUEST_REJECTED",
        entity_type="application_request",
        entity_id=request_id,
        institution_id=req.institution_id,
        company_id=req.company_id,
        details={"workflow_id": req.workflow_id, "reason": rejection_reason},
    )
    db.commit()
    db.refresh(req)
    return req
