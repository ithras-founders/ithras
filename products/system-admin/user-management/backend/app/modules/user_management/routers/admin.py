import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user, require_permission
from app.modules.shared.audit import log_audit
from app.modules.shared.database import Base, engine

# Import all models to ensure they're registered with Base.metadata
from app.modules.shared import models as _  # noqa: F401 - ensures all model classes are imported

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


# --- Pending institutions/companies (status=PENDING) ---

@router.get("/institutions/pending", response_model=List[schemas.InstitutionSchema])
def list_pending_institutions(
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """List institutions with status=PENDING for approval."""
    return db.query(models.Institution).filter(models.Institution.status == "PENDING").order_by(models.Institution.name).all()


@router.get("/companies/pending", response_model=List[schemas.CompanySchema])
def list_pending_companies(
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """List companies with status=PENDING for approval."""
    return db.query(models.Company).filter(models.Company.status == "PENDING").order_by(models.Company.name).all()


@router.get("/summary")
def get_admin_summary(
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """Return aggregated platform stats for system admin dashboard."""
    total_institutions = db.query(models.Institution).count()
    total_companies = db.query(models.Company).count()
    total_users = db.query(models.User).count()
    total_candidates = db.query(models.User).filter(models.User.role == "CANDIDATE").count()
    pending_institutions = db.query(models.Institution).filter(models.Institution.status == "PENDING").count()
    pending_companies = db.query(models.Company).filter(models.Company.status == "PENDING").count()
    active_jobs = db.query(models.JobPosting).filter(models.JobPosting.jd_status.in_(["Approved", "Submitted"])).count()
    active_cycles = db.query(models.Cycle).filter(models.Cycle.status.in_(["APPLICATIONS_OPEN", "SHORTLISTING"])).count()
    total_cvs = db.query(models.CV).count()
    total_shortlists = db.query(models.Shortlist).count()

    return {
        "totalInstitutions": total_institutions,
        "totalCompanies": total_companies,
        "totalUsers": total_users,
        "totalCandidates": total_candidates,
        "pendingInstitutions": pending_institutions,
        "pendingCompanies": pending_companies,
        "activeJobs": active_jobs,
        "activeCycles": active_cycles,
        "totalCVs": total_cvs,
        "totalShortlists": total_shortlists,
    }


# --- Approval schemas ---

class InstitutionApproveSchema(BaseModel):
    status: str  # LISTED | PARTNER
    name: Optional[str] = None
    tier: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None
    about: Optional[str] = None
    website: Optional[str] = None
    founding_year: Optional[int] = None
    student_count_range: Optional[str] = None


class CompanyApproveSchema(BaseModel):
    status: str  # LISTED | PARTNER
    name: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    founding_year: Optional[int] = None
    last_year_hires: Optional[int] = None
    cumulative_hires_3y: Optional[int] = None
    last_year_median_fixed: Optional[float] = None
    logo_url: Optional[str] = None


class RejectSchema(BaseModel):
    reason: Optional[str] = None


# --- Approve / Reject ---

@router.post("/institutions/{institution_id}/approve", response_model=schemas.InstitutionSchema)
def approve_institution(
    institution_id: str,
    data: InstitutionApproveSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """Approve a PENDING institution: set status to VERIFIED or PARTNER and apply details."""
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    if getattr(inst, "status", "PARTNER") != "PENDING":
        raise HTTPException(status_code=400, detail="Institution is not pending approval")
    if data.status not in ("LISTED", "PARTNER"):
        raise HTTPException(status_code=400, detail="status must be LISTED or PARTNER")
    updates = data.model_dump(exclude_unset=True)
    status_val = updates.pop("status", None)
    for k, v in updates.items():
        if v is not None:
            setattr(inst, k, v)
    inst.status = status_val
    inst.updated_at = datetime.datetime.utcnow()
    log_audit(
        db, user_id=current_user.id, action="INSTITUTION_APPROVED",
        entity_type="institution", entity_id=institution_id,
        institution_id=institution_id,
        details={"status": status_val, "approved_by": current_user.id},
    )
    db.commit()
    db.refresh(inst)
    return inst


@router.post("/institutions/{institution_id}/reject")
def reject_institution(
    institution_id: str,
    data: RejectSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """Reject a PENDING institution (delete or keep as rejected). For now we delete."""
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    if getattr(inst, "status", "PARTNER") != "PENDING":
        raise HTTPException(status_code=400, detail="Institution is not pending approval")
    # Check no programs/users reference it
    from app.modules.shared.models.core import Program
    prog_count = db.query(Program).filter(Program.institution_id == institution_id).count()
    user_count = db.query(models.User).filter(models.User.institution_id == institution_id).count()
    if prog_count > 0 or user_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {prog_count} programs and {user_count} users reference this institution",
        )
    db.delete(inst)
    log_audit(
        db, user_id=current_user.id, action="INSTITUTION_REJECTED",
        entity_type="institution", entity_id=institution_id,
        details={"reason": data.reason, "rejected_by": current_user.id},
    )
    db.commit()
    return {"message": "Institution rejected and removed"}


@router.post("/companies/{company_id}/approve", response_model=schemas.CompanySchema)
def approve_company(
    company_id: str,
    data: CompanyApproveSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """Approve a PENDING company: set status to VERIFIED or PARTNER and apply details."""
    comp = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    if getattr(comp, "status", "PARTNER") != "PENDING":
        raise HTTPException(status_code=400, detail="Company is not pending approval")
    if data.status not in ("LISTED", "PARTNER"):
        raise HTTPException(status_code=400, detail="status must be LISTED or PARTNER")
    updates = data.model_dump(exclude_unset=True)
    status_val = updates.pop("status", None)
    for k, v in updates.items():
        if v is not None:
            setattr(comp, k, v)
    comp.status = status_val
    log_audit(
        db, user_id=current_user.id, action="COMPANY_APPROVED",
        entity_type="company", entity_id=company_id,
        company_id=company_id,
        details={"status": status_val, "approved_by": current_user.id},
    )
    db.commit()
    db.refresh(comp)
    return comp


@router.post("/companies/{company_id}/reject")
def reject_company(
    company_id: str,
    data: RejectSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("system.admin")),
):
    """Reject a PENDING company (delete)."""
    comp = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    if getattr(comp, "status", "PARTNER") != "PENDING":
        raise HTTPException(status_code=400, detail="Company is not pending approval")
    user_count = db.query(models.User).filter(models.User.company_id == company_id).count()
    job_count = db.query(models.JobPosting).filter(models.JobPosting.company_id == company_id).count()
    if user_count > 0 or job_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete: {user_count} users and {job_count} jobs reference this company",
        )
    db.delete(comp)
    log_audit(
        db, user_id=current_user.id, action="COMPANY_REJECTED",
        entity_type="company", entity_id=company_id,
        details={"reason": data.reason, "rejected_by": current_user.id},
    )
    db.commit()
    return {"message": "Company rejected and removed"}


@router.post("/seed-system-admin")
def seed_system_admin(db: Session = Depends(database.get_db)):
    """Create System Admin user (founders@ithras.com) if it doesn't exist. Creates tables if needed."""
    try:
        from app.constants import FOUNDER_EMAIL, FOUNDER_USER_ID

        # Ensure all tables exist
        Base.metadata.create_all(bind=engine)

        # Check if System Admin (founders@ithras.com) already exists
        existing_admin = db.query(models.User).filter(
            models.User.email == FOUNDER_EMAIL
        ).first()

        if existing_admin:
            return {
                "message": "System Admin already exists",
                "user": {
                    "id": existing_admin.id,
                    "email": existing_admin.email,
                    "name": existing_admin.name,
                    "role": existing_admin.role
                }
            }

        # Create System Admin user with password (DEMO_PASSWORD)
        from app.config import settings
        from app.modules.shared.password import hash_password

        pw_hash = hash_password(settings.DEMO_PASSWORD)
        admin_user = models.User(
            id=FOUNDER_USER_ID,
            email=FOUNDER_EMAIL,
            name='Founders',
            role='SYSTEM_ADMIN',
            institution_id=None,
            password_hash=pw_hash,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        return {
            "message": "System Admin created successfully",
            "user": {
                "id": admin_user.id,
                "email": admin_user.email,
                "name": admin_user.name,
                "role": admin_user.role
            }
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create System Admin: {str(e)}"
        )
