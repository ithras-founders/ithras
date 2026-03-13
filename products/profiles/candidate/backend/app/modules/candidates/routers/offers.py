"""Offers API - CRUD and lifecycle (accept/reject/withdraw)."""
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import get_current_user, require_role
from app.modules.shared.services import resolve_policy_for_candidate, is_offer_release_valid
from app.modules.shared.services.governance_engine import is_lateral_institution

router = APIRouter(prefix="/api/v1/offers", tags=["offers"])


@router.get("/", response_model=List[schemas.OfferSchema], summary="List offers")
def get_offers(
    candidate_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    job_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """List offers with optional filters. Candidates see own; recruiters see company's."""
    query = db.query(models.Offer)
    if candidate_id:
        query = query.filter(models.Offer.candidate_id == candidate_id)
    if company_id:
        query = query.filter(models.Offer.company_id == company_id)
    if job_id:
        query = query.filter(models.Offer.job_id == job_id)
    if status:
        query = query.filter(models.Offer.status == status)
    return query.order_by(models.Offer.created_at.desc()).all()


@router.get("/{offer_id}", response_model=schemas.OfferSchema, summary="Get offer by ID")
def get_offer(offer_id: str, db: Session = Depends(database.get_db), current_user=Depends(get_current_user)):
    """Get a single offer."""
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return offer


@router.post("/", response_model=schemas.OfferSchema, summary="Create offer")
def create_offer(
    data: schemas.OfferCreateSchema,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
):
    """Create an offer. Requires recruiter or placement role."""
    application = db.query(models.Application).filter(models.Application.id == data.application_id).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    if application.student_id != data.candidate_id:
        raise HTTPException(status_code=400, detail="Candidate does not match application")
    if application.job_id != data.job_id:
        raise HTTPException(status_code=400, detail="Job does not match application")
    job = db.query(models.JobPosting).filter(models.JobPosting.id == data.job_id).first()
    if not job or job.company_id != data.company_id:
        raise HTTPException(status_code=400, detail="Company does not match job")
    existing = db.query(models.Offer).filter(
        models.Offer.application_id == data.application_id,
        models.Offer.status.in_(["PENDING"]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="An offer already exists for this application")
    # Enforce offer release window (SYNC vs ROLLING per policy; lateral is always ROLLING)
    candidate = db.query(models.User).filter(models.User.id == data.candidate_id).first()
    lateral = is_lateral_institution(candidate.institution_id if candidate else None, db)
    policy = resolve_policy_for_candidate(data.candidate_id, db)
    if not is_offer_release_valid(datetime.datetime.utcnow(), policy, lateral=lateral):
        raise HTTPException(
            status_code=400,
            detail="Offer release window has not opened yet per governance policy",
        )
    offer_id = f"offer_{uuid.uuid4().hex[:12]}"
    offer = models.Offer(
        id=offer_id,
        application_id=data.application_id,
        candidate_id=data.candidate_id,
        company_id=data.company_id,
        job_id=data.job_id,
        status="PENDING",
        ctc=data.ctc,
        deadline=data.deadline,
    )
    db.add(offer)
    log_audit(
        db, user_id=current_user.id, action="OFFER_CREATED",
        entity_type="offer", entity_id=offer_id,
        details={"candidate_id": data.candidate_id, "job_id": data.job_id},
    )
    db.commit()
    db.refresh(offer)
    return offer


@router.delete("/{offer_id}")
def delete_offer(
    offer_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
):
    """Withdraw a pending offer."""
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status != "PENDING":
        raise HTTPException(status_code=400, detail="Only pending offers can be withdrawn")
    offer.status = "WITHDRAWN"
    offer.responded_at = datetime.datetime.utcnow()
    log_audit(
        db, user_id=current_user.id, action="OFFER_WITHDRAWN",
        entity_type="offer", entity_id=offer_id,
        details={"candidate_id": offer.candidate_id},
    )
    db.commit()
    return {"message": "Offer withdrawn"}


def _respond_offer(offer_id: str, new_status: str, db: Session, current_user):
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status != "PENDING":
        raise HTTPException(status_code=400, detail="Offer is no longer pending")
    if offer.candidate_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the candidate can respond to this offer")
    # Enforce offer deadline
    now = datetime.datetime.utcnow()
    if offer.deadline and now > offer.deadline:
        raise HTTPException(status_code=400, detail="Offer deadline has passed")
    # Enforce offer release window on accept (lateral is always ROLLING)
    if new_status == "ACCEPTED":
        cand = db.query(models.User).filter(models.User.id == offer.candidate_id).first()
        lat = is_lateral_institution(cand.institution_id if cand else None, db)
        policy = resolve_policy_for_candidate(offer.candidate_id, db)
        if not is_offer_release_valid(now, policy, lateral=lat):
            raise HTTPException(
                status_code=400,
                detail="Offer acceptance window has not opened yet per governance policy",
            )
    offer.status = new_status
    offer.responded_at = now
    return offer


@router.post("/{offer_id}/accept")
def accept_offer(
    offer_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Candidate accepts the offer."""
    offer = _respond_offer(offer_id, "ACCEPTED", db, current_user)
    log_audit(
        db, user_id=current_user.id, action="OFFER_ACCEPTED",
        entity_type="offer", entity_id=offer_id,
        details={"job_id": offer.job_id},
    )
    db.commit()
    return {"message": "Offer accepted"}


@router.post("/{offer_id}/reject")
def reject_offer(
    offer_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(get_current_user),
):
    """Candidate rejects the offer."""
    offer = _respond_offer(offer_id, "REJECTED", db, current_user)
    log_audit(
        db, user_id=current_user.id, action="OFFER_REJECTED",
        entity_type="offer", entity_id=offer_id,
        details={"job_id": offer.job_id},
    )
    db.commit()
    return {"message": "Offer rejected"}


@router.post("/{offer_id}/withdraw")
def withdraw_offer(
    offer_id: str,
    db: Session = Depends(database.get_db),
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
):
    """Recruiter/placement withdraws the offer."""
    offer = db.query(models.Offer).filter(models.Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    if offer.status != "PENDING":
        raise HTTPException(status_code=400, detail="Offer is no longer pending")
    offer.status = "WITHDRAWN"
    offer.responded_at = datetime.datetime.utcnow()
    log_audit(
        db, user_id=current_user.id, action="OFFER_WITHDRAWN",
        entity_type="offer", entity_id=offer_id,
        details={"candidate_id": offer.candidate_id},
    )
    db.commit()
    return {"message": "Offer withdrawn"}
