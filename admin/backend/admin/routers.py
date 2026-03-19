"""Admin API - institution and organisation approval."""
import json
import re
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.exc import ProgrammingError

from shared.database.database import get_db
from shared.auth.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])

try:
    from admin.community_routers import router as community_router
    router.include_router(community_router)
except ImportError:
    pass
try:
    from admin.telemetry_routers import router as telemetry_router
    router.include_router(telemetry_router)
except ImportError:
    pass
try:
    from admin.community_sync import (
        ensure_institution_community,
        ensure_organisation_community,
        add_institution_admin_to_community,
        add_organisation_admin_to_community,
    )
except ImportError:
    ensure_institution_community = lambda db, iid, name: None
    ensure_organisation_community = lambda db, oid, name: None
    add_institution_admin_to_community = lambda db, iid, uid: None
    add_organisation_admin_to_community = lambda db, oid, uid: None


@router.get("/", summary="Admin API root")
def admin_root(user=Depends(require_admin)):
    """Verify admin router is loaded. Requires admin auth."""
    return {"ok": True, "message": "Admin API"}


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "n-a"


# ─── Institution approval ──────────────────────────────────────────────────

@router.get("/institutions/pending", summary="List pending institution approvals")
def list_pending_institutions(user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT pi.id, pi.institution_name, pi.degree, pi.majors_json, pi.submitted_by,
                   pi.education_entry_id, pi.status, pi.admin_suggested_json, pi.created_at
            FROM pending_institutions pi
            WHERE pi.status = 'pending'
            ORDER BY pi.created_at ASC
        """),
    )
    rows = r.fetchall()
    out = []
    for row in rows:
        majors = []
        try:
            majors = json.loads(row.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        out.append({
            "id": row.id,
            "institution_name": row.institution_name,
            "degree": row.degree,
            "majors": majors,
            "submitted_by": row.submitted_by,
            "education_entry_id": row.education_entry_id,
            "status": row.status,
            "admin_suggested_json": row.admin_suggested_json,
            "created_at": row.created_at.isoformat() if hasattr(row.created_at, "isoformat") else str(row.created_at),
        })
    return {"pending": out}


@router.get("/institutions/listed", summary="List approved institutions and degree-majors")
def list_listed_institutions(user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT i.id, i.name, i.slug, i.status,
                   idm.id as combo_id, idm.degree, idm.majors_json
            FROM institutions i
            LEFT JOIN institution_degree_majors idm ON idm.institution_id = i.id AND idm.status = 'listed'
            WHERE i.status IN ('listed', 'placeholder')
            ORDER BY i.name, idm.degree
        """),
    )
    rows = r.fetchall()
    by_inst = {}
    for row in rows:
        kid = row.id
        if kid not in by_inst:
            by_inst[kid] = {"id": row.id, "name": row.name, "slug": row.slug, "status": row.status, "combos": []}
        if row.combo_id:
            majors = []
            try:
                majors = json.loads(row.majors_json or "[]")
            except (json.JSONDecodeError, TypeError):
                pass
            by_inst[kid]["combos"].append({"id": row.combo_id, "degree": row.degree, "majors": majors})
    return {"listed": list(by_inst.values())}


class InstitutionUpdate(BaseModel):
    name: str | None = None
    short_name: str | None = None
    logo_url: str | None = None
    description: str | None = None
    website: str | None = None
    status: str | None = None
    institution_type: str | None = None
    founded_year: int | None = None
    country: str | None = None
    state: str | None = None
    city: str | None = None
    campus_type: str | None = None
    cover_image_url: str | None = None
    brand_colors_json: str | None = None
    linkedin_url: str | None = None
    twitter_url: str | None = None
    facebook_url: str | None = None
    wikipedia_url: str | None = None
    is_public: bool | None = None
    degrees: list[str] | None = None
    majors: list[str] | None = None
    minors: list[str] | None = None


class DepartmentCreate(BaseModel):
    name: str
    head_user_id: int | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = None
    head_user_id: int | None = None


class DegreeCreate(BaseModel):
    name: str
    level: str = "Undergraduate"
    duration_years: float = 4.0
    department_id: int | None = None


class DegreeUpdate(BaseModel):
    name: str | None = None
    level: str | None = None
    duration_years: float | None = None
    department_id: int | None = None


class MajorCreate(BaseModel):
    name: str
    department_id: int | None = None
    degree_id: int | None = None


class MajorUpdate(BaseModel):
    name: str | None = None
    department_id: int | None = None
    degree_id: int | None = None
    status: str | None = None


class MinorCreate(BaseModel):
    name: str
    department_id: int | None = None
    linked_major_id: int | None = None


class MinorUpdate(BaseModel):
    name: str | None = None
    department_id: int | None = None
    linked_major_id: int | None = None


class AdminInvite(BaseModel):
    user_id: int
    role: str = "admin"


class SlugUpdate(BaseModel):
    slug: str


def _log_institution_activity(db, inst_id: int, user_id: int | None, action: str, details: dict | None = None):
    """Log activity. No-op if institution_activity_log table does not exist (migration not run)."""
    try:
        db.execute(
            text("""
                INSERT INTO institution_activity_log (institution_id, user_id, action, details_json)
                VALUES (:iid, :uid, :action, :details)
            """),
            {"iid": inst_id, "uid": user_id, "action": action, "details": json.dumps(details) if details else None},
        )
    except ProgrammingError:
        pass
    try:
        from shared.telemetry.emitters.audit_emitter import track_audit_action
        track_audit_action(db, user_id, action, "institution", str(inst_id), metadata=details)
    except Exception:
        pass


