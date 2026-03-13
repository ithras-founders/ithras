"""HR Mode: Recruiter outreach / InMail - send, list, respond."""
import os
import sys
import uuid
import json

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional, List

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import database
from app.modules.shared.auth import require_role

router = APIRouter(prefix="/api/v1/hr", tags=["hr-outreach"])


class SendOutreachRequest(BaseModel):
    candidate_id: str
    job_profile_id: Optional[str] = None
    message: Optional[str] = None


class RespondOutreachRequest(BaseModel):
    status: str  # ACCEPTED, DECLINED


def _serialize_outreach(row, extra: dict = None) -> dict:
    r = row._mapping if hasattr(row, "_mapping") else dict(row)
    out = {
        "id": r.get("id"),
        "recruiter_id": r.get("recruiter_id"),
        "candidate_id": r.get("candidate_id"),
        "job_profile_id": r.get("job_profile_id"),
        "message": r.get("message"),
        "status": r.get("status"),
        "created_at": str(r.get("created_at")) if r.get("created_at") else None,
    }
    if extra:
        out.update(extra)
    return out


@router.post("/outreach")
def send_outreach(
    data: SendOutreachRequest,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Send outreach/InMail to a candidate. Creates notification for candidate."""
    if not user.company_id:
        raise HTTPException(status_code=400, detail="Company required")
    outreach_id = f"ro_{uuid.uuid4().hex[:16]}"
    db.execute(
        text("""
            INSERT INTO recruiter_outreach (id, recruiter_id, candidate_id, job_profile_id, message, status)
            VALUES (:id, :rid, :cid, :jpid, :msg, 'PENDING')
        """),
        {
            "id": outreach_id,
            "rid": user.id,
            "cid": data.candidate_id,
            "jpid": data.job_profile_id,
            "msg": data.message or None,
        },
    )
    db.commit()
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    data_json = json.dumps({"outreach_id": outreach_id, "recruiter_id": user.id, "job_profile_id": data.job_profile_id})
    db.execute(
        text("""
            INSERT INTO notifications (id, user_id, recipient_type, notification_type, title, message, data, is_read)
            VALUES (:id, :uid, 'USER', 'RECRUITER_OUTREACH', :title, :msg, :data::jsonb, false)
        """),
        {
            "id": notif_id,
            "uid": data.candidate_id,
            "title": "New recruiter message",
            "msg": data.message[:200] + "..." if data.message and len(data.message) > 200 else (data.message or "A recruiter has reached out to you."),
            "data": data_json,
        },
    )
    db.commit()
    row = db.execute(text("SELECT * FROM recruiter_outreach WHERE id = :id"), {"id": outreach_id}).fetchone()
    return _serialize_outreach(row)


@router.get("/outreach")
def list_outreach(
    role: str = Query(..., description="recruiter | candidate"),
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN", "CANDIDATE", "PROFESSIONAL")),
    db: Session = Depends(database.get_db),
):
    """List outreach: recruiter sees sent, candidate sees received."""
    if role == "recruiter":
        if not user.company_id:
            return {"items": []}
        rows = db.execute(
            text("""
                SELECT ro.*, u.name as candidate_name, u.email as candidate_email, jp.title as job_profile_title
                FROM recruiter_outreach ro
                LEFT JOIN users u ON u.id = ro.candidate_id
                LEFT JOIN job_profiles jp ON jp.id = ro.job_profile_id
                WHERE ro.recruiter_id = :uid
                ORDER BY ro.created_at DESC
            """),
            {"uid": user.id},
        ).fetchall()
        items = []
        for r in rows:
            rm = r._mapping if hasattr(r, "_mapping") else dict(r)
            items.append(_serialize_outreach(r, {
                "candidate_name": rm.get("candidate_name"),
                "candidate_email": rm.get("candidate_email"),
                "job_profile_title": rm.get("job_profile_title"),
            }))
        return {"items": items}
    else:
        rows = db.execute(
            text("""
                SELECT ro.*, u.name as recruiter_name, jp.title as job_profile_title, c.name as company_name
                FROM recruiter_outreach ro
                LEFT JOIN users u ON u.id = ro.recruiter_id
                LEFT JOIN companies c ON c.id = u.company_id
                LEFT JOIN job_profiles jp ON jp.id = ro.job_profile_id
                WHERE ro.candidate_id = :uid
                ORDER BY ro.created_at DESC
            """),
            {"uid": user.id},
        ).fetchall()
        items = []
        for r in rows:
            rm = r._mapping if hasattr(r, "_mapping") else dict(r)
            items.append(_serialize_outreach(r, {
                "recruiter_name": rm.get("recruiter_name"),
                "job_profile_title": rm.get("job_profile_title"),
                "company_name": rm.get("company_name"),
            }))
        return {"items": items}


@router.put("/outreach/{outreach_id}/respond")
def respond_outreach(
    outreach_id: str,
    data: RespondOutreachRequest,
    user=Depends(require_role("CANDIDATE", "PROFESSIONAL", "RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Candidate: Accept or Decline outreach."""
    if data.status not in ("ACCEPTED", "DECLINED"):
        raise HTTPException(status_code=400, detail="status must be ACCEPTED or DECLINED")
    row = db.execute(text("SELECT * FROM recruiter_outreach WHERE id = :id"), {"id": outreach_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Outreach not found")
    r = row._mapping if hasattr(row, "_mapping") else dict(row)
    if r.get("candidate_id") != user.id:
        raise HTTPException(status_code=403, detail="Not your outreach")
    if r.get("status") != "PENDING":
        raise HTTPException(status_code=400, detail="Already responded")
    db.execute(
        text("UPDATE recruiter_outreach SET status = :status, updated_at = NOW() WHERE id = :id"),
        {"status": data.status, "id": outreach_id},
    )
    db.commit()
    recruiter_id = r.get("recruiter_id")
    if data.status == "ACCEPTED" and recruiter_id:
        notif_id = f"notif_{uuid.uuid4().hex[:12]}"
        data_json = json.dumps({"outreach_id": outreach_id, "candidate_id": user.id})
        db.execute(
            text("""
                INSERT INTO notifications (id, user_id, recipient_type, notification_type, title, message, data, is_read)
                VALUES (:id, :uid, 'USER', 'OUTREACH_ACCEPTED', :title, :msg, :data::jsonb, false)
            """),
            {
                "id": notif_id,
                "uid": recruiter_id,
                "title": "Candidate accepted your outreach",
                "msg": f"{user.name or user.email} accepted your connection request.",
                "data": data_json,
            },
        )
        db.commit()
    row = db.execute(text("SELECT * FROM recruiter_outreach WHERE id = :id"), {"id": outreach_id}).fetchone()
    return _serialize_outreach(row)
