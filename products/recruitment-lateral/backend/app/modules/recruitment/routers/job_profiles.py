"""HR Mode: Job Profiles CRUD - criteria-first job definitions."""
import os
import sys
import uuid
import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import database
from app.modules.shared.auth import get_current_user, require_role
from app.config import settings as _app_settings

router = APIRouter(prefix="/api/v1/hr", tags=["hr-job-profiles"])
logger = logging.getLogger(__name__)


class JobProfileCreate(BaseModel):
    title: str
    jd_text: Optional[str] = None
    sector: Optional[str] = None
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    skills_keywords: List[str] = []
    experience_years_min: Optional[int] = None
    institution_ids: Optional[List[str]] = None
    program_ids: Optional[List[str]] = None


class JobProfileUpdate(BaseModel):
    title: Optional[str] = None
    jd_text: Optional[str] = None
    sector: Optional[str] = None
    min_cgpa: Optional[float] = None
    max_backlogs: Optional[int] = None
    skills_keywords: Optional[List[str]] = None
    experience_years_min: Optional[int] = None
    institution_ids: Optional[List[str]] = None
    program_ids: Optional[List[str]] = None


def _serialize_row(row) -> dict:
    r = row._mapping if hasattr(row, "_mapping") else dict(row)
    return {k: r.get(k) for k in [
        "id", "company_id", "created_by", "title", "jd_text", "sector",
        "min_cgpa", "max_backlogs", "skills_keywords", "experience_years_min",
        "institution_ids", "program_ids", "status", "created_at", "updated_at"
    ]}


