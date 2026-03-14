"""Interview prep: question bank, attempts, rubric scoring."""
import os
import sys
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user
from app.modules.shared.audit import log_audit
from ..services.scoring import compute_pi_rubric_score

router = APIRouter(prefix="/api/v1/prep-interview", tags=["prep-interview"])


@router.get("/questions", response_model=list[schemas.PrepQuestionBankSchema])
def list_questions(
    category: str | None = Query(None),
    school_tag: str | None = Query(None),
    difficulty: str | None = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List PI/WAT/GD questions with optional filters."""
    q = db.query(models.PrepQuestionBank)
    if category:
        q = q.filter(models.PrepQuestionBank.category == category)
    if school_tag:
        q = q.filter(models.PrepQuestionBank.school_tag == school_tag)
    if difficulty:
        q = q.filter(models.PrepQuestionBank.difficulty == difficulty)
    return q.offset(offset).limit(limit).all()


@router.post("/attempts", response_model=schemas.PrepAttemptSchema)
def create_attempt(
    data: schemas.PrepAttemptCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Submit a mock attempt (text)."""
    if not data.question_id and not data.prompt_id:
        raise HTTPException(status_code=400, detail="question_id or prompt_id required")
    attempt_id = f"att_{uuid.uuid4().hex[:12]}"
    attempt = models.PrepAttempt(
        id=attempt_id,
        user_id=current_user.id,
        question_id=data.question_id,
        prompt_id=data.prompt_id,
        answer_text=data.answer_text,
        duration_sec=data.duration_sec,
        transcript_ref=data.transcript_ref,
        attempt_type=data.attempt_type or "TEXT",
    )
    db.add(attempt)
    log_audit(db, user_id=current_user.id, action="PREP_ATTEMPT_CREATED", entity_type="prep_attempt", entity_id=attempt_id)
    db.commit()
    db.refresh(attempt)
    return attempt


@router.post("/attempts/{attempt_id}/score", response_model=schemas.PrepRubricScoreSchema)
def score_attempt(
    attempt_id: str,
    clarity: float = Query(0, ge=0, le=10),
    structure: float = Query(0, ge=0, le=10),
    relevance: float = Query(0, ge=0, le=10),
    confidence: float = Query(0, ge=0, le=10),
    feedback_notes: str | None = Query(None),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add rubric score to attempt (manual or rule-based)."""
    attempt = db.query(models.PrepAttempt).filter(
        models.PrepAttempt.id == attempt_id,
        models.PrepAttempt.user_id == current_user.id,
    ).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")
    existing = db.query(models.PrepRubricScore).filter(models.PrepRubricScore.attempt_id == attempt_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Score already exists for this attempt")
    agg = compute_pi_rubric_score(clarity=clarity, structure=structure, relevance=relevance, confidence=confidence)
    score_id = f"scr_{uuid.uuid4().hex[:12]}"
    score = models.PrepRubricScore(
        id=score_id,
        attempt_id=attempt_id,
        clarity=clarity,
        structure=structure,
        relevance=relevance,
        confidence=confidence,
        aggregate_score=agg,
        feedback_notes=feedback_notes,
    )
    db.add(score)
    db.commit()
    db.refresh(score)
    return score


@router.get("/attempts", response_model=list[schemas.PrepAttemptSchema])
def list_my_attempts(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List current user's attempts."""
    return db.query(models.PrepAttempt).filter(
        models.PrepAttempt.user_id == current_user.id,
    ).order_by(models.PrepAttempt.created_at.desc()).offset(offset).limit(limit).all()
