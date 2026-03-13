from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.modules.shared import models, database, schemas

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])

@router.get("/")
def get_jobs(
    company_id: Optional[str] = Query(None),
    cycle_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    slot: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db)
):
    """Get jobs with optional filtering and pagination."""
    query = db.query(models.JobPosting)
    if company_id:
        query = query.filter(models.JobPosting.company_id == company_id)
    if cycle_id:
        query = query.filter(models.JobPosting.cycle_id == cycle_id)
    if institution_id:
        query = query.filter(
            (models.JobPosting.institution_id == institution_id) | (models.JobPosting.institution_id.is_(None))
        )
    if sector:
        query = query.filter(models.JobPosting.sector == sector)
    if slot:
        query = query.filter(models.JobPosting.slot == slot)
    from app.modules.shared.pagination import paginate_query
    items, total = paginate_query(query, limit, offset)
    return {"items": items, "total": total}

@router.get("/{job_id}", response_model=schemas.JobSchema)
def get_job(job_id: str, db: Session = Depends(database.get_db)):
    """Get a specific job by ID"""
    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/", response_model=schemas.JobSchema)
def create_job(job: schemas.JobCreateSchema, db: Session = Depends(database.get_db)):
    """Create a new job posting"""
    db_job = models.JobPosting(
        id=job.id,
        company_id=job.company_id,
        cycle_id=job.cycle_id,
        institution_id=job.institution_id,
        title=job.title,
        sector=job.sector,
        slot=job.slot,
        fixed_comp=job.fixed_comp,
        variable_comp=job.variable_comp or 0,
        esops_vested=job.esops_vested or 0,
        joining_bonus=job.joining_bonus or 0,
        performance_bonus=job.performance_bonus or 0,
        is_top_decile=job.is_top_decile or False,
        opening_date=job.opening_date,
        jd_status=job.jd_status or "Draft",
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@router.delete("/{job_id}")
def delete_job(
    job_id: str,
    db: Session = Depends(database.get_db),
):
    """Delete a job posting."""
    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}


@router.put("/{job_id}", response_model=schemas.JobSchema)
def update_job(
    job_id: str,
    job_update: schemas.JobUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a job posting"""
    db_job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not db_job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    for key, value in job_update.dict(exclude_unset=True).items():
        setattr(db_job, key, value)
    
    db.commit()
    db.refresh(db_job)
    return db_job
