"""Public API - profiles, institutions, organisations by slug. No auth required."""
import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text

from shared.auth.auth import get_current_user_optional
from shared.database.database import get_db

router = APIRouter(prefix="/api/v1/public", tags=["public"])


def _optional_viewer_id(viewer: Any) -> int | None:
    if not viewer:
        return None
    uid = int(getattr(viewer, "user_numerical", None) or getattr(viewer, "id", 0) or 0)
    return uid if uid else None


def _linked_community_payload(db, *, institution_id: int | None = None, organisation_id: int | None = None, viewer: Any) -> dict | None:
    if institution_id is not None:
        r = db.execute(
            text("""
                SELECT c.id, c.slug, c.name, c.member_count
                FROM communities c
                WHERE c.institution_id = :eid AND c.status = 'listed'
                ORDER BY c.id ASC
                LIMIT 1
            """),
            {"eid": institution_id},
        ).fetchone()
    elif organisation_id is not None:
        r = db.execute(
            text("""
                SELECT c.id, c.slug, c.name, c.member_count
                FROM communities c
                WHERE c.organisation_id = :eid AND c.status = 'listed'
                ORDER BY c.id ASC
                LIMIT 1
            """),
            {"eid": organisation_id},
        ).fetchone()
    else:
        return None
    if not r:
        return None
    vid = _optional_viewer_id(viewer)
    viewer_is_member = False
    if vid:
        m = db.execute(
            text("SELECT 1 FROM community_members WHERE community_id = :cid AND user_id = :uid LIMIT 1"),
            {"cid": r.id, "uid": vid},
        ).fetchone()
        viewer_is_member = bool(m)
    return {
        "id": r.id,
        "slug": r.slug,
        "name": r.name,
        "member_count": r.member_count or 0,
        "feed_href": f"/feed/c/{r.slug}",
        "viewer_is_member": viewer_is_member,
    }


@router.get("/profiles/{slug}", summary="Get public profile by slug")
def get_public_profile(slug: str, db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT user_numerical, username, full_name, headline, summary, profile_slug, profile_photo_url
            FROM users
            WHERE profile_slug = :s AND user_type = 'professional'
        """),
        {"s": slug},
    )
    profile_row = r.fetchone()
    if not profile_row:
        raise HTTPException(status_code=404, detail="Profile not found")

    uid = profile_row.user_numerical
    education = []
    try:
        re = db.execute(
            text("""
                SELECT e.id, e.institution_id, e.institution_name, e.degree, e.majors_json, e.minors_json,
                       e.start_month, e.end_month, e.status, i.name as institution_display,
                       CASE WHEN i.status IN ('listed', 'placeholder') THEN i.slug ELSE NULL END as institution_slug
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
                "institution_slug": getattr(er, "institution_slug", None) or None,
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
                SELECT eg.id, eg.organisation_id, eg.organisation_name, o.name as org_display,
                       CASE WHEN o.status IN ('listed', 'placeholder') THEN o.slug ELSE NULL END as organisation_slug
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
                "organisation_slug": getattr(eg, "organisation_slug", None) or None,
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
        for ar_row in ar.fetchall():
            additional_responsibilities.append({
                "id": ar_row.id,
                "title": ar_row.title,
                "organisation_name": ar_row.organisation_name,
                "description": ar_row.description,
                "start_month": ar_row.start_month,
                "end_month": ar_row.end_month,
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
        for oa_row in oa.fetchall():
            other_achievements.append({
                "id": oa_row.id,
                "category": oa_row.category,
                "title": oa_row.title,
                "description": oa_row.description,
            })
    except Exception:
        pass

    return {
        "profile": {
            "full_name": profile_row.full_name,
            "headline": profile_row.headline,
            "summary": profile_row.summary,
            "profile_slug": profile_row.profile_slug,
            "profile_photo_url": getattr(profile_row, "profile_photo_url", None),
        },
        "education": education,
        "experience": experience,
        "additional_responsibilities": additional_responsibilities,
        "other_achievements": other_achievements,
    }


@router.get("/institutions/{slug}", summary="Get public institution by slug")
def get_public_institution(slug: str, db=Depends(get_db), viewer=Depends(get_current_user_optional)):
    r = db.execute(
        text("""
            SELECT id, name, slug, status, logo_url, description, website,
                   short_name, institution_type, founded_year, country, state, city, campus_type,
                   linkedin_url, twitter_url, facebook_url, wikipedia_url
            FROM institutions WHERE slug = :s AND status IN ('listed', 'placeholder')
        """),
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

    def _g(attr, default=None):
        return getattr(row, attr, default) if hasattr(row, attr) else default

    linked_community = _linked_community_payload(db, institution_id=row.id, viewer=viewer)

    return {
        "institution": {
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "status": row.status,
            "logo_url": _g("logo_url"),
            "description": _g("description"),
            "website": _g("website"),
            "short_name": _g("short_name"),
            "institution_type": _g("institution_type"),
            "founded_year": _g("founded_year"),
            "country": _g("country"),
            "state": _g("state"),
            "city": _g("city"),
            "campus_type": _g("campus_type"),
            "linkedin_url": _g("linkedin_url"),
            "twitter_url": _g("twitter_url"),
            "facebook_url": _g("facebook_url"),
            "wikipedia_url": _g("wikipedia_url"),
        },
        "alumni_count": alumni_count,
        "current_count": current_count,
        "total_count": current_count + alumni_count,
        "degree_majors": combos,
        "linked_community": linked_community,
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
def get_public_organisation(slug: str, db=Depends(get_db), viewer=Depends(get_current_user_optional)):
    r = db.execute(
        text("""
            SELECT id, name, slug, status, logo_url, description, website,
                   short_name, organisation_type, industry, headquarters, founded_year, company_size,
                   linkedin_url, twitter_url, crunchbase_url
            FROM organisations WHERE slug = :s AND status IN ('listed', 'placeholder')
        """),
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

    def _go(attr, default=None):
        return getattr(row, attr, default) if hasattr(row, attr) else default

    linked_community = _linked_community_payload(db, organisation_id=row.id, viewer=viewer)

    return {
        "organisation": {
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "status": row.status,
            "logo_url": _go("logo_url"),
            "description": _go("description"),
            "website": _go("website"),
            "short_name": _go("short_name"),
            "organisation_type": _go("organisation_type"),
            "industry": _go("industry"),
            "headquarters": _go("headquarters"),
            "founded_year": _go("founded_year"),
            "company_size": _go("company_size"),
            "linkedin_url": _go("linkedin_url"),
            "twitter_url": _go("twitter_url"),
            "crunchbase_url": _go("crunchbase_url"),
        },
        "combos": combos,
        "current_count": current_count,
        "alumni_count": alumni_count,
        "total_count": current_count + alumni_count,
        "linked_community": linked_community,
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
