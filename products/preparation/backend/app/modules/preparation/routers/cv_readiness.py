"""CV readiness rule-based scoring API."""
import os
import sys
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user
from ..services.scoring import compute_cv_readiness_score

router = APIRouter(prefix="/api/v1/prep-cv", tags=["prep-cv"])


@router.get("/readiness/me", response_model=schemas.CVReadinessScoreSchema)
def get_my_cv_readiness(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get CV readiness score for the current user's primary CV."""
    cv = (
        db.query(models.CV)
        .filter(models.CV.candidate_id == current_user.id)
        .order_by(models.CV.updated_at.desc())
        .first()
    )
    if not cv or not cv.data:
        return schemas.CVReadinessScoreSchema(score=0, checklist={}, suggestions=["Add a CV to see your strength"])
    result = compute_cv_readiness_score(cv.data, None)
    return schemas.CVReadinessScoreSchema(
        score=result["score"],
        checklist=result["checklist"],
        suggestions=result["suggestions"],
    )


@router.post("/readiness", response_model=schemas.CVReadinessScoreSchema)
def check_cv_readiness(
    cv_data: dict = Body(default_factory=dict),
    cv_text: str | None = Body(default=None),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """
    Rule-based CV checklist score. Submit raw CV data (JSON) or plain text.
    No AI - deterministic quality checks.
    """
    result = compute_cv_readiness_score(cv_data, cv_text)
    return schemas.CVReadinessScoreSchema(
        score=result["score"],
        checklist=result["checklist"],
        suggestions=result["suggestions"],
    )
