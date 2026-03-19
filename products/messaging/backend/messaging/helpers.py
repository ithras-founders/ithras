"""Helpers for messaging - user summary, relationship type, priority."""
import json
from datetime import datetime
from typing import Any

from sqlalchemy import text


def _yyyymm() -> str:
    now = datetime.now()
    return f"{now.year}-{str(now.month).zfill(2)}"


def user_summary(db: Any, user_id: int) -> dict | None:
    """Get minimal user summary for messaging."""
    r = db.execute(
        text("""
            SELECT u.user_numerical, u.full_name, u.profile_slug, u.headline
            FROM users u
            WHERE u.user_numerical = :uid AND u.user_type = 'professional'
        """),
        {"uid": user_id},
    )
    row = r.fetchone()
    if not row:
        return None
    r2 = db.execute(
        text("""
            SELECT o.name FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
                AND (im.end_month IS NULL OR im.end_month >= :yyyymm)
            LEFT JOIN organisations o ON o.id = eg.organisation_id
            WHERE eg.user_id = :uid
            ORDER BY im.start_month DESC
            LIMIT 1
        """),
        {"uid": user_id, "yyyymm": _yyyymm()},
    )
    ro = r2.fetchone()
    r3 = db.execute(
        text("""
            SELECT i.name as inst_name, e.majors_json, e.end_month
            FROM education_entries e
            LEFT JOIN institutions i ON i.id = e.institution_id
            WHERE e.user_id = :uid
            ORDER BY e.end_month DESC NULLS FIRST
            LIMIT 1
        """),
        {"uid": user_id},
    )
    re = r3.fetchone()
    majors = []
    if re and re.majors_json:
        try:
            majors = json.loads(re.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
    r4 = db.execute(
        text("""
            SELECT im.function FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
                AND (im.end_month IS NULL OR im.end_month >= :yyyymm)
            WHERE eg.user_id = :uid
            ORDER BY im.start_month DESC
            LIMIT 1
        """),
        {"uid": user_id, "yyyymm": _yyyymm()},
    )
    rf = r4.fetchone()
    return {
        "id": row.user_numerical,
        "full_name": row.full_name or "",
        "profile_slug": row.profile_slug or "",
        "headline": row.headline,
        "current_org": ro.name if ro else None,
        "institution_name": re.inst_name if re else None,
        "major": majors[0] if majors else None,
        "graduation_year": re.end_month[:4] if (re and re.end_month and len(re.end_month) >= 4) else None,
        "function": rf.function if rf and rf.function else None,
    }


def get_relationship_type(db: Any, current_user_id: int, other_user_id: int) -> str:
    """Return: connection | following | follower | other."""
    # Connection (mutual)
    r = db.execute(
        text("""
            SELECT 1 FROM user_connections
            WHERE status = 'accepted' AND (requester_id = :uid AND recipient_id = :oid OR requester_id = :oid AND recipient_id = :uid)
        """),
        {"uid": current_user_id, "oid": other_user_id},
    )
    if r.fetchone():
        return "connection"
    # I follow them
    r = db.execute(
        text("SELECT 1 FROM user_follows WHERE follower_id = :uid AND following_id = :oid"),
        {"uid": current_user_id, "oid": other_user_id},
    )
    if r.fetchone():
        return "following"
    # They follow me
    r = db.execute(
        text("SELECT 1 FROM user_follows WHERE follower_id = :oid AND following_id = :uid"),
        {"uid": current_user_id, "oid": other_user_id},
    )
    if r.fetchone():
        return "follower"
    return "other"


def get_overlap_context(db: Any, current_user_id: int, other_user_id: int) -> list[dict]:
    """Get overlap reasons for relationship context."""
    try:
        from network.overlap import compute_overlap_reasons

        return compute_overlap_reasons(db, current_user_id, other_user_id)
    except ImportError:
        return []
