"""
AI-powered shortlist generation. Recruiter provides a natural language prompt,
system returns suggested candidates from applications.
"""
import os
import sys
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, selectinload

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import models, database
from app.modules.shared.auth import require_role
from app.config import settings as _app_settings

router = APIRouter(prefix="/api/v1/recruitment", tags=["ai-shortlist"])
logger = logging.getLogger(__name__)


class AIShortlistRequest(BaseModel):
    workflow_id: str
    job_id: str
    prompt: str
    max_candidates: int = 10


class AIShortlistCandidate(BaseModel):
    candidate_id: str
    candidate_name: str
    score: float
    reasoning: str


class AIShortlistResponse(BaseModel):
    candidates: list[dict]
    model_used: str


def _build_candidate_summary(app, cv_data: dict | None) -> str:
    """Build a short text summary of candidate for LLM."""
    parts = [f"Name: {getattr(app.student, 'name', 'Unknown')}"]
    if cv_data and isinstance(cv_data, dict):
        data = cv_data.get("data") or cv_data
        if isinstance(data, dict):
            for k, v in list(data.items())[:5]:
                if v and k not in ("_meta",):
                    parts.append(f"{k}: {str(v)[:200]}")
    return " | ".join(parts)


@router.post("/ai-shortlist", response_model=AIShortlistResponse)
def generate_ai_shortlist(
    req: AIShortlistRequest,
    current_user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Generate shortlist suggestions from natural language prompt using LLM."""
    api_key = _app_settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="AI shortlist requires GEMINI_API_KEY")

    applications = (
        db.query(models.Application)
        .filter(
            models.Application.workflow_id == req.workflow_id,
            models.Application.job_id == req.job_id,
        )
        .options(selectinload(models.Application.student))
        .all()
    )
    if not applications:
        return AIShortlistResponse(candidates=[], model_used="none")

    cvs = {}
    for app in applications:
        cv = db.query(models.CV).filter(
            models.CV.candidate_id == app.student_id,
            models.CV.status.in_(["VERIFIED", "SUBMITTED", "DRAFT"]),
        ).first()
        if cv:
            cvs[app.student_id] = cv.data or {}

    summaries = []
    for app in applications:
        summary = _build_candidate_summary(app, cvs.get(app.student_id))
        summaries.append({"id": app.student_id, "name": getattr(app.student, "name", "Unknown"), "summary": summary})

    try:
        import requests
        model = _app_settings.GEMINI_MODEL or "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"""You are a recruitment assistant. Given these candidates and the recruiter's criteria, rank and return the top candidates.

Recruiter criteria: {req.prompt}

Candidates (one per line, format: ID|||NAME|||SUMMARY):
"""
                    + "\n".join(f"{s['id']}|||{s['name']}|||{s['summary'][:500]}" for s in summaries)
                    + f"""

Return a JSON array of up to {req.max_candidates} objects, each with: candidate_id, score (0-1), reasoning (1 sentence).
Example: [{{"candidate_id":"xxx","score":0.9,"reasoning":"Strong consulting background"}}]
"""
                }]
            }],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        r = requests.post(url, json=payload, timeout=30)
        r.raise_for_status()
        data = r.json()
        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "[]")
        try:
            parsed = json.loads(text) if isinstance(text, str) else text
            if not isinstance(parsed, list):
                parsed = []
        except json.JSONDecodeError:
            parsed = []

        id_to_name = {s["id"]: s["name"] for s in summaries}
        candidates = []
        for item in parsed[: req.max_candidates]:
            cid = item.get("candidate_id", "")
            if cid in id_to_name:
                candidates.append({
                    "candidate_id": cid,
                    "candidate_name": id_to_name[cid],
                    "score": float(item.get("score", 0)),
                    "reasoning": str(item.get("reasoning", "")),
                })
        return AIShortlistResponse(candidates=candidates, model_used=model)
    except Exception as e:
        logger.exception("AI shortlist failed: %s", e)
        raise HTTPException(status_code=500, detail=f"AI shortlist failed: {str(e)}")
