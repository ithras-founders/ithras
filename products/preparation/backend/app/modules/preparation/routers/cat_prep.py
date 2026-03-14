"""CAT prep router: topics, mocks, dashboard, insights."""
import os
import sys
import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database
from app.modules.shared.auth import get_current_user
from app.config import settings as _app_settings

from ..config.cat_taxonomy import CAT_SECTIONS, CAT_TOPICS, MOCK_TYPES, DIFFICULTY_LEVELS
from ..services.cat_scoring import compute_cat_raw_score, estimate_percentile_from_raw, aggregate_topic_scores
from ..services.cat_recommendations import get_cat_prep_insights

router = APIRouter(prefix="/api/v1/prep-cat", tags=["prep-cat"])


class StartMockRequest(BaseModel):
    session_type: str
    difficulty_level: Optional[str] = "MIXED"


class SubmitMockRequest(BaseModel):
    responses: List[Dict[str, Any]]  # [{question_id, selected_option, time_spent_sec}]


@router.get("/topics")
def get_topics(current_user=Depends(get_current_user)):
    """List CAT sections and topics taxonomy."""
    return {
        "sections": CAT_SECTIONS,
        "topics": CAT_TOPICS,
    }


@router.get("/mocks/available")
def get_available_mocks(current_user=Depends(get_current_user)):
    """List available mock types (sectional/full, difficulty)."""
    return {
        "mock_types": MOCK_TYPES,
        "difficulty_levels": DIFFICULTY_LEVELS,
    }


