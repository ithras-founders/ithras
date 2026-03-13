"""
Workflow Approvals API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
from datetime import datetime
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/workflow-approvals", tags=["workflow-approvals"])

@router.get("/", response_model=List[schemas.WorkflowApprovalSchema])
def get_workflow_approvals(
    status: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    workflow_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Get workflow approvals with optional filtering"""
    query = db.query(models.WorkflowApproval)
    
    if status:
        query = query.filter(models.WorkflowApproval.status == status)
    if company_id:
        query = query.filter(models.WorkflowApproval.company_id == company_id)
    if workflow_id:
        query = query.filter(models.WorkflowApproval.workflow_id == workflow_id)
    
    return query.order_by(models.WorkflowApproval.created_at.desc()).all()

@router.get("/{approval_id}", response_model=schemas.WorkflowApprovalSchema)
def get_workflow_approval(approval_id: str, db: Session = Depends(database.get_db)):
    """Get a specific workflow approval"""
    approval = db.query(models.WorkflowApproval).filter(models.WorkflowApproval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Workflow approval not found")
    return approval

@router.post("/", response_model=schemas.WorkflowApprovalSchema)
def create_workflow_approval(
    approval_data: schemas.WorkflowApprovalCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Create a new approval request"""
    approval_id = f"approval_{uuid.uuid4().hex[:12]}"
    
    db_approval = models.WorkflowApproval(
        id=approval_id,
        workflow_id=approval_data.workflow_id,
        company_id=approval_data.company_id,
        approval_type=approval_data.approval_type,
        requested_by=approval_data.requested_by,
        requested_data=approval_data.requested_data or {},
        status="PENDING"
    )
    
    db.add(db_approval)
    log_audit(
        db, user_id=approval_data.requested_by, action="APPROVAL_CREATED",
        entity_type="workflow_approval", entity_id=approval_id,
        company_id=approval_data.company_id,
        details={"approval_type": approval_data.approval_type, "workflow_id": approval_data.workflow_id},
    )
    db.commit()
    db.refresh(db_approval)
    return db_approval

@router.put("/{approval_id}/approve", response_model=schemas.WorkflowApprovalSchema)
def approve_workflow_request(
    approval_id: str,
    approver_id: str = Query(...),
    db: Session = Depends(database.get_db)
):
    """Approve a workflow request"""
    db_approval = db.query(models.WorkflowApproval).filter(models.WorkflowApproval.id == approval_id).first()
    if not db_approval:
        raise HTTPException(status_code=404, detail="Workflow approval not found")
    
    if db_approval.status != "PENDING":
        raise HTTPException(status_code=400, detail="Approval is not pending")
    
    db_approval.status = "APPROVED"
    db_approval.approved_by = approver_id
    db_approval.approved_at = datetime.utcnow()
    
    log_audit(
        db, user_id=approver_id, action="APPROVAL_APPROVED",
        entity_type="workflow_approval", entity_id=approval_id,
        company_id=db_approval.company_id,
        details={"approval_type": db_approval.approval_type, "workflow_id": db_approval.workflow_id},
    )
    db.commit()
    db.refresh(db_approval)
    return db_approval

@router.put("/{approval_id}/reject", response_model=schemas.WorkflowApprovalSchema)
def reject_workflow_request(
    approval_id: str,
    approver_id: str = Query(...),
    rejection_reason: str = Query(...),
    db: Session = Depends(database.get_db)
):
    """Reject a workflow request"""
    db_approval = db.query(models.WorkflowApproval).filter(models.WorkflowApproval.id == approval_id).first()
    if not db_approval:
        raise HTTPException(status_code=404, detail="Workflow approval not found")
    
    if db_approval.status != "PENDING":
        raise HTTPException(status_code=400, detail="Approval is not pending")
    
    db_approval.status = "REJECTED"
    db_approval.approved_by = approver_id
    db_approval.approved_at = datetime.utcnow()
    db_approval.rejection_reason = rejection_reason
    
    log_audit(
        db, user_id=approver_id, action="APPROVAL_REJECTED",
        entity_type="workflow_approval", entity_id=approval_id,
        company_id=db_approval.company_id,
        details={"approval_type": db_approval.approval_type, "reason": rejection_reason},
    )
    db.commit()
    db.refresh(db_approval)
    return db_approval
