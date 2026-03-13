"""
Workflow Templates API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import sys
import os

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/workflow-templates", tags=["workflow-templates"])


@router.get("/", response_model=List[schemas.WorkflowTemplateSchema])
def get_workflow_templates(
    template_type: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
):
    """Get workflow templates. Filter by institution_id returns institution-specific + global templates."""
    query = db.query(models.WorkflowTemplate)
    if template_type:
        query = query.filter(models.WorkflowTemplate.template_type == template_type)
    if institution_id:
        query = query.filter(
            (models.WorkflowTemplate.institution_id == institution_id)
            | (models.WorkflowTemplate.institution_id.is_(None))
        )
    return query.order_by(models.WorkflowTemplate.name).all()


@router.get("/{template_id}", response_model=schemas.WorkflowTemplateSchema)
def get_workflow_template(template_id: str, db: Session = Depends(database.get_db)):
    """Get a workflow template with its stages."""
    template = db.query(models.WorkflowTemplate).filter(
        models.WorkflowTemplate.id == template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found")
    return template


@router.post("/", response_model=schemas.WorkflowTemplateSchema)
def create_workflow_template(
    data: schemas.WorkflowTemplateCreateSchema,
    db: Session = Depends(database.get_db),
):
    """Create a new workflow template with optional stages."""
    template_id = f"wftpl_{uuid.uuid4().hex[:12]}"
    db_template = models.WorkflowTemplate(
        id=template_id,
        name=data.name,
        description=data.description,
        template_type=data.template_type or "PLACEMENT_CYCLE",
        institution_id=data.institution_id,
    )
    db.add(db_template)
    db.flush()

    if data.stages:
        for s in data.stages:
            stage_id = f"wfts_{uuid.uuid4().hex[:12]}"
            db_stage = models.WorkflowTemplateStage(
                id=stage_id,
                template_id=template_id,
                stage_number=s.stage_number,
                name=s.name,
                description=s.description,
                stage_type=s.stage_type or "APPLICATION",
                is_approval_required=s.is_approval_required if s.is_approval_required is not None else True,
            )
            db.add(db_stage)

    db.commit()
    db.refresh(db_template)
    return db_template


@router.put("/{template_id}", response_model=schemas.WorkflowTemplateSchema)
def update_workflow_template(
    template_id: str,
    data: schemas.WorkflowTemplateUpdateSchema,
    db: Session = Depends(database.get_db),
):
    """Update a workflow template (name, description, type)."""
    template = db.query(models.WorkflowTemplate).filter(
        models.WorkflowTemplate.id == template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(template, key, value)

    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}")
def delete_workflow_template(template_id: str, db: Session = Depends(database.get_db)):
    """Delete a workflow template and its stages."""
    template = db.query(models.WorkflowTemplate).filter(
        models.WorkflowTemplate.id == template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found")
    db.delete(template)
    db.commit()
    return {"message": "Template deleted"}


@router.get("/{template_id}/stages", response_model=List[schemas.WorkflowTemplateStageSchema])
def get_template_stages(template_id: str, db: Session = Depends(database.get_db)):
    """Get stages for a template."""
    stages = db.query(models.WorkflowTemplateStage).filter(
        models.WorkflowTemplateStage.template_id == template_id
    ).order_by(models.WorkflowTemplateStage.stage_number).all()
    return stages


@router.post("/{template_id}/stages", response_model=schemas.WorkflowTemplateStageSchema)
def add_template_stage(
    template_id: str,
    stage_data: schemas.WorkflowTemplateStageCreateSchema,
    db: Session = Depends(database.get_db),
):
    """Add a stage to a template."""
    template = db.query(models.WorkflowTemplate).filter(
        models.WorkflowTemplate.id == template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found")

    stage_id = f"wfts_{uuid.uuid4().hex[:12]}"
    db_stage = models.WorkflowTemplateStage(
        id=stage_id,
        template_id=template_id,
        stage_number=stage_data.stage_number,
        name=stage_data.name,
        description=stage_data.description,
        stage_type=stage_data.stage_type or "APPLICATION",
        is_approval_required=stage_data.is_approval_required if stage_data.is_approval_required is not None else True,
    )
    db.add(db_stage)
    db.commit()
    db.refresh(db_stage)
    return db_stage


@router.post("/{template_id}/apply", response_model=schemas.WorkflowSchema)
def apply_template_to_institution(
    template_id: str,
    apply_data: schemas.WorkflowTemplateApplySchema,
    db: Session = Depends(database.get_db),
):
    """Create a workflow from this template for the given institution/company."""
    template = db.query(models.WorkflowTemplate).filter(
        models.WorkflowTemplate.id == template_id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Workflow template not found")

    stages = db.query(models.WorkflowTemplateStage).filter(
        models.WorkflowTemplateStage.template_id == template_id
    ).order_by(models.WorkflowTemplateStage.stage_number).all()

    workflow_id = f"workflow_{uuid.uuid4().hex[:12]}"
    workflow_name = apply_data.workflow_name or template.name

    db_workflow = models.Workflow(
        id=workflow_id,
        company_id=apply_data.company_id,
        job_id=apply_data.job_id,
        institution_id=apply_data.institution_id,
        name=workflow_name,
        description=template.description,
        created_by=apply_data.created_by,
        status="DRAFT",
    )
    db.add(db_workflow)
    db.flush()

    for s in stages:
        stage_id = f"stage_{uuid.uuid4().hex[:12]}"
        db_stage = models.WorkflowStage(
            id=stage_id,
            workflow_id=workflow_id,
            stage_number=s.stage_number,
            name=s.name,
            description=s.description,
            stage_type=s.stage_type,
            is_approval_required=s.is_approval_required,
        )
        db.add(db_stage)

    log_audit(
        db,
        user_id=apply_data.created_by,
        action="WORKFLOW_CREATED_FROM_TEMPLATE",
        entity_type="workflow",
        entity_id=workflow_id,
        institution_id=apply_data.institution_id,
        company_id=apply_data.company_id,
        details={"template_id": template_id, "template_name": template.name},
    )
    db.commit()
    db.refresh(db_workflow)
    return db_workflow
