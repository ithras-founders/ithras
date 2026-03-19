"""Profile API - GET/PATCH /api/v1/profile/me."""
import json
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import get_current_user

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


class ProfilePatch(BaseModel):
    full_name: str | None = None
    date_of_birth: str | None = None
    summary: str | None = None


def _row_to_profile(row) -> dict:
    out = {
        "id": row.user_numerical,
        "user_numerical": row.user_numerical,
        "username": row.username,
        "email": row.email,
        "full_name": row.full_name,
        "date_of_birth": str(row.date_of_birth) if row.date_of_birth else None,
        "created_at": row.created_at.isoformat() if hasattr(row.created_at, 'isoformat') else str(row.created_at),
        "updated_at": row.updated_at.isoformat() if hasattr(row.updated_at, 'isoformat') else str(row.updated_at),
    }
    if hasattr(row, "headline"):
        out["headline"] = row.headline
    if hasattr(row, "summary"):
        out["summary"] = row.summary
    if hasattr(row, "profile_slug"):
        out["profile_slug"] = row.profile_slug
    return out


@router.get("/me", summary="Get current user profile")
def get_me(user=Depends(get_current_user), db=Depends(get_db)):
    """Return profile for the authenticated user (user_numerical from JWT). Includes education and experience."""
    try:
        user_id = int(user.id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    r = db.execute(
        text("""
            SELECT user_numerical, username, email, full_name, date_of_birth, created_at, updated_at,
                   headline, summary, profile_slug
            FROM users WHERE user_numerical = :uid
        """),
        {"uid": user_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    education = []
    try:
        re = db.execute(
            text("""
                SELECT e.id, e.institution_id, e.institution_degree_majors_id, e.institution_name,
                       e.degree, e.majors_json, e.start_month, e.end_month, e.status,
                       i.name as institution_display
                FROM education_entries e
                LEFT JOIN institutions i ON i.id = e.institution_id
                WHERE e.user_id = :uid
                ORDER BY e.end_month DESC NULLS FIRST, e.start_month DESC
            """),
            {"uid": user_id},
        )
        for er in re.fetchall():
            majors = []
            try:
                majors = json.loads(er.majors_json or "[]")
            except (json.JSONDecodeError, TypeError):
                pass
            education.append({
                "id": er.id,
                "institution_id": er.institution_id,
                "institution_name": er.institution_name or er.institution_display,
                "degree": er.degree,
                "majors": majors,
                "start_month": er.start_month,
                "end_month": er.end_month,
                "status": er.status or "pending",
            })
    except Exception:
        pass

    experience = []
    try:
        rg = db.execute(
            text("""
                SELECT eg.id, eg.organisation_id, eg.organisation_name, o.name as org_display
                FROM experience_groups eg
                LEFT JOIN organisations o ON o.id = eg.organisation_id
                WHERE eg.user_id = :uid
                ORDER BY eg.id
            """),
            {"uid": user_id},
        )
        for eg in rg.fetchall():
            r2 = db.execute(
                text("""
                    SELECT id, business_unit, function, title, start_month, end_month, status
                    FROM internal_movements
                    WHERE experience_group_id = :egid
                    ORDER BY start_month DESC, end_month DESC NULLS FIRST
                """),
                {"egid": eg.id},
            )
            movements = [
                {"id": m.id, "business_unit": m.business_unit or "", "function": m.function or "", "title": m.title, "start_month": m.start_month, "end_month": m.end_month, "status": m.status or "pending"}
                for m in r2.fetchall()
            ]
            experience.append({
                "id": eg.id,
                "organisation_id": eg.organisation_id,
                "organisation_name": eg.organisation_name or eg.org_display,
                "movements": movements,
            })
    except Exception:
        pass

    return {
        "profile": _row_to_profile(row),
        "education": education,
        "experience": experience,
    }


@router.patch("/me", summary="Update current user profile")
def patch_me(data: ProfilePatch, user=Depends(get_current_user), db=Depends(get_db)):
    """Update profile fields. Only provided fields are updated."""
    try:
        user_id = int(user.id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid user")
    updates = []
    params = {"uid": user_id}
    if data.full_name is not None:
        updates.append("full_name = :full_name")
        params["full_name"] = data.full_name
    if data.date_of_birth is not None:
        updates.append("date_of_birth = :date_of_birth::date")
        params["date_of_birth"] = data.date_of_birth
    if data.summary is not None:
        updates.append("summary = :summary")
        params["summary"] = data.summary
    if not updates:
        return get_me(user=user, db=db)
    updates.append("updated_at = NOW()")
    db.execute(
        text(f"""
            UPDATE users SET {", ".join(updates)}
            WHERE user_numerical = :uid
        """),
        params,
    )
    db.commit()
    return get_me(user=user, db=db)
