"""Entity About admin CRUD - Business Units, Designations, Functions, Degrees, Certifications.
   System admin only. Used by System Admin portal to manage institution/company About page content.
"""
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from .. import models, database, schemas
from ..auth import get_current_user, require_role
from ..normalization import normalize_canonical_key

router = APIRouter(prefix="/api/v1/organizations", tags=["entity-about-admin"])


def _assert_no_duplicate_name_or_code(db: Session, model, scope_column, scope_id: str, name: str, code: Optional[str] = None):
    normalized_name = normalize_canonical_key(name)
    entities = db.query(model).filter(scope_column == scope_id).all()

    for entity in entities:
        if normalize_canonical_key(entity.name) == normalized_name:
            raise HTTPException(status_code=409, detail="Duplicate name in this scope")

    if code and hasattr(model, "code"):
        normalized_code = normalize_canonical_key(code)
        for entity in entities:
            if entity.code and normalize_canonical_key(entity.code) == normalized_code:
                raise HTTPException(status_code=409, detail="Duplicate code in this scope")


def _assert_program_belongs_to_institution(db: Session, institution_id: str, program_id: Optional[str]):
    if not program_id:
        return
    program = (
        db.query(models.Program.id)
        .filter(
            models.Program.id == program_id,
            models.Program.institution_id == institution_id,
        )
        .first()
    )
    if not program:
        raise HTTPException(status_code=400, detail="Program does not belong to institution")


# ─── Business Units (organizations has GET; we add POST/DELETE) ────────────

