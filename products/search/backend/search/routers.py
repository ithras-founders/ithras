"""
Unified platform search — real DB queries across people, communities, posts, channels,
organizations, and institutions. Supports operator tokens (company:, institution:, etc.)
and optional JSON filters. Designed for command-palette / overlay UX.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Any, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import get_current_user
from shared.search.institution_search import search_institutions_ranked

logger = logging.getLogger("ithras")

router = APIRouter(prefix="/api/v1/search", tags=["search"])

# company:"Acme Inc" company:acme institution:"IIM" year:2024 type:question
_OPERATOR_RE = re.compile(
    r'\b(company|institution|function|year|community|degree|major|industry|location|type)'
    r':(?:"([^"]+)"|(\S+))',
    re.IGNORECASE,
)


def _uid(user) -> int:
    return int(getattr(user, "user_numerical", None) or getattr(user, "id", 0))


def parse_search_query(q: str) -> tuple[str, dict[str, str]]:
    """Strip key:value operators from q; return (remaining free text, operators dict)."""
    operators: dict[str, str] = {}

    def _repl(m: re.Match) -> str:
        key = m.group(1).lower()
        val = (m.group(2) or m.group(3) or "").strip()
        if val:
            operators[key] = val
        return " "

    cleaned = _OPERATOR_RE.sub(_repl, q or "")
    free = " ".join(cleaned.split())
    return free, operators


def _community_visibility_sql(uid: int | None) -> tuple[str, dict[str, Any]]:
    """SQL fragment for communities c — same rules as feed list_communities."""
    if not uid:
        return (
            "((c.type != 'institution' OR c.institution_id IS NULL) "
            "AND (c.type != 'organisation' OR c.organisation_id IS NULL))",
            {},
        )
    return (
        "("
        "((c.type != 'institution' OR c.institution_id IS NULL) "
        "OR EXISTS (SELECT 1 FROM education_entries e WHERE e.user_id = :uid_vis AND e.institution_id = c.institution_id))"
        " AND "
        "((c.type != 'organisation' OR c.organisation_id IS NULL) "
        "OR EXISTS (SELECT 1 FROM experience_groups eg WHERE eg.user_id = :uid_vis AND eg.organisation_id = c.organisation_id))"
        ")",
        {"uid_vis": uid},
    )


def _post_access_sql(uid: int) -> str:
    """User can see post if member of community (matches global feed semantics)."""
    return (
        "EXISTS (SELECT 1 FROM community_members cm "
        "WHERE cm.community_id = p.community_id AND cm.user_id = :uid_mem)"
    )


def _people_conditions(
    free_text: str,
    f: dict[str, str],
    params: dict[str, Any],
) -> tuple[list[str], dict[str, Any]]:
    cond = [
        "u.user_type = 'professional'",
        "COALESCE(u.account_status, 'approved') = 'approved'",
        "u.user_numerical != :uid_self",
        "u.profile_slug IS NOT NULL",
        "u.profile_slug != ''",
    ]
    if free_text:
        cond.append(
            "(u.full_name ILIKE :pq OR u.username ILIKE :pq OR u.profile_slug ILIKE :pq)"
        )
        params["pq"] = f"%{free_text}%"
    if f.get("company"):
        cond.append(
            "EXISTS (SELECT 1 FROM experience_groups eg "
            "LEFT JOIN organisations o ON o.id = eg.organisation_id "
            "WHERE eg.user_id = u.user_numerical "
            "AND (o.name ILIKE :pf_co OR eg.organisation_name ILIKE :pf_co))"
        )
        params["pf_co"] = f"%{f['company']}%"
    if f.get("institution"):
        cond.append(
            "EXISTS (SELECT 1 FROM education_entries e "
            "LEFT JOIN institutions i ON i.id = e.institution_id "
            "WHERE e.user_id = u.user_numerical AND (i.name ILIKE :pf_in "
            "OR COALESCE(i.short_name,'') ILIKE :pf_in))"
        )
        params["pf_in"] = f"%{f['institution']}%"
    if f.get("function"):
        cond.append(
            "EXISTS (SELECT 1 FROM experience_groups eg "
            "JOIN internal_movements im ON im.experience_group_id = eg.id "
            "WHERE eg.user_id = u.user_numerical AND im.function ILIKE :pf_fn)"
        )
        params["pf_fn"] = f"%{f['function']}%"
    if f.get("degree"):
        cond.append(
            "EXISTS (SELECT 1 FROM education_entries e "
            "WHERE e.user_id = u.user_numerical AND e.degree ILIKE :pf_deg)"
        )
        params["pf_deg"] = f"%{f['degree']}%"
    if f.get("major"):
        cond.append(
            "EXISTS (SELECT 1 FROM education_entries e "
            "WHERE e.user_id = u.user_numerical AND CAST(e.majors_json AS TEXT) ILIKE :pf_maj)"
        )
        params["pf_maj"] = f"%{f['major']}%"
    if f.get("year"):
        cond.append(
            "EXISTS (SELECT 1 FROM education_entries e "
            "WHERE e.user_id = u.user_numerical AND e.end_month LIKE :pf_yr)"
        )
        params["pf_yr"] = f"{f['year']}%"
    return cond, params


def search_people(db, uid: int, free_text: str, f: dict[str, str], limit: int, offset: int = 0) -> tuple[list[dict], int]:
    from messaging.helpers import user_summary, get_relationship_type, get_overlap_context

    filter_keys = ("company", "institution", "function", "degree", "major", "year")
    if not free_text.strip() and not any(f.get(k) for k in filter_keys):
        return [], 0

    params: dict[str, Any] = {"uid_self": uid, "lim": limit, "off": max(0, offset)}
    cond, params = _people_conditions(free_text, f, params)
    where = " AND ".join(cond)
    count_row = db.execute(
        text(f"SELECT COUNT(*) AS n FROM users u WHERE {where}"),
        params,
    ).fetchone()
    total = int(count_row.n) if count_row else 0
    rows = db.execute(
        text(
            f"SELECT u.user_numerical FROM users u WHERE {where} "
            "ORDER BY u.full_name NULLS LAST LIMIT :lim OFFSET :off"
        ),
        params,
    ).fetchall()
    items = []
    for row in rows:
        oid = row.user_numerical
        s = user_summary(db, oid)
        if not s:
            continue
        rel = get_relationship_type(db, uid, oid)
        overlap = get_overlap_context(db, uid, oid)
        mutual_conn = 1 if rel == "connection" else 0
        mutual_communities = sum(1 for x in (overlap or []) if x.get("type") == "community")
        items.append(
            {
                **s,
                "relationship_type": rel,
                "overlap_context": overlap or [],
                "mutual_connections": mutual_conn,
                "mutual_communities": mutual_communities,
                "href": f"/p/{s.get('profile_slug') or ''}",
            }
        )
    return items, total


def search_communities(db, uid: int, free_text: str, f: dict[str, str], limit: int, offset: int = 0) -> tuple[list[dict], int]:
    if not free_text.strip() and not any(f.get(k) for k in ("type", "community", "institution")):
        return [], 0

    vis, vis_params = _community_visibility_sql(uid if uid else None)
    cond = ["c.status = 'listed'", vis]
    params: dict[str, Any] = {**vis_params, "lim": limit, "off": max(0, offset)}
    if uid:
        params["uid"] = uid
    if free_text:
        cond.append("(c.name ILIKE :cq OR c.description ILIKE :cq)")
        params["cq"] = f"%{free_text}%"
    if f.get("type"):
        cond.append("c.type = :ctype")
        params["ctype"] = f["type"].lower()
    if f.get("community"):
        cond.append("c.name ILIKE :cname")
        params["cname"] = f"%{f['community']}%"
    if f.get("institution"):
        cond.append(
            "(i.name ILIKE :cinst OR COALESCE(i.short_name,'') ILIKE :cinst)"
        )
        params["cinst"] = f"%{f['institution']}%"
    where = " AND ".join(cond)
    member_join = (
        "LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = :uid"
        if uid
        else ""
    )
    is_member = "cm.user_id IS NOT NULL" if uid else "false"
    sql = f"""
        SELECT c.id, c.name, c.slug, c.type, c.description, c.member_count,
               c.logo_url, c.institution_id, c.organisation_id,
               i.slug AS institution_page_slug, o.slug AS organisation_page_slug,
               ({is_member}) AS is_member
        FROM communities c
        LEFT JOIN institutions i ON i.id = c.institution_id
        LEFT JOIN organisations o ON o.id = c.organisation_id
        {member_join}
        WHERE {where}
        ORDER BY c.member_count DESC NULLS LAST, c.name
        LIMIT :lim OFFSET :off
    """
    rows = db.execute(text(sql), params).fetchall()
    count_params = {k: v for k, v in params.items() if k not in ("lim", "off")}
    total_row = db.execute(
        text(
            f"SELECT COUNT(*) AS n FROM communities c "
            f"LEFT JOIN institutions i ON i.id = c.institution_id "
            f"LEFT JOIN organisations o ON o.id = c.organisation_id WHERE {where}"
        ),
        count_params,
    ).fetchone()
    total = int(total_row.n) if total_row else 0
    def _community_search_href(r) -> str:
        inst_slug = getattr(r, "institution_page_slug", None)
        org_slug = getattr(r, "organisation_page_slug", None)
        if getattr(r, "institution_id", None) and inst_slug:
            return f"/i/{inst_slug}"
        if getattr(r, "organisation_id", None) and org_slug:
            return f"/o/{org_slug}"
        return f"/feed/c/{r.slug}"

    items = [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "type": r.type,
            "description": (r.description or "")[:280],
            "member_count": r.member_count or 0,
            "logo_url": r.logo_url,
            "is_member": bool(getattr(r, "is_member", False)),
            "href": _community_search_href(r),
            "community_feed_href": f"/feed/c/{r.slug}",
        }
        for r in rows
    ]
    return items, total


def search_channels(db, uid: int, free_text: str, limit: int, offset: int = 0) -> tuple[list[dict], int]:
    if not free_text or len(free_text) < 1:
        return [], 0
    vis, vis_params = _community_visibility_sql(uid if uid else None)
    params = {**vis_params, "q": f"%{free_text}%", "lim": limit, "off": max(0, offset)}
    if uid:
        params["uid"] = uid
    member_join = (
        "LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = :uid"
        if uid
        else ""
    )
    where = f"ch.community_id = c.id AND c.status = 'listed' AND {vis} AND (ch.name ILIKE :q OR ch.description ILIKE :q)"
    sql = f"""
        SELECT ch.id, ch.name, ch.slug, ch.description, c.id AS community_id, c.name AS community_name, c.slug AS community_slug
        FROM channels ch
        JOIN communities c ON c.id = ch.community_id
        {member_join}
        WHERE {where}
        ORDER BY ch.name
        LIMIT :lim OFFSET :off
    """
    rows = db.execute(text(sql), params).fetchall()
    cp = {k: v for k, v in params.items() if k not in ("lim", "off")}
    total_row = db.execute(
        text(
            f"""
            SELECT COUNT(*) AS n FROM channels ch
            JOIN communities c ON c.id = ch.community_id
            {member_join}
            WHERE {where}
            """
        ),
        cp,
    ).fetchone()
    total = int(total_row.n) if total_row else 0
    items = [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": (r.description or "")[:160],
            "community_id": r.community_id,
            "community_name": r.community_name,
            "community_slug": r.community_slug,
            "href": f"/feed/c/{r.community_slug}/ch/{r.slug}",
        }
        for r in rows
    ]
    return items, total


def search_posts(db, uid: int, free_text: str, f: dict[str, str], limit: int, offset: int = 0) -> tuple[list[dict], int]:
    if not uid:
        return [], 0
    if not free_text.strip() and not f.get("type") and not f.get("community"):
        return [], 0
    vis, vis_params = _community_visibility_sql(uid)
    params: dict[str, Any] = {**vis_params, "uid_mem": uid, "lim": limit, "off": max(0, offset)}
    cond = [
        "p.moderation_status = 'active'",
        vis,
        _post_access_sql(uid),
    ]
    if free_text:
        cond.append("(p.title ILIKE :pq OR p.content ILIKE :pq)")
        params["pq"] = f"%{free_text}%"
    if f.get("type"):
        cond.append("p.type = :ptype")
        params["ptype"] = f["type"].lower()
    if f.get("community"):
        cond.append("c.name ILIKE :pccomm")
        params["pccomm"] = f"%{f['community']}%"
    where = " AND ".join(cond)
    useful_join = (
        "LEFT JOIN (SELECT post_id, COUNT(*)::int AS useful_cnt FROM post_useful GROUP BY post_id) pu ON pu.post_id = p.id"
    )
    sql = f"""
        SELECT p.id, p.type, p.title, p.content, p.comment_count,
               COALESCE(pu.useful_cnt, 0) AS useful_count,
               u.full_name AS author_name, c.name AS community_name, c.slug AS community_slug,
               ch.name AS channel_name, ch.slug AS channel_slug
        FROM posts p
        JOIN users u ON u.user_numerical = p.author_id
        JOIN communities c ON c.id = p.community_id
        LEFT JOIN channels ch ON ch.id = p.channel_id
        {useful_join}
        WHERE {where}
        ORDER BY p.created_at DESC
        LIMIT :lim OFFSET :off
    """
    rows = db.execute(text(sql), params).fetchall()
    cp = {k: v for k, v in params.items() if k not in ("lim", "off")}
    total_row = db.execute(
        text(
            f"""
            SELECT COUNT(*) AS n FROM posts p
            JOIN communities c ON c.id = p.community_id
            {useful_join}
            WHERE {where}
            """
        ),
        cp,
    ).fetchone()
    total = int(total_row.n) if total_row else 0
    items = []
    for r in rows:
        snippet = (r.content or "")[:200].replace("\n", " ")
        if r.title:
            snippet = (r.title + " — " + snippet).strip(" —")
        items.append(
            {
                "id": r.id,
                "type": r.type,
                "title": r.title or "",
                "snippet": snippet,
                "author_name": r.author_name or "",
                "community_name": r.community_name or "",
                "community_slug": r.community_slug or "",
                "channel_name": r.channel_name or "",
                "channel_slug": r.channel_slug or "",
                "comment_count": r.comment_count or 0,
                "useful_count": int(r.useful_count or 0),
                "href": f"/feed/c/{r.community_slug}"
                + (f"/ch/{r.channel_slug}" if r.channel_slug else ""),
            }
        )
    return items, total


def search_organisations(db, free_text: str, limit: int, offset: int = 0) -> tuple[list[dict], int]:
    if not free_text or len(free_text.strip()) < 1:
        return [], 0
    term = f"%{free_text.strip().lower()}%"
    params = {"t": term, "lim": limit, "off": max(0, offset)}
    cond = [
        "status = 'listed'",
        "("
        "LOWER(name) LIKE :t OR LOWER(slug) LIKE :t OR "
        "LOWER(COALESCE(short_name,'')) LIKE :t OR "
        "LOWER(COALESCE(headquarters,'')) LIKE :t OR "
        "LOWER(COALESCE(industry,'')) LIKE :t"
        ")",
    ]
    if free_text and len(free_text) > 1:
        pass
    where = " AND ".join(cond)
    rows = db.execute(
        text(
            f"SELECT id, name, slug, logo_url FROM organisations WHERE {where} ORDER BY name LIMIT :lim OFFSET :off"
        ),
        params,
    ).fetchall()
    total_row = db.execute(
        text(f"SELECT COUNT(*) AS n FROM organisations WHERE {where}"),
        {k: v for k, v in params.items() if k not in ("lim", "off")},
    ).fetchone()
    total = int(total_row.n) if total_row else 0
    items = [
        {
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "logo_url": getattr(r, "logo_url", None),
            "href": f"/o/{r.slug}",
        }
        for r in rows
    ]
    return items, total


def search_institutions(
    db, free_text: str, limit: int, offset: int = 0, user_id: int | None = None
) -> tuple[list[dict], int]:
    return search_institutions_ranked(db, free_text, limit, offset, user_id=user_id)


def _merge_filters(operators: dict[str, str], filters_json: Optional[str]) -> dict[str, str]:
    out = dict(operators)
    if filters_json:
        try:
            extra = json.loads(filters_json)
            if isinstance(extra, dict):
                for k, v in extra.items():
                    if v is not None and v != "":
                        out[str(k).lower()] = str(v)
        except (json.JSONDecodeError, TypeError):
            pass
    return out


@router.get("", summary="Unified search (grouped by entity)")
def unified_search(
    user=Depends(get_current_user),
    db=Depends(get_db),
    q: str = Query("", description="Search text; supports operators like company:google institution:iim"),
    mode: str = Query(
        "all",
        description="all | people | posts | communities | channels | organizations | institutions",
    ),
    limit: int = Query(8, ge=1, le=40),
    offset: int = Query(0, ge=0, le=10_000, description="Pagination offset (single-entity modes only; ignored for mode=all)"),
    filters: Optional[str] = Query(None, description="JSON object of extra filters"),
):
    uid = _uid(user)
    free, operators = parse_search_query(q)
    f = _merge_filters(operators, filters)
    mode_l = (mode or "all").lower()

    per = limit
    off = offset if mode_l != "all" else 0
    out: dict[str, Any] = {
        "parsed": {"text": free, "operators": operators, "filters": f},
        "mode": mode_l,
    }

    def run_all():
        ppl, ppl_t = search_people(db, uid, free, f, per, 0) if uid else ([], 0)
        comm, comm_t = search_communities(db, uid, free, f, per, 0)
        ch, ch_t = search_channels(db, uid, free, per, 0)
        po, po_t = search_posts(db, uid, free, f, per, 0)
        org, org_t = search_organisations(db, free, per, 0)
        ins, ins_t = search_institutions(db, free, per, 0, user_id=uid or None)
        page_hrefs = {x["href"] for x in org} | {x["href"] for x in ins}
        comm_deduped = [c for c in comm if c["href"] not in page_hrefs]
        out["people"] = {"items": ppl, "total": ppl_t}
        out["communities"] = {"items": comm_deduped, "total": comm_t}
        out["channels"] = {"items": ch, "total": ch_t}
        out["posts"] = {"items": po, "total": po_t}
        out["organizations"] = {"items": org, "total": org_t}
        out["institutions"] = {"items": ins, "total": ins_t}
        out["messages"] = {"items": [], "total": 0, "extension": "planned"}
        out["events"] = {"items": [], "total": 0, "extension": "planned"}
        out["resources"] = {"items": [], "total": 0, "extension": "planned"}

    if mode_l == "all":
        run_all()
    elif mode_l == "people":
        items, total = search_people(db, uid, free, f, per, off)
        out["people"] = {"items": items, "total": total}
    elif mode_l == "communities":
        items, total = search_communities(db, uid, free, f, per, off)
        out["communities"] = {"items": items, "total": total}
    elif mode_l == "channels":
        items, total = search_channels(db, uid, free, per, off)
        out["channels"] = {"items": items, "total": total}
    elif mode_l == "posts":
        items, total = search_posts(db, uid, free, f, per, off)
        out["posts"] = {"items": items, "total": total}
    elif mode_l in ("organizations", "organisations"):
        items, total = search_organisations(db, free, per, off)
        out["organizations"] = {"items": items, "total": total}
    elif mode_l == "institutions":
        items, total = search_institutions(db, free, per, off, user_id=uid or None)
        out["institutions"] = {"items": items, "total": total}
    else:
        run_all()

    try:
        from shared.telemetry.emitters.search_emitter import track_search_performed

        track_search_performed(db, "unified", q[:200], 1, uid)
    except Exception:
        pass

    return out


@router.get("/suggest", summary="Lightweight mixed suggestions for autocomplete")
def search_suggest(
    user=Depends(get_current_user),
    db=Depends(get_db),
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=20),
):
    uid = _uid(user)
    free, operators = parse_search_query(q)
    text_q = free or q
    f = operators
    suggestions: list[dict[str, Any]] = []

    seen_href: set[str] = set()

    def _push_s(s: dict[str, Any]) -> None:
        h = s.get("href") or ""
        if not h or h in seen_href:
            return
        seen_href.add(h)
        suggestions.append(s)

    inst, _ = search_institutions(db, text_q, 4, user_id=uid or None)
    for x in inst:
        _push_s(
            {
                "kind": "institution",
                "id": x["id"],
                "label": x["name"],
                "subtitle": "Institution",
                "href": x["href"],
            }
        )
    org, _ = search_organisations(db, text_q, 4)
    for x in org:
        _push_s(
            {
                "kind": "organization",
                "id": x["id"],
                "label": x["name"],
                "subtitle": "Organization",
                "href": x["href"],
            }
        )
    comm, _ = search_communities(db, uid, text_q, f, 6)
    for x in comm:
        href = x["href"]
        if href.startswith("/i/"):
            sub = "Institution · Community"
            kind = "institution"
        elif href.startswith("/o/"):
            sub = "Organization · Community"
            kind = "organization"
        else:
            sub = f"Community · {x.get('type') or ''}".strip()
            kind = "community"
        _push_s(
            {
                "kind": kind,
                "id": x["id"],
                "label": x["name"],
                "subtitle": sub,
                "href": href,
            }
        )
    if uid:
        ppl, _ = search_people(db, uid, text_q, f, 5)
        for x in ppl:
            _push_s(
                {
                    "kind": "person",
                    "id": x["id"],
                    "label": x.get("full_name") or "",
                    "subtitle": x.get("headline") or x.get("current_org") or "Profile",
                    "href": x["href"],
                }
            )

    return {"suggestions": suggestions[:limit], "parsed": {"text": free, "operators": operators}}