@router.post("/mocks/start")
def start_mock(
    data: StartMockRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Start a mock session; return session_id and questions."""
    mock_def = next((m for m in MOCK_TYPES if m["id"] == data.session_type), None)
    if not mock_def:
        raise HTTPException(status_code=400, detail=f"Unknown session_type: {data.session_type}")

    sections = mock_def["sections"]
    q_per = mock_def["questions_per_section"]
    time_sec = mock_def["time_sec"]

    q_filter = models.PrepQuestionBank.category == "CAT"
    questions = db.query(models.PrepQuestionBank).filter(q_filter).all()

    meta_filtered = [q for q in questions if (q.extra_meta or {}).get("section") in sections]
    if len(meta_filtered) < q_per * len(sections):
        meta_filtered = questions

    selected = []
    for sec in sections:
        sec_q = [q for q in meta_filtered if (q.extra_meta or {}).get("section") == sec]
        if not sec_q:
            sec_q = meta_filtered[:q_per]
        import random
        selected.extend(random.sample(sec_q, min(q_per, len(sec_q))))

    if not selected:
        raise HTTPException(status_code=503, detail="No CAT questions in bank. Run seed script.")

    session_id = f"cat_{uuid.uuid4().hex[:16]}"
    question_ids = [q.id for q in selected]

    session = models.CATMockSession(
        id=session_id,
        user_id=current_user.id,
        session_type=data.session_type,
        difficulty_level=data.difficulty_level or "MIXED",
        section_order=sections,
        time_limit_sec=time_sec,
        status="IN_PROGRESS",
        question_ids=question_ids,
    )
    db.add(session)
    db.commit()

    def _serialize_q(q):
        meta = q.extra_meta or {}
        return {
            "id": q.id,
            "question_text": q.question_text,
            "section": meta.get("section"),
            "topic": meta.get("topic"),
            "question_type": meta.get("question_type", "MCQ"),
            "options": meta.get("options", []),
        }

    return {
        "session_id": session_id,
        "questions": [_serialize_q(q) for q in selected],
        "time_limit_sec": time_sec,
        "section_order": sections,
    }


@router.post("/mocks/{session_id}/submit")
def submit_mock(
    session_id: str,
    data: SubmitMockRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Submit mock answers; compute score and update topic scores."""
    session = db.query(models.CATMockSession).filter(
        models.CATMockSession.id == session_id,
        models.CATMockSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.status == "SUBMITTED":
        raise HTTPException(status_code=400, detail="Session already submitted")

    q_ids = session.question_ids or []
    questions = {q.id: q for q in db.query(models.PrepQuestionBank).filter(
        models.PrepQuestionBank.id.in_(q_ids)
    ).all()} if q_ids else {}

    responses_by_q = {r["question_id"]: r for r in data.responses}
    score_raw_by_section = {}
    topic_updates = []

    for qid in q_ids:
        q = questions.get(qid)
        meta = (q.extra_meta or {}) if q else {}
        section = meta.get("section", "UNKNOWN")
        topic = meta.get("topic", "UNKNOWN")
        correct_option = meta.get("correct_option")
        options = meta.get("options", [])
        is_mcq = meta.get("question_type", "MCQ") == "MCQ"

        resp = responses_by_q.get(qid, {})
        selected = resp.get("selected_option")
        time_sec = resp.get("time_spent_sec")

        is_correct = False
        if correct_option is not None and selected is not None:
            if is_mcq and options:
                correct_val = options[int(correct_option)] if isinstance(correct_option, int) else correct_option
                is_correct = str(selected) == str(correct_val)
            else:
                is_correct = str(selected) == str(correct_option)

        resp_id = f"resp_{uuid.uuid4().hex[:12]}"
        ar = models.CATAttemptResponse(
            id=resp_id,
            session_id=session_id,
            question_id=qid,
            selected_option=str(selected) if selected is not None else None,
            is_correct=is_correct,
            time_spent_sec=time_sec,
        )
        db.add(ar)

        if section not in score_raw_by_section:
            score_raw_by_section[section] = {"correct": 0, "wrong": 0}
        if is_mcq:
            if is_correct:
                score_raw_by_section[section]["correct"] += 1
            elif selected is not None and str(selected).strip() != "":
                score_raw_by_section[section]["wrong"] += 1

        topic_updates.append({
            "question_id": qid,
            "section": section,
            "topic": topic,
            "is_correct": is_correct,
            "time_spent_sec": time_sec,
        })

    now = datetime.utcnow()
    session.submitted_at = now
    session.status = "SUBMITTED"
    session.score_raw = {
        sec: compute_cat_raw_score(d["correct"], d["wrong"])
        for sec, d in score_raw_by_section.items()
    }
    session.score_scaled = session.score_raw
    total_raw = sum(session.score_raw.values())
    max_possible = len([q for q in questions.values() if (q.extra_meta or {}).get("question_type", "MCQ") == "MCQ"]) * 3
    session.percentile_estimate = {
        sec: estimate_percentile_from_raw(session.score_raw.get(sec, 0), max_possible / 3 if len(score_raw_by_section) else 1)
        for sec in score_raw_by_section
    }

    questions_by_id = {
        qid: {"section": (q.extra_meta or {}).get("section"), "topic": (q.extra_meta or {}).get("topic")}
        for qid, q in questions.items()
    }
    resp_for_agg = [
        {"question_id": t["question_id"], "is_correct": t["is_correct"], "time_spent_sec": t["time_spent_sec"]}
        for t in topic_updates if t.get("question_id")
    ]
    agg = aggregate_topic_scores(resp_for_agg, questions_by_id)

    for key, stats in agg.items():
        section, topic = stats["section"], stats["topic"]
        existing = db.query(models.CATTopicScore).filter(
            models.CATTopicScore.user_id == current_user.id,
            models.CATTopicScore.section == section,
            models.CATTopicScore.topic == topic,
        ).first()
        if existing:
            n = existing.attempts_count + stats["attempts_count"]
            c = existing.correct_count + stats["correct_count"]
            existing.attempts_count = n
            existing.correct_count = c
            existing.accuracy_pct = round(100 * c / n, 1) if n else 0
            ts = [stats.get("avg_time_sec"), existing.avg_time_sec]
            existing.avg_time_sec = sum(x for x in ts if x) / 2 if any(ts) else None
            existing.last_attempted_at = now
            existing.updated_at = now
        else:
            sid = f"cts_{uuid.uuid4().hex[:12]}"
            db.add(models.CATTopicScore(
                id=sid,
                user_id=current_user.id,
                section=section,
                topic=topic,
                attempts_count=stats["attempts_count"],
                correct_count=stats["correct_count"],
                accuracy_pct=stats["accuracy_pct"],
                avg_time_sec=stats.get("avg_time_sec"),
                last_attempted_at=now,
            ))

    db.commit()
    db.refresh(session)

    return {
        "session_id": session_id,
        "score_raw": session.score_raw,
        "score_scaled": session.score_scaled,
        "percentile_estimate": session.percentile_estimate,
        "total_raw": total_raw,
    }


@router.get("/dashboard")
def get_dashboard(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Topic-wise scores, sectional trends, weak/strong areas."""
    topic_scores = db.query(models.CATTopicScore).filter(
        models.CATTopicScore.user_id == current_user.id,
    ).all()

    by_section = {}
    for ts in topic_scores:
        sec = ts.section
        if sec not in by_section:
            by_section[sec] = {"accuracy": 0, "total_attempts": 0, "total_correct": 0, "topics": []}
        by_section[sec]["total_attempts"] += ts.attempts_count
        by_section[sec]["total_correct"] += ts.correct_count
        by_section[sec]["topics"].append({
            "topic": ts.topic,
            "attempts_count": ts.attempts_count,
            "correct_count": ts.correct_count,
            "accuracy_pct": ts.accuracy_pct,
            "avg_time_sec": ts.avg_time_sec,
        })

    section_accuracy = {}
    for sec, d in by_section.items():
        a, c = d["total_attempts"], d["total_correct"]
        section_accuracy[sec] = round(100 * c / a, 1) if a else 0

    weak = sorted(
        [{"section": ts.section, "topic": ts.topic, "accuracy_pct": ts.accuracy_pct or 0} for ts in topic_scores],
        key=lambda x: x["accuracy_pct"],
    )[:5]
    strong = sorted(
        [{"section": ts.section, "topic": ts.topic, "accuracy_pct": ts.accuracy_pct or 0} for ts in topic_scores],
        key=lambda x: -(x["accuracy_pct"] or 0),
    )[:5]

    last_session = db.query(models.CATMockSession).filter(
        models.CATMockSession.user_id == current_user.id,
        models.CATMockSession.status == "SUBMITTED",
    ).order_by(models.CATMockSession.submitted_at.desc()).first()

    return {
        "section_scores": section_accuracy,
        "topic_scores": [{
            "section": ts.section,
            "topic": ts.topic,
            "attempts_count": ts.attempts_count,
            "correct_count": ts.correct_count,
            "accuracy_pct": ts.accuracy_pct,
            "avg_time_sec": ts.avg_time_sec,
        } for ts in topic_scores],
        "weak_areas": weak,
        "strong_areas": strong,
        "last_mock": {
            "session_id": last_session.id,
            "session_type": last_session.session_type,
            "score_raw": last_session.score_raw,
            "submitted_at": last_session.submitted_at.isoformat() if last_session.submitted_at else None,
        } if last_session else None,
    }


@router.get("/insights")
def get_insights(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """AI-powered prep suggestions."""
    topic_scores = db.query(models.CATTopicScore).filter(
        models.CATTopicScore.user_id == current_user.id,
    ).all()

    by_section = {}
    for ts in topic_scores:
        sec = ts.section
        if sec not in by_section:
            by_section[sec] = {"total_attempts": 0, "total_correct": 0}
        by_section[sec]["total_attempts"] += ts.attempts_count
        by_section[sec]["total_correct"] += ts.correct_count

    section_scores = {
        sec: round(100 * d["total_correct"] / d["total_attempts"], 1) if d["total_attempts"] else 0
        for sec, d in by_section.items()
    }

    count = db.query(models.CATMockSession).filter(
        models.CATMockSession.user_id == current_user.id,
        models.CATMockSession.status == "SUBMITTED",
    ).count()

    last = db.query(models.CATMockSession).filter(
        models.CATMockSession.user_id == current_user.id,
        models.CATMockSession.status == "SUBMITTED",
    ).order_by(models.CATMockSession.submitted_at.desc()).first()

    topic_list = [{"topic": ts.topic, "section": ts.section, "accuracy_pct": ts.accuracy_pct, "attempts_count": ts.attempts_count} for ts in topic_scores]

    profile = db.query(models.PrepProfile).filter(models.PrepProfile.user_id == current_user.id).first()
    target = 95.0
    if profile and profile.cat_percentile:
        target = max(95, profile.cat_percentile + 5)

    insights = get_cat_prep_insights(
        section_scores=section_scores,
        topic_scores=topic_list,
        mock_count=count,
        last_mock_date=last.submitted_at.strftime("%Y-%m-%d") if last and last.submitted_at else None,
        target_percentile=target,
        api_key=_app_settings.GEMINI_API_KEY or None,
    )

    return {"insights": insights}


@router.get("/history")
def get_history(
    limit: int = 20,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Past mock sessions with scores."""
    sessions = db.query(models.CATMockSession).filter(
        models.CATMockSession.user_id == current_user.id,
        models.CATMockSession.status == "SUBMITTED",
    ).order_by(models.CATMockSession.submitted_at.desc()).limit(limit).all()

    return {
        "items": [{
            "session_id": s.id,
            "session_type": s.session_type,
            "score_raw": s.score_raw,
            "percentile_estimate": s.percentile_estimate,
            "submitted_at": s.submitted_at.isoformat() if s.submitted_at else None,
        } for s in sessions],
    }
