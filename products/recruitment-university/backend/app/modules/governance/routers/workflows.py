"""
Workflows API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
import uuid
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.cache import get_cached, cache_response
from app.modules.shared.pagination import paginate_query

router = APIRouter(prefix="/api/v1/workflows", tags=["workflows"])
WORKFLOWS_CACHE_TTL = 60

@router.get("/", summary="List workflows with pagination")
def get_workflows(
    company_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    created_by: Optional[str] = Query(None, description="Filter by user who created the workflow"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db)
):
    """Get workflows with optional filtering and pagination. Eager-loads company, institution, job."""
    query = db.query(models.Workflow).options(
        selectinload(models.Workflow.company),
        selectinload(models.Workflow.institution),
        selectinload(models.Workflow.job),
    )
    if company_id:
        query = query.filter(models.Workflow.company_id == company_id)
    if institution_id:
        query = query.filter(models.Workflow.institution_id == institution_id)
    if created_by:
        query = query.filter(models.Workflow.created_by == created_by)
    query = query.order_by(models.Workflow.created_at.desc())
    cache_key = f"workflows:{company_id or 'all'}:{institution_id or 'all'}:{created_by or 'all'}:{limit}:{offset}"
    cached = get_cached(cache_key)
    if cached is not None:
        return cached
    items, total = paginate_query(query, limit, offset)
    result = {"items": [schemas.WorkflowSchema.model_validate(w).model_dump() for w in items], "total": total}
    cache_response(cache_key, result, WORKFLOWS_CACHE_TTL)
    return result

@router.get("/{workflow_id}", response_model=schemas.WorkflowSchema, summary="Get workflow by ID")
def get_workflow(workflow_id: str, db: Session = Depends(database.get_db)):
    """Get a specific workflow."""
    workflow = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow

@router.post("/", response_model=schemas.WorkflowSchema, summary="Create workflow")
def create_workflow(
    workflow_data: schemas.WorkflowCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Create a new workflow"""
    workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"
    
    db_workflow = models.Workflow(
        id=workflow_id,
        company_id=workflow_data.company_id,
        job_id=workflow_data.job_id,
        institution_id=workflow_data.institution_id,
        name=workflow_data.name,
        description=workflow_data.description,
        created_by=workflow_data.created_by,
        status=workflow_data.status or "DRAFT"
    )
    
    db.add(db_workflow)
    log_audit(
        db, user_id=workflow_data.created_by, action="WORKFLOW_CREATED",
        entity_type="workflow", entity_id=workflow_id,
        institution_id=workflow_data.institution_id,
        company_id=workflow_data.company_id,
        details={"name": workflow_data.name},
    )
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.delete("/{workflow_id}", summary="Delete workflow")
def delete_workflow(
    workflow_id: str,
    db: Session = Depends(database.get_db),
):
    """Delete a workflow."""
    workflow = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete(workflow)
    db.commit()
    return {"message": "Workflow deleted"}


@router.put("/{workflow_id}", response_model=schemas.WorkflowSchema)
def update_workflow(
    workflow_id: str,
    workflow_update: schemas.WorkflowUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a workflow"""
    db_workflow = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    changes = workflow_update.dict(exclude_unset=True)
    for key, value in changes.items():
        setattr(db_workflow, key, value)
    
    log_audit(
        db, user_id=db_workflow.created_by, action="WORKFLOW_UPDATED",
        entity_type="workflow", entity_id=workflow_id,
        institution_id=db_workflow.institution_id,
        company_id=db_workflow.company_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(db_workflow)
    return db_workflow

@router.get("/{workflow_id}/stages", response_model=List[schemas.WorkflowStageSchema])
def get_workflow_stages(workflow_id: str, db: Session = Depends(database.get_db)):
    """Get all stages for a workflow"""
    stages = db.query(models.WorkflowStage).filter(
        models.WorkflowStage.workflow_id == workflow_id
    ).order_by(models.WorkflowStage.stage_number).all()
    return stages

@router.post("/{workflow_id}/stages", response_model=schemas.WorkflowStageSchema)
def add_workflow_stage(
    workflow_id: str,
    stage_data: schemas.WorkflowStageCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Add a stage to a workflow"""
    workflow = db.query(models.Workflow).filter(models.Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    
    stage_id = f"stage_{uuid.uuid4().hex[:12]}"
    db_stage = models.WorkflowStage(
        id=stage_id,
        workflow_id=workflow_id,
        stage_number=stage_data.stage_number,
        name=stage_data.name,
        description=stage_data.description,
        stage_type=stage_data.stage_type or "APPLICATION",
        is_approval_required=stage_data.is_approval_required if stage_data.is_approval_required is not None else True
    )
    
    db.add(db_stage)
    log_audit(
        db, user_id=workflow.created_by, action="STAGE_ADDED",
        entity_type="workflow", entity_id=workflow_id,
        institution_id=workflow.institution_id,
        company_id=workflow.company_id,
        details={"stage_name": stage_data.name, "stage_id": stage_id},
    )
    db.commit()
    db.refresh(db_stage)
    return db_stage

@router.put("/{workflow_id}/stages/{stage_id}", response_model=schemas.WorkflowStageSchema)
def update_workflow_stage(
    workflow_id: str,
    stage_id: str,
    stage_update: schemas.WorkflowStageUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a workflow stage"""
    db_stage = db.query(models.WorkflowStage).filter(
        models.WorkflowStage.id == stage_id,
        models.WorkflowStage.workflow_id == workflow_id
    ).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Workflow stage not found")
    
    for key, value in stage_update.dict(exclude_unset=True).items():
        setattr(db_stage, key, value)
    
    db.commit()
    db.refresh(db_stage)
    return db_stage

@router.delete("/{workflow_id}/stages/{stage_id}")
def delete_workflow_stage(
    workflow_id: str,
    stage_id: str,
    db: Session = Depends(database.get_db)
):
    """Remove a stage from a workflow"""
    db_stage = db.query(models.WorkflowStage).filter(
        models.WorkflowStage.id == stage_id,
        models.WorkflowStage.workflow_id == workflow_id
    ).first()
    if not db_stage:
        raise HTTPException(status_code=404, detail="Workflow stage not found")
    
    db.delete(db_stage)
    db.commit()
    return {"message": "Stage deleted successfully"}
