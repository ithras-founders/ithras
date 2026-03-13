import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional
from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import get_current_user, require_role
from ..services.governance_rules import check_shortlist_governance

router = APIRouter(prefix="/api/v1/shortlists", tags=["shortlists"])


@router.post("/", response_model=schemas.ShortlistSchema, summary="Create shortlist")
def create_shortlist(
    data: schemas.ShortlistCreateSchema,
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Create a shortlist. Requires recruiter or placement role. Candidate must have applied to the job."""
    # Validate candidate applied to job
    application = (
        db.query(models.Application)
        .filter(
            models.Application.student_id == data.candidate_id,
            models.Application.job_id == data.job_id,
        )
        .first()
    )
    if not application:
        raise HTTPException(
            status_code=400,
            detail="Candidate has not applied to this job",
        )
    # Check for duplicate
    existing = (
        db.query(models.Shortlist)
        .filter(
            models.Shortlist.candidate_id == data.candidate_id,
            models.Shortlist.job_id == data.job_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Candidate is already shortlisted for this job",
        )
    # Enforce governance: shortlist caps and sector distribution
    job = db.query(models.JobPosting).filter(models.JobPosting.id == data.job_id).first()
    if job:
        valid, error = check_shortlist_governance(data.candidate_id, job, db)
        if not valid:
            raise HTTPException(status_code=400, detail=error)
    shortlist_id = f"sl_{uuid.uuid4().hex[:12]}"
    shortlist = models.Shortlist(
        id=shortlist_id,
        candidate_id=data.candidate_id,
        job_id=data.job_id,
        status=data.status or "Active",
    )
    db.add(shortlist)
    log_audit(
        db, user_id=current_user.id, action="SHORTLIST_CREATED",
        entity_type="shortlist", entity_id=shortlist_id,
        details={"candidate_id": data.candidate_id, "job_id": data.job_id},
    )
    db.commit()
    db.refresh(shortlist)
    return shortlist


@router.get("/", summary="List shortlists with pagination")
def get_shortlists(
    candidate_id: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db)
):
    """Get shortlists with optional filtering and pagination."""
    query = db.query(models.Shortlist)
    if candidate_id:
        query = query.filter(models.Shortlist.candidate_id == candidate_id)
    if job_id:
        query = query.filter(models.Shortlist.job_id == job_id)
    if status:
        query = query.filter(models.Shortlist.status == status)
    # Avoid N+1: jobs/candidates loaded if schema needs them
    query = query.order_by(models.Shortlist.received_at.desc())
    from app.modules.shared.pagination import paginate_query
    items, total = paginate_query(query, limit, offset)
    return {"items": items, "total": total}

@router.get("/{shortlist_id}", response_model=schemas.ShortlistSchema)
def get_shortlist(shortlist_id: str, db: Session = Depends(database.get_db)):
    """Get a specific shortlist by ID"""
    shortlist = db.query(models.Shortlist).filter(models.Shortlist.id == shortlist_id).first()
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    return shortlist

@router.get("/user/{user_id}", response_model=List[schemas.ShortlistSchema])
def get_user_shortlists(user_id: str, db: Session = Depends(database.get_db)):
    """Get all shortlists for a specific user"""
    shortlists = db.query(models.Shortlist).filter(models.Shortlist.candidate_id == user_id).all()
    return shortlists

@router.delete("/{shortlist_id}")
def delete_shortlist(
    shortlist_id: str,
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Remove a candidate from shortlist."""
    shortlist = db.query(models.Shortlist).filter(models.Shortlist.id == shortlist_id).first()
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    db.delete(shortlist)
    log_audit(
        db, user_id=current_user.id, action="SHORTLIST_DELETED",
        entity_type="shortlist", entity_id=shortlist_id,
        details={"candidate_id": shortlist.candidate_id, "job_id": shortlist.job_id},
    )
    db.commit()
    return {"message": "Shortlist removed"}


@router.post("/{shortlist_id}/respond")
def respond_to_shortlist(
    shortlist_id: str,
    payload: schemas.ResponseSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Respond to a shortlist (existing endpoint)"""
    shortlist = db.query(models.Shortlist).filter(models.Shortlist.id == shortlist_id).first()
    if not shortlist:
        raise HTTPException(status_code=404, detail="Shortlist not found")
    
    if payload.status in ["Accepted", "Held"]:
        job = db.query(models.JobPosting).filter(models.JobPosting.id == shortlist.job_id).first()
        if job:
            valid, error = check_shortlist_governance(shortlist.candidate_id, job, db)
            if not valid:
                raise HTTPException(status_code=400, detail=error)

    shortlist.status = payload.status
    import datetime
    shortlist.responded_at = datetime.datetime.utcnow()
    
    log_audit(
        db, user_id=shortlist.candidate_id, action="SHORTLIST_RESPONSE",
        entity_type="shortlist", entity_id=shortlist_id,
        details={"status": payload.status, "job_id": shortlist.job_id},
    )
    db.commit()
    return {"message": "Response recorded"}