@router.post("/job-profiles")
def create_job_profile(
    data: JobProfileCreate,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Create a job profile. Requires company_id (recruiter must have company)."""
    if not user.company_id:
        raise HTTPException(status_code=400, detail="Recruiter must have a company to create job profiles")
    profile_id = f"jp_{uuid.uuid4().hex[:16]}"
    db.execute(
        text("""
            INSERT INTO job_profiles (id, company_id, created_by, title, jd_text, sector,
                min_cgpa, max_backlogs, skills_keywords, experience_years_min,
                institution_ids, program_ids, status)
            VALUES (:id, :cid, :uid, :title, :jd_text, :sector, :min_cgpa, :max_backlogs,
                :skills, :exp_min, :inst_ids, :prog_ids, 'DRAFT')
        """),
        {
            "id": profile_id,
            "cid": user.company_id,
            "uid": user.id,
            "title": data.title or "Untitled",
            "jd_text": data.jd_text,
            "sector": data.sector,
            "min_cgpa": data.min_cgpa,
            "max_backlogs": data.max_backlogs,
            "skills": data.skills_keywords or [],
            "exp_min": data.experience_years_min,
            "inst_ids": data.institution_ids,
            "prog_ids": data.program_ids,
        },
    )
    db.commit()
    row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    return _serialize_row(row)


@router.get("/job-profiles")
def list_job_profiles(
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """List job profiles for the user's company."""
    if not user.company_id:
        return {"items": []}
    rows = db.execute(
        text("SELECT * FROM job_profiles WHERE company_id = :cid ORDER BY updated_at DESC"),
        {"cid": user.company_id},
    ).fetchall()
    return {"items": [_serialize_row(r) for r in rows]}


@router.get("/job-profiles/{profile_id}")
def get_job_profile(
    profile_id: str,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Get a single job profile."""
    row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Job profile not found")
    r = _serialize_row(row)
    if r.get("company_id") != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    return r


@router.put("/job-profiles/{profile_id}")
def update_job_profile(
    profile_id: str,
    data: JobProfileUpdate,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Update a job profile."""
    existing = db.execute(text("SELECT company_id FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Job profile not found")
    cid = existing._mapping.get("company_id") if hasattr(existing, "_mapping") else existing[0]
    if cid != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    updates = []
    params = {"id": profile_id}
    if data.title is not None:
        updates.append("title = :title")
        params["title"] = data.title
    if data.jd_text is not None:
        updates.append("jd_text = :jd_text")
        params["jd_text"] = data.jd_text
    if data.sector is not None:
        updates.append("sector = :sector")
        params["sector"] = data.sector
    if data.min_cgpa is not None:
        updates.append("min_cgpa = :min_cgpa")
        params["min_cgpa"] = data.min_cgpa
    if data.max_backlogs is not None:
        updates.append("max_backlogs = :max_backlogs")
        params["max_backlogs"] = data.max_backlogs
    if data.skills_keywords is not None:
        updates.append("skills_keywords = :skills_keywords")
        params["skills_keywords"] = data.skills_keywords
    if data.experience_years_min is not None:
        updates.append("experience_years_min = :experience_years_min")
        params["experience_years_min"] = data.experience_years_min
    if data.institution_ids is not None:
        updates.append("institution_ids = :institution_ids")
        params["institution_ids"] = data.institution_ids
    if data.program_ids is not None:
        updates.append("program_ids = :program_ids")
        params["program_ids"] = data.program_ids
    if updates:
        updates.append("updated_at = NOW()")
        db.execute(text(f"UPDATE job_profiles SET {', '.join(updates)} WHERE id = :id"), params)
        db.commit()
    row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    return _serialize_row(row)


@router.post("/job-profiles/{profile_id}/publish")
def publish_job_profile(
    profile_id: str,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Set job profile status to PUBLISHED."""
    existing = db.execute(text("SELECT company_id FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Job profile not found")
    cid = existing._mapping.get("company_id") if hasattr(existing, "_mapping") else existing[0]
    if cid != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    db.execute(text("UPDATE job_profiles SET status = 'PUBLISHED', updated_at = NOW() WHERE id = :id"), {"id": profile_id})
    db.commit()
    row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    return _serialize_row(row)


class ExtractJDRequest(BaseModel):
    jd_text: str


@router.post("/job-profiles/extract-jd")
def extract_jd_criteria(
    data: ExtractJDRequest,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
):
    """AI-extract structured criteria from raw JD text. Returns title, sector, skills, min_cgpa, experience_years_min."""
    api_key = _app_settings.GEMINI_API_KEY
    if not api_key:
        raise HTTPException(status_code=503, detail="JD extraction requires GEMINI_API_KEY")
    text_in = (data.jd_text or "").strip()
    if len(text_in) < 50:
        return {"title": "", "sector": "", "skills_keywords": [], "min_cgpa": None, "experience_years_min": None}
    try:
        import requests
        model = _app_settings.GEMINI_MODEL or "gemini-2.0-flash"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
        payload = {
            "contents": [{
                "parts": [{
                    "text": f"""Extract structured hiring criteria from this job description. Return ONLY valid JSON (no markdown).

Job description:
---
{text_in[:8000]}
---

Return JSON with these keys (use null for unknown):
- title: job title string
- sector: industry/sector (e.g. Consulting, Tech, Finance)
- skills_keywords: array of skill strings (e.g. ["Python", "SQL", "consulting"])
- min_cgpa: number or null
- experience_years_min: integer or null (0 for campus/fresher)
- education_preferred: string or null

Example: {{"title":"Senior Analyst","sector":"Consulting","skills_keywords":["Python","SQL"],"min_cgpa":7.0,"experience_years_min":2,"education_preferred":"MBA"}}
"""
                }]
            }],
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }
        r = requests.post(url, json=payload, timeout=30)
        r.raise_for_status()
        resp = r.json()
        raw = resp.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "{}")
        parsed = json.loads(raw) if isinstance(raw, str) else raw
        return {
            "title": parsed.get("title") or "",
            "sector": parsed.get("sector") or "",
            "skills_keywords": parsed.get("skills_keywords") or [],
            "min_cgpa": parsed.get("min_cgpa"),
            "experience_years_min": parsed.get("experience_years_min"),
        }
    except Exception as e:
        logger.exception("JD extraction failed: %s", e)
        raise HTTPException(status_code=500, detail=f"JD extraction failed: {str(e)}")


class CreateWorkflowFromProfileRequest(BaseModel):
    workflow_name: str
    institution_id: str


@router.post("/job-profiles/{profile_id}/create-workflow")
def create_workflow_from_profile(
    profile_id: str,
    data: CreateWorkflowFromProfileRequest,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """One-click: create a workflow + job from a job profile."""
    row = db.execute(text("SELECT * FROM job_profiles WHERE id = :id"), {"id": profile_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Job profile not found")
    profile = row._mapping if hasattr(row, "_mapping") else dict(row)
    if profile.get("company_id") != user.company_id and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    if not user.company_id:
        raise HTTPException(status_code=400, detail="Company required")
    if not data.institution_id:
        raise HTTPException(status_code=400, detail="Institution is required")
    workflow_id = f"wf_{uuid.uuid4().hex[:14]}"
    job_id = f"job_{uuid.uuid4().hex[:14]}"
    title = profile.get("title") or "New Job"
    sector = profile.get("sector") or "General"
    db.execute(
        text("""
            INSERT INTO jobs (id, company_id, title, sector, slot, fixed_comp, variable_comp,
                esops_vested, joining_bonus, performance_bonus, is_top_decile, opening_date, jd_status, institution_id)
            VALUES (:job_id, :cid, :title, :sector, 'General', 0, 0, 0, 0, 0, false, NOW(), 'Draft', :inst_id)
        """),
        {"job_id": job_id, "cid": user.company_id, "title": title, "sector": sector, "inst_id": data.institution_id},
    )
    db.execute(
        text("""
            INSERT INTO workflows (id, company_id, job_id, institution_id, created_by, name, status)
            VALUES (:wf_id, :cid, :job_id, :inst_id, :uid, :name, 'DRAFT')
        """),
        {"wf_id": workflow_id, "cid": user.company_id, "job_id": job_id, "inst_id": data.institution_id, "uid": user.id, "name": data.workflow_name or title},
    )
    db.commit()
    return {"workflow_id": workflow_id, "job_id": job_id, "message": "Workflow created. Add stages and submit JD when ready."}