@router.post("/companies/{company_id}/business-units", response_model=schemas.BusinessUnitRead)
def create_business_unit(
    company_id: str,
    data: schemas.BusinessUnitCreate,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Create a business unit. System admin only."""
    if not db.query(models.Company).filter(models.Company.id == company_id).first():
        raise HTTPException(404, "Company not found")
    _assert_no_duplicate_name_or_code(db, models.BusinessUnit, models.BusinessUnit.company_id, company_id, data.name, data.code)
    bu = models.BusinessUnit(
        id=f"bu_{uuid.uuid4().hex[:16]}",
        company_id=company_id,
        name=data.name,
        normalized_name=normalize_canonical_key(data.name),
        code=data.code,
    )
    db.add(bu)
    db.commit()
    db.refresh(bu)
    return bu


@router.delete("/companies/{company_id}/business-units/{bu_id}")
def delete_business_unit(
    company_id: str,
    bu_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Delete a business unit. System admin only."""
    bu = db.query(models.BusinessUnit).filter(
        models.BusinessUnit.id == bu_id,
        models.BusinessUnit.company_id == company_id,
    ).first()
    if not bu:
        raise HTTPException(404, "Business unit not found")
    db.delete(bu)
    db.commit()
    return {"ok": True}


# ─── Company Functions ────────────────────────────────────────────────────

@router.get("/companies/{company_id}/functions", response_model=List[schemas.CompanyFunctionRead])
def list_company_functions(
    company_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(get_current_user),
):
    """List functions for a company."""
    return db.query(models.CompanyFunction).filter(models.CompanyFunction.company_id == company_id).all()


@router.post("/companies/{company_id}/functions", response_model=schemas.CompanyFunctionRead)
def create_company_function(
    company_id: str,
    data: schemas.CompanyFunctionCreate,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Create a company function. System admin only."""
    if not db.query(models.Company).filter(models.Company.id == company_id).first():
        raise HTTPException(404, "Company not found")
    _assert_no_duplicate_name_or_code(db, models.CompanyFunction, models.CompanyFunction.company_id, company_id, data.name, data.code)
    f = models.CompanyFunction(
        id=f"fn_{uuid.uuid4().hex[:16]}",
        company_id=company_id,
        name=data.name,
        normalized_name=normalize_canonical_key(data.name),
        code=data.code,
    )
    db.add(f)
    db.commit()
    db.refresh(f)
    return f


@router.delete("/companies/{company_id}/functions/{fn_id}")
def delete_company_function(
    company_id: str,
    fn_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Delete a company function. System admin only."""
    f = db.query(models.CompanyFunction).filter(
        models.CompanyFunction.id == fn_id,
        models.CompanyFunction.company_id == company_id,
    ).first()
    if not f:
        raise HTTPException(404, "Function not found")
    db.delete(f)
    db.commit()
    return {"ok": True}


# ─── Company Designations ────────────────────────────────────────────────

@router.get("/companies/{company_id}/designations", response_model=List[schemas.CompanyDesignationRead])
def list_company_designations(
    company_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(get_current_user),
):
    """List designations for a company."""
    return (
        db.query(models.CompanyDesignation)
        .filter(models.CompanyDesignation.company_id == company_id)
        .order_by(models.CompanyDesignation.level.asc().nullslast())
        .all()
    )


@router.post("/companies/{company_id}/designations", response_model=schemas.CompanyDesignationRead)
def create_company_designation(
    company_id: str,
    data: schemas.CompanyDesignationCreate,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Create a company designation. System admin only."""
    if not db.query(models.Company).filter(models.Company.id == company_id).first():
        raise HTTPException(404, "Company not found")
    _assert_no_duplicate_name_or_code(db, models.CompanyDesignation, models.CompanyDesignation.company_id, company_id, data.name)
    d = models.CompanyDesignation(
        id=f"des_{uuid.uuid4().hex[:16]}",
        company_id=company_id,
        name=data.name,
        normalized_name=normalize_canonical_key(data.name),
        level=data.level,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/companies/{company_id}/designations/{des_id}")
def delete_company_designation(
    company_id: str,
    des_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Delete a company designation. System admin only."""
    d = db.query(models.CompanyDesignation).filter(
        models.CompanyDesignation.id == des_id,
        models.CompanyDesignation.company_id == company_id,
    ).first()
    if not d:
        raise HTTPException(404, "Designation not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


# ─── Institution Degrees ─────────────────────────────────────────────────

@router.get("/institutions/{institution_id}/degrees", response_model=List[schemas.InstitutionDegreeRead])
def list_institution_degrees(
    institution_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(get_current_user),
):
    """List degrees for an institution."""
    return (
        db.query(models.InstitutionDegree)
        .filter(models.InstitutionDegree.institution_id == institution_id)
        .all()
    )


@router.post("/institutions/{institution_id}/degrees", response_model=schemas.InstitutionDegreeRead)
def create_institution_degree(
    institution_id: str,
    data: schemas.InstitutionDegreeCreate,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Create an institution degree. System admin only."""
    if not db.query(models.Institution).filter(models.Institution.id == institution_id).first():
        raise HTTPException(404, "Institution not found")
    _assert_no_duplicate_name_or_code(db, models.InstitutionDegree, models.InstitutionDegree.institution_id, institution_id, data.name)
    _assert_program_belongs_to_institution(db, institution_id, data.program_id)
    d = models.InstitutionDegree(
        id=f"deg_{uuid.uuid4().hex[:16]}",
        institution_id=institution_id,
        name=data.name,
        normalized_name=normalize_canonical_key(data.name),
        degree_type=data.degree_type,
        program_id=data.program_id,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


@router.delete("/institutions/{institution_id}/degrees/{deg_id}")
def delete_institution_degree(
    institution_id: str,
    deg_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Delete an institution degree. System admin only."""
    d = db.query(models.InstitutionDegree).filter(
        models.InstitutionDegree.id == deg_id,
        models.InstitutionDegree.institution_id == institution_id,
    ).first()
    if not d:
        raise HTTPException(404, "Degree not found")
    db.delete(d)
    db.commit()
    return {"ok": True}


# ─── Institution Certifications ──────────────────────────────────────────

@router.get("/institutions/{institution_id}/certifications", response_model=List[schemas.InstitutionCertificationRead])
def list_institution_certifications(
    institution_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(get_current_user),
):
    """List certifications for an institution."""
    return (
        db.query(models.InstitutionCertification)
        .filter(models.InstitutionCertification.institution_id == institution_id)
        .all()
    )


@router.post("/institutions/{institution_id}/certifications", response_model=schemas.InstitutionCertificationRead)
def create_institution_certification(
    institution_id: str,
    data: schemas.InstitutionCertificationCreate,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Create an institution certification. System admin only."""
    if not db.query(models.Institution).filter(models.Institution.id == institution_id).first():
        raise HTTPException(404, "Institution not found")
    _assert_no_duplicate_name_or_code(db, models.InstitutionCertification, models.InstitutionCertification.institution_id, institution_id, data.name)
    c = models.InstitutionCertification(
        id=f"cert_{uuid.uuid4().hex[:16]}",
        institution_id=institution_id,
        name=data.name,
        normalized_name=normalize_canonical_key(data.name),
        issuing_body=data.issuing_body,
        description=data.description,
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.delete("/institutions/{institution_id}/certifications/{cert_id}")
def delete_institution_certification(
    institution_id: str,
    cert_id: str,
    db: Session = Depends(database.get_db),
    _=Depends(require_role("SYSTEM_ADMIN")),
):
    """Delete an institution certification. System admin only."""
    c = db.query(models.InstitutionCertification).filter(
        models.InstitutionCertification.id == cert_id,
        models.InstitutionCertification.institution_id == institution_id,
    ).first()
    if not c:
        raise HTTPException(404, "Certification not found")
    db.delete(c)
    db.commit()
    return {"ok": True}
