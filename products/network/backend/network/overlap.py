"""Overlap computation helpers - derive structural overlaps from education/experience."""
import json
from datetime import datetime
from typing import Any

from sqlalchemy import text
from typing import Any

from sqlalchemy import text


def _yyyymm() -> str:
    now = datetime.now()
    return f"{now.year}-{str(now.month).zfill(2)}"


def _parse_majors(majors_json: str | None) -> list[str]:
    if not majors_json:
        return []
    try:
        out = json.loads(majors_json)
        return [m for m in (out or []) if isinstance(m, str) and m.strip()]
    except (json.JSONDecodeError, TypeError):
        return []


def _graduation_year(end_month: str | None) -> str | None:
    if not end_month or len(end_month) < 4:
        return None
    return end_month[:4]


def compute_overlap_reasons(
    db: Any,
    current_user_id: int,
    target_user_id: int,
) -> list[dict[str, Any]]:
    """Compute overlap reasons between current user and target user. Returns list of {type, label}."""
    reasons: list[dict[str, Any]] = []
    yyyymm = _yyyymm()

    # Same institution
    r = db.execute(
        text("""
            SELECT e1.institution_id, e2.institution_id, i.name
            FROM education_entries e1
            JOIN education_entries e2 ON e2.user_id = :tid AND e2.institution_id IS NOT NULL
                AND e1.institution_id = e2.institution_id
            LEFT JOIN institutions i ON i.id = e1.institution_id
            WHERE e1.user_id = :uid AND e1.institution_id IS NOT NULL
            LIMIT 1
        """),
        {"uid": current_user_id, "tid": target_user_id},
    )
    row = r.fetchone()
    if row:
        inst_name = row.name or "same institution"
        reasons.append({"type": "same_institution", "label": f"You both studied at {inst_name}"})

    # Same major (at same or any institution)
    r = db.execute(
        text("""
            SELECT e1.majors_json as m1, e2.majors_json as m2,
                   i1.name as i1_name, i2.name as i2_name
            FROM education_entries e1
            JOIN education_entries e2 ON e2.user_id = :tid
            LEFT JOIN institutions i1 ON i1.id = e1.institution_id
            LEFT JOIN institutions i2 ON i2.id = e2.institution_id
            WHERE e1.user_id = :uid
        """),
        {"uid": current_user_id, "tid": target_user_id},
    )
    for row in r.fetchall():
        m1 = _parse_majors(getattr(row, "m1", None))
        m2 = _parse_majors(getattr(row, "m2", None))
        overlap = [x for x in m1 if x in m2]
        if overlap:
            major = overlap[0]
            inst1 = getattr(row, "i1_name", None) or ""
            inst2 = getattr(row, "i2_name", None) or ""
            if inst1 and inst2 and inst1 == inst2:
                reasons.append({"type": "same_major", "label": f"You both studied {major} at {inst1}"})
            else:
                reasons.append({"type": "same_major", "label": f"You both studied {major}"})
            break

    # Same graduation year
    r = db.execute(
        text("""
            SELECT e1.end_month, e2.end_month
            FROM education_entries e1
            JOIN education_entries e2 ON e2.user_id = :tid AND e2.end_month IS NOT NULL
                AND SUBSTRING(e1.end_month, 1, 4) = SUBSTRING(e2.end_month, 1, 4)
            WHERE e1.user_id = :uid AND e1.end_month IS NOT NULL
            LIMIT 1
        """),
        {"uid": current_user_id, "tid": target_user_id},
    )
    row = r.fetchone()
    if row:
        yr = _graduation_year(row.end_month)
        if yr:
            reasons.append({"type": "same_year", "label": f"Class of {yr}"})

    # Same org (current)
    r = db.execute(
        text("""
            SELECT eg1.organisation_id, eg2.organisation_id, o.name
            FROM experience_groups eg1
            JOIN experience_groups eg2 ON eg2.user_id = :tid AND eg2.organisation_id = eg1.organisation_id
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
                AND (im1.end_month IS NULL OR im1.end_month >= :yyyymm)
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
                AND (im2.end_month IS NULL OR im2.end_month >= :yyyymm)
            LEFT JOIN organisations o ON o.id = eg1.organisation_id
            WHERE eg1.user_id = :uid AND eg1.organisation_id IS NOT NULL
            LIMIT 1
        """),
        {"uid": current_user_id, "tid": target_user_id, "yyyymm": yyyymm},
    )
    row = r.fetchone()
    if row:
        org_name = row.name or "same organisation"
        reasons.append({"type": "same_org", "label": f"You both work at {org_name}"})

    # Previous org
    r = db.execute(
        text("""
            SELECT eg1.organisation_id, o.name
            FROM experience_groups eg1
            JOIN experience_groups eg2 ON eg2.user_id = :tid AND eg2.organisation_id = eg1.organisation_id
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
                AND im1.end_month IS NOT NULL AND im1.end_month < :yyyymm
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
                AND im2.end_month IS NOT NULL AND im2.end_month < :yyyymm
            LEFT JOIN organisations o ON o.id = eg1.organisation_id
            WHERE eg1.user_id = :uid AND eg1.organisation_id IS NOT NULL
            LIMIT 1
        """),
        {"uid": current_user_id, "tid": target_user_id, "yyyymm": yyyymm},
    )
    row = r.fetchone()
    if row:
        org_name = row.name or "same organisation"
        reasons.append({"type": "previous_org", "label": f"You both worked at {org_name}"})

    # Same function
    r = db.execute(
        text("""
            SELECT im1.function
            FROM experience_groups eg1
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
            JOIN experience_groups eg2 ON eg2.user_id = :tid
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
                AND im2.function = im1.function AND im1.function IS NOT NULL AND im1.function != ''
            WHERE eg1.user_id = :uid
            LIMIT 1
        """),
        {"uid": current_user_id, "tid": target_user_id},
    )
    row = r.fetchone()
    if row and row.function:
        reasons.append({"type": "same_function", "label": f"Same function: {row.function}"})

    # Same business unit
    r = db.execute(
        text("""
            SELECT im1.business_unit
            FROM experience_groups eg1
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
            JOIN experience_groups eg2 ON eg2.user_id = :tid
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
                AND im2.business_unit = im1.business_unit AND im1.business_unit IS NOT NULL AND im1.business_unit != ''
            WHERE eg1.user_id = :uid
            LIMIT 1
        """),
        {"uid": current_user_id, "tid": target_user_id},
    )
    row = r.fetchone()
    if row and row.business_unit:
        reasons.append({"type": "same_business_unit", "label": f"Same business unit: {row.business_unit}"})

    # Deduplicate by type (keep first occurrence)
    seen = set()
    deduped = []
    for r in reasons:
        if r["type"] not in seen:
            seen.add(r["type"])
            deduped.append(r)
    return deduped


def count_mutual_connections(db: Any, user_id: int, other_id: int) -> int:
    """Count mutual connections between user_id and other_id."""
    r = db.execute(
        text("""
            WITH my_conns AS (
                SELECT CASE WHEN requester_id = :uid THEN recipient_id ELSE requester_id END as conn_id
                FROM user_connections WHERE (requester_id = :uid OR recipient_id = :uid) AND status = 'accepted'
            ),
            other_conns AS (
                SELECT CASE WHEN requester_id = :oid THEN recipient_id ELSE requester_id END as conn_id
                FROM user_connections WHERE (requester_id = :oid OR recipient_id = :oid) AND status = 'accepted'
            )
            SELECT COUNT(*) as n FROM my_conns m JOIN other_conns o ON m.conn_id = o.conn_id
        """),
        {"uid": user_id, "oid": other_id},
    )
    row = r.fetchone()
    return row.n if row else 0
