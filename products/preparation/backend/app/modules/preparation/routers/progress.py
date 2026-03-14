"""Progress dashboard: readiness score, milestones, weekly plan."""
import os
import sys
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user
from app.modules.shared.audit import log_audit
from ..services.scoring import compute_weekly_readiness_score
from ..services.recommendations import get_next_best_action

router = APIRouter(prefix="/api/v1/prep-progress", tags=["prep-progress"])


@router.get("/me")
def get_my_progress(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Returns daily prep streak for Readiness Dashboard. Placeholder - returns 0 until streak tracking is implemented."""
    return {"daily_streak": 0}


@router.get("/dashboard")
def get_progress_dashboard(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Progress dashboard: readiness score, last 14-day delta, next fix, milestones.
    """
    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    baseline = profile.baseline_metadata if profile else {}
    admission_score = profile.admission_readiness_score if profile else 50.0
    if admission_score is None:
        admission_score = 50.0

    week_ago = datetime.utcnow() - timedelta(days=7)
    two_weeks_ago = datetime.utcnow() - timedelta(days=14)
    mock_count_7d = db.query(models.PrepAttempt).filter(
        models.PrepAttempt.user_id == current_user.id,
        models.PrepAttempt.created_at >= week_ago,
    ).count()
    q_ids_wat = [r[0] for r in db.query(models.PrepQuestionBank.id).filter(
        models.PrepQuestionBank.category == "WAT"
    ).all()]
    wat_count_7d = 0
    if q_ids_wat:
        wat_count_7d = db.query(models.PrepAttempt).filter(
            models.PrepAttempt.user_id == current_user.id,
            models.PrepAttempt.created_at >= week_ago,
            models.PrepAttempt.question_id.in_(q_ids_wat),
        ).count()
    cv_complete = db.query(models.PrepMilestone).filter(
        models.PrepMilestone.user_id == current_user.id,
        models.PrepMilestone.milestone_type == "CV_COMPLETE",
    ).first() is not None
    milestones_count = db.query(models.PrepMilestone).filter(
        models.PrepMilestone.user_id == current_user.id,
    ).count()

    current_score = compute_weekly_readiness_score(
        admission_score=admission_score,
        mock_count_7d=mock_count_7d,
        wat_count_7d=wat_count_7d,
        cv_complete=cv_complete,
        milestones_count=milestones_count,
    )
    next_action = get_next_best_action(
        baseline_metadata=baseline,
        mock_count_7d=mock_count_7d,
        wat_count_7d=wat_count_7d,
        cv_complete=cv_complete,
    )
    milestones = db.query(models.PrepMilestone).filter(
        models.PrepMilestone.user_id == current_user.id,
    ).order_by(models.PrepMilestone.completed_at.desc()).limit(10).all()

    return {
        "current_readiness_score": current_score,
        "admission_readiness_score": admission_score,
        "next_action": next_action,
        "mock_count_7d": mock_count_7d,
        "wat_count_7d": wat_count_7d,
        "cv_complete": cv_complete,
        "milestones": [schemas.PrepMilestoneSchema.model_validate(m) for m in milestones],
    }


@router.post("/milestones", response_model=schemas.PrepMilestoneSchema)
def create_milestone(
    data: schemas.PrepMilestoneCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Mark a milestone complete (e.g. CV_COMPLETE, MOCK_1)."""
    import uuid
    milestone_id = f"ms_{uuid.uuid4().hex[:12]}"
    milestone = models.PrepMilestone(
        id=milestone_id,
        user_id=current_user.id,
        milestone_type=data.milestone_type,
    )
    db.add(milestone)
    log_audit(db, user_id=current_user.id, action="PREP_MILESTONE_CREATED", entity_type="prep_milestone", entity_id=milestone_id)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("/plan", response_model=schemas.PrepPlanSchema | None)
def get_prep_plan(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get current user's active prep plan."""
    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    if not profile:
        return None
    plan = db.query(models.PrepPlan).filter(
        models.PrepPlan.profile_id == profile.id,
        models.PrepPlan.status == "ACTIVE",
    ).first()
    return plan


@router.post("/plan", response_model=schemas.PrepPlanSchema)
def create_prep_plan(
    data: schemas.PrepPlanCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create or update weekly prep plan."""
    import uuid
    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Complete intake first")
    existing = db.query(models.PrepPlan).filter(
        models.PrepPlan.profile_id == profile.id,
        models.PrepPlan.status == "ACTIVE",
    ).first()
    if existing:
        for k, v in data.model_dump(exclude_unset=True).items():
            setattr(existing, k, v)
        db.commit()
        db.refresh(existing)
        return existing
    plan_id = f"plan_{uuid.uuid4().hex[:12]}"
    plan = models.PrepPlan(
        id=plan_id,
        profile_id=profile.id,
        weekly_goals=data.weekly_goals,
        status=data.status,
        due_dates=data.due_dates,
        week_start=data.week_start,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan
