"""HR Mode: Candidate Discovery and Match Stats."""
import os
import sys
import json
import logging
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text, func, cast, String

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import database
from app.modules.shared.auth import require_role
from app.config import settings as _app_settings

router = APIRouter(prefix="/api/v1/hr", tags=["hr-discovery"])
logger = logging.getLogger(__name__)


class MatchStatsRequest(BaseModel):
    job_profile_id: str


def _apply_criteria_to_query(db, base_query, profile: dict):
    """Apply job profile criteria to a users query. Returns modified query text and params."""
    params = {}
    conditions = ["u.role != 'SYSTEM_ADMIN'"]
    if profile.get("institution_ids") and isinstance(profile["institution_ids"], list) and len(profile["institution_ids"]) > 0:
        placeholders = ", ".join([f":inst_{i}" for i in range(len(profile["institution_ids"]))])
        conditions.append(f"u.institution_id IN ({placeholders})")
        for i, v in enumerate(profile["institution_ids"]):
            params[f"inst_{i}"] = v
    if profile.get("program_ids") and isinstance(profile["program_ids"], list) and len(profile["program_ids"]) > 0:
        placeholders = ", ".join([f":prog_{i}" for i in range(len(profile["program_ids"]))])
        conditions.append(f"u.program_id IN ({placeholders})")
        for i, v in enumerate(profile["program_ids"]):
            params[f"prog_{i}"] = v
    if profile.get("sector"):
        conditions.append("CAST(u.sector_preferences AS TEXT) ILIKE :sector")
        params["sector"] = f"%{profile['sector']}%"
    if profile.get("min_cgpa") is not None:
        conditions.append("u.cgpa >= :min_cgpa")
        params["min_cgpa"] = profile["min_cgpa"]
    if profile.get("max_backlogs") is not None:
        conditions.append("(u.backlog_count IS NULL OR u.backlog_count <= :max_backlogs)")
        params["max_backlogs"] = profile["max_backlogs"]
    if profile.get("experience_years_min") is not None and profile["experience_years_min"] > 0:
        conditions.append("u.role = 'PROFESSIONAL'")
    return " AND ".join(conditions), params


def _serialize_user(row) -> dict:
    r = row._mapping if hasattr(row, "_mapping") else dict(row)
    return {
        "id": r.get("id"),
        "name": r.get("name") or r.get("email") or "Unknown",
        "email": r.get("email"),
        "profile_photo_url": r.get("profile_photo_url"),
        "role": r.get("role"),
        "student_subtype": r.get("student_subtype"),
        "institution_id": r.get("institution_id"),
        "program_id": r.get("program_id"),
        "cgpa": r.get("cgpa"),
        "backlog_count": r.get("backlog_count"),
    }


@router.get("/discovery/candidates")
def get_discovery_candidates(
    job_profile_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    min_cgpa: Optional[float] = Query(None),
    max_backlogs: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    q: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Discover candidates filtered by job profile or inline criteria."""
    profile = {}
    if job_profile_id:
        row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": job_profile_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job profile not found")
        profile = row._mapping if hasattr(row, "_mapping") else dict(row)
        if profile.get("company_id") != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
            raise HTTPException(status_code=403, detail="Access denied")
    else:
        if institution_id:
            profile["institution_ids"] = [institution_id]
        if program_id:
            profile["program_ids"] = [program_id]
        if sector:
            profile["sector"] = sector
        if min_cgpa is not None:
            profile["min_cgpa"] = min_cgpa
        if max_backlogs is not None:
            profile["max_backlogs"] = max_backlogs

    conditions, params = _apply_criteria_to_query(db, None, profile)
    params["limit"] = limit
    params["offset"] = offset

    sql = f"""
        SELECT u.id, u.name, u.email, u.profile_photo_url, u.role, u.student_subtype,
               u.institution_id, u.program_id, u.cgpa, u.backlog_count
        FROM users u
        WHERE {conditions}
    """
    if role:
        sql += " AND u.role = :role"
        params["role"] = role
    if q and q.strip():
        sql += " AND (u.name ILIKE :q_term OR u.email ILIKE :q_term OR u.roll_number ILIKE :q_term)"
        params["q_term"] = f"%{q.strip()}%"
    sql += " ORDER BY u.name LIMIT :limit OFFSET :offset"
    rows = db.execute(text(sql), params).fetchall()
    items = [_serialize_user(r) for r in rows]
    count_sql = f"SELECT COUNT(*) as cnt FROM users u WHERE {conditions}"
    if role:
        count_sql += " AND u.role = :role"
    if q and q.strip():
        count_sql += " AND (u.name ILIKE :q_term OR u.email ILIKE :q_term OR u.roll_number ILIKE :q_term)"
    total = db.execute(text(count_sql), {k: v for k, v in params.items() if k not in ("limit", "offset")}).scalar() or 0
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@router.post("/discovery/match-stats")
def get_match_stats(
    req: MatchStatsRequest,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Get match statistics for a job profile: total count, by institution, by sector."""
    row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": req.job_profile_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Job profile not found")
    profile = row._mapping if hasattr(row, "_mapping") else dict(row)
    if profile.get("company_id") != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")

    conditions, params = _apply_criteria_to_query(db, None, profile)
    count_sql = f"SELECT COUNT(*) as cnt FROM users u WHERE {conditions}"
    total = db.execute(text(count_sql), params).scalar() or 0

    by_inst_sql = f"""
        SELECT u.institution_id as id, i.name, COUNT(*) as cnt
        FROM users u
        LEFT JOIN institutions i ON i.id = u.institution_id
        WHERE {conditions} AND u.institution_id IS NOT NULL
        GROUP BY u.institution_id, i.name
        ORDER BY cnt DESC
        LIMIT 20
    """
    inst_rows = db.execute(text(by_inst_sql), params).fetchall()
    by_institution = []
    for r in inst_rows:
        rm = r._mapping if hasattr(r, "_mapping") else dict(r)
        by_institution.append({
            "id": rm.get("id"),
            "name": rm.get("name") or "Unknown",
            "count": rm.get("cnt") or 0,
        })

    by_sector = []
    try:
        sector_sql = f"""
            SELECT jsonb_array_elements_text(u.sector_preferences::jsonb) as sector
            FROM users u
            WHERE {conditions} AND u.sector_preferences IS NOT NULL
              AND jsonb_typeof(u.sector_preferences::jsonb) = 'array'
              AND jsonb_array_length(u.sector_preferences::jsonb) > 0
        """
        sector_rows = db.execute(text(sector_sql), params).fetchall()
        sector_counts = {}
        for r in sector_rows:
            s = (r._mapping.get("sector") if hasattr(r, "_mapping") else r[0]) or ""
            if s.strip():
                sector_counts[s] = sector_counts.get(s, 0) + 1
        by_sector = [{"sector": k, "count": v} for k, v in sorted(sector_counts.items(), key=lambda x: -x[1])[:20]]
    except Exception:
        pass

    return {
        "total_matching": total,
        "by_institution": by_institution,
        "by_sector": by_sector,
    }


class AIRankRequest(BaseModel):
    job_profile_id: str
    candidate_ids: List[str]
    max_candidates: int = 20


def _build_user_summary(user_row, cv_data: dict | None) -> str:
    """Build text summary for LLM from user + CV data."""
    r = user_row._mapping if hasattr(user_row, "_mapping") else dict(user_row)
    name = r.get("name") or r.get("email") or "Unknown"
    parts = [f"Name: {name}", f"Role: {r.get('role', '')}"]
    if r.get("cgpa") is not None:
        parts.append(f"CGPA: {r['cgpa']}")
    if r.get("student_subtype"):
        parts.append(f"Type: {r['student_subtype']}")
    if cv_data and isinstance(cv_data, dict):
        data = cv_data.get("data") or cv_data
        if isinstance(data, dict):
            for k, v in list(data.items())[:8]:
                if v and k not in ("_meta",):
                    parts.append(f"{k}: {str(v)[:150]}")
    return " | ".join(parts)


@router.post("/discovery/ai-rank")
def ai_rank_candidates(
    req: AIRankRequest,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """AI rank candidates from discovery pool by job profile. Works on any candidate set, not just applicants."""
    api_key = _app_settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="AI rank requires GEMINI_API_KEY")
    if not req.candidate_ids:
        return {"candidates": [], "model_used": "none"}
    profile_row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": req.job_profile_id}).fetchone()
    if not profile_row:
        raise HTTPException(status_code=404, detail="Job profile not found")
    profile = profile_row._mapping if hasattr(profile_row, "_mapping") else dict(profile_row)
    if profile.get("company_id") != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    ids_ph = ", ".join([f":cid_{i}" for i in range(len(req.candidate_ids))])
    params = {f"cid_{i}": cid for i, cid in enumerate(req.candidate_ids)}
    user_rows = db.execute(
        text(f"SELECT id, name, email, role, student_subtype, cgpa, backlog_count FROM users WHERE id IN ({ids_ph})"),
        params,
    ).fetchall()
    cvs = {}
    for ur in user_rows:
        uid = ur._mapping.get("id") if hasattr(ur, "_mapping") else ur[0]
        cv_row = db.execute(
            text("SELECT data FROM cvs WHERE candidate_id = :uid AND status IN ('VERIFIED','SUBMITTED','DRAFT') LIMIT 1"),
            {"uid": uid},
        ).fetchone()
        if cv_row:
            cvs[uid] = cv_row._mapping.get("data") if hasattr(cv_row, "_mapping") else cv_row[0] or {}
    summaries = []
    for ur in user_rows:
        uid = ur._mapping.get("id") if hasattr(ur, "_mapping") else ur[0]
        name = ur._mapping.get("name") or ur._mapping.get("email") if hasattr(ur, "_mapping") else "Unknown"
        if hasattr(ur, "_mapping"):
            name = ur._mapping.get("name") or ur._mapping.get("email") or "Unknown"
        summaries.append({"id": uid, "name": name, "summary": _build_user_summary(ur, cvs.get(uid))})
    jd_text = (profile.get("jd_text") or "")[:3000]
    criteria = f"Title: {profile.get('title')}; Sector: {profile.get('sector')}; Min CGPA: {profile.get('min_cgpa')}; Skills: {profile.get('skills_keywords') or []}"
    try:
        import requests
        model = _app_settings.GEMINI_MODEL or "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"""You are a recruitment assistant. Rank these candidates by fit for the job. Return the top {min(req.max_candidates, len(summaries))} ranked by match.

Job criteria: {criteria}
JD excerpt: {jd_text[:1500] if jd_text else "N/A"}

Candidates (format: ID|||NAME|||SUMMARY):
"""
                    + "\n".join(f"{s['id']}|||{s['name']}|||{s['summary'][:400]}" for s in summaries)
                    + """

Return a JSON array of objects: candidate_id, score (0-1), reasoning (1 sentence).
Example: [{{"candidate_id":"xxx","score":0.9,"reasoning":"Strong consulting background"}}]
"""
                }]
            }],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        r = requests.post(url, json=payload, timeout=60)
        r.raise_for_status()
        data = r.json()
        raw = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "[]")
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        if not isinstance(parsed, list):
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
        return {"candidates": candidates, "model_used": model}
    except Exception as e:
        logger.exception("AI rank failed: %s", e)
        raise HTTPException(status_code=500, detail=f"AI rank failed: {str(e)}")
