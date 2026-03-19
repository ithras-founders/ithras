"""Public API - profiles, institutions, organisations by slug. No auth required."""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from shared.database.database import get_db

router = APIRouter(prefix="/api/v1/public", tags=["public"])


@router.get("/profiles/{slug}", summary="Get public profile by slug")
def get_public_profile(slug: str, db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT user_numerical, username, full_name, headline, summary, profile_slug
            FROM users
            WHERE profile_slug = :s AND user_type = 'professional'
        """),
        {"s": slug},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")

    uid = row.user_numerical
    education = []
    try:
        re = db.execute(
            text("""
                SELECT e.id, e.institution_id, e.institution_name, e.degree, e.majors_json, e.minors_json,
                       e.start_month, e.end_month, e.status, i.name as institution_display
                FROM education_entries e
                LEFT JOIN institutions i ON i.id = e.institution_id
                WHERE e.user_id = :uid
                ORDER BY e.end_month DESC NULLS FIRST, e.start_month DESC
            """),
            {"uid": uid},
        )
        for er in re.fetchall():
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
        rg = db.execute(
            text("""
                SELECT eg.id, eg.organisation_id, eg.organisation_name, o.name as org_display
                FROM experience_groups eg
                LEFT JOIN organisations o ON o.id = eg.organisation_id
                WHERE eg.user_id = :uid
                ORDER BY eg.id
            """),
            {"uid": uid},
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
                "organisation_name": eg.organisation_name or eg.org_display,
                "movements": movements,
            })
    except Exception:
        pass

    additional_responsibilities = []
    try:
        ar = db.execute(
            text("""
                SELECT id, title, organisation_name, description, start_month, end_month
                FROM additional_responsibilities WHERE user_id = :uid
                ORDER BY sort_order, created_at
            """),
            {"uid": uid},
        )
        for row in ar.fetchall():
            additional_responsibilities.append({
                "id": row.id,
                "title": row.title,
                "organisation_name": row.organisation_name,
                "description": row.description,
                "start_month": row.start_month,
                "end_month": row.end_month,
            })
    except Exception:
        pass

    other_achievements = []
    try:
        oa = db.execute(
            text("""
                SELECT id, category, title, description
                FROM other_achievements WHERE user_id = :uid
                ORDER BY sort_order, created_at
            """),
            {"uid": uid},
        )
        for row in oa.fetchall():
            other_achievements.append({
                "id": row.id,
                "category": row.category,
                "title": row.title,
                "description": row.description,
            })
    except Exception:
        pass

    return {
        "profile": {
            "full_name": row.full_name,
            "headline": row.headline,
            "summary": row.summary,
            "profile_slug": row.profile_slug,
        },
        "education": education,
        "experience": experience,
        "additional_responsibilities": additional_responsibilities,
        "other_achievements": other_achievements,
    }


@router.get("/institutions/{slug}", summary="Get public institution by slug")
def get_public_institution(slug: str, db=Depends(get_db)):
    r = db.execute(
        text("SELECT id, name, slug, status, logo_url, description, website FROM institutions WHERE slug = :s AND status IN ('listed', 'placeholder')"),
        {"s": slug},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Institution not found")

    alumni_count = 0
    current_count = 0
    try:
        from datetime import datetime
        now = datetime.now()
        yyyymm = f"{now.year}-{str(now.month).zfill(2)}"
        rc = db.execute(
            text("""
                SELECT COUNT(DISTINCT user_id) FROM education_entries
                WHERE institution_id = :iid AND end_month IS NOT NULL AND end_month < :yyyymm
            """),
            {"iid": row.id, "yyyymm": yyyymm},
        )
        alumni_count = rc.scalar() or 0
        rc2 = db.execute(
            text("""
                SELECT COUNT(DISTINCT user_id) FROM education_entries
                WHERE institution_id = :iid AND (end_month IS NULL OR end_month >= :yyyymm)
            """),
            {"iid": row.id, "yyyymm": yyyymm},
        )
        current_count = rc2.scalar() or 0
    except Exception:
        pass

    r2 = db.execute(
        text("SELECT id, degree, majors_json FROM institution_degree_majors WHERE institution_id = :iid AND status = 'listed'"),
        {"iid": row.id},
    )
    combos = []
    for c in r2.fetchall():
        majors = []
        try:
            majors = json.loads(c.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        combos.append({"degree": c.degree, "majors": majors})

    return {
        "institution": {
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "status": row.status,
            "logo_url": getattr(row, "logo_url", None),
            "description": getattr(row, "description", None),
            "website": getattr(row, "website", None),
        },
        "alumni_count": alumni_count,
        "current_count": current_count,
        "total_count": current_count + alumni_count,
        "degree_majors": combos,
    }


@router.get("/institutions/{slug}/people", summary="List current and alumni for institution")
def get_institution_people(slug: str, db=Depends(get_db)):
    r = db.execute(
        text("SELECT id FROM institutions WHERE slug = :s AND status IN ('listed', 'placeholder')"),
        {"s": slug},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Institution not found")
    inst_id = row.id

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


@router.get("/organisations/{slug}", summary="Get public organisation by slug")
def get_public_organisation(slug: str, db=Depends(get_db)):
    r = db.execute(
        text("SELECT id, name, slug, status, logo_url, description, website FROM organisations WHERE slug = :s AND status IN ('listed', 'placeholder')"),
        {"s": slug},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Organisation not found")

    r2 = db.execute(
        text("SELECT id, business_unit, function, title FROM organisation_combos WHERE organisation_id = :oid AND status = 'listed'"),
        {"oid": row.id},
    )
    combos = [{"business_unit": c.business_unit, "function": c.function, "title": c.title} for c in r2.fetchall()]

    alumni_count = 0
    current_count = 0
    try:
        from datetime import datetime
        now = datetime.now()
        yyyymm = f"{now.year}-{str(now.month).zfill(2)}"
        rc = db.execute(
            text("""
                SELECT COUNT(DISTINCT eg.user_id) FROM experience_groups eg
                JOIN internal_movements im ON im.experience_group_id = eg.id
                WHERE eg.organisation_id = :oid AND (im.end_month IS NULL OR im.end_month >= :yyyymm)
            """),
            {"oid": row.id, "yyyymm": yyyymm},
        )
        current_count = rc.scalar() or 0
        rc2 = db.execute(
            text("""
                SELECT COUNT(DISTINCT eg.user_id) FROM experience_groups eg
                JOIN internal_movements im ON im.experience_group_id = eg.id
                WHERE eg.organisation_id = :oid AND im.end_month IS NOT NULL AND im.end_month < :yyyymm
            """),
            {"oid": row.id, "yyyymm": yyyymm},
        )
        alumni_count = rc2.scalar() or 0
    except Exception:
        pass

    return {
        "organisation": {
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "status": row.status,
            "logo_url": getattr(row, "logo_url", None),
            "description": getattr(row, "description", None),
            "website": getattr(row, "website", None),
        },
        "combos": combos,
        "current_count": current_count,
        "alumni_count": alumni_count,
        "total_count": current_count + alumni_count,
    }


@router.get("/organisations/{slug}/people", summary="List current and alumni for organisation")
def get_organisation_people(slug: str, db=Depends(get_db)):
    r = db.execute(
        text("SELECT id FROM organisations WHERE slug = :s AND status IN ('listed', 'placeholder')"),
        {"s": slug},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Organisation not found")
    org_id = row.id

    from datetime import datetime
    now = datetime.now()
    yyyymm = f"{now.year}-{str(now.month).zfill(2)}"

    current_rows = db.execute(
        text("""
            SELECT DISTINCT ON (eg.user_id) eg.user_id,
                   im.business_unit, im.function, im.title, im.start_month, im.end_month,
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
            SELECT DISTINCT ON (eg.user_id) eg.user_id,
                   im.business_unit, im.function, im.title, im.start_month, im.end_month,
                   u.full_name, u.profile_slug
            FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
            JOIN users u ON u.user_numerical = eg.user_id
            WHERE eg.organisation_id = :oid AND im.end_month IS NOT NULL AND im.end_month < :yyyymm
            ORDER BY eg.user_id, im.end_month DESC
        """),
        {"oid": org_id, "yyyymm": yyyymm},
    ).fetchall()

    def _to_person(m):
        return {
            "user_id": m.user_id,
            "full_name": m.full_name or "",
            "profile_slug": m.profile_slug or "",
            "business_unit": m.business_unit or "",
            "function": m.function or "",
            "title": m.title or "",
            "start_month": m.start_month,
            "end_month": m.end_month,
        }

    return {"current": [_to_person(m) for m in current_rows], "alumni": [_to_person(m) for m in alumni_rows]}
