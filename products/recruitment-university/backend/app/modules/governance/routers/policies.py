from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
import sys
import os
_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)
from app.modules.shared import models, database, schemas
from app.modules.shared.schemas.governance import PolicyTemplateAssignInstitutionSchema
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import get_current_user

router = APIRouter(prefix="/api/v1/policies", tags=["policies"])

@router.get("/", response_model=List[schemas.PolicySchema], summary="List policies")
def get_policies(
    institution_id: Optional[str] = None,
    program_id: Optional[str] = None,
    is_template: Optional[bool] = None,
    cycle_id: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """Get all policies with optional filtering"""
    query = db.query(models.Policy)
    if institution_id:
        query = query.filter(models.Policy.institution_id == institution_id)
    if program_id:
        query = query.filter(models.Policy.program_id == program_id)
    if is_template is not None:
        query = query.filter(models.Policy.is_template == is_template)
    if cycle_id:
        query = query.filter(models.Policy.cycle_id == cycle_id)
    policies = query.all()
    return policies

@router.get("/active")
def get_active_policy(
    program_id: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """Get the active policy, optionally scoped by program"""
    query = db.query(models.Policy).filter(models.Policy.status == "ACTIVE")
    if program_id:
        query = query.filter(models.Policy.program_id == program_id)
    policy = query.first()
    if not policy:
        return None  # Return null instead of 404
    return policy

@router.get("/pending", response_model=List[schemas.PolicyProposalSchema])
def get_pending_proposals(db: Session = Depends(database.get_db)):
    """Get pending policy proposals"""
    proposals = db.query(models.PolicyProposal).filter(models.PolicyProposal.status == "PENDING").all()
    return proposals

@router.get("/templates", response_model=List[schemas.PolicySchema])
def get_policy_templates(
    institution_id: Optional[str] = None,
    program_id: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """Get all policy templates"""
    query = db.query(models.Policy).filter(models.Policy.is_template == True)
    if institution_id:
        query = query.filter(models.Policy.institution_id == institution_id)
    if program_id:
        query = query.filter(models.Policy.program_id == program_id)
    return query.all()

@router.get("/{policy_id}", response_model=schemas.PolicySchema, summary="Get policy by ID")
def get_policy(policy_id: str, db: Session = Depends(database.get_db)):
    """Get a specific policy by ID."""
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return policy

@router.post("/", response_model=schemas.PolicySchema, summary="Create policy")
def create_policy(
    policy: schemas.PolicyCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create a new policy or template"""
    db_policy = models.Policy(
        id=policy.id,
        institution_id=policy.institution_id,
        program_id=policy.program_id,
        governance_type=policy.governance_type or "UNIVERSAL",
        status=policy.status,
        is_template=policy.is_template or False,
        template_name=policy.template_name,
        cycle_id=policy.cycle_id,
        levels=policy.levels or [],
        stages=policy.stages or [],
        global_caps=policy.global_caps or {},
        student_statuses=policy.student_statuses or [],
        stage_restrictions=policy.stage_restrictions or {}
    )
    db.add(db_policy)
    log_audit(
        db, user_id=current_user.id, action="POLICY_CREATED",
        entity_type="policy", entity_id=policy.id,
        institution_id=policy.institution_id,
        details={"governance_type": policy.governance_type or "UNIVERSAL", "is_template": policy.is_template or False},
    )
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.delete("/{policy_id}")
def delete_policy(
    policy_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Delete a policy."""
    policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    db.delete(policy)
    log_audit(
        db, user_id=current_user.id, action="POLICY_DELETED",
        entity_type="policy", entity_id=policy_id,
        details={},
    )
    db.commit()
    return {"message": "Policy deleted"}


@router.put("/{policy_id}", response_model=schemas.PolicySchema)
def update_policy(
    policy_id: str,
    policy_update: schemas.PolicyUpdateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Update a policy"""
    db_policy = db.query(models.Policy).filter(models.Policy.id == policy_id).first()
    if not db_policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    
    changes = policy_update.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(db_policy, key, value)
    
    log_audit(
        db, user_id=current_user.id, action="POLICY_UPDATED",
        entity_type="policy", entity_id=policy_id,
        institution_id=db_policy.institution_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.post("/templates/{template_id}/assign-institution", response_model=schemas.PolicySchema)
def assign_template_to_institution(
    template_id: str,
    assign_data: PolicyTemplateAssignInstitutionSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Map a governance template to an institution. Creates an ACTIVE policy for that institution."""
    template = db.query(models.Policy).filter(
        models.Policy.id == template_id,
        models.Policy.is_template == True
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Governance template not found")
    inst = db.query(models.Institution).filter(models.Institution.id == assign_data.institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    import uuid
    new_id = f"policy_{uuid.uuid4().hex[:12]}"
    db_policy = models.Policy(
        id=new_id,
        institution_id=assign_data.institution_id,
        program_id=assign_data.program_id,
        governance_type=template.governance_type or "UNIVERSAL",
        status="ACTIVE",
        is_template=False,
        template_name=assign_data.name or template.template_name,
        cycle_id=None,
        levels=template.levels.copy() if template.levels else [],
        stages=template.stages.copy() if template.stages else [],
        global_caps=template.global_caps.copy() if template.global_caps else {},
        student_statuses=template.student_statuses.copy() if template.student_statuses else [],
        stage_restrictions=template.stage_restrictions.copy() if template.stage_restrictions else {}
    )
    db.add(db_policy)
    log_audit(
        db, user_id=current_user.id, action="POLICY_TEMPLATE_ASSIGNED",
        entity_type="policy", entity_id=new_id,
        institution_id=assign_data.institution_id,
        details={"template_id": template_id},
    )
    db.commit()
    db.refresh(db_policy)
    return db_policy


@router.post("/templates/{template_id}/apply", response_model=schemas.PolicySchema)
def apply_policy_template(
    template_id: str,
    apply_data: schemas.PolicyTemplateApplySchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Apply a policy template to a cycle, creating a new policy instance"""
    # Get the template
    template = db.query(models.Policy).filter(
        models.Policy.id == template_id,
        models.Policy.is_template == True
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Policy template not found")
    
    # Verify cycle exists
    cycle = db.query(models.Cycle).filter(models.Cycle.id == apply_data.cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    
    # Create new policy instance from template
    import uuid
    new_policy_id = f"policy_{uuid.uuid4().hex[:12]}"
    db_policy = models.Policy(
        id=new_policy_id,
        institution_id=template.institution_id,
        program_id=template.program_id,
        governance_type=template.governance_type or "UNIVERSAL",
        status="DRAFT",
        is_template=False,
        template_name=apply_data.name or template.template_name,
        cycle_id=apply_data.cycle_id,
        levels=template.levels.copy() if template.levels else [],
        stages=template.stages.copy() if template.stages else [],
        global_caps=template.global_caps.copy() if template.global_caps else {},
        student_statuses=template.student_statuses.copy() if template.student_statuses else [],
        stage_restrictions=template.stage_restrictions.copy() if template.stage_restrictions else {}
    )
    
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy
