"""Opportunities API: unified feed, save/unsave, company follow."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from .. import models, database
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/opportunities", tags=["opportunities"])


def _job_to_feed_item(job: models.JobPosting, company: Optional[models.Company], saved_ids: set) -> dict:
    return {
        "id": job.id,
        "company_id": job.company_id,
        "company_name": company.name if company else None,
        "cycle_id": job.cycle_id,
        "institution_id": job.institution_id,
        "title": job.title,
        "sector": job.sector,
        "slot": job.slot,
        "slot_rank": getattr(job, "slot_rank", None),
        "fixed_comp": job.fixed_comp,
        "variable_comp": job.variable_comp or 0,
        "esops_vested": job.esops_vested or 0,
        "joining_bonus": job.joining_bonus or 0,
        "performance_bonus": job.performance_bonus or 0,
        "is_top_decile": job.is_top_decile or False,
        "opening_date": job.opening_date,
        "jd_status": job.jd_status or "Draft",
        "min_cgpa": getattr(job, "min_cgpa", None),
        "max_backlogs": getattr(job, "max_backlogs", None),
        "is_saved": job.id in saved_ids,
        "source": "campus" if job.cycle_id else "lateral",
    }


@router.get("/feed", summary="Unified opportunity feed")
def get_feed(
    cycle_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    slot: Optional[str] = Query(None),
    include_lateral: bool = Query(True, description="Include non-cycle jobs"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Unified feed of job opportunities (campus + lateral). Eligibility filtering can be applied client-side."""
    query = db.query(models.JobPosting).filter(models.JobPosting.jd_status.in_(["Approved", "Submitted", "Draft"]))
    if cycle_id:
        query = query.filter(models.JobPosting.cycle_id == cycle_id)
    if institution_id:
        query = query.filter(
            (models.JobPosting.institution_id == institution_id) | (models.JobPosting.institution_id.is_(None))
        )
    if company_id:
        query = query.filter(models.JobPosting.company_id == company_id)
    if sector:
        query = query.filter(models.JobPosting.sector == sector)
    if slot:
        query = query.filter(models.JobPosting.slot == slot)
    if not include_lateral:
        query = query.filter(models.JobPosting.cycle_id.isnot(None))

    query = query.order_by(models.JobPosting.opening_date.desc().nullslast())
    from ..pagination import paginate_query
    jobs, total = paginate_query(query, limit, offset)

    saved = db.query(models.SavedOpportunity).filter(
        models.SavedOpportunity.user_id == current_user.id,
        models.SavedOpportunity.job_id.in_([j.id for j in jobs]),
    ).all()
    saved_ids = {s.job_id for s in saved}

    company_ids = list({j.company_id for j in jobs})
    companies = {c.id: c for c in db.query(models.Company).filter(models.Company.id.in_(company_ids)).all()}

    items = [_job_to_feed_item(j, companies.get(j.company_id), saved_ids) for j in jobs]
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.get("/saved", summary="List saved opportunities")
def list_saved(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List jobs the current user has saved."""
    saved = (
        db.query(models.SavedOpportunity)
        .filter(models.SavedOpportunity.user_id == current_user.id)
        .order_by(models.SavedOpportunity.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    total = db.query(models.SavedOpportunity).filter(models.SavedOpportunity.user_id == current_user.id).count()
    job_ids = [s.job_id for s in saved]
    jobs = {j.id: j for j in db.query(models.JobPosting).filter(models.JobPosting.id.in_(job_ids)).all()} if job_ids else {}
    companies = {}
    if jobs:
        cids = list({j.company_id for j in jobs.values()})
        companies = {c.id: c for c in db.query(models.Company).filter(models.Company.id.in_(cids)).all()}

    items = []
    for s in saved:
        job = jobs.get(s.job_id)
        if job:
            items.append(_job_to_feed_item(job, companies.get(job.company_id), {s.job_id}))

    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("/saved/{job_id}", summary="Save opportunity")
def save_opportunity(
    job_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Save a job to the user's list."""
    job = db.query(models.JobPosting).filter(models.JobPosting.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    existing = db.query(models.SavedOpportunity).filter(
        models.SavedOpportunity.user_id == current_user.id,
        models.SavedOpportunity.job_id == job_id,
    ).first()
    if existing:
        return {"message": "Already saved", "id": existing.id}

    rec = models.SavedOpportunity(
        id=f"so_{uuid.uuid4().hex}",
        user_id=current_user.id,
        job_id=job_id,
    )
    db.add(rec)
    db.commit()
    return {"message": "Saved", "id": rec.id}


@router.delete("/saved/{job_id}", summary="Unsave opportunity")
def unsave_opportunity(
    job_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Remove a job from the user's saved list."""
    rec = db.query(models.SavedOpportunity).filter(
        models.SavedOpportunity.user_id == current_user.id,
        models.SavedOpportunity.job_id == job_id,
    ).first()
    if not rec:
        return {"message": "Not in saved list"}
    db.delete(rec)
    db.commit()
    return {"message": "Removed"}


@router.post("/companies/{company_id}/follow", summary="Follow company")
def follow_company(
    company_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Follow a company for updates."""
    company = db.query(models.Company).filter(models.Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    existing = db.query(models.CompanyFollow).filter(
        models.CompanyFollow.user_id == current_user.id,
        models.CompanyFollow.company_id == company_id,
    ).first()
    if existing:
        return {"message": "Already following", "id": existing.id}

    rec = models.CompanyFollow(
        id=f"cf_{uuid.uuid4().hex}",
        user_id=current_user.id,
        company_id=company_id,
    )
    db.add(rec)
    db.commit()
    return {"message": "Following", "id": rec.id}


@router.delete("/companies/{company_id}/follow", summary="Unfollow company")
def unfollow_company(
    company_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Unfollow a company."""
    rec = db.query(models.CompanyFollow).filter(
        models.CompanyFollow.user_id == current_user.id,
        models.CompanyFollow.company_id == company_id,
    ).first()
    if not rec:
        return {"message": "Not following"}
    db.delete(rec)
    db.commit()
    return {"message": "Unfollowed"}
