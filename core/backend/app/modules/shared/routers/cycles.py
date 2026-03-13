from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from statistics import median
from .. import models, database, schemas
from ..auth import get_current_user, require_permission_with_subscription
from ..audit import log_audit
from ..cache import invalidate
from ..pagination import paginate_query

router = APIRouter(prefix="/api/v1/cycles", tags=["cycles"])

CACHE_KEY_CYCLES = "cycles:list"


@router.get("/", summary="List placement cycles")
def get_cycles(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    institution_id: str = Query(None),
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.view")),
):
    """Get placement cycles with pagination. Optionally filter by institution_id."""
    query = db.query(models.Cycle)
    if institution_id:
        query = query.filter(
            (models.Cycle.institution_id == institution_id) | (models.Cycle.institution_id.is_(None))
        )
    query = query.order_by(models.Cycle.created_at.desc())
    from ..pagination import paginate_query
    cycles, total = paginate_query(query, limit, offset)
    result = [schemas.CycleSchema.model_validate(c) for c in cycles]
    return {"items": result, "total": total}

@router.get("/{cycle_id}", response_model=schemas.CycleSchema, summary="Get cycle by ID")
def get_cycle(
    cycle_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.view")),
):
    """Get a specific cycle by ID."""
    cycle = db.query(models.Cycle).filter(models.Cycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    return cycle

@router.get("/{cycle_id}/stats", summary="Get cycle statistics")
def get_cycle_stats(
    cycle_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.view")),
):
    """Get statistics for a cycle. Jobs and shortlists are filtered by cycle_id."""
    cycle = db.query(models.Cycle).filter(models.Cycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    jobs = db.query(models.JobPosting).filter(models.JobPosting.cycle_id == cycle_id).all()
    job_ids = [j.id for j in jobs]
    shortlists = db.query(models.Shortlist).filter(models.Shortlist.job_id.in_(job_ids)).all() if job_ids else []
    stats = []
    companies = db.query(models.Company).all()
    for company in companies:
        company_jobs = [j for j in jobs if j.company_id == company.id]
        company_shortlists = [s for s in shortlists if s.job_id in [j.id for j in company_jobs]]
        stats.append({
            "companyId": company.id,
            "applicants": len(set([s.candidate_id for s in company_shortlists])),
            "shortlists": len(company_shortlists),
            "totalHires": company.last_year_hires or 0
        })
    return {"stats": stats}

@router.get("/{cycle_id}/analytics", summary="Cycle placement analytics")
def get_cycle_analytics(
    cycle_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.view")),
):
    """Aggregate analytics for a cycle: offer rate, median CTC, sector distribution, stage funnel."""
    cycle = db.query(models.Cycle).filter(models.Cycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    jobs = db.query(models.JobPosting).filter(models.JobPosting.cycle_id == cycle_id).all()
    job_ids = [j.id for j in jobs]

    if not job_ids:
        return {
            "cycle_id": cycle_id,
            "cycle_name": cycle.name,
            "total_jobs": 0,
            "total_applications": 0,
            "total_offers": 0,
            "offer_rate_pct": 0,
            "median_ctc": None,
            "sector_distribution": [],
            "stage_funnel": [],
            "top_recruiters": [],
        }

    total_apps = (
        db.query(func.count(models.Application.id))
        .filter(models.Application.job_id.in_(job_ids))
        .scalar()
    ) or 0

    offers = (
        db.query(models.Offer)
        .filter(models.Offer.job_id.in_(job_ids))
        .all()
    )
    total_offers = len(offers)
    accepted_offers = [o for o in offers if o.status == "ACCEPTED"]

    offer_rate = round((total_offers / total_apps) * 100, 1) if total_apps > 0 else 0

    ctc_values = [o.ctc for o in offers if o.ctc and o.ctc > 0]
    median_ctc = round(median(ctc_values)) if ctc_values else None

    sector_counts = {}
    for j in jobs:
        s = j.sector or "Other"
        sector_counts[s] = sector_counts.get(s, 0) + 1
    sector_distribution = sorted(
        [{"sector": k, "count": v} for k, v in sector_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )

    stage_names = ["SUBMITTED", "SHORTLISTED", "IN_PROGRESS", "SELECTED"]
    stage_funnel = []
    for sn in stage_names:
        cnt = (
            db.query(func.count(models.Application.id))
            .filter(models.Application.job_id.in_(job_ids), models.Application.status == sn)
            .scalar()
        ) or 0
        stage_funnel.append({"stage": sn, "count": cnt})

    company_offer_counts = {}
    for o in offers:
        company_offer_counts[o.company_id] = company_offer_counts.get(o.company_id, 0) + 1
    top_company_ids = sorted(company_offer_counts, key=company_offer_counts.get, reverse=True)[:10]
    top_companies = db.query(models.Company).filter(models.Company.id.in_(top_company_ids)).all() if top_company_ids else []
    companies_by_id = {c.id: c for c in top_companies}
    top_recruiters = []
    for cid in top_company_ids:
        company = companies_by_id.get(cid)
        top_recruiters.append({
            "company_id": cid,
            "company_name": company.name if company else cid,
            "offers": company_offer_counts[cid],
        })

    return {
        "cycle_id": cycle_id,
        "cycle_name": cycle.name,
        "total_jobs": len(jobs),
        "total_applications": total_apps,
        "total_offers": total_offers,
        "accepted_offers": len(accepted_offers),
        "offer_rate_pct": offer_rate,
        "median_ctc": median_ctc,
        "sector_distribution": sector_distribution,
        "stage_funnel": stage_funnel,
        "top_recruiters": top_recruiters,
    }


@router.post("/", response_model=schemas.CycleSchema, summary="Create placement cycle")
def create_cycle(
    cycle: schemas.CycleCreateSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.manage")),
):
    """Create a new placement cycle"""
    db_cycle = models.Cycle(
        id=cycle.id,
        name=cycle.name,
        type=cycle.type,
        category=cycle.category,
        status=cycle.status,
        institution_id=cycle.institution_id,
        start_date=cycle.start_date,
        end_date=cycle.end_date,
    )
    db.add(db_cycle)
    log_audit(
        db,
        user_id=current_user.id,
        action="CYCLE_CREATED",
        entity_type="cycle",
        entity_id=cycle.id,
        details={"name": cycle.name},
    )
    db.commit()
    db.refresh(db_cycle)
    invalidate(CACHE_KEY_CYCLES)
    return db_cycle

@router.delete("/{cycle_id}", summary="Delete placement cycle")
def delete_cycle(
    cycle_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.manage")),
):
    """Delete a placement cycle."""
    cycle = db.query(models.Cycle).filter(models.Cycle.id == cycle_id).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")
    log_audit(
        db,
        user_id=current_user.id,
        action="CYCLE_DELETED",
        entity_type="cycle",
        entity_id=cycle_id,
        details={"name": cycle.name},
    )
    db.delete(cycle)
    db.commit()
    invalidate(CACHE_KEY_CYCLES)
    return {"message": "Cycle deleted"}


@router.put("/{cycle_id}", response_model=schemas.CycleSchema, summary="Update placement cycle")
def update_cycle(
    cycle_id: str,
    cycle_update: schemas.CycleUpdateSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission_with_subscription("placement.cycles.manage")),
):
    """Update a placement cycle"""
    db_cycle = db.query(models.Cycle).filter(models.Cycle.id == cycle_id).first()
    if not db_cycle:
        raise HTTPException(status_code=404, detail="Cycle not found")

    changes = cycle_update.model_dump(exclude_unset=True)
    for key, value in changes.items():
        setattr(db_cycle, key, value)

    log_audit(
        db,
        user_id=current_user.id,
        action="CYCLE_UPDATED",
        entity_type="cycle",
        entity_id=cycle_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(db_cycle)
    invalidate(CACHE_KEY_CYCLES)
    return db_cycle