def _ensure_institution(db, inst_id: int) -> None:
    r = db.execute(text("SELECT id FROM institutions WHERE id = :id"), {"id": inst_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Institution not found")


def _get_institution_row(db, inst_id: int):
    """Fetch institution row. Tries extended schema first, falls back to minimal if migration not run."""
    try:
        r = db.execute(
            text("""
                SELECT id, name, short_name, slug, status, logo_url, description, website,
                       institution_type, founded_year, country, state, city, campus_type,
                       cover_image_url, brand_colors_json, linkedin_url, twitter_url, facebook_url, wikipedia_url,
                       is_public, draft_json
                FROM institutions WHERE id = :id
            """),
            {"id": inst_id},
        )
        return r.fetchone(), True
    except ProgrammingError:
        r = db.execute(
            text("SELECT id, name, slug, status, logo_url, description, website FROM institutions WHERE id = :id"),
            {"id": inst_id},
        )
        return r.fetchone(), False


def _get_institution_v2_data(db, inst_id: int, schema_ok: bool):
    """Fetch v2 tables and legacy lists. Returns empty dicts if schema not migrated."""
    departments = degrees_v2 = majors_v2 = minors_v2 = admins = []
    degrees = majors = minors = []
    if schema_ok:
        try:
            dept_rows = db.execute(
                text("SELECT id, name, head_user_id, created_at FROM institution_departments WHERE institution_id = :iid ORDER BY name"),
                {"iid": inst_id},
            ).fetchall()
            departments = [{"id": r.id, "name": r.name, "head_user_id": r.head_user_id, "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in dept_rows]
            deg_rows = db.execute(
                text("SELECT id, name, level, duration_years, department_id, created_at FROM institution_degrees_v2 WHERE institution_id = :iid ORDER BY name"),
                {"iid": inst_id},
            ).fetchall()
            degrees_v2 = [{"id": r.id, "name": r.name, "level": r.level or "Undergraduate", "duration_years": float(r.duration_years or 4), "department_id": r.department_id, "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in deg_rows]
            maj_rows = db.execute(
                text("SELECT id, name, department_id, degree_id, status, created_at FROM institution_majors_v2 WHERE institution_id = :iid ORDER BY name"),
                {"iid": inst_id},
            ).fetchall()
            majors_v2 = [{"id": r.id, "name": r.name, "department_id": r.department_id, "degree_id": r.degree_id, "status": r.status or "active", "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in maj_rows]
            min_rows = db.execute(
                text("SELECT id, name, department_id, linked_major_id, created_at FROM institution_minors_v2 WHERE institution_id = :iid ORDER BY name"),
                {"iid": inst_id},
            ).fetchall()
            minors_v2 = [{"id": r.id, "name": r.name, "department_id": r.department_id, "linked_major_id": r.linked_major_id, "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in min_rows]
            admin_rows = db.execute(
                text("SELECT ia.id, ia.user_id, ia.role, ia.added_by_user_id, ia.created_at, u.full_name FROM institution_admins ia LEFT JOIN users u ON u.user_numerical = ia.user_id WHERE ia.institution_id = :iid ORDER BY ia.created_at"),
                {"iid": inst_id},
            ).fetchall()
            admins = [{"id": r.id, "user_id": r.user_id, "role": r.role, "added_by_user_id": r.added_by_user_id, "full_name": r.full_name or "", "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in admin_rows]
        except ProgrammingError:
            pass
    try:
        r2 = db.execute(text("SELECT degree FROM institution_degrees WHERE institution_id = :iid ORDER BY degree"), {"iid": inst_id})
        degrees = [r.degree for r in r2.fetchall() if r.degree]
    except ProgrammingError:
        pass
    try:
        r2 = db.execute(text("SELECT major FROM institution_majors WHERE institution_id = :iid ORDER BY major"), {"iid": inst_id})
        majors = [r.major for r in r2.fetchall() if r.major]
    except ProgrammingError:
        pass
    try:
        r2 = db.execute(text("SELECT minor FROM institution_minors WHERE institution_id = :iid ORDER BY minor"), {"iid": inst_id})
        minors = [r.minor for r in r2.fetchall() if r.minor]
    except ProgrammingError:
        pass
    return {"departments": departments, "degrees_v2": degrees_v2, "majors_v2": majors_v2, "minors_v2": minors_v2, "admins": admins, "degrees": degrees, "majors": majors, "minors": minors}


@router.get("/institutions/{inst_id}", summary="Get institution for editing")
def get_institution(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    row, schema_ok = _get_institution_row(db, inst_id)
    if not row:
        raise HTTPException(status_code=404, detail="Institution not found")
    v2 = _get_institution_v2_data(db, inst_id, schema_ok)
    return {
        "id": row.id,
        "name": row.name,
        "short_name": getattr(row, "short_name", None) if schema_ok else None,
        "slug": row.slug,
        "status": row.status,
        "logo_url": row.logo_url,
        "description": row.description,
        "website": row.website,
        "institution_type": getattr(row, "institution_type", None) if schema_ok else None,
        "founded_year": getattr(row, "founded_year", None) if schema_ok else None,
        "country": getattr(row, "country", None) if schema_ok else None,
        "state": getattr(row, "state", None) if schema_ok else None,
        "city": getattr(row, "city", None) if schema_ok else None,
        "campus_type": getattr(row, "campus_type", None) if schema_ok else None,
        "cover_image_url": getattr(row, "cover_image_url", None) if schema_ok else None,
        "brand_colors_json": getattr(row, "brand_colors_json", None) if schema_ok else None,
        "linkedin_url": getattr(row, "linkedin_url", None) if schema_ok else None,
        "twitter_url": getattr(row, "twitter_url", None) if schema_ok else None,
        "facebook_url": getattr(row, "facebook_url", None) if schema_ok else None,
        "wikipedia_url": getattr(row, "wikipedia_url", None) if schema_ok else None,
        "is_public": getattr(row, "is_public", True) if schema_ok and hasattr(row, "is_public") and row.is_public is not None else True,
        "draft_json": getattr(row, "draft_json", None) if schema_ok else None,
        "departments": v2["departments"],
        "degrees_v2": v2["degrees_v2"],
        "majors_v2": v2["majors_v2"],
        "minors_v2": v2["minors_v2"],
        "admins": v2["admins"],
        "degrees": v2["degrees"],
        "majors": v2["majors"],
        "minors": v2["minors"],
    }


@router.patch("/institutions/{inst_id}", summary="Update institution")
def update_institution(inst_id: int, data: InstitutionUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)

    updates = []
    params = {"id": inst_id}
    if data.name is not None:
        updates.append("name = :n")
        params["n"] = data.name.strip()
    if data.short_name is not None:
        updates.append("short_name = :sn")
        params["sn"] = data.short_name.strip() or None
    if data.logo_url is not None:
        updates.append("logo_url = :logo")
        params["logo"] = data.logo_url.strip() or None
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description.strip() or None
    if data.website is not None:
        updates.append("website = :web")
        params["web"] = data.website.strip() or None
    if data.status is not None:
        updates.append("status = :status")
        params["status"] = data.status
    if data.institution_type is not None:
        updates.append("institution_type = :itype")
        params["itype"] = data.institution_type.strip() or None
    if data.founded_year is not None:
        updates.append("founded_year = :fy")
        params["fy"] = data.founded_year
    if data.country is not None:
        updates.append("country = :country")
        params["country"] = data.country.strip() or None
    if data.state is not None:
        updates.append("state = :state")
        params["state"] = data.state.strip() or None
    if data.city is not None:
        updates.append("city = :city")
        params["city"] = data.city.strip() or None
    if data.campus_type is not None:
        updates.append("campus_type = :ctype")
        params["ctype"] = data.campus_type.strip() or None
    if data.cover_image_url is not None:
        updates.append("cover_image_url = :cover")
        params["cover"] = data.cover_image_url.strip() or None
    if data.brand_colors_json is not None:
        updates.append("brand_colors_json = :bc")
        params["bc"] = data.brand_colors_json.strip() or None
    if data.linkedin_url is not None:
        updates.append("linkedin_url = :li")
        params["li"] = data.linkedin_url.strip() or None
    if data.twitter_url is not None:
        updates.append("twitter_url = :tw")
        params["tw"] = data.twitter_url.strip() or None
    if data.facebook_url is not None:
        updates.append("facebook_url = :fb")
        params["fb"] = data.facebook_url.strip() or None
    if data.wikipedia_url is not None:
        updates.append("wikipedia_url = :wiki")
        params["wiki"] = data.wikipedia_url.strip() or None
    if data.is_public is not None:
        updates.append("is_public = :ip")
        params["ip"] = data.is_public

    legacy_cols = {"name", "logo_url", "description", "website", "status"}
    if updates:
        try:
            db.execute(text(f"UPDATE institutions SET {', '.join(updates)} WHERE id = :id"), params)
        except ProgrammingError:
            # Fallback when migration not run: only update legacy columns
            legacy_updates = [u for u in updates if u.split(" = ")[0].strip() in legacy_cols]
            legacy_param_keys = ("id", "n", "logo", "desc", "web", "status")
            legacy_params = {k: params[k] for k in legacy_param_keys if k in params}
            if legacy_updates and legacy_params:
                db.execute(text(f"UPDATE institutions SET {', '.join(legacy_updates)} WHERE id = :id"), legacy_params)
        _log_institution_activity(db, inst_id, user_id, "profile_updated", {"fields": [u.split(" = ")[0] for u in updates]})

    if data.degrees is not None:
        db.execute(text("DELETE FROM institution_degrees WHERE institution_id = :iid"), {"iid": inst_id})
        for d in data.degrees:
            d = (d or "").strip()
            if d:
                db.execute(text("INSERT INTO institution_degrees (institution_id, degree) VALUES (:iid, :d) ON CONFLICT (institution_id, degree) DO NOTHING"), {"iid": inst_id, "d": d})
        _log_institution_activity(db, inst_id, user_id, "degrees_updated", {"count": len(data.degrees)})
    if data.majors is not None:
        db.execute(text("DELETE FROM institution_majors WHERE institution_id = :iid"), {"iid": inst_id})
        for m in data.majors:
            m = (m or "").strip()
            if m:
                db.execute(text("INSERT INTO institution_majors (institution_id, major) VALUES (:iid, :m) ON CONFLICT (institution_id, major) DO NOTHING"), {"iid": inst_id, "m": m})
        _log_institution_activity(db, inst_id, user_id, "majors_updated", {"count": len(data.majors)})
    if data.minors is not None:
        db.execute(text("DELETE FROM institution_minors WHERE institution_id = :iid"), {"iid": inst_id})
        for m in data.minors:
            m = (m or "").strip()
            if m:
                db.execute(text("INSERT INTO institution_minors (institution_id, minor) VALUES (:iid, :m) ON CONFLICT (institution_id, minor) DO NOTHING"), {"iid": inst_id, "m": m})
        _log_institution_activity(db, inst_id, user_id, "minors_updated", {"count": len(data.minors)})

    db.commit()
    return {"ok": True}


@router.get("/institutions/{inst_id}/stats", summary="Get institution stats")
def get_institution_stats(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM institutions WHERE id = :id"), {"id": inst_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Institution not found")
    from datetime import datetime
    now = datetime.now()
    yyyymm = f"{now.year}-{str(now.month).zfill(2)}"
    rc = db.execute(
        text("""
            SELECT COUNT(DISTINCT user_id) FROM education_entries
            WHERE institution_id = :iid AND end_month IS NOT NULL AND end_month < :yyyymm
        """),
        {"iid": inst_id, "yyyymm": yyyymm},
    )
    alumni_count = rc.scalar() or 0
    rc2 = db.execute(
        text("""
            SELECT COUNT(DISTINCT user_id) FROM education_entries
            WHERE institution_id = :iid AND (end_month IS NULL OR end_month >= :yyyymm)
        """),
        {"iid": inst_id, "yyyymm": yyyymm},
    )
    current_count = rc2.scalar() or 0
    return {"current_count": current_count, "alumni_count": alumni_count, "total_count": current_count + alumni_count}


# ─── Institution Admin Board: activity, people, departments, degrees, majors, admins ─

@router.get("/institutions/{inst_id}/activity", summary="Paginated activity log")
def get_institution_activity(
    inst_id: int,
    user=Depends(require_admin),
    db=Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    _ensure_institution(db, inst_id)
    try:
        rows = db.execute(
            text("""
                SELECT ial.id, ial.user_id, ial.action, ial.details_json, ial.created_at, u.full_name
                FROM institution_activity_log ial
                LEFT JOIN users u ON u.user_numerical = ial.user_id
                WHERE ial.institution_id = :iid
                ORDER BY ial.created_at DESC
                OFFSET :skip LIMIT :limit
            """),
            {"iid": inst_id, "skip": skip, "limit": limit},
        ).fetchall()
        total = db.execute(
            text("SELECT COUNT(*) FROM institution_activity_log WHERE institution_id = :iid"),
            {"iid": inst_id},
        ).scalar() or 0
        items = []
        for r in rows:
            details = None
            if r.details_json:
                try:
                    details = json.loads(r.details_json)
                except (json.JSONDecodeError, TypeError):
                    pass
            items.append({
                "id": r.id,
                "user_id": r.user_id,
                "full_name": r.full_name or "",
                "action": r.action,
                "details": details,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })
        return {"items": items, "total": total, "skip": skip, "limit": limit}
    except ProgrammingError:
        return {"items": [], "total": 0, "skip": skip, "limit": limit}


@router.get("/institutions/{inst_id}/people", summary="Current members and alumni")
def get_institution_people(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    from datetime import datetime
    now = datetime.now()
    yyyymm = f"{now.year}-{str(now.month).zfill(2)}"
    current_rows = db.execute(
        text("""
            SELECT DISTINCT ON (e.user_id) e.user_id, e.degree, e.majors_json, e.start_month, e.end_month,
                   u.full_name, u.profile_slug
            FROM education_entries e
            JOIN users u ON u.user_numerical = e.user_id
            WHERE e.institution_id = :iid AND (e.end_month IS NULL OR e.end_month >= :yyyymm)
            ORDER BY e.user_id, e.end_month DESC NULLS FIRST
        """),
        {"iid": inst_id, "yyyymm": yyyymm},
    ).fetchall()
    alumni_rows = db.execute(
        text("""
            SELECT DISTINCT ON (e.user_id) e.user_id, e.degree, e.majors_json, e.start_month, e.end_month,
                   u.full_name, u.profile_slug
            FROM education_entries e
            JOIN users u ON u.user_numerical = e.user_id
            WHERE e.institution_id = :iid AND e.end_month IS NOT NULL AND e.end_month < :yyyymm
            ORDER BY e.user_id, e.end_month DESC
        """),
        {"iid": inst_id, "yyyymm": yyyymm},
    ).fetchall()

    def _to_person(er):
        majors = []
        try:
            majors = json.loads(er.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        return {
            "user_id": er.user_id,
            "full_name": er.full_name or "",
            "profile_slug": er.profile_slug or "",
            "degree": er.degree or "",
            "majors": majors,
            "start_month": er.start_month,
            "end_month": er.end_month,
        }
    return {"current": [_to_person(er) for er in current_rows], "alumni": [_to_person(er) for er in alumni_rows]}


@router.post("/institutions/{inst_id}/departments", summary="Add department")
def add_department(inst_id: int, data: DepartmentCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    db.execute(
        text("""
            INSERT INTO institution_departments (institution_id, name, head_user_id)
            VALUES (:iid, :name, :hid)
        """),
        {"iid": inst_id, "name": data.name.strip(), "hid": data.head_user_id},
    )
    dept_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    _log_institution_activity(db, inst_id, user_id, "department_added", {"department_id": dept_id, "name": data.name})
    db.commit()
    return {"ok": True, "id": dept_id}


@router.patch("/institutions/{inst_id}/departments/{dept_id}", summary="Update department")
def update_department(inst_id: int, dept_id: int, data: DepartmentUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_departments WHERE institution_id = :iid AND id = :did"),
        {"iid": inst_id, "did": dept_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Department not found")
    user_id = getattr(user, "user_numerical", None)
    updates, params = [], {"did": dept_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name.strip()
    if data.head_user_id is not None:
        updates.append("head_user_id = :hid")
        params["hid"] = data.head_user_id
    if updates:
        db.execute(text(f"UPDATE institution_departments SET {', '.join(updates)} WHERE id = :did"), params)
        _log_institution_activity(db, inst_id, user_id, "department_updated", {"department_id": dept_id})
    db.commit()
    return {"ok": True}


@router.delete("/institutions/{inst_id}/departments/{dept_id}", summary="Remove department")
def delete_department(inst_id: int, dept_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_departments WHERE institution_id = :iid AND id = :did"),
        {"iid": inst_id, "did": dept_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Department not found")
    user_id = getattr(user, "user_numerical", None)
    db.execute(text("DELETE FROM institution_departments WHERE id = :did"), {"did": dept_id})
    _log_institution_activity(db, inst_id, user_id, "department_removed", {"department_id": dept_id})
    db.commit()
    return {"ok": True}


@router.post("/institutions/{inst_id}/degrees", summary="Add degree")
def add_degree(inst_id: int, data: DegreeCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    db.execute(
        text("""
            INSERT INTO institution_degrees_v2 (institution_id, name, level, duration_years, department_id)
            VALUES (:iid, :name, :level, :dur, :did)
        """),
        {"iid": inst_id, "name": data.name.strip(), "level": data.level or "Undergraduate", "dur": data.duration_years, "did": data.department_id},
    )
    deg_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    _log_institution_activity(db, inst_id, user_id, "degree_added", {"degree_id": deg_id, "name": data.name})
    db.commit()
    return {"ok": True, "id": deg_id}


@router.patch("/institutions/{inst_id}/degrees/{deg_id}", summary="Update degree")
def update_degree(inst_id: int, deg_id: int, data: DegreeUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_degrees_v2 WHERE institution_id = :iid AND id = :did"),
        {"iid": inst_id, "did": deg_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Degree not found")
    user_id = getattr(user, "user_numerical", None)
    updates, params = [], {"did": deg_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name.strip()
    if data.level is not None:
        updates.append("level = :level")
        params["level"] = data.level
    if data.duration_years is not None:
        updates.append("duration_years = :dur")
        params["dur"] = data.duration_years
    if data.department_id is not None:
        updates.append("department_id = :did2")
        params["did2"] = data.department_id
    if updates:
        db.execute(text(f"UPDATE institution_degrees_v2 SET {', '.join(updates)} WHERE id = :did"), params)
        _log_institution_activity(db, inst_id, user_id, "degree_updated", {"degree_id": deg_id})
    db.commit()
    return {"ok": True}


@router.delete("/institutions/{inst_id}/degrees/{deg_id}", summary="Remove degree")
def delete_degree(inst_id: int, deg_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_degrees_v2 WHERE institution_id = :iid AND id = :did"),
        {"iid": inst_id, "did": deg_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Degree not found")
    user_id = getattr(user, "user_numerical", None)
    db.execute(text("DELETE FROM institution_degrees_v2 WHERE id = :did"), {"did": deg_id})
    _log_institution_activity(db, inst_id, user_id, "degree_removed", {"degree_id": deg_id})
    db.commit()
    return {"ok": True}


@router.post("/institutions/{inst_id}/majors", summary="Add major")
def add_major(inst_id: int, data: MajorCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    db.execute(
        text("""
            INSERT INTO institution_majors_v2 (institution_id, name, department_id, degree_id, status)
            VALUES (:iid, :name, :did, :degid, 'active')
        """),
        {"iid": inst_id, "name": data.name.strip(), "did": data.department_id, "degid": data.degree_id},
    )
    maj_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    _log_institution_activity(db, inst_id, user_id, "major_added", {"major_id": maj_id, "name": data.name})
    db.commit()
    return {"ok": True, "id": maj_id}


@router.patch("/institutions/{inst_id}/majors/{major_id}", summary="Update major")
def update_major(inst_id: int, major_id: int, data: MajorUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_majors_v2 WHERE institution_id = :iid AND id = :mid"),
        {"iid": inst_id, "mid": major_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Major not found")
    user_id = getattr(user, "user_numerical", None)
    updates, params = [], {"mid": major_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name.strip()
    if data.department_id is not None:
        updates.append("department_id = :did")
        params["did"] = data.department_id
    if data.degree_id is not None:
        updates.append("degree_id = :degid")
        params["degid"] = data.degree_id
    if data.status is not None:
        updates.append("status = :status")
        params["status"] = data.status
    if updates:
        db.execute(text(f"UPDATE institution_majors_v2 SET {', '.join(updates)} WHERE id = :mid"), params)
        _log_institution_activity(db, inst_id, user_id, "major_updated", {"major_id": major_id})
    db.commit()
    return {"ok": True}


@router.delete("/institutions/{inst_id}/majors/{major_id}", summary="Remove/archive major")
def delete_major(inst_id: int, major_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_majors_v2 WHERE institution_id = :iid AND id = :mid"),
        {"iid": inst_id, "mid": major_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Major not found")
    user_id = getattr(user, "user_numerical", None)
    db.execute(text("DELETE FROM institution_majors_v2 WHERE id = :mid"), {"mid": major_id})
    _log_institution_activity(db, inst_id, user_id, "major_removed", {"major_id": major_id})
    db.commit()
    return {"ok": True}


@router.post("/institutions/{inst_id}/minors", summary="Add minor")
def add_minor(inst_id: int, data: MinorCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    db.execute(
        text("""
            INSERT INTO institution_minors_v2 (institution_id, name, department_id, linked_major_id)
            VALUES (:iid, :name, :did, :lid)
        """),
        {"iid": inst_id, "name": data.name.strip(), "did": data.department_id, "lid": data.linked_major_id},
    )
    min_id = db.execute(text("SELECT lastval()")).fetchone()[0]
    _log_institution_activity(db, inst_id, user_id, "minor_added", {"minor_id": min_id, "name": data.name})
    db.commit()
    return {"ok": True, "id": min_id}


@router.patch("/institutions/{inst_id}/minors/{minor_id}", summary="Update minor")
def update_minor(inst_id: int, minor_id: int, data: MinorUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_minors_v2 WHERE institution_id = :iid AND id = :mid"),
        {"iid": inst_id, "mid": minor_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Minor not found")
    user_id = getattr(user, "user_numerical", None)
    updates, params = [], {"mid": minor_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name.strip()
    if data.department_id is not None:
        updates.append("department_id = :did")
        params["did"] = data.department_id
    if data.linked_major_id is not None:
        updates.append("linked_major_id = :lid")
        params["lid"] = data.linked_major_id
    if updates:
        db.execute(text(f"UPDATE institution_minors_v2 SET {', '.join(updates)} WHERE id = :mid"), params)
        _log_institution_activity(db, inst_id, user_id, "minor_updated", {"minor_id": minor_id})
    db.commit()
    return {"ok": True}


@router.delete("/institutions/{inst_id}/minors/{minor_id}", summary="Remove minor")
def delete_minor(inst_id: int, minor_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_minors_v2 WHERE institution_id = :iid AND id = :mid"),
        {"iid": inst_id, "mid": minor_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Minor not found")
    user_id = getattr(user, "user_numerical", None)
    db.execute(text("DELETE FROM institution_minors_v2 WHERE id = :mid"), {"mid": minor_id})
    _log_institution_activity(db, inst_id, user_id, "minor_removed", {"minor_id": minor_id})
    db.commit()
    return {"ok": True}


@router.get("/institutions/{inst_id}/admins", summary="List admins")
def get_institution_admins(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    rows = db.execute(
        text("""
            SELECT ia.id, ia.user_id, ia.role, ia.added_by_user_id, ia.created_at, u.full_name
            FROM institution_admins ia
            LEFT JOIN users u ON u.user_numerical = ia.user_id
            WHERE ia.institution_id = :iid ORDER BY ia.created_at
        """),
        {"iid": inst_id},
    ).fetchall()
    return {"admins": [{"id": r.id, "user_id": r.user_id, "role": r.role, "added_by_user_id": r.added_by_user_id, "full_name": r.full_name or "", "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in rows]}


@router.post("/institutions/{inst_id}/admins", summary="Invite admin")
def add_institution_admin(inst_id: int, data: AdminInvite, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    db.execute(
        text("""
            INSERT INTO institution_admins (institution_id, user_id, role, added_by_user_id)
            VALUES (:iid, :uid, :role, :added_by)
            ON CONFLICT (institution_id, user_id) DO UPDATE SET role = EXCLUDED.role
        """),
        {"iid": inst_id, "uid": data.user_id, "role": data.role or "admin", "added_by": user_id},
    )
    _log_institution_activity(db, inst_id, user_id, "admin_added", {"user_id": data.user_id, "role": data.role})
    try:
        add_institution_admin_to_community(db, inst_id, data.user_id)
    except Exception:
        pass
    db.commit()
    return {"ok": True}


@router.delete("/institutions/{inst_id}/admins/{admin_user_id}", summary="Remove admin")
def remove_institution_admin(inst_id: int, admin_user_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    r = db.execute(
        text("SELECT id FROM institution_admins WHERE institution_id = :iid AND user_id = :uid"),
        {"iid": inst_id, "uid": admin_user_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Admin not found")
    user_id = getattr(user, "user_numerical", None)
    db.execute(text("DELETE FROM institution_admins WHERE institution_id = :iid AND user_id = :uid"), {"iid": inst_id, "uid": admin_user_id})
    _log_institution_activity(db, inst_id, user_id, "admin_removed", {"user_id": admin_user_id})
    db.commit()
    return {"ok": True}


@router.patch("/institutions/{inst_id}/slug", summary="Update public URL slug")
def update_institution_slug(inst_id: int, data: SlugUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    slug = _slug(data.slug.strip())
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid slug")
    r = db.execute(text("SELECT id FROM institutions WHERE slug = :s AND id != :id"), {"s": slug, "id": inst_id})
    if r.scalar():
        raise HTTPException(status_code=409, detail="Slug already in use")
    db.execute(text("UPDATE institutions SET slug = :s WHERE id = :id"), {"s": slug, "id": inst_id})
    _log_institution_activity(db, inst_id, user_id, "slug_updated", {"slug": slug})
    db.commit()
    return {"ok": True, "slug": slug}


@router.post("/institutions/{inst_id}/publish", summary="Publish draft")
def publish_institution(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    user_id = getattr(user, "user_numerical", None)
    try:
        r = db.execute(text("SELECT draft_json FROM institutions WHERE id = :id"), {"id": inst_id})
        row = r.fetchone()
        draft = row.draft_json if row and hasattr(row, "draft_json") else None
        if draft:
            try:
                draft_data = json.loads(draft)
                col_map = {
                    "name": "name", "short_name": "short_name", "description": "description",
                    "website": "website", "logo_url": "logo_url", "cover_image_url": "cover_image_url",
                    "institution_type": "institution_type", "founded_year": "founded_year",
                    "country": "country", "state": "state", "city": "city", "campus_type": "campus_type",
                }
                updates, params = [], {"id": inst_id}
                for i, (k, v) in enumerate(draft_data.items()):
                    if k in col_map and v is not None:
                        pkey = f"draft_{i}"
                        updates.append(f"{col_map[k]} = :{pkey}")
                        params[pkey] = v
                if updates:
                    db.execute(text(f"UPDATE institutions SET {', '.join(updates)} WHERE id = :id"), params)
            except (json.JSONDecodeError, TypeError):
                pass
            db.execute(text("UPDATE institutions SET draft_json = NULL WHERE id = :id"), {"id": inst_id})
        _log_institution_activity(db, inst_id, user_id, "published", {})
    except ProgrammingError:
        pass  # draft_json column or new tables do not exist yet
    db.commit()
    return {"ok": True}


@router.post("/institutions/{inst_id}/archive", summary="Archive institution")
def archive_institution(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    _log_institution_activity(db, inst_id, getattr(user, "user_numerical", None), "archived", {})
    db.execute(text("UPDATE institutions SET status = 'archived' WHERE id = :id"), {"id": inst_id})
    db.commit()
    return {"ok": True}


@router.delete("/institutions/{inst_id}", summary="Delete institution permanently")
def delete_institution(inst_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_institution(db, inst_id)
    db.execute(text("DELETE FROM institutions WHERE id = :id"), {"id": inst_id})
    db.commit()
    return {"ok": True}


# ─── Pending institution approval (legacy) ───────────────────────────────────

class SuggestEditInstitution(BaseModel):
    degree: str | None = None
    majors: list[str] | None = None


@router.post("/institutions/{pid}/reject", summary="Reject pending institution and remove from queue")
def reject_institution(pid: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM pending_institutions WHERE id = :id AND status = 'pending'"), {"id": pid})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Pending institution not found")
    db.execute(text("UPDATE pending_institutions SET status = 'rejected' WHERE id = :id"), {"id": pid})
    db.commit()
    return {"ok": True}


@router.post("/institutions/combos/{combo_id}/disapprove", summary="Disapprove listed institution combo and revert education entries to pending")
def disapprove_institution_combo(combo_id: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("SELECT id FROM institution_degree_majors WHERE id = :id AND status = 'listed'"),
        {"id": combo_id},
    )
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Listed institution combo not found")
    db.execute(
        text("UPDATE institution_degree_majors SET status = 'removed' WHERE id = :id"),
        {"id": combo_id},
    )
    db.execute(
        text("UPDATE education_entries SET institution_degree_majors_id = NULL, status = 'pending' WHERE institution_degree_majors_id = :idm_id"),
        {"idm_id": combo_id},
    )
    db.commit()
    return {"ok": True}


@router.post("/institutions/{pid}/suggest-edit", summary="Suggest edits for pending institution")
def suggest_edit_institution(pid: int, data: SuggestEditInstitution, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM pending_institutions WHERE id = :id AND status = 'pending'"), {"id": pid})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Pending institution not found")
    sug = {}
    if data.degree is not None:
        sug["degree"] = data.degree
    if data.majors is not None:
        sug["majors"] = data.majors
    db.execute(
        text("UPDATE pending_institutions SET admin_suggested_json = :j WHERE id = :id"),
        {"j": json.dumps(sug), "id": pid},
    )
    db.commit()
    return {"ok": True}


def _add_to_institution_allowed_lists(db, inst_id: int, degree: str, majors: list, minors: list):
    """Add degree, majors, minors to institution allowed lists (idempotent)."""
    if degree:
        db.execute(
            text("INSERT INTO institution_degrees (institution_id, degree) VALUES (:iid, :d) ON CONFLICT (institution_id, degree) DO NOTHING"),
            {"iid": inst_id, "d": degree},
        )
    for m in (majors or []):
        m = (m or "").strip()
        if m:
            db.execute(
                text("INSERT INTO institution_majors (institution_id, major) VALUES (:iid, :m) ON CONFLICT (institution_id, major) DO NOTHING"),
                {"iid": inst_id, "m": m},
            )
    for m in (minors or []):
        m = (m or "").strip()
        if m:
            db.execute(
                text("INSERT INTO institution_minors (institution_id, minor) VALUES (:iid, :m) ON CONFLICT (institution_id, minor) DO NOTHING"),
                {"iid": inst_id, "m": m},
            )


@router.post("/institutions/{pid}/approve", summary="Approve pending institution")
def approve_institution(pid: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT id, institution_name, degree, majors_json, education_entry_id
            FROM pending_institutions WHERE id = :id AND status = 'pending'
        """),
        {"id": pid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pending institution not found")

    inst_name = (row.institution_name or "").strip()
    degree = (row.degree or "").strip()
    majors_json = row.majors_json or "[]"
    entry_id = row.education_entry_id

    try:
        majors = json.loads(majors_json)
    except (json.JSONDecodeError, TypeError):
        majors = []

    slug = _slug(inst_name)
    r2 = db.execute(text("SELECT id FROM institutions WHERE slug = :s"), {"s": slug})
    inst_row = r2.fetchone()
    if inst_row:
        inst_id = inst_row.id
        db.execute(text("UPDATE institutions SET status = 'listed' WHERE id = :id"), {"id": inst_id})
    else:
        db.execute(
            text("INSERT INTO institutions (name, slug, status) VALUES (:n, :s, 'listed')"),
            {"n": inst_name, "s": slug},
        )
        inst_id = db.execute(text("SELECT lastval()")).fetchone()[0]

    r3 = db.execute(
        text("SELECT id FROM institution_degree_majors WHERE institution_id = :iid AND degree = :d AND majors_json = :mj AND status = 'listed'"),
        {"iid": inst_id, "d": degree, "mj": majors_json},
    )
    idm_row = r3.fetchone()
    if idm_row:
        idm_id = idm_row.id
    else:
        db.execute(
            text("INSERT INTO institution_degree_majors (institution_id, degree, majors_json, status) VALUES (:iid, :d, :mj, 'listed')"),
            {"iid": inst_id, "d": degree, "mj": majors_json},
        )
        idm_id = db.execute(text("SELECT lastval()")).fetchone()[0]

    minors = []
    if entry_id:
        r4 = db.execute(text("SELECT minors_json FROM education_entries WHERE id = :eid"), {"eid": entry_id})
        er = r4.fetchone()
        if er and getattr(er, "minors_json", None):
            try:
                minors = json.loads(er.minors_json or "[]")
            except (json.JSONDecodeError, TypeError):
                pass
    _add_to_institution_allowed_lists(db, inst_id, degree, majors, minors)

    if entry_id:
        db.execute(
            text("""
                UPDATE education_entries
                SET institution_id = :iid, institution_degree_majors_id = :idm, institution_name = :n, degree = :d, majors_json = :mj, status = 'listed'
                WHERE id = :eid
            """),
            {"iid": inst_id, "idm": idm_id, "n": inst_name, "d": degree, "mj": majors_json, "eid": entry_id},
        )

    db.execute(text("UPDATE pending_institutions SET status = 'approved' WHERE id = :id"), {"id": pid})
    try:
        ensure_institution_community(db, inst_id, inst_name)
    except Exception:
        pass
    db.commit()
    return {"ok": True, "institution_id": inst_id}


@router.post("/institutions/{pid}/approve-with-edit", summary="Approve with corrected values")
def approve_institution_with_edit(pid: int, data: SuggestEditInstitution, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("SELECT id, institution_name, degree, majors_json, education_entry_id FROM pending_institutions WHERE id = :id AND status = 'pending'"),
        {"id": pid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pending institution not found")

    inst_name = (row.institution_name or "").strip()
    degree = (data.degree or row.degree or "").strip()
    majors = data.majors if data.majors is not None else []
    try:
        majors = json.loads(row.majors_json or "[]") if data.majors is None else majors
    except (json.JSONDecodeError, TypeError):
        majors = []
    majors_json = json.dumps(majors)
    entry_id = row.education_entry_id

    slug = _slug(inst_name)
    r2 = db.execute(text("SELECT id FROM institutions WHERE slug = :s"), {"s": slug})
    inst_row = r2.fetchone()
    if inst_row:
        inst_id = inst_row.id
        db.execute(text("UPDATE institutions SET status = 'listed' WHERE id = :id"), {"id": inst_id})
    else:
        db.execute(
            text("INSERT INTO institutions (name, slug, status) VALUES (:n, :s, 'listed')"),
            {"n": inst_name, "s": slug},
        )
        inst_id = db.execute(text("SELECT lastval()")).fetchone()[0]

    r3 = db.execute(
        text("SELECT id FROM institution_degree_majors WHERE institution_id = :iid AND degree = :d AND majors_json = :mj AND status = 'listed'"),
        {"iid": inst_id, "d": degree, "mj": majors_json},
    )
    idm_row = r3.fetchone()
    if idm_row:
        idm_id = idm_row.id
    else:
        db.execute(
            text("INSERT INTO institution_degree_majors (institution_id, degree, majors_json, status) VALUES (:iid, :d, :mj, 'listed')"),
            {"iid": inst_id, "d": degree, "mj": majors_json},
        )
        idm_id = db.execute(text("SELECT lastval()")).fetchone()[0]

    minors = []
    if entry_id:
        r4 = db.execute(text("SELECT minors_json FROM education_entries WHERE id = :eid"), {"eid": entry_id})
        er = r4.fetchone()
        if er and getattr(er, "minors_json", None):
            try:
                minors = json.loads(er.minors_json or "[]")
            except (json.JSONDecodeError, TypeError):
                pass
    _add_to_institution_allowed_lists(db, inst_id, degree, majors, minors)

    if entry_id:
        db.execute(
            text("""
                UPDATE education_entries
                SET institution_id = :iid, institution_degree_majors_id = :idm, institution_name = :n, degree = :d, majors_json = :mj, status = 'listed'
                WHERE id = :eid
            """),
            {"iid": inst_id, "idm": idm_id, "n": inst_name, "d": degree, "mj": majors_json, "eid": entry_id},
        )

    db.execute(text("UPDATE pending_institutions SET status = 'approved' WHERE id = :id"), {"id": pid})
    try:
        ensure_institution_community(db, inst_id, inst_name)
    except Exception:
        pass
    db.commit()
    return {"ok": True, "institution_id": inst_id}


# ─── Organisation approval ───────────────────────────────────────────────────

@router.get("/organisations/pending", summary="List pending organisation approvals")
def list_pending_organisations(user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT id, organisation_name, business_unit, function, title, submitted_by,
                   experience_group_id, movement_id, status, created_at
            FROM pending_organisations
            WHERE status = 'pending'
            ORDER BY created_at ASC
        """),
    )
    rows = r.fetchall()
    return {"pending": [{"id": r.id, "organisation_name": r.organisation_name, "business_unit": r.business_unit, "function": r.function, "title": r.title, "submitted_by": r.submitted_by, "experience_group_id": r.experience_group_id, "movement_id": r.movement_id, "created_at": r.created_at.isoformat() if hasattr(r.created_at, "isoformat") else str(r.created_at)} for r in rows]}


@router.get("/organisations/listed", summary="List approved organisations and combos")
def list_listed_organisations(user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT o.id, o.name, o.slug, o.status, oc.id as combo_id, oc.business_unit, oc.function, oc.title
            FROM organisations o
            LEFT JOIN organisation_combos oc ON oc.organisation_id = o.id AND oc.status = 'listed'
            WHERE o.status IN ('listed', 'placeholder')
            ORDER BY o.name, oc.title
        """),
    )
    rows = r.fetchall()
    by_org = {}
    for row in rows:
        if row.id not in by_org:
            by_org[row.id] = {"id": row.id, "name": row.name, "slug": row.slug, "status": row.status, "combos": []}
        if row.combo_id:
            by_org[row.id]["combos"].append({"id": row.combo_id, "business_unit": row.business_unit, "function": row.function, "title": row.title})
    return {"listed": list(by_org.values())}


class OrganisationUpdate(BaseModel):
    name: str | None = None
    short_name: str | None = None
    logo_url: str | None = None
    description: str | None = None
    website: str | None = None
    status: str | None = None
    organisation_type: str | None = None
    industry: str | None = None
    headquarters: str | None = None
    founded_year: int | None = None
    company_size: str | None = None
    cover_image_url: str | None = None
    brand_colors_json: str | None = None
    linkedin_url: str | None = None
    twitter_url: str | None = None
    crunchbase_url: str | None = None
    is_public: bool | None = None
    business_units: list[str] | None = None
    functions: list[str] | None = None
    titles: list[str] | None = None


class OrgBusinessUnitCreate(BaseModel):
    name: str
    head_user_id: int | None = None


class OrgFunctionCreate(BaseModel):
    name: str
    business_unit_id: int | None = None


class OrgRoleCreate(BaseModel):
    title: str
    level: str = "C10"
    function_id: int | None = None
    business_unit_id: int | None = None
    employment_type: str = "full_time"


class OrgAdminInvite(BaseModel):
    user_id: int
    role: str = "admin"


def _log_organisation_activity(db, org_id: int, user_id: int | None, action: str, details: dict | None = None):
    try:
        db.execute(
            text("""
                INSERT INTO organisation_activity_log (organisation_id, user_id, action, details_json)
                VALUES (:oid, :uid, :action, :details)
            """),
            {"oid": org_id, "uid": user_id, "action": action, "details": json.dumps(details) if details else None},
        )
    except ProgrammingError:
        pass
    try:
        from shared.telemetry.emitters.audit_emitter import track_audit_action
        track_audit_action(db, user_id, action, "organisation", str(org_id), metadata=details)
    except Exception:
        pass


def _ensure_organisation(db, org_id: int) -> None:
    r = db.execute(text("SELECT id FROM organisations WHERE id = :id"), {"id": org_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Organisation not found")


def _get_organisation_row(db, org_id: int):
    try:
        r = db.execute(
            text("""
                SELECT id, name, short_name, slug, status, logo_url, description, website,
                       organisation_type, industry, headquarters, founded_year, company_size,
                       cover_image_url, brand_colors_json, linkedin_url, twitter_url, crunchbase_url,
                       is_public, draft_json
                FROM organisations WHERE id = :id
            """),
            {"id": org_id},
        )
        return r.fetchone(), True
    except ProgrammingError:
        r = db.execute(
            text("SELECT id, name, slug, status, logo_url, description, website FROM organisations WHERE id = :id"),
            {"id": org_id},
        )
        return r.fetchone(), False


def _get_organisation_v2_data(db, org_id: int, schema_ok: bool):
    business_units_v2 = functions_v2 = roles_v2 = admins = []
    business_units = functions = titles = []
    if schema_ok:
        try:
            bu_rows = db.execute(
                text("SELECT id, name, head_user_id, created_at FROM organisation_business_units_v2 WHERE organisation_id = :oid ORDER BY name"),
                {"oid": org_id},
            ).fetchall()
            business_units_v2 = [{"id": r.id, "name": r.name, "head_user_id": r.head_user_id, "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in bu_rows]
            fn_rows = db.execute(
                text("SELECT id, name, business_unit_id, created_at FROM organisation_functions_v2 WHERE organisation_id = :oid ORDER BY name"),
                {"oid": org_id},
            ).fetchall()
            functions_v2 = [{"id": r.id, "name": r.name, "business_unit_id": r.business_unit_id, "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in fn_rows]
            role_rows = db.execute(
                text("SELECT id, title, level, function_id, business_unit_id, employment_type, status, created_at FROM organisation_roles_v2 WHERE organisation_id = :oid ORDER BY title"),
                {"oid": org_id},
            ).fetchall()
            roles_v2 = [{"id": r.id, "title": r.title, "level": r.level or "C10", "function_id": r.function_id, "business_unit_id": r.business_unit_id, "employment_type": r.employment_type or "full_time", "status": r.status or "active", "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in role_rows]
            admin_rows = db.execute(
                text("SELECT oa.id, oa.user_id, oa.role, oa.added_by_user_id, oa.created_at, u.full_name FROM organisation_admins oa LEFT JOIN users u ON u.user_numerical = oa.user_id WHERE oa.organisation_id = :oid ORDER BY oa.created_at"),
                {"oid": org_id},
            ).fetchall()
            admins = [{"id": r.id, "user_id": r.user_id, "role": r.role, "added_by_user_id": r.added_by_user_id, "full_name": r.full_name or "", "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in admin_rows]
        except ProgrammingError:
            pass
    try:
        r2 = db.execute(text("SELECT name FROM organisation_business_units WHERE organisation_id = :oid ORDER BY name"), {"oid": org_id})
        business_units = [r.name for r in r2.fetchall() if r.name]
    except ProgrammingError:
        pass
    try:
        r2 = db.execute(text("SELECT name FROM organisation_functions WHERE organisation_id = :oid ORDER BY name"), {"oid": org_id})
        functions = [r.name for r in r2.fetchall() if r.name]
    except ProgrammingError:
        pass
    try:
        r2 = db.execute(text("SELECT title FROM organisation_titles WHERE organisation_id = :oid ORDER BY title"), {"oid": org_id})
        titles = [r.title for r in r2.fetchall() if r.title]
    except ProgrammingError:
        pass
    return {"business_units_v2": business_units_v2, "functions_v2": functions_v2, "roles_v2": roles_v2, "admins": admins, "business_units": business_units, "functions": functions, "titles": titles}


@router.get("/organisations/{org_id}", summary="Get organisation for editing")
def get_organisation(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    row, schema_ok = _get_organisation_row(db, org_id)
    if not row:
        raise HTTPException(status_code=404, detail="Organisation not found")
    v2 = _get_organisation_v2_data(db, org_id, schema_ok)
    return {
        "id": row.id,
        "name": row.name,
        "short_name": getattr(row, "short_name", None) if schema_ok else None,
        "slug": row.slug,
        "status": row.status,
        "logo_url": row.logo_url,
        "description": row.description,
        "website": row.website,
        "organisation_type": getattr(row, "organisation_type", None) if schema_ok else None,
        "industry": getattr(row, "industry", None) if schema_ok else None,
        "headquarters": getattr(row, "headquarters", None) if schema_ok else None,
        "founded_year": getattr(row, "founded_year", None) if schema_ok else None,
        "company_size": getattr(row, "company_size", None) if schema_ok else None,
        "cover_image_url": getattr(row, "cover_image_url", None) if schema_ok else None,
        "brand_colors_json": getattr(row, "brand_colors_json", None) if schema_ok else None,
        "linkedin_url": getattr(row, "linkedin_url", None) if schema_ok else None,
        "twitter_url": getattr(row, "twitter_url", None) if schema_ok else None,
        "crunchbase_url": getattr(row, "crunchbase_url", None) if schema_ok else None,
        "is_public": getattr(row, "is_public", True) if schema_ok and hasattr(row, "is_public") and row.is_public is not None else True,
        "draft_json": getattr(row, "draft_json", None) if schema_ok else None,
        "business_units_v2": v2["business_units_v2"],
        "functions_v2": v2["functions_v2"],
        "roles_v2": v2["roles_v2"],
        "admins": v2["admins"],
        "business_units": v2["business_units"],
        "functions": v2["functions"],
        "titles": v2["titles"],
    }


@router.patch("/organisations/{org_id}", summary="Update organisation")
def update_organisation(org_id: int, data: OrganisationUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    user_id = getattr(user, "user_numerical", None)
    updates = []
    params = {"id": org_id}
    legacy_cols = {"name", "logo_url", "description", "website", "status"}
    if data.name is not None:
        updates.append("name = :n")
        params["n"] = data.name.strip()
    if data.short_name is not None:
        updates.append("short_name = :sn")
        params["sn"] = data.short_name.strip() or None
    if data.logo_url is not None:
        updates.append("logo_url = :logo")
        params["logo"] = data.logo_url.strip() or None
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description.strip() or None
    if data.website is not None:
        updates.append("website = :web")
        params["web"] = data.website.strip() or None
    if data.status is not None:
        updates.append("status = :status")
        params["status"] = data.status
    if data.organisation_type is not None:
        updates.append("organisation_type = :otype")
        params["otype"] = data.organisation_type.strip() or None
    if data.industry is not None:
        updates.append("industry = :ind")
        params["ind"] = data.industry.strip() or None
    if data.headquarters is not None:
        updates.append("headquarters = :hq")
        params["hq"] = data.headquarters.strip() or None
    if data.founded_year is not None:
        updates.append("founded_year = :fy")
        params["fy"] = data.founded_year
    if data.company_size is not None:
        updates.append("company_size = :csize")
        params["csize"] = data.company_size.strip() or None
    if data.cover_image_url is not None:
        updates.append("cover_image_url = :cover")
        params["cover"] = data.cover_image_url.strip() or None
    if data.brand_colors_json is not None:
        updates.append("brand_colors_json = :bc")
        params["bc"] = data.brand_colors_json.strip() or None
    if data.linkedin_url is not None:
        updates.append("linkedin_url = :li")
        params["li"] = data.linkedin_url.strip() or None
    if data.twitter_url is not None:
        updates.append("twitter_url = :tw")
        params["tw"] = data.twitter_url.strip() or None
    if data.crunchbase_url is not None:
        updates.append("crunchbase_url = :cb")
        params["cb"] = data.crunchbase_url.strip() or None
    if data.is_public is not None:
        updates.append("is_public = :ip")
        params["ip"] = data.is_public
    if updates:
        try:
            db.execute(text(f"UPDATE organisations SET {', '.join(updates)} WHERE id = :id"), params)
        except ProgrammingError:
            legacy_updates = [u for u in updates if u.split(" = ")[0].strip() in legacy_cols]
            legacy_param_keys = ("id", "n", "logo", "desc", "web", "status")
            legacy_params = {k: params[k] for k in legacy_param_keys if k in params}
            if legacy_updates and legacy_params:
                db.execute(text(f"UPDATE organisations SET {', '.join(legacy_updates)} WHERE id = :id"), legacy_params)
        _log_organisation_activity(db, org_id, user_id, "profile_updated", {"fields": [u.split(" = ")[0] for u in updates]})
    if data.business_units is not None:
        db.execute(text("DELETE FROM organisation_business_units WHERE organisation_id = :oid"), {"oid": org_id})
        for b in data.business_units:
            b = (b or "").strip()
            if b:
                db.execute(text("INSERT INTO organisation_business_units (organisation_id, name) VALUES (:oid, :n) ON CONFLICT (organisation_id, name) DO NOTHING"), {"oid": org_id, "n": b})
        _log_organisation_activity(db, org_id, user_id, "business_units_updated", {"count": len(data.business_units)})
    if data.functions is not None:
        db.execute(text("DELETE FROM organisation_functions WHERE organisation_id = :oid"), {"oid": org_id})
        for f in data.functions:
            f = (f or "").strip()
            if f:
                db.execute(text("INSERT INTO organisation_functions (organisation_id, name) VALUES (:oid, :n) ON CONFLICT (organisation_id, name) DO NOTHING"), {"oid": org_id, "n": f})
        _log_organisation_activity(db, org_id, user_id, "functions_updated", {"count": len(data.functions)})
    if data.titles is not None:
        db.execute(text("DELETE FROM organisation_titles WHERE organisation_id = :oid"), {"oid": org_id})
        for t in data.titles:
            t = (t or "").strip()
            if t:
                db.execute(text("INSERT INTO organisation_titles (organisation_id, title) VALUES (:oid, :n) ON CONFLICT (organisation_id, title) DO NOTHING"), {"oid": org_id, "n": t})
        _log_organisation_activity(db, org_id, user_id, "titles_updated", {"count": len(data.titles)})
    db.commit()
    return {"ok": True}


@router.get("/organisations/{org_id}/stats", summary="Get organisation stats")
def get_organisation_stats(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM organisations WHERE id = :id"), {"id": org_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Organisation not found")
    from datetime import datetime
    now = datetime.now()
    yyyymm = f"{now.year}-{str(now.month).zfill(2)}"
    rc = db.execute(
        text("""
            SELECT COUNT(DISTINCT eg.user_id) FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
            WHERE eg.organisation_id = :oid AND (im.end_month IS NULL OR im.end_month >= :yyyymm)
        """),
        {"oid": org_id, "yyyymm": yyyymm},
    )
    current_count = rc.scalar() or 0
    rc2 = db.execute(
        text("""
            SELECT COUNT(DISTINCT eg.user_id) FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
            WHERE eg.organisation_id = :oid AND im.end_month IS NOT NULL AND im.end_month < :yyyymm
        """),
        {"oid": org_id, "yyyymm": yyyymm},
    )
    alumni_count = rc2.scalar() or 0
    rc3 = db.execute(text("SELECT COUNT(DISTINCT user_id) FROM experience_groups WHERE organisation_id = :oid"), {"oid": org_id})
    total_count = rc3.scalar() or 0
    return {"current_count": current_count, "alumni_count": alumni_count, "total_count": total_count}


# ─── Organisation Admin Board: activity, people, BUs, functions, roles, admins ─

@router.get("/organisations/{org_id}/activity", summary="Paginated activity log")
def get_organisation_activity(
    org_id: int,
    user=Depends(require_admin),
    db=Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    _ensure_organisation(db, org_id)
    try:
        rows = db.execute(
            text("""
                SELECT oal.id, oal.user_id, oal.action, oal.details_json, oal.created_at, u.full_name
                FROM organisation_activity_log oal
                LEFT JOIN users u ON u.user_numerical = oal.user_id
                WHERE oal.organisation_id = :oid
                ORDER BY oal.created_at DESC
                OFFSET :skip LIMIT :limit
            """),
            {"oid": org_id, "skip": skip, "limit": limit},
        ).fetchall()
        total = db.execute(
            text("SELECT COUNT(*) FROM organisation_activity_log WHERE organisation_id = :oid"),
            {"oid": org_id},
        ).scalar() or 0
        items = []
        for r in rows:
            details = None
            if r.details_json:
                try:
                    details = json.loads(r.details_json)
                except (json.JSONDecodeError, TypeError):
                    pass
            items.append({"id": r.id, "user_id": r.user_id, "full_name": r.full_name or "", "action": r.action, "details": details, "created_at": r.created_at.isoformat() if r.created_at else None})
        return {"items": items, "total": total, "skip": skip, "limit": limit}
    except ProgrammingError:
        return {"items": [], "total": 0, "skip": skip, "limit": limit}


@router.get("/organisations/{org_id}/people", summary="Current members and alumni")
def get_organisation_people(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    from datetime import datetime
    now = datetime.now()
    yyyymm = f"{now.year}-{str(now.month).zfill(2)}"
    current_rows = db.execute(
        text("""
            SELECT DISTINCT ON (eg.user_id) eg.user_id, im.business_unit, im.function, im.title, im.start_month, im.end_month,
                   u.full_name, u.profile_slug
            FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
            JOIN users u ON u.user_numerical = eg.user_id
            WHERE eg.organisation_id = :oid AND (im.end_month IS NULL OR im.end_month >= :yyyymm)
            ORDER BY eg.user_id, im.end_month DESC NULLS FIRST
        """),
        {"oid": org_id, "yyyymm": yyyymm},
    ).fetchall()
    alumni_rows = db.execute(
        text("""
            SELECT DISTINCT ON (eg.user_id) eg.user_id, im.business_unit, im.function, im.title, im.start_month, im.end_month,
                   u.full_name, u.profile_slug
            FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
            JOIN users u ON u.user_numerical = eg.user_id
            WHERE eg.organisation_id = :oid AND im.end_month IS NOT NULL AND im.end_month < :yyyymm
            ORDER BY eg.user_id, im.end_month DESC
        """),
        {"oid": org_id, "yyyymm": yyyymm},
    ).fetchall()

    def _to_person(r):
        return {"user_id": r.user_id, "full_name": r.full_name or "", "profile_slug": r.profile_slug or "", "business_unit": r.business_unit or "", "function": r.function or "", "title": r.title or "", "start_month": r.start_month, "end_month": r.end_month}
    return {"current": [_to_person(r) for r in current_rows], "alumni": [_to_person(r) for r in alumni_rows]}


@router.post("/organisations/{org_id}/business-units", summary="Add business unit")
def add_org_business_unit(org_id: int, data: OrgBusinessUnitCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    row, schema_ok = _get_organisation_row(db, org_id)
    if not schema_ok:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")
    try:
        n = data.name.strip()
        db.execute(
            text("INSERT INTO organisation_business_units_v2 (organisation_id, name, head_user_id) VALUES (:oid, :name, :hid)"),
            {"oid": org_id, "name": n, "hid": data.head_user_id},
        )
        bu_id = db.execute(text("SELECT lastval()")).fetchone()[0]
        db.execute(text("INSERT INTO organisation_business_units (organisation_id, name) VALUES (:oid, :n) ON CONFLICT (organisation_id, name) DO NOTHING"), {"oid": org_id, "n": n})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "business_unit_added", {"id": bu_id, "name": n})
        db.commit()
        return {"ok": True, "id": bu_id}
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")


@router.delete("/organisations/{org_id}/business-units/{bu_id}", summary="Remove business unit")
def delete_org_business_unit(org_id: int, bu_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    r = db.execute(text("SELECT id FROM organisation_business_units_v2 WHERE organisation_id = :oid AND id = :bid"), {"oid": org_id, "bid": bu_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Business unit not found")
    try:
        db.execute(text("DELETE FROM organisation_business_units_v2 WHERE id = :bid"), {"bid": bu_id})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "business_unit_removed", {"id": bu_id})
        db.commit()
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")
    return {"ok": True}


@router.post("/organisations/{org_id}/functions", summary="Add function")
def add_org_function(org_id: int, data: OrgFunctionCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    try:
        n = data.name.strip()
        db.execute(
            text("INSERT INTO organisation_functions_v2 (organisation_id, name, business_unit_id) VALUES (:oid, :name, :buid)"),
            {"oid": org_id, "name": n, "buid": data.business_unit_id},
        )
        fn_id = db.execute(text("SELECT lastval()")).fetchone()[0]
        db.execute(text("INSERT INTO organisation_functions (organisation_id, name) VALUES (:oid, :n) ON CONFLICT (organisation_id, name) DO NOTHING"), {"oid": org_id, "n": n})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "function_added", {"id": fn_id, "name": n})
        db.commit()
        return {"ok": True, "id": fn_id}
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")


@router.delete("/organisations/{org_id}/functions/{fn_id}", summary="Remove function")
def delete_org_function(org_id: int, fn_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    r = db.execute(text("SELECT id FROM organisation_functions_v2 WHERE organisation_id = :oid AND id = :fid"), {"oid": org_id, "fid": fn_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Function not found")
    try:
        db.execute(text("DELETE FROM organisation_functions_v2 WHERE id = :fid"), {"fid": fn_id})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "function_removed", {"id": fn_id})
        db.commit()
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")
    return {"ok": True}


@router.post("/organisations/{org_id}/roles", summary="Add role")
def add_org_role(org_id: int, data: OrgRoleCreate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    try:
        t = data.title.strip()
        db.execute(
            text("""
                INSERT INTO organisation_roles_v2 (organisation_id, title, level, function_id, business_unit_id, employment_type, status)
                VALUES (:oid, :title, :level, :fid, :buid, :etype, 'active')
            """),
            {"oid": org_id, "title": t, "level": data.level or "C10", "fid": data.function_id, "buid": data.business_unit_id, "etype": data.employment_type or "full_time"},
        )
        role_id = db.execute(text("SELECT lastval()")).fetchone()[0]
        db.execute(text("INSERT INTO organisation_titles (organisation_id, title) VALUES (:oid, :n) ON CONFLICT (organisation_id, title) DO NOTHING"), {"oid": org_id, "n": t})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "role_added", {"id": role_id, "title": t})
        db.commit()
        return {"ok": True, "id": role_id}
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")


@router.delete("/organisations/{org_id}/roles/{role_id}", summary="Remove role")
def delete_org_role(org_id: int, role_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    r = db.execute(text("SELECT id FROM organisation_roles_v2 WHERE organisation_id = :oid AND id = :rid"), {"oid": org_id, "rid": role_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Role not found")
    try:
        db.execute(text("DELETE FROM organisation_roles_v2 WHERE id = :rid"), {"rid": role_id})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "role_removed", {"id": role_id})
        db.commit()
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")
    return {"ok": True}


@router.get("/organisations/{org_id}/admins", summary="List admins")
def get_organisation_admins(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    try:
        rows = db.execute(
            text("SELECT oa.id, oa.user_id, oa.role, oa.added_by_user_id, oa.created_at, u.full_name FROM organisation_admins oa LEFT JOIN users u ON u.user_numerical = oa.user_id WHERE oa.organisation_id = :oid ORDER BY oa.created_at"),
            {"oid": org_id},
        ).fetchall()
        return {"admins": [{"id": r.id, "user_id": r.user_id, "role": r.role, "added_by_user_id": r.added_by_user_id, "full_name": r.full_name or "", "created_at": (r.created_at.isoformat() if r.created_at else None)} for r in rows]}
    except ProgrammingError:
        return {"admins": []}


@router.post("/organisations/{org_id}/admins", summary="Invite admin")
def add_organisation_admin(org_id: int, data: OrgAdminInvite, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    try:
        db.execute(
            text("INSERT INTO organisation_admins (organisation_id, user_id, role, added_by_user_id) VALUES (:oid, :uid, :role, :added) ON CONFLICT (organisation_id, user_id) DO UPDATE SET role = EXCLUDED.role"),
            {"oid": org_id, "uid": data.user_id, "role": data.role or "admin", "added": getattr(user, "user_numerical", None)},
        )
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "admin_added", {"user_id": data.user_id})
        try:
            add_organisation_admin_to_community(db, org_id, data.user_id)
        except Exception:
            pass
        db.commit()
        return {"ok": True}
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")


@router.delete("/organisations/{org_id}/admins/{admin_user_id}", summary="Remove admin")
def remove_organisation_admin(org_id: int, admin_user_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    r = db.execute(text("SELECT id FROM organisation_admins WHERE organisation_id = :oid AND user_id = :uid"), {"oid": org_id, "uid": admin_user_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Admin not found")
    try:
        db.execute(text("DELETE FROM organisation_admins WHERE organisation_id = :oid AND user_id = :uid"), {"oid": org_id, "uid": admin_user_id})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "admin_removed", {"user_id": admin_user_id})
        db.commit()
    except ProgrammingError:
        raise HTTPException(status_code=501, detail="Run migration 006_organisation_admin_board")
    return {"ok": True}


@router.patch("/organisations/{org_id}/slug", summary="Update public URL slug")
def update_organisation_slug(org_id: int, data: SlugUpdate, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    slug = _slug(data.slug.strip())
    if not slug:
        raise HTTPException(status_code=400, detail="Invalid slug")
    r = db.execute(text("SELECT id FROM organisations WHERE slug = :s AND id != :id"), {"s": slug, "id": org_id})
    if r.scalar():
        raise HTTPException(status_code=409, detail="Slug already in use")
    db.execute(text("UPDATE organisations SET slug = :s WHERE id = :id"), {"s": slug, "id": org_id})
    _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "slug_updated", {"slug": slug})
    db.commit()
    return {"ok": True, "slug": slug}


@router.post("/organisations/{org_id}/publish", summary="Publish draft")
def publish_organisation(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    try:
        r = db.execute(text("SELECT draft_json FROM organisations WHERE id = :id"), {"id": org_id})
        row = r.fetchone()
        draft = row.draft_json if row and hasattr(row, "draft_json") else None
        if draft:
            try:
                draft_data = json.loads(draft)
                col_map = {"name": "name", "short_name": "short_name", "description": "description", "website": "website", "logo_url": "logo_url", "cover_image_url": "cover_image_url", "organisation_type": "organisation_type", "industry": "industry", "headquarters": "headquarters", "founded_year": "founded_year", "company_size": "company_size"}
                updates, params = [], {"id": org_id}
                for i, (k, v) in enumerate(draft_data.items()):
                    if k in col_map and v is not None:
                        pkey = f"draft_{i}"
                        updates.append(f"{col_map[k]} = :{pkey}")
                        params[pkey] = v
                if updates:
                    db.execute(text(f"UPDATE organisations SET {', '.join(updates)} WHERE id = :id"), params)
            except (json.JSONDecodeError, TypeError):
                pass
            db.execute(text("UPDATE organisations SET draft_json = NULL WHERE id = :id"), {"id": org_id})
        _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "published", {})
    except ProgrammingError:
        pass
    db.commit()
    return {"ok": True}


@router.post("/organisations/{org_id}/archive", summary="Archive organisation")
def archive_organisation(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    _log_organisation_activity(db, org_id, getattr(user, "user_numerical", None), "archived", {})
    db.execute(text("UPDATE organisations SET status = 'archived' WHERE id = :id"), {"id": org_id})
    db.commit()
    return {"ok": True}


@router.delete("/organisations/{org_id}", summary="Delete organisation permanently")
def delete_organisation(org_id: int, user=Depends(require_admin), db=Depends(get_db)):
    _ensure_organisation(db, org_id)
    db.execute(text("DELETE FROM organisations WHERE id = :id"), {"id": org_id})
    db.commit()
    return {"ok": True}


@router.get("/organisations/combos-pending", summary="List pending combos for an org (by exp group)")
def list_combos_pending(experience_group_id: int = Query(...), user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT id, organisation_name, business_unit, function, title, movement_id, created_at
            FROM pending_organisations
            WHERE experience_group_id = :egid AND status = 'pending'
        """),
        {"egid": experience_group_id},
    )
    rows = r.fetchall()
    return {"pending": [{"id": r.id, "organisation_name": r.organisation_name, "business_unit": r.business_unit, "function": r.function, "title": r.title, "movement_id": r.movement_id} for r in rows]}


class SuggestEditOrganisation(BaseModel):
    organisation_name: str | None = None
    business_unit: str | None = None
    function: str | None = None
    title: str | None = None


def _add_to_organisation_allowed_lists(db, org_id: int, bu: str, fn: str, title: str):
    """Add BU, function, title to organisation allowed lists (idempotent)."""
    if bu:
        db.execute(
            text("INSERT INTO organisation_business_units (organisation_id, name) VALUES (:oid, :n) ON CONFLICT (organisation_id, name) DO NOTHING"),
            {"oid": org_id, "n": bu},
        )
    if fn:
        db.execute(
            text("INSERT INTO organisation_functions (organisation_id, name) VALUES (:oid, :n) ON CONFLICT (organisation_id, name) DO NOTHING"),
            {"oid": org_id, "n": fn},
        )
    if title:
        db.execute(
            text("INSERT INTO organisation_titles (organisation_id, title) VALUES (:oid, :n) ON CONFLICT (organisation_id, title) DO NOTHING"),
            {"oid": org_id, "n": title},
        )


@router.post("/organisations/{pid}/approve", summary="Approve pending organisation (org-level or combo)")
def approve_organisation(pid: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("SELECT id, organisation_name, business_unit, function, title, experience_group_id, movement_id FROM pending_organisations WHERE id = :id AND status = 'pending'"),
        {"id": pid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Pending organisation not found")

    org_name = (row.organisation_name or "").strip()
    bu = (row.business_unit or "").strip()
    fn = (row.function or "").strip()
    title = (row.title or "").strip()
    eg_id = row.experience_group_id
    mov_id = row.movement_id

    r2 = db.execute(text("SELECT id, organisation_id FROM experience_groups WHERE id = :id"), {"id": eg_id})
    eg = r2.fetchone()
    if not eg:
        db.execute(text("UPDATE pending_organisations SET status = 'rejected' WHERE id = :id"), {"id": pid})
        db.commit()
        return {"ok": False, "detail": "Experience group not found"}

    org_id = eg.organisation_id
    slug = _slug(org_name)
    if not org_id:
        r3 = db.execute(text("SELECT id FROM organisations WHERE slug = :s"), {"s": slug})
        o = r3.fetchone()
        if o:
            org_id = o.id
            db.execute(text("UPDATE organisations SET status = 'listed' WHERE id = :id"), {"id": org_id})
        else:
            db.execute(
                text("INSERT INTO organisations (name, slug, status) VALUES (:n, :s, 'listed')"),
                {"n": org_name, "s": slug},
            )
            org_id = db.execute(text("SELECT lastval()")).fetchone()[0]
        db.execute(
            text("UPDATE experience_groups SET organisation_id = :oid, organisation_name = :n WHERE id = :id"),
            {"oid": org_id, "n": org_name, "id": eg_id},
        )

    r4 = db.execute(
        text("SELECT id FROM organisation_combos WHERE organisation_id = :oid AND business_unit = :bu AND function = :fn AND title = :title AND status = 'listed'"),
        {"oid": org_id, "bu": bu, "fn": fn, "title": title},
    )
    oc = r4.fetchone()
    if oc:
        oc_id = oc.id
    else:
        db.execute(
            text("INSERT INTO organisation_combos (organisation_id, business_unit, function, title, status) VALUES (:oid, :bu, :fn, :title, 'listed')"),
            {"oid": org_id, "bu": bu, "fn": fn, "title": title},
        )
        oc_id = db.execute(text("SELECT lastval()")).fetchone()[0]

    if mov_id:
        db.execute(
            text("UPDATE internal_movements SET organisation_combo_id = :ocid, status = 'listed' WHERE id = :mid"),
            {"ocid": oc_id, "mid": mov_id},
        )

    _add_to_organisation_allowed_lists(db, org_id, bu, fn, title)

    db.execute(text("UPDATE pending_organisations SET status = 'approved' WHERE id = :id"), {"id": pid})
    try:
        ensure_organisation_community(db, org_id, org_name)
    except Exception:
        pass
    db.commit()
    return {"ok": True, "organisation_id": org_id}


@router.post("/organisations/{pid}/reject", summary="Reject pending organisation and remove from queue")
def reject_organisation(pid: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM pending_organisations WHERE id = :id AND status = 'pending'"), {"id": pid})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Pending organisation not found")
    db.execute(text("UPDATE pending_organisations SET status = 'rejected' WHERE id = :id"), {"id": pid})
    db.commit()
    return {"ok": True}


@router.post("/organisations/combos/{combo_id}/disapprove", summary="Disapprove listed combo and revert movements to pending")
def disapprove_organisation_combo(combo_id: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("SELECT id, organisation_id FROM organisation_combos WHERE id = :id AND status = 'listed'"),
        {"id": combo_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Listed combo not found")
    db.execute(
        text("UPDATE organisation_combos SET status = 'removed' WHERE id = :id"),
        {"id": combo_id},
    )
    db.execute(
        text("UPDATE internal_movements SET organisation_combo_id = NULL, status = 'pending' WHERE organisation_combo_id = :ocid"),
        {"ocid": combo_id},
    )
    db.commit()
    return {"ok": True}


@router.post("/organisations/{pid}/suggest-edit", summary="Suggest edits for pending organisation")
def suggest_edit_organisation(pid: int, data: SuggestEditOrganisation, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM pending_organisations WHERE id = :id AND status = 'pending'"), {"id": pid})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Pending organisation not found")
    sug = {}
    if data.organisation_name is not None:
        sug["organisation_name"] = data.organisation_name
    if data.business_unit is not None:
        sug["business_unit"] = data.business_unit
    if data.function is not None:
        sug["function"] = data.function
    if data.title is not None:
        sug["title"] = data.title
    db.execute(
        text("UPDATE pending_organisations SET admin_suggested_json = :j WHERE id = :id"),
        {"j": json.dumps(sug), "id": pid},
    )
    db.commit()
    return {"ok": True}


@router.post("/organisations/combos/{cid}/approve", summary="Approve a combo (legacy - use org approve)")
def approve_combo(cid: int, user=Depends(require_admin), db=Depends(get_db)):
    raise HTTPException(status_code=501, detail="Use organisation approve endpoint with pending id")


# ─── User Management ────────────────────────────────────────────────────────

@router.get("/users", summary="List all users with profile data")
def list_users(user=Depends(require_admin), db=Depends(get_db)):
    """Return all users with basic profile info. Admin only."""
    r = db.execute(
        text("""
            SELECT user_numerical, username, email, full_name, headline, summary, profile_slug, user_type, date_of_birth,
                   COALESCE(account_status, 'approved') as account_status, created_at
            FROM users
            ORDER BY
                CASE COALESCE(account_status, 'approved') WHEN 'pending' THEN 0 ELSE 1 END ASC,
                user_numerical ASC
        """),
    )
    rows = r.fetchall()
    out = []
    for row in rows:
        out.append({
            "id": row.user_numerical,
            "username": row.username,
            "email": row.email,
            "full_name": row.full_name,
            "headline": row.headline,
            "summary": row.summary,
            "profile_slug": row.profile_slug,
            "user_type": row.user_type or "general",
            "date_of_birth": str(row.date_of_birth) if row.date_of_birth else None,
            "account_status": row.account_status or "approved",
            "created_at": row.created_at.isoformat() if row.created_at else None,
        })
    pending_count = sum(1 for u in out if u["account_status"] == "pending")
    return {"users": out, "pending_count": pending_count}


@router.patch("/users/{uid}/approve", summary="Approve a user account")
def approve_user(uid: int, user=Depends(require_admin), db=Depends(get_db)):
    """Set account_status to approved for the given user."""
    r = db.execute(
        text("SELECT user_numerical, email FROM users WHERE user_numerical = :uid"),
        {"uid": uid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    db.execute(
        text("UPDATE users SET account_status = 'approved' WHERE user_numerical = :uid"),
        {"uid": uid},
    )
    db.commit()
    try:
        actor_id = getattr(user, "user_numerical", None) or getattr(user, "id", None)
        from shared.telemetry.emitters.audit_emitter import track_audit_action
        track_audit_action(db, actor_id, "user_approved", "user", str(uid))
    except Exception:
        pass
    return {"ok": True, "user_id": uid, "account_status": "approved"}


@router.patch("/users/{uid}/reject", summary="Reject a user account")
def reject_user(uid: int, user=Depends(require_admin), db=Depends(get_db)):
    """Set account_status to rejected for the given user."""
    r = db.execute(
        text("SELECT user_numerical, email FROM users WHERE user_numerical = :uid"),
        {"uid": uid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if (row.email or "").lower() == "founders@ithras.com":
        raise HTTPException(status_code=403, detail="Cannot reject founders account")
    db.execute(
        text("UPDATE users SET account_status = 'rejected' WHERE user_numerical = :uid"),
        {"uid": uid},
    )
    db.commit()
    try:
        actor_id = getattr(user, "user_numerical", None) or getattr(user, "id", None)
        from shared.telemetry.emitters.audit_emitter import track_audit_action
        track_audit_action(db, actor_id, "user_rejected", "user", str(uid))
    except Exception:
        pass
    return {"ok": True, "user_id": uid, "account_status": "rejected"}


@router.delete("/users/{uid}", summary="Delete a user")
def delete_user(uid: int, user=Depends(require_admin), db=Depends(get_db)):
    """Delete user by id. Cannot delete founders@ithras.com."""
    r = db.execute(
        text("SELECT user_numerical, email FROM users WHERE user_numerical = :uid"),
        {"uid": uid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="User not found")
    if (row.email or "").lower() == "founders@ithras.com":
        raise HTTPException(status_code=403, detail="Cannot delete founders account")
    db.execute(text("DELETE FROM users WHERE user_numerical = :uid"), {"uid": uid})
    db.commit()
    return {"ok": True}
