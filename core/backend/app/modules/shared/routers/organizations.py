"""Organizations API - Institution and Company CRUD with permission scoping."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, database, schemas
from ..auth import require_permission

router = APIRouter(prefix="/api/v1/organizations", tags=["organizations"])


# ─── Institutions ───────────────────────────────────────────────────────────────

@router.get("/institutions", response_model=List[schemas.InstitutionRead])
def list_institutions(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("institution.view")),
):
    """List all institutions. Requires institution.structure.view or institution.view."""
    return db.query(models.Institution).order_by(models.Institution.name).all()


@router.get("/institutions/{institution_id}", response_model=schemas.InstitutionRead)
def get_institution(
    institution_id: str,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("institution.view")),
):
    """Get institution by ID."""
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst


@router.get("/institutions/{institution_id}/structure", response_model=schemas.InstitutionStructureRead)
def get_institution_structure(
    institution_id: str,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("institution.structure.view")),
):
    """Get institution with programs and batches (structure view)."""
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    programs = db.query(models.Program).filter(models.Program.institution_id == institution_id).all()
    batches_by_program = {}
    for p in programs:
        batches = db.query(models.Batch).filter(models.Batch.program_id == p.id).order_by(models.Batch.year.desc().nullslast()).all()
        batches_by_program[p.id] = [schemas.BatchRead.model_validate(b) for b in batches]
    return schemas.InstitutionStructureRead(
        institution=schemas.InstitutionRead.model_validate(inst),
        programs=[schemas.ProgramRead.model_validate(p) for p in programs],
        batches_by_program=batches_by_program,
    )


# ─── Companies ────────────────────────────────────────────────────────────────

@router.get("/companies", response_model=List[schemas.CompanyRead])
def list_companies(
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("company.view")),
):
    """List all companies."""
    return db.query(models.Company).order_by(models.Company.name).all()


@router.get("/companies/{company_id}", response_model=schemas.CompanyRead)
def get_company(
    company_id: str,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("company.view")),
):
    """Get company by ID."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.get("/companies/{company_id}/business-units", response_model=List[schemas.BusinessUnitRead])
def list_business_units(
    company_id: str,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("company.structure.view")),
):
    """List business units for a company."""
    return db.query(models.BusinessUnit).filter(models.BusinessUnit.company_id == company_id).all()


# ─── Programs & Batches (delegate to existing schemas) ─────────────────────────

@router.get("/programs", response_model=List[schemas.ProgramRead])
def list_programs(
    institution_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("institution.structure.view")),
):
    """List programs, optionally filtered by institution."""
    query = db.query(models.Program)
    if institution_id:
        query = query.filter(models.Program.institution_id == institution_id)
    return query.order_by(models.Program.name).all()


# ─── About pages (LinkedIn-style) ─────────────────────────────────────────────

def _get_institution_about(institution_id: str, db: Session):
    """Build institution About payload with stats."""
    inst = db.query(models.Institution).filter(models.Institution.id == institution_id).first()
    if not inst:
        return None
    programs = db.query(models.Program).filter(models.Program.institution_id == institution_id).all()
    degrees = db.query(models.InstitutionDegree).filter(models.InstitutionDegree.institution_id == institution_id).all()
    certs = db.query(models.InstitutionCertification).filter(models.InstitutionCertification.institution_id == institution_id).all()
    # Stats: users linked via individual_institution_links
    from sqlalchemy import func
    user_count = (
        db.query(func.count(func.distinct(models.IndividualInstitutionLink.user_id)))
        .filter(models.IndividualInstitutionLink.institution_id == institution_id)
        .scalar()
        or 0
    )
    stats = {
        "total_users": user_count,
        "total_programs": len(programs),
        "total_degrees": len(degrees) if degrees else 0,
        "total_certifications": len(certs) if certs else 0,
    }
    return {
        "institution": inst,
        "programs": programs,
        "degrees": degrees or [],
        "certifications": certs or [],
        "stats": stats,
    }


def _get_company_about(company_id: str, db: Session):
    """Build company About payload with stats."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        return None
    business_units = db.query(models.BusinessUnit).filter(models.BusinessUnit.company_id == company_id).all()
    designations = db.query(models.CompanyDesignation).filter(
        models.CompanyDesignation.company_id == company_id
    ).order_by(models.CompanyDesignation.level.asc().nullslast()).all()
    functions = db.query(models.CompanyFunction).filter(models.CompanyFunction.company_id == company_id).all()
    from sqlalchemy import func
    total = (
        db.query(func.count(func.distinct(models.IndividualOrganizationLink.user_id)))
        .filter(models.IndividualOrganizationLink.company_id == company_id)
        .scalar()
        or 0
    )
    current = (
        db.query(func.count(func.distinct(models.IndividualOrganizationLink.user_id)))
        .filter(
            models.IndividualOrganizationLink.company_id == company_id,
            models.IndividualOrganizationLink.end_date.is_(None),
        )
        .scalar()
        or 0
    )
    stats = {
        "total_users": total,
        "total_current": current,
        "total_alumni": max(0, total - current),
    }
    return {
        "company": company,
        "business_units": business_units,
        "designations": designations or [],
        "functions": functions or [],
        "stats": stats,
    }


@router.get("/institutions/{institution_id}/about", response_model=schemas.InstitutionAboutRead)
def get_institution_about(
    institution_id: str,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("institution.about.view")),
):
    """Get institution About page with programs, degrees, certifications, and stats."""
    data = _get_institution_about(institution_id, db)
    if not data:
        raise HTTPException(status_code=404, detail="Institution not found")
    return schemas.InstitutionAboutRead(
        institution=schemas.InstitutionRead.model_validate(data["institution"]),
        programs=[schemas.ProgramRead.model_validate(p) for p in data["programs"]],
        degrees=[schemas.InstitutionDegreeRead.model_validate(d) for d in data["degrees"]],
        certifications=[schemas.InstitutionCertificationRead.model_validate(c) for c in data["certifications"]],
        stats=data["stats"],
    )


@router.get("/companies/{company_id}/about", response_model=schemas.CompanyAboutRead)
def get_company_about(
    company_id: str,
    db: Session = Depends(database.get_db),
    _: models.User = Depends(require_permission("company.about.view")),
):
    """Get company About page with business units, designations, functions, and stats."""
    data = _get_company_about(company_id, db)
    if not data:
        raise HTTPException(status_code=404, detail="Company not found")
    return schemas.CompanyAboutRead(
        company=schemas.CompanyRead.model_validate(data["company"]),
        business_units=[schemas.BusinessUnitRead.model_validate(b) for b in data["business_units"]],
        designations=[schemas.CompanyDesignationRead.model_validate(d) for d in data["designations"]],
        functions=[schemas.CompanyFunctionRead.model_validate(f) for f in data["functions"]],
        stats=data["stats"],
    )
