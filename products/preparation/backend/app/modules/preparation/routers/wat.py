"""WAT practice: timed response + rubric scoring."""
import os
import sys
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user
from app.modules.shared.audit import log_audit
from ..services.scoring import compute_wat_rubric_score

router = APIRouter(prefix="/api/v1/prep-wat", tags=["prep-wat"])


@router.get("/topics", response_model=list[schemas.PrepQuestionBankSchema])
def list_wat_topics(
    school_tag: str | None = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List WAT prompts/topics."""
    q = db.query(models.PrepQuestionBank).filter(models.PrepQuestionBank.category == "WAT")
    if school_tag:
        q = q.filter(models.PrepQuestionBank.school_tag == school_tag)
    return q.offset(offset).limit(limit).all()


@router.post("/attempts", response_model=schemas.PrepAttemptSchema)
def create_wat_attempt(
    data: schemas.PrepAttemptCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Submit WAT timed response."""
    if not data.question_id and not data.prompt_id:
        raise HTTPException(status_code=400, detail="question_id or prompt_id required")
    attempt_id = f"wat_{uuid.uuid4().hex[:12]}"
    attempt = models.PrepAttempt(
        id=attempt_id,
        user_id=current_user.id,
        question_id=data.question_id,
        prompt_id=data.prompt_id,
        answer_text=data.answer_text,
        duration_sec=data.duration_sec,
        attempt_type="TEXT",
    )
    db.add(attempt)
    log_audit(db, user_id=current_user.id, action="PREP_WAT_ATTEMPT_CREATED", entity_type="prep_attempt", entity_id=attempt_id)
    db.commit()
    db.refresh(attempt)
    return attempt


@router.post("/attempts/{attempt_id}/score", response_model=schemas.PrepRubricScoreSchema)
def score_wat_attempt(
    attempt_id: str,
    clarity: float = Query(0, ge=0, le=10),
    structure: float = Query(0, ge=0, le=10),
    relevance: float = Query(0, ge=0, le=10),
    feedback_notes: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add WAT rubric score."""
    attempt = db.query(models.PrepAttempt).filter(
        models.PrepAttempt.id == attempt_id,
        models.PrepAttempt.user_id == current_user.id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    existing = db.query(models.PrepRubricScore).filter(models.PrepRubricScore.attempt_id == attempt_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Score already exists")
    agg = compute_wat_rubric_score(clarity=clarity, structure=structure, relevance=relevance)
    score_id = f"wsc_{uuid.uuid4().hex[:12]}"
    score = models.PrepRubricScore(
        id=score_id,
        attempt_id=attempt_id,
        clarity=clarity,
        structure=structure,
        relevance=relevance,
        aggregate_score=agg,
        feedback_notes=feedback_notes,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score
