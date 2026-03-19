"""Professional profile API: education, experience, institutions, organisations."""
import json
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import get_current_user

router = APIRouter(tags=["professional"])


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "n-a"


def _row_to_profile(row) -> dict:
    out = {
        "id": row.user_numerical,
        "user_numerical": row.user_numerical,
        "username": row.username,
        "email": row.email,
        "full_name": row.full_name,
        "date_of_birth": str(row.date_of_birth) if row.date_of_birth else None,
    }
    if hasattr(row, "headline"):
        out["headline"] = row.headline
    if hasattr(row, "summary"):
        out["summary"] = row.summary
    if hasattr(row, "profile_slug"):
        out["profile_slug"] = row.profile_slug
    return out


@router.get("/api/v1/profile/me", summary="Get current user profile with education and experience")
def get_profile_me(user=Depends(get_current_user), db=Depends(get_db)):
    """Return profile, education, and experience for the authenticated user."""
    uid = int(user.id)
    r = db.execute(
        text("""
            SELECT user_numerical, username, email, full_name, date_of_birth, headline, summary, profile_slug
            FROM users WHERE user_numerical = :uid
        """),
        {"uid": uid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    education = []
    try:
        re_rows = db.execute(
            text("""
                SELECT e.id, e.institution_id, e.institution_degree_majors_id, e.institution_name,
                       e.degree, e.majors_json, e.minors_json, e.start_month, e.end_month, e.status,
                       i.name as institution_display
                FROM education_entries e
                LEFT JOIN institutions i ON i.id = e.institution_id
                WHERE e.user_id = :uid
                ORDER BY e.end_month DESC NULLS FIRST, e.start_month DESC
            """),
            {"uid": uid},
        )
        for er in re_rows.fetchall():
            majors = []
            minors = []
            try:
                majors = json.loads(er.majors_json or "[]")
            except (json.JSONDecodeError, TypeError):
                pass
            try:
                minors = json.loads(getattr(er, "minors_json", None) or "[]")
            except (json.JSONDecodeError, TypeError):
                pass
            education.append({
                "id": er.id,
                "institution_id": er.institution_id,
                "institution_name": er.institution_name or er.institution_display,
                "degree": er.degree,
                "majors": majors,
                "minors": minors,
                "start_month": er.start_month,
                "end_month": er.end_month,
                "status": er.status or "pending",
            })
    except Exception:
        pass

    experience = []
    try:
        rg_rows = db.execute(
            text("""
                SELECT eg.id, eg.organisation_id, eg.organisation_name, o.name as org_display
                FROM experience_groups eg
                LEFT JOIN organisations o ON o.id = eg.organisation_id
                WHERE eg.user_id = :uid
                ORDER BY eg.id
            """),
            {"uid": uid},
        )
        for eg in rg_rows.fetchall():
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

    additional_responsibilities = []
    try:
        r_ar = db.execute(
            text("""
                SELECT id, title, organisation_name, description, start_month, end_month
                FROM additional_responsibilities
                WHERE user_id = :uid
                ORDER BY sort_order, created_at
            """),
            {"uid": uid},
        )
        for ar in r_ar.fetchall():
            additional_responsibilities.append({
                "id": ar.id,
                "title": ar.title,
                "organisation_name": ar.organisation_name,
                "description": ar.description,
                "start_month": ar.start_month,
                "end_month": ar.end_month,
            })
    except Exception:
        pass

    other_achievements = []
    try:
        r_oa = db.execute(
            text("""
                SELECT id, category, title, description
                FROM other_achievements
                WHERE user_id = :uid
                ORDER BY sort_order, created_at
            """),
            {"uid": uid},
        )
        for oa in r_oa.fetchall():
            other_achievements.append({
                "id": oa.id,
                "category": oa.category,
                "title": oa.title,
                "description": oa.description,
            })
    except Exception:
        pass

    return {
        "profile": _row_to_profile(row),
        "education": education,
        "experience": experience,
        "additional_responsibilities": additional_responsibilities,
        "other_achievements": other_achievements,
    }


# ─── Education ────────────────────────────────────────────────────────────────

class EducationEntryCreate(BaseModel):
    institution_name: str
    institution_id: Optional[int] = None
    degree: str
    majors: list[str] = []
    minors: list[str] = []
    start_month: str
    end_month: Optional[str] = None


@router.get("/api/v1/profile/education", summary="List user education")
def list_education(user=Depends(get_current_user), db=Depends(get_db)):
    """Return education entries for current user."""
    uid = int(user.id)
    r = db.execute(
        text("""
            SELECT e.id, e.user_id, e.institution_id, e.institution_degree_majors_id, e.institution_name,
                   e.degree, e.majors_json, e.minors_json, e.start_month, e.end_month, e.status, i.name as institution_display
            FROM education_entries e
            LEFT JOIN institutions i ON i.id = e.institution_id
            WHERE e.user_id = :uid
            ORDER BY e.end_month DESC NULLS FIRST, e.start_month DESC
        """),
        {"uid": uid},
    )
    rows = r.fetchall()
    out = []
    for row in rows:
        majors = []
        minors = []
        try:
            majors = json.loads(row.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        try:
            minors = json.loads(getattr(row, "minors_json", None) or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        out.append({
            "id": row.id,
            "institution_id": row.institution_id,
            "institution_name": row.institution_name or row.institution_display,
            "degree": row.degree,
            "majors": majors,
            "minors": minors,
            "start_month": row.start_month,
            "end_month": row.end_month,
            "status": row.status or "pending",
        })
    return {"education": out}


def _get_or_create_institution(db, name: str):
    """Get institution by slug, or create placeholder. Returns (institution_id, display_name)."""
    slug = _slug(name)
    r = db.execute(text("SELECT id, name FROM institutions WHERE slug = :s"), {"s": slug})
    row = r.fetchone()
    if row:
        return row.id, row.name
    db.execute(
        text("INSERT INTO institutions (name, slug, status) VALUES (:n, :s, 'placeholder')"),
        {"n": name, "s": slug},
    )
    inst_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    return inst_id, name


def _get_or_create_organisation(db, name: str):
    """Get organisation by slug, or create placeholder. Returns (organisation_id, display_name)."""
    slug = _slug(name)
    r = db.execute(text("SELECT id, name FROM organisations WHERE slug = :s"), {"s": slug})
    row = r.fetchone()
    if row:
        return row.id, row.name
    db.execute(
        text("INSERT INTO organisations (name, slug, status) VALUES (:n, :s, 'placeholder')"),
        {"n": name, "s": slug},
    )
    org_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    return org_id, name


@router.post("/api/v1/profile/education", summary="Add education entry")
def add_education(data: EducationEntryCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Add education entry. Checks approval; creates pending if combo not listed. Creates placeholder institution if new."""
    uid = int(user.id)
    majors_json = json.dumps(data.majors or [])
    minors_json = json.dumps(data.minors or [])
    inst_name = (data.institution_name or "").strip()
    degree = (data.degree or "").strip()
    if not inst_name or not degree:
        raise HTTPException(status_code=400, detail="Institution and degree required")

    status = "pending"
    institution_id = data.institution_id
    institution_degree_majors_id = None

    if institution_id:
        r = db.execute(
            text("""
                SELECT id FROM institution_degree_majors
                WHERE institution_id = :iid AND degree = :deg AND majors_json = :mj AND status = 'listed'
                LIMIT 1
            """),
            {"iid": institution_id, "deg": degree, "mj": majors_json},
        )
        row = r.fetchone()
        if row:
            institution_degree_majors_id = row.id
            status = "listed"
        else:
            r2 = db.execute(text("SELECT id, name FROM institutions WHERE id = :iid"), {"iid": institution_id})
            inst = r2.fetchone()
            if inst:
                inst_name = inst.name
    else:
        institution_id, inst_name = _get_or_create_institution(db, inst_name)
        r = db.execute(
            text("""
                SELECT id FROM institution_degree_majors
                WHERE institution_id = :iid AND degree = :deg AND majors_json = :mj AND status = 'listed'
                LIMIT 1
            """),
            {"iid": institution_id, "deg": degree, "mj": majors_json},
        )
        row = r.fetchone()
        if row:
            institution_degree_majors_id = row.id
            status = "listed"

    db.execute(
        text("""
            INSERT INTO education_entries (user_id, institution_id, institution_degree_majors_id, institution_name, degree, majors_json, minors_json, start_month, end_month, status)
            VALUES (:uid, :iid, :idm_id, :iname, :deg, :mj, :minj, :start, :end, :status)
            RETURNING id
        """),
        {
            "uid": uid,
            "iid": institution_id,
            "idm_id": institution_degree_majors_id,
            "iname": inst_name,
            "deg": degree,
            "mj": majors_json,
            "minj": minors_json,
            "start": data.start_month,
            "end": data.end_month or None,
            "status": status,
        },
    )
    row = db.execute(text("SELECT lastval()")).fetchone()
    entry_id = row[0] if row else None
    if status == "pending":
        db.execute(
            text("""
                INSERT INTO pending_institutions (institution_name, degree, majors_json, submitted_by, education_entry_id, status)
                VALUES (:iname, :deg, :mj, :uid, :eid, 'pending')
            """),
            {"iname": inst_name, "deg": degree, "mj": majors_json, "uid": uid, "eid": entry_id},
        )
    db.commit()
    return {"id": entry_id, "status": status}


class EducationEntryUpdate(BaseModel):
    institution_name: Optional[str] = None
    institution_id: Optional[int] = None
    degree: Optional[str] = None
    majors: Optional[list[str]] = None
    minors: Optional[list[str]] = None
    start_month: Optional[str] = None
    end_month: Optional[str] = None


@router.patch("/api/v1/profile/education/{entry_id}", summary="Update education entry")
def update_education(entry_id: int, data: EducationEntryUpdate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id, user_id FROM education_entries WHERE id = :eid"), {"eid": entry_id})
    row = r.fetchone()
    if not row or row.user_id != uid:
        raise HTTPException(status_code=404, detail="Education entry not found")
    updates = []
    params = {"eid": entry_id}
    if data.institution_name is not None:
        updates.append("institution_name = :iname")
        params["iname"] = data.institution_name.strip()
    if data.institution_id is not None:
        updates.append("institution_id = :iid")
        params["iid"] = data.institution_id
    if data.degree is not None:
        updates.append("degree = :deg")
        params["deg"] = data.degree.strip()
    if data.majors is not None:
        updates.append("majors_json = :mj")
        params["mj"] = json.dumps(data.majors)
    if data.minors is not None:
        updates.append("minors_json = :minj")
        params["minj"] = json.dumps(data.minors)
    if data.start_month is not None:
        updates.append("start_month = :start")
        params["start"] = data.start_month
    if data.end_month is not None:
        updates.append("end_month = :end")
        params["end"] = data.end_month or None
    if not updates:
        return {"ok": True}
    updates.append("admin_suggested_json = NULL")
    db.execute(
        text(f"UPDATE education_entries SET {', '.join(updates)} WHERE id = :eid"),
        params,
    )
    db.commit()
    return {"ok": True}


@router.delete("/api/v1/profile/education/{entry_id}", summary="Delete education entry")
def delete_education(entry_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM education_entries WHERE id = :eid AND user_id = :uid"), {"eid": entry_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Education entry not found")
    # Remove from approval queue if this entry was pending
    db.execute(text("DELETE FROM pending_institutions WHERE education_entry_id = :eid"), {"eid": entry_id})
    db.execute(text("DELETE FROM education_entries WHERE id = :eid"), {"eid": entry_id})
    db.commit()
    return {"ok": True}


@router.get("/api/v1/institutions/search", summary="Search institutions by name")
def search_institutions(q: str = Query("", min_length=0), db=Depends(get_db)):
    """Search institutions by name. Returns only listed (approved) institutions for suggestions.
    Free-text entries go for approval via pending_institutions."""
    if not q or len(q.strip()) < 2:
        return {"institutions": []}
    term = f"%{q.strip().lower()}%"
    r = db.execute(
        text("""
            SELECT id, name, slug, logo_url FROM institutions
            WHERE status = 'listed' AND (LOWER(name) LIKE :t OR slug LIKE :t)
            ORDER BY name
            LIMIT 20
        """),
        {"t": term},
    )
    rows = r.fetchall()
    try:
        from shared.telemetry.emitters.search_emitter import track_search_performed
        track_search_performed(db, "institution", q, len(rows))
    except Exception:
        pass
    return {
        "institutions": [
            {"id": row.id, "name": row.name, "slug": row.slug, "logo_url": getattr(row, "logo_url", None)}
            for row in rows
        ]
    }


@router.get("/api/v1/institutions/{inst_id}/degree-majors", summary="List degree-majors combos for institution")
def list_degree_majors(inst_id: int, db=Depends(get_db)):
    """Return approved degree-majors combinations for an institution."""
    r = db.execute(
        text("""
            SELECT id, degree, majors_json FROM institution_degree_majors
            WHERE institution_id = :iid AND status = 'listed'
            ORDER BY degree
        """),
        {"iid": inst_id},
    )
    rows = r.fetchall()
    out = []
    for row in rows:
        majors = []
        try:
            majors = json.loads(row.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        out.append({"id": row.id, "degree": row.degree, "majors": majors})
    return {"combos": out}


@router.get("/api/v1/institutions/{inst_id}/allowed-fields", summary="List allowed degrees, majors, minors for institution")
def list_institution_allowed_fields(inst_id: int, db=Depends(get_db)):
    """Return allowed degrees, majors, minors for autocomplete. Used for listed and placeholder institutions."""
    r = db.execute(text("SELECT degree FROM institution_degrees WHERE institution_id = :iid ORDER BY degree"), {"iid": inst_id})
    degrees = [row.degree for row in r.fetchall() if row.degree]
    r = db.execute(text("SELECT major FROM institution_majors WHERE institution_id = :iid ORDER BY major"), {"iid": inst_id})
    majors = [row.major for row in r.fetchall() if row.major]
    r = db.execute(text("SELECT minor FROM institution_minors WHERE institution_id = :iid ORDER BY minor"), {"iid": inst_id})
    minors = [row.minor for row in r.fetchall() if row.minor]
    return {"degrees": degrees, "majors": majors, "minors": minors}


# ─── Experience ───────────────────────────────────────────────────────────────

class ExperienceGroupCreate(BaseModel):
    organisation_name: str
    organisation_id: Optional[int] = None


class InternalMovementCreate(BaseModel):
    experience_group_id: int
    business_unit: str = ""
    function: str = ""
    title: str
    start_month: str
    end_month: Optional[str] = None


@router.get("/api/v1/profile/experience", summary="List user experience")
def list_experience(user=Depends(get_current_user), db=Depends(get_db)):
    """Return experience groups with internal movements."""
    uid = int(user.id)
    r = db.execute(
        text("""
            SELECT eg.id, eg.organisation_id, eg.organisation_name, o.name as org_display
            FROM experience_groups eg
            LEFT JOIN organisations o ON o.id = eg.organisation_id
            WHERE eg.user_id = :uid
            ORDER BY eg.id
        """),
        {"uid": uid},
    )
    groups = r.fetchall()
    out = []
    for g in groups:
        r2 = db.execute(
            text("""
                SELECT id, business_unit, function, title, start_month, end_month, status
                FROM internal_movements
                WHERE experience_group_id = :egid
                ORDER BY start_month DESC, end_month DESC NULLS FIRST
            """),
            {"egid": g.id},
        )
        movements = r2.fetchall()
        out.append({
            "id": g.id,
            "organisation_id": g.organisation_id,
            "organisation_name": g.organisation_name or g.org_display,
            "movements": [
                {
                    "id": m.id,
                    "business_unit": m.business_unit or "",
                    "function": m.function or "",
                    "title": m.title,
                    "start_month": m.start_month,
                    "end_month": m.end_month,
                    "status": m.status or "pending",
                }
                for m in movements
            ],
        })
    return {"experience": out}


@router.post("/api/v1/profile/experience", summary="Add organisation or movement")
def add_experience(data: ExperienceGroupCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Add new organisation (experience group). Creates placeholder organisation if new."""
    uid = int(user.id)
    org_name = (data.organisation_name or "").strip()
    if not org_name:
        raise HTTPException(status_code=400, detail="Organisation name required")

    organisation_id = data.organisation_id
    org_display = org_name

    if organisation_id:
        r = db.execute(text("SELECT id, name FROM organisations WHERE id = :oid"), {"oid": organisation_id})
        row = r.fetchone()
        if row:
            org_display = row.name
    else:
        organisation_id, org_display = _get_or_create_organisation(db, org_name)

    db.execute(
        text("""
            INSERT INTO experience_groups (user_id, organisation_id, organisation_name)
            VALUES (:uid, :oid, :oname)
        """),
        {"uid": uid, "oid": organisation_id, "oname": org_display},
    )
    eg_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    db.commit()
    return {"experience_group_id": eg_id}


class ExperienceGroupUpdate(BaseModel):
    organisation_name: Optional[str] = None
    organisation_id: Optional[int] = None


@router.patch("/api/v1/profile/experience/{eg_id}", summary="Update experience group")
def update_experience(eg_id: int, data: ExperienceGroupUpdate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM experience_groups WHERE id = :egid AND user_id = :uid"), {"egid": eg_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Experience group not found")
    updates = []
    params = {"egid": eg_id}
    if data.organisation_name is not None:
        updates.append("organisation_name = :oname")
        params["oname"] = data.organisation_name.strip()
    if data.organisation_id is not None:
        updates.append("organisation_id = :oid")
        params["oid"] = data.organisation_id
    if not updates:
        return {"ok": True}
    db.execute(text(f"UPDATE experience_groups SET {', '.join(updates)} WHERE id = :egid"), params)
    db.commit()
    return {"ok": True}


@router.delete("/api/v1/profile/experience/{eg_id}", summary="Delete experience group")
def delete_experience(eg_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM experience_groups WHERE id = :egid AND user_id = :uid"), {"egid": eg_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Experience group not found")
    # Remove any pending approvals for movements in this group
    db.execute(text("DELETE FROM pending_organisations WHERE experience_group_id = :egid"), {"egid": eg_id})
    db.execute(text("DELETE FROM experience_groups WHERE id = :egid"), {"egid": eg_id})
    db.commit()
    return {"ok": True}


class MovementUpdate(BaseModel):
    business_unit: Optional[str] = None
    function: Optional[str] = None
    title: Optional[str] = None
    start_month: Optional[str] = None
    end_month: Optional[str] = None


@router.patch("/api/v1/profile/experience/movement/{movement_id}", summary="Update internal movement")
def update_movement(movement_id: int, data: MovementUpdate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(
        text("SELECT im.id, eg.user_id FROM internal_movements im JOIN experience_groups eg ON eg.id = im.experience_group_id WHERE im.id = :mid"),
        {"mid": movement_id},
    )
    row = r.fetchone()
    if not row or row.user_id != uid:
        raise HTTPException(status_code=404, detail="Movement not found")
    updates = []
    params = {"mid": movement_id}
    if data.business_unit is not None:
        updates.append("business_unit = :bu")
        params["bu"] = data.business_unit
    if data.function is not None:
        updates.append("function = :fn")
        params["fn"] = data.function
    if data.title is not None:
        updates.append("title = :title")
        params["title"] = data.title.strip()
    if data.start_month is not None:
        updates.append("start_month = :start")
        params["start"] = data.start_month
    if data.end_month is not None:
        updates.append("end_month = :end")
        params["end"] = data.end_month or None
    if not updates:
        return {"ok": True}
    db.execute(text(f"UPDATE internal_movements SET {', '.join(updates)} WHERE id = :mid"), params)
    db.commit()
    return {"ok": True}


@router.delete("/api/v1/profile/experience/movement/{movement_id}", summary="Delete internal movement")
def delete_movement(movement_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(
        text("SELECT im.id, eg.id as egid, eg.user_id FROM internal_movements im JOIN experience_groups eg ON eg.id = im.experience_group_id WHERE im.id = :mid"),
        {"mid": movement_id},
    )
    row = r.fetchone()
    if not row or row.user_id != uid:
        raise HTTPException(status_code=404, detail="Movement not found")
    r2 = db.execute(text("SELECT COUNT(*) FROM internal_movements WHERE experience_group_id = :egid"), {"egid": row.egid})
    count = r2.scalar()
    if count <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last role. Add another role first or remove the organisation.")
    # Remove from approval queue if this movement was pending
    db.execute(text("DELETE FROM pending_organisations WHERE movement_id = :mid"), {"mid": movement_id})
    db.execute(text("DELETE FROM internal_movements WHERE id = :mid"), {"mid": movement_id})
    db.commit()
    return {"ok": True}


@router.post("/api/v1/profile/experience/movement", summary="Add internal movement")
def add_movement(data: InternalMovementCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Add role movement to an experience group."""
    uid = int(user.id)
    r = db.execute(
        text("SELECT user_id FROM experience_groups WHERE id = :egid"),
        {"egid": data.experience_group_id},
    )
    row = r.fetchone()
    if not row or row.user_id != uid:
        raise HTTPException(status_code=404, detail="Experience group not found")

    title = (data.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title required")

    bu = (data.business_unit or "").strip()
    fn = (data.function or "").strip()

    status = "pending"
    org_combo_id = None

    r2 = db.execute(
        text("SELECT organisation_id FROM experience_groups WHERE id = :egid"),
        {"egid": data.experience_group_id},
    )
    eg_row = r2.fetchone()
    org_id = eg_row.organisation_id if eg_row else None
    if org_id:
        r3 = db.execute(
            text("""
                SELECT id FROM organisation_combos
                WHERE organisation_id = :oid AND business_unit = :bu AND function = :fn AND title = :title AND status = 'listed'
                LIMIT 1
            """),
            {"oid": org_id, "bu": bu, "fn": fn, "title": title},
        )
        combo = r3.fetchone()
        if combo:
            org_combo_id = combo.id
            status = "listed"

    db.execute(
        text("""
            INSERT INTO internal_movements (experience_group_id, organisation_combo_id, business_unit, function, title, start_month, end_month, status)
            VALUES (:egid, :ocid, :bu, :fn, :title, :start, :end, :status)
        """),
        {
            "egid": data.experience_group_id,
            "ocid": org_combo_id,
            "bu": bu,
            "fn": fn,
            "title": title,
            "start": data.start_month,
            "end": data.end_month or None,
            "status": status,
        },
    )
    mov_id = db.execute(text("SELECT lastval()")).fetchone()[0]

    if status == "pending":
        r_eg = db.execute(
            text("SELECT COALESCE(o.name, eg.organisation_name, '') as oname FROM experience_groups eg LEFT JOIN organisations o ON o.id = eg.organisation_id WHERE eg.id = :egid"),
            {"egid": data.experience_group_id},
        )
        eg_row = r_eg.fetchone()
        oname = eg_row.oname if eg_row else ""
        db.execute(
            text("""
                INSERT INTO pending_organisations (organisation_name, business_unit, function, title, submitted_by, experience_group_id, movement_id, status)
                VALUES (:oname, :bu, :fn, :title, :uid, :egid, :mov_id, 'pending')
            """),
            {"oname": oname, "bu": bu, "fn": fn, "title": title, "uid": uid, "egid": data.experience_group_id, "mov_id": mov_id},
        )
    db.commit()
    return {"id": mov_id, "status": status}


# ─── Additional Responsibilities ──────────────────────────────────────────────

class AdditionalResponsibilityCreate(BaseModel):
    title: str
    organisation_name: Optional[str] = None
    description: Optional[str] = None
    start_month: Optional[str] = None
    end_month: Optional[str] = None


class AdditionalResponsibilityUpdate(BaseModel):
    title: Optional[str] = None
    organisation_name: Optional[str] = None
    description: Optional[str] = None
    start_month: Optional[str] = None
    end_month: Optional[str] = None


@router.get("/api/v1/profile/additional-responsibilities", summary="List additional responsibilities")
def list_additional_responsibilities(user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(
        text("""
            SELECT id, title, organisation_name, description, start_month, end_month
            FROM additional_responsibilities WHERE user_id = :uid
            ORDER BY sort_order, created_at
        """),
        {"uid": uid},
    )
    items = [{"id": row.id, "title": row.title, "organisation_name": row.organisation_name, "description": row.description, "start_month": row.start_month, "end_month": row.end_month} for row in r.fetchall()]
    return {"items": items}


@router.post("/api/v1/profile/additional-responsibilities", summary="Add additional responsibility")
def add_additional_responsibility(data: AdditionalResponsibilityCreate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    title = (data.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title required")
    db.execute(
        text("""
            INSERT INTO additional_responsibilities (user_id, title, organisation_name, description, start_month, end_month)
            VALUES (:uid, :title, :org, :desc, :start, :end)
        """),
        {"uid": uid, "title": title, "org": (data.organisation_name or "").strip() or None, "desc": (data.description or "").strip() or None, "start": data.start_month or None, "end": data.end_month or None},
    )
    rid = db.execute(text("SELECT lastval()")).fetchone()[0]
    db.commit()
    return {"id": rid}


@router.patch("/api/v1/profile/additional-responsibilities/{resp_id}", summary="Update additional responsibility")
def update_additional_responsibility(resp_id: int, data: AdditionalResponsibilityUpdate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM additional_responsibilities WHERE id = :rid AND user_id = :uid"), {"rid": resp_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Not found")
    updates = []
    params = {"rid": resp_id}
    if data.title is not None:
        updates.append("title = :title")
        params["title"] = data.title.strip()
    if data.organisation_name is not None:
        updates.append("organisation_name = :org")
        params["org"] = data.organisation_name.strip() or None
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description.strip() or None
    if data.start_month is not None:
        updates.append("start_month = :start")
        params["start"] = data.start_month or None
    if data.end_month is not None:
        updates.append("end_month = :end")
        params["end"] = data.end_month or None
    if not updates:
        return {"ok": True}
    db.execute(text(f"UPDATE additional_responsibilities SET {', '.join(updates)} WHERE id = :rid"), params)
    db.commit()
    return {"ok": True}


@router.delete("/api/v1/profile/additional-responsibilities/{resp_id}", summary="Delete additional responsibility")
def delete_additional_responsibility(resp_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM additional_responsibilities WHERE id = :rid AND user_id = :uid"), {"rid": resp_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Not found")
    db.execute(text("DELETE FROM additional_responsibilities WHERE id = :rid"), {"rid": resp_id})
    db.commit()
    return {"ok": True}


# ─── Other Achievements ───────────────────────────────────────────────────────

class OtherAchievementCreate(BaseModel):
    category: str = "other"
    title: str
    description: Optional[str] = None


class OtherAchievementUpdate(BaseModel):
    category: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None


@router.get("/api/v1/profile/other-achievements", summary="List other achievements")
def list_other_achievements(user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(
        text("""
            SELECT id, category, title, description
            FROM other_achievements WHERE user_id = :uid
            ORDER BY sort_order, created_at
        """),
        {"uid": uid},
    )
    items = [{"id": row.id, "category": row.category, "title": row.title, "description": row.description} for row in r.fetchall()]
    return {"items": items}


@router.post("/api/v1/profile/other-achievements", summary="Add other achievement")
def add_other_achievement(data: OtherAchievementCreate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    title = (data.title or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Title required")
    cat = (data.category or "other").lower()
    if cat not in ("sports", "dance", "music", "arts", "other"):
        cat = "other"
    db.execute(
        text("""
            INSERT INTO other_achievements (user_id, category, title, description)
            VALUES (:uid, :cat, :title, :desc)
        """),
        {"uid": uid, "cat": cat, "title": title, "desc": (data.description or "").strip() or None},
    )
    oid = db.execute(text("SELECT lastval()")).fetchone()[0]
    db.commit()
    return {"id": oid}


@router.patch("/api/v1/profile/other-achievements/{ach_id}", summary="Update other achievement")
def update_other_achievement(ach_id: int, data: OtherAchievementUpdate, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM other_achievements WHERE id = :aid AND user_id = :uid"), {"aid": ach_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Not found")
    updates = []
    params = {"aid": ach_id}
    if data.category is not None:
        cat = data.category.lower()
        if cat in ("sports", "dance", "music", "arts", "other"):
            updates.append("category = :cat")
            params["cat"] = cat
    if data.title is not None:
        updates.append("title = :title")
        params["title"] = data.title.strip()
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description.strip() or None
    if not updates:
        return {"ok": True}
    db.execute(text(f"UPDATE other_achievements SET {', '.join(updates)} WHERE id = :aid"), params)
    db.commit()
    return {"ok": True}


@router.delete("/api/v1/profile/other-achievements/{ach_id}", summary="Delete other achievement")
def delete_other_achievement(ach_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    uid = int(user.id)
    r = db.execute(text("SELECT id FROM other_achievements WHERE id = :aid AND user_id = :uid"), {"aid": ach_id, "uid": uid})
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Not found")
    db.execute(text("DELETE FROM other_achievements WHERE id = :aid"), {"aid": ach_id})
    db.commit()
    return {"ok": True}


@router.get("/api/v1/organisations/search", summary="Search organisations by name")
def search_organisations(q: str = Query("", min_length=0), db=Depends(get_db)):
    """Search organisations by name. Returns only listed (approved) organisations for suggestions.
    Free-text entries create placeholders; role combos go for approval via pending_organisations."""
    if not q or len(q.strip()) < 2:
        return {"organisations": []}
    term = f"%{q.strip().lower()}%"
    r = db.execute(
        text("""
            SELECT id, name, slug, logo_url FROM organisations
            WHERE status = 'listed' AND (LOWER(name) LIKE :t OR slug LIKE :t)
            ORDER BY name
            LIMIT 20
        """),
        {"t": term},
    )
    rows = r.fetchall()
    try:
        from shared.telemetry.emitters.search_emitter import track_search_performed
        track_search_performed(db, "organisation", q, len(rows))
    except Exception:
        pass
    return {
        "organisations": [
            {"id": row.id, "name": row.name, "slug": row.slug, "logo_url": getattr(row, "logo_url", None)}
            for row in rows
        ]
    }


@router.get("/api/v1/organisations/{org_id}/combos", summary="List BU/function/title combos for organisation")
def list_org_combos(org_id: int, db=Depends(get_db)):
    """Return approved combos for an organisation."""
    r = db.execute(
        text("""
            SELECT id, business_unit, function, title FROM organisation_combos
            WHERE organisation_id = :oid AND status = 'listed'
            ORDER BY title
        """),
        {"oid": org_id},
    )
    rows = r.fetchall()
    return {"combos": [{"id": r.id, "business_unit": r.business_unit, "function": r.function, "title": r.title} for r in rows]}


@router.get("/api/v1/organisations/{org_id}/allowed-fields", summary="List allowed BU, functions, titles for organisation")
def list_organisation_allowed_fields(org_id: int, db=Depends(get_db)):
    """Return allowed business_units, functions, titles for autocomplete. Used for listed and placeholder organisations."""
    r = db.execute(text("SELECT name FROM organisation_business_units WHERE organisation_id = :oid ORDER BY name"), {"oid": org_id})
    business_units = [row.name for row in r.fetchall() if row.name]
    r = db.execute(text("SELECT name FROM organisation_functions WHERE organisation_id = :oid ORDER BY name"), {"oid": org_id})
    functions = [row.name for row in r.fetchall() if row.name]
    r = db.execute(text("SELECT title FROM organisation_titles WHERE organisation_id = :oid ORDER BY title"), {"oid": org_id})
    titles = [row.title for row in r.fetchall() if row.title]
    return {"business_units": business_units, "functions": functions, "titles": titles}
