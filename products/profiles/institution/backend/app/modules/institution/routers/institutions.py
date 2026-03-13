from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime

from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import get_current_user
from app.modules.shared.pagination import paginate_query

router = APIRouter(prefix="/api/v1/institutions", tags=["institutions"])


@router.get("/")
def get_institutions(
    institution_id: Optional[str] = None,
    q: Optional[str] = Query(None, description="Search by institution name"),
    limit: int = Query(50, ge=1, le=500, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    include_counts: bool = Query(False, description="Include program_count and user_count per institution"),
    db: Session = Depends(database.get_db),
):
    """Get institutions with pagination and search. Returns { items, total }."""
    query = db.query(models.Institution)
    if institution_id:
        query = query.filter(models.Institution.id == institution_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(models.Institution.name.ilike(term))
    items, total = paginate_query(query, limit, offset)

    if include_counts and items:
        from sqlalchemy import func
        inst_ids = [i.id for i in items]
        prog_counts = dict(
            db.query(models.Program.institution_id, func.count(models.Program.id))
            .filter(models.Program.institution_id.in_(inst_ids))
            .group_by(models.Program.institution_id)
            .all()
        )
        user_counts = dict(
            db.query(models.User.institution_id, func.count(models.User.id))
            .filter(models.User.institution_id.in_(inst_ids))
            .filter(models.User.role != "SYSTEM_ADMIN")
            .group_by(models.User.institution_id)
            .all()
        )
        staff_counts = dict(
            db.query(models.User.institution_id, func.count(models.User.id))
            .filter(models.User.institution_id.in_(inst_ids))
            .filter(models.User.role.in_(["PLACEMENT_TEAM", "PLACEMENT_ADMIN"]))
            .group_by(models.User.institution_id)
            .all()
        )
        for inst in items:
            inst.program_count = prog_counts.get(inst.id, 0)
            inst.user_count = user_counts.get(inst.id, 0)
            inst.staff_count = staff_counts.get(inst.id, 0)

    return {"items": items, "total": total}

@router.get("/{institution_id}", response_model=schemas.InstitutionSchema)
def get_institution(institution_id: str, db: Session = Depends(database.get_db)):
    """Get a specific institution by ID"""
    institution = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    return institution

@router.post("/", response_model=schemas.InstitutionSchema)
def create_institution(institution: schemas.InstitutionCreateSchema, db: Session = Depends(database.get_db)):
    """Create a new institution"""
    # Check if institution already exists
    existing = db.query(models.Institution).filter(models.Institution.id == institution.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Institution with this ID already exists")
    
    default_allowed = ["CANDIDATE", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "INSTITUTION_ADMIN", "FACULTY_OBSERVER", "ALUMNI"]
    status = getattr(institution, "status", None) or "PENDING"
    if status not in ("PENDING", "LISTED", "PARTNER"):
        status = "PENDING"
    db_institution = models.Institution(
        id=institution.id,
        name=institution.name,
        tier=institution.tier,
        location=institution.location,
        logo_url=institution.logo_url,
        allowed_roles=getattr(institution, "allowed_roles", None) or default_allowed,
        status=status,
    )
    db.add(db_institution)
    log_audit(
        db, user_id="system", action="INSTITUTION_CREATED",
        entity_type="institution", entity_id=institution.id,
        institution_id=institution.id,
        details={"name": institution.name, "tier": institution.tier},
    )
    db.commit()
    db.refresh(db_institution)
    return db_institution

@router.put("/{institution_id}", response_model=schemas.InstitutionSchema)
def update_institution(
    institution_id: str,
    institution_update: schemas.InstitutionUpdateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Update an institution. System admins can update any; institution admins only their own."""
    db_institution = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not db_institution:
        raise HTTPException(status_code=404, detail="Institution not found")

    # System admins can update any institution; institution admins only their own
    if current_user.role != "SYSTEM_ADMIN":
        if current_user.role != "INSTITUTION_ADMIN" or current_user.institution_id != institution_id:
            raise HTTPException(status_code=403, detail="You can only update your own institution")

    changes = institution_update.dict(exclude_unset=True)
    for key, value in changes.items():
        setattr(db_institution, key, value)

    db_institution.updated_at = datetime.datetime.utcnow()
    log_audit(
        db, user_id=current_user.id, action="INSTITUTION_UPDATED",
        entity_type="institution", entity_id=institution_id,
        institution_id=institution_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(db_institution)
    return db_institution

@router.delete("/{institution_id}")
def delete_institution(institution_id: str, db: Session = Depends(database.get_db)):
    """Delete an institution"""
    db_institution = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not db_institution:
        raise HTTPException(status_code=404, detail="Institution not found")
    
    # Check if institution is referenced by programs, users or policies
    programs_count = db.query(models.Program).filter(models.Program.institution_id == institution_id).count()
    users_count = db.query(models.User).filter(models.User.institution_id == institution_id).count()
    policies_count = db.query(models.Policy).filter(models.Policy.institution_id == institution_id).count()

    if programs_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete institution: delete {programs_count} program(s) first"
        )
    if users_count > 0 or policies_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete institution: {users_count} users and {policies_count} policies reference it"
        )
    
    db.delete(db_institution)
    db.commit()
    return {"message": "Institution deleted successfully"}
