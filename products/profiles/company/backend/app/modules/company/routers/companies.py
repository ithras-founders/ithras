from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.pagination import paginate_query

router = APIRouter(prefix="/api/v1/companies", tags=["companies"])


@router.get("/")
def get_companies(
    q: Optional[str] = Query(None, description="Search by company name"),
    limit: int = Query(50, ge=1, le=500, description="Max items to return"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    include_counts: bool = Query(False, description="Include recruiter_count per company"),
    db: Session = Depends(database.get_db),
):
    """Get companies with pagination and search. Returns { items, total }."""
    query = db.query(models.Company)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(models.Company.name.ilike(term))
    items, total = paginate_query(query, limit, offset)

    if include_counts and items:
        from sqlalchemy import func
        comp_ids = [c.id for c in items]
        recruiter_counts = dict(
            db.query(models.User.company_id, func.count(models.User.id))
            .filter(models.User.company_id.in_(comp_ids))
            .group_by(models.User.company_id)
            .all()
        )
        for comp in items:
            comp.recruiter_count = recruiter_counts.get(comp.id, 0)

    return {"items": items, "total": total}

DEMO_COMPANY = {
    "id": "demo-company",
    "name": "TechCorp India",
    "logo": None,
    "logo_url": None,
    "last_year_hires": 0,
    "cumulative_hires_3y": 0,
    "last_year_median_fixed": None,
}

@router.get("/{company_id}", response_model=schemas.CompanySchema)
def get_company(company_id: str, db: Session = Depends(database.get_db)):
    """Get a specific company by ID"""
    if company_id == "demo-company":
        return DEMO_COMPANY
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company

@router.post("/", response_model=schemas.CompanySchema)
def create_company(company: schemas.CompanyCreateSchema, db: Session = Depends(database.get_db)):
    """Create a new company"""
    # Check if company already exists
    existing = db.query(models.Company).filter(models.Company.name == company.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company with this name already exists")
    
    default_allowed = ["RECRUITER"]
    status = getattr(company, "status", None) or "PENDING"
    if status not in ("PENDING", "LISTED", "PARTNER"):
        status = "PENDING"
    db_company = models.Company(
        id=company.id,
        name=company.name,
        last_year_hires=company.last_year_hires or 0,
        cumulative_hires_3y=company.cumulative_hires_3y or 0,
        last_year_median_fixed=company.last_year_median_fixed,
        logo_url=company.logo_url,
        description=getattr(company, "description", None),
        headquarters=getattr(company, "headquarters", None),
        founding_year=getattr(company, "founding_year", None),
        allowed_roles=getattr(company, "allowed_roles", None) or default_allowed,
        status=status,
    )
    db.add(db_company)
    log_audit(
        db, user_id="system", action="COMPANY_CREATED",
        entity_type="company", entity_id=company.id,
        company_id=company.id,
        details={"name": company.name},
    )
    db.commit()
    db.refresh(db_company)
    return db_company

@router.put("/{company_id}", response_model=schemas.CompanySchema)
def update_company(
    company_id: str,
    company_update: schemas.CompanyUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a company"""
    db_company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    changes = company_update.dict(exclude_unset=True)
    for key, value in changes.items():
        setattr(db_company, key, value)
    
    log_audit(
        db, user_id="system", action="COMPANY_UPDATED",
        entity_type="company", entity_id=company_id,
        company_id=company_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(db_company)
    return db_company

@router.get("/{company_id}/jobs", response_model=List[schemas.JobSchema])
def get_company_jobs(company_id: str, db: Session = Depends(database.get_db)):
    """Get all jobs for a company"""
    jobs = db.query(models.JobPosting).filter(models.JobPosting.company_id == company_id).all()
    return jobs

@router.get("/{company_id}/hires", response_model=List[schemas.HistoricalHireSchema])
def get_company_hires(company_id: str, db: Session = Depends(database.get_db)):
    """Get historical hires for a company"""
    hires = db.query(models.HistoricalHire).filter(models.HistoricalHire.company_id == company_id).all()
    return hires

@router.delete("/{company_id}")
def delete_company(company_id: str, db: Session = Depends(database.get_db)):
    """Delete a company"""
    db_company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check if company is referenced by users or jobs
    users_count = db.query(models.User).filter(models.User.company_id == company_id).count()
    jobs_count = db.query(models.JobPosting).filter(models.JobPosting.company_id == company_id).count()
    
    if users_count > 0 or jobs_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete company: {users_count} users and {jobs_count} jobs reference it"
        )
    
    db.delete(db_company)
    db.commit()
    return {"message": "Company deleted successfully"}
