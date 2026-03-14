"""Profile intake and readiness baseline API."""
import os
import sys
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user
from app.modules.shared.audit import log_audit
from ..services.scoring import compute_weekly_readiness_score
from ..services.recommendations import get_top_5_actions

router = APIRouter(prefix="/api/v1/prep-intake", tags=["prep-intake"])


@router.get("/profile", response_model=schemas.PrepProfileSchema)
def get_prep_profile(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get current user's preparation profile."""
    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Complete intake first.")
    return profile


@router.post("/profile", response_model=schemas.PrepProfileSchema)
def create_prep_profile(
    data: schemas.PrepProfileCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create preparation profile (intake)."""
    existing = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Profile already exists. Use PATCH to update.")
    profile_id = f"prep_{uuid.uuid4().hex[:12]}"
    profile = models.PrepProfile(
        id=profile_id,
        user_id=current_user.id,
        cat_percentile=data.cat_percentile,
        grad_stream=data.grad_stream,
        work_ex_years=data.work_ex_years,
        achievements=data.achievements,
        extracurriculars=data.extracurriculars,
        target_schools=data.target_schools,
    )
    db.add(profile)
    log_audit(db, user_id=current_user.id, action="PREP_PROFILE_CREATED", entity_type="prep_profile", entity_id=profile_id)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/profile", response_model=schemas.PrepProfileSchema)
def update_prep_profile(
    data: schemas.PrepProfileUpdateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Update preparation profile."""
    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found. Complete intake first.")
    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(profile, k, v)
    log_audit(db, user_id=current_user.id, action="PREP_PROFILE_UPDATED", entity_type="prep_profile", entity_id=profile.id)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/readiness", response_model=schemas.ReadinessBaselineSchema)
def get_readiness(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get admission readiness score, strength/weakness radar, and top 5 actions."""
    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    baseline = profile.baseline_metadata if profile else {}
    radar = baseline.get("strength_weakness_radar", {
        "academics": 50.0,
        "story": 50.0,
        "communication": 50.0,
        "business_awareness": 50.0,
        "confidence": 50.0,
    })
    admission_score = profile.admission_readiness_score if profile else 50.0
    if admission_score is None:
        admission_score = 50.0
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    mock_count = db.query(models.PrepAttempt).filter(
        models.PrepAttempt.user_id == current_user.id,
        models.PrepAttempt.created_at >= week_ago,
    ).count() if profile else 0
    wat_count = 0
    if profile:
        q_ids = [r.id for r in db.query(models.PrepQuestionBank.id).filter(
            models.PrepQuestionBank.category == "WAT"
        ).all()]
        if q_ids:
            wat_count = db.query(models.PrepAttempt).filter(
                models.PrepAttempt.user_id == current_user.id,
                models.PrepAttempt.created_at >= week_ago,
                models.PrepAttempt.question_id.in_(q_ids),
            ).count()
    cv_milestone = db.query(models.PrepMilestone).filter(
        models.PrepMilestone.user_id == current_user.id,
        models.PrepMilestone.milestone_type == "CV_COMPLETE",
    ).first() is not None
    top_5 = get_top_5_actions(
        admission_readiness_score=admission_score,
        baseline_metadata=baseline,
        mock_count_7d=mock_count,
        wat_count_7d=wat_count,
        cv_complete=cv_milestone,
        cat_percentile=profile.cat_percentile if profile else None,
    )
    return schemas.ReadinessBaselineSchema(
        admission_readiness_score=admission_score,
        strength_weakness_radar=radar,
        top_5_actions=top_5,
    )
