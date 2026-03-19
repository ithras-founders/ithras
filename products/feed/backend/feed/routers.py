"""Feed API - communities, channels, posts, comments, reactions."""
import json
import logging
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import get_current_user

router = APIRouter(prefix="/api/v1/feed", tags=["feed"])


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "n-a"


def _user_id(user) -> int:
    return int(getattr(user, "user_numerical", None) or getattr(user, "id", 0))


# ─── Pydantic models ────────────────────────────────────────────────────────
class PostCreate(BaseModel):
    community_id: int
    channel_id: Optional[int] = None
    type: str = "discussion"
    title: Optional[str] = None
    content: str = ""
    tags: Optional[list[str]] = None


class CommentCreate(BaseModel):
    content: str


class CommunityRequestCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    purpose: Optional[str] = None
    rules: Optional[list[str]] = None


# ─── Communities ─────────────────────────────────────────────────────────────
@router.get("/communities", summary="List communities")
def list_communities(
    user=Depends(get_current_user),
    db=Depends(get_db),
    type_filter: Optional[str] = Query(None, alias="type"),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List communities with optional type and search filter.
    Institutional communities: only visible to current or alumni of that institution.
    Organisational communities: only visible to current or former employees of that organisation.
    Public and function communities: visible to all."""
    conditions = ["c.status = 'listed'"]
    params = {"lim": limit, "off": offset}
    uid = _user_id(user)
    if uid:
        params["uid"] = uid
    if type_filter:
        conditions.append("c.type = :typ")
        params["typ"] = type_filter
    if search:
        conditions.append("(c.name ILIKE :q OR c.description ILIKE :q)")
        params["q"] = f"%{search}%"

    # Restrict institution communities to users with education at that institution
    # Restrict organisation communities to users with experience at that organisation
    if uid:
        conditions.append("""
            (
                (c.type != 'institution' OR c.institution_id IS NULL)
                OR EXISTS (SELECT 1 FROM education_entries e WHERE e.user_id = :uid AND e.institution_id = c.institution_id)
            )
            AND (
                (c.type != 'organisation' OR c.organisation_id IS NULL)
                OR EXISTS (SELECT 1 FROM experience_groups eg WHERE eg.user_id = :uid AND eg.organisation_id = c.organisation_id)
            )
        """)

    where = " AND ".join(conditions)
    member_join = "LEFT JOIN community_members cm ON cm.community_id = c.id AND cm.user_id = :uid" if uid else ""
    is_member_expr = "cm.user_id IS NOT NULL" if uid else "false"

    r = db.execute(
        text(f"""
            SELECT c.id, c.name, c.slug, c.type, c.description, c.has_channels,
                   c.institution_id, c.organisation_id, c.function_key,
                   c.logo_url, c.cover_image_url, c.member_count, c.created_at,
                   i.name as institution_name,
                   o.name as organisation_name,
                   ({is_member_expr}) as is_member
            FROM communities c
            LEFT JOIN institutions i ON i.id = c.institution_id
            LEFT JOIN organisations o ON o.id = c.organisation_id
            {member_join}
            WHERE {where}
            ORDER BY c.member_count DESC, c.name
            LIMIT :lim OFFSET :off
        """),
        params,
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        items.append({
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "type": row.type,
            "description": row.description or "",
            "has_channels": row.has_channels or False,
            "institution_id": row.institution_id,
            "organisation_id": row.organisation_id,
            "function_key": row.function_key,
            "logo_url": row.logo_url,
            "cover_image_url": row.cover_image_url,
            "member_count": row.member_count or 0,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "institution_name": row.institution_name,
            "organisation_name": row.organisation_name,
            "is_member": getattr(row, "is_member", False),
        })

    count_params = {k: v for k, v in params.items() if k not in ("lim", "off")}
    count_row = db.execute(
        text(f"SELECT COUNT(*) as n FROM communities c WHERE {where}"),
        count_params,
    ).fetchone()
    total = count_row.n if count_row else 0

    return {"items": items, "total": total}


@router.get("/communities/me", summary="User's joined and followed communities")
def get_my_communities(user=Depends(get_current_user), db=Depends(get_db)):
    """Return communities the user has joined or followed."""
    uid = _user_id(user)
    r = db.execute(
        text("""
            SELECT c.id, c.name, c.slug, c.type, c.description, c.has_channels,
                   c.logo_url, c.member_count, cm.role
            FROM community_members cm
            JOIN communities c ON c.id = cm.community_id AND c.status = 'listed'
            WHERE cm.user_id = :uid
            ORDER BY c.name
        """),
        {"uid": uid},
    )
    items = []
    for row in r.fetchall():
        items.append({
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "type": row.type,
            "description": row.description or "",
            "has_channels": row.has_channels or False,
            "logo_url": row.logo_url,
            "member_count": row.member_count or 0,
            "role": row.role or "member",
        })
    return {"items": items, "total": len(items)}


def _user_can_see_community(uid: int, row, db) -> bool:
    """Check if user can see an institution/org-scoped community (current or alumni)."""
    if not uid:
        return row.type not in ("institution", "organisation") or (row.institution_id is None and row.organisation_id is None)
    if row.type == "institution" and row.institution_id:
        r = db.execute(
            text("SELECT 1 FROM education_entries WHERE user_id = :uid AND institution_id = :iid"),
            {"uid": uid, "iid": row.institution_id},
        )
        if not r.fetchone():
            return False
    if row.type == "organisation" and row.organisation_id:
        r = db.execute(
            text("SELECT 1 FROM experience_groups WHERE user_id = :uid AND organisation_id = :oid"),
            {"uid": uid, "oid": row.organisation_id},
        )
        if not r.fetchone():
            return False
    return True


def _get_community_response(community_id: int, user, db):
    """Internal helper to build community response."""
    r = db.execute(
        text("""
            SELECT c.id, c.name, c.slug, c.type, c.description, c.has_channels,
                   c.institution_id, c.organisation_id, c.function_key,
                   c.logo_url, c.cover_image_url, c.member_count, c.status, c.created_at,
                   c.rules,
                   i.name as institution_name,
                   o.name as organisation_name
            FROM communities c
            LEFT JOIN institutions i ON i.id = c.institution_id
            LEFT JOIN organisations o ON o.id = c.organisation_id
            WHERE c.id = :cid
        """),
        {"cid": community_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Community not found")
    uid = _user_id(user)
    if not _user_can_see_community(uid, row, db):
        raise HTTPException(status_code=404, detail="Community not found")

    channels = []
    if row.has_channels:
        ch_rows = db.execute(
            text("SELECT id, name, slug, description FROM channels WHERE community_id = :cid ORDER BY name"),
            {"cid": community_id},
        ).fetchall()
        channels = [{"id": r.id, "name": r.name, "slug": r.slug, "description": r.description or ""} for r in ch_rows]

    uid = _user_id(user)
    is_member = False
    if uid:
        m = db.execute(
            text("SELECT 1 FROM community_members WHERE community_id = :cid AND user_id = :uid"),
            {"cid": community_id, "uid": uid},
        ).fetchone()
        is_member = bool(m)

    return {
        "id": row.id,
        "name": row.name,
        "slug": row.slug,
        "type": row.type,
        "description": row.description or "",
        "has_channels": row.has_channels or False,
        "institution_id": row.institution_id,
        "organisation_id": row.organisation_id,
        "function_key": row.function_key,
        "logo_url": row.logo_url,
        "cover_image_url": row.cover_image_url,
        "member_count": row.member_count or 0,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "institution_name": row.institution_name,
        "organisation_name": row.organisation_name,
        "channels": channels,
        "is_member": is_member,
        "rules": getattr(row, "rules", None) or "",
    }


@router.get("/communities/by-slug/{slug}", summary="Get community by slug")
def get_community_by_slug(slug: str, user=Depends(get_current_user), db=Depends(get_db)):
    """Get community by slug."""
    r = db.execute(text("SELECT id FROM communities WHERE slug = :slug"), {"slug": slug})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Community not found")
    return _get_community_response(row.id, user, db)


@router.get("/communities/{community_id}", summary="Get community")
def get_community(community_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Get community by id with channels if any."""
    return _get_community_response(community_id, user, db)


@router.get("/communities/{community_id}/channels", summary="List channels")
def list_channels(community_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """List channels for a community."""
    uid = _user_id(user)
    r = db.execute(
        text("SELECT id, type, institution_id, organisation_id FROM communities WHERE id = :cid"),
        {"cid": community_id},
    )
    crow = r.fetchone()
    if not crow:
        raise HTTPException(status_code=404, detail="Community not found")
    if not _user_can_see_community(uid, crow, db):
        raise HTTPException(status_code=404, detail="Community not found")
    r = db.execute(
        text("SELECT id, name, slug, description FROM channels WHERE community_id = :cid ORDER BY name"),
        {"cid": community_id},
    )
    rows = r.fetchall()
    return {"items": [{"id": r.id, "name": r.name, "slug": r.slug, "description": r.description or ""} for r in rows], "total": len(rows)}


@router.post("/communities/{community_id}/join", summary="Join community")
def join_community(community_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Join a community. Institutional/org communities require user to be current or alumni."""
    uid = _user_id(user)
    r = db.execute(
        text("SELECT id, type, institution_id, organisation_id FROM communities WHERE id = :cid"),
        {"cid": community_id},
    )
    crow = r.fetchone()
    if not crow:
        raise HTTPException(status_code=404, detail="Community not found")
    if not _user_can_see_community(uid, crow, db):
        raise HTTPException(status_code=403, detail="You must be a current or former member of this institution or organisation to join.")
    r = db.execute(
        text("""
            INSERT INTO community_members (community_id, user_id, role)
            VALUES (:cid, :uid, 'member')
            ON CONFLICT (community_id, user_id) DO NOTHING
            RETURNING id
        """),
        {"cid": community_id, "uid": uid},
    )
    row = r.fetchone()
    db.execute(
        text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"),
        {"cid": community_id},
    )
    db.commit()
    if row:
        try:
            from shared.telemetry.emitters.community_emitter import track_community_joined
            track_community_joined(db, uid, community_id)
        except Exception as e:
            logging.getLogger(__name__).warning("Community join telemetry tracking failed: %s", e)
    return {"ok": True}


@router.post("/communities/{community_id}/leave", summary="Leave community")
def leave_community(community_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Leave a community."""
    uid = _user_id(user)
    db.execute(
        text("DELETE FROM community_members WHERE community_id = :cid AND user_id = :uid"),
        {"cid": community_id, "uid": uid},
    )
    db.execute(
        text("UPDATE communities SET member_count = GREATEST(0, (SELECT COUNT(*) FROM community_members WHERE community_id = :cid)) WHERE id = :cid"),
        {"cid": community_id},
    )
    db.commit()
    return {"ok": True}


@router.post("/communities/requests", summary="Request new public community")
def request_community(data: CommunityRequestCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Request creation of a new public community. Admin approval required."""
    uid = _user_id(user)
    rules_json = json.dumps(data.rules or [])
    db.execute(
        text("""
            INSERT INTO community_requests (user_id, name, description, category, purpose, rules_json, status)
            VALUES (:uid, :name, :desc, :cat, :purpose, :rules, 'pending')
        """),
        {"uid": uid, "name": data.name, "desc": data.description or "", "cat": data.category or "", "purpose": data.purpose or "", "rules": rules_json},
    )
    db.commit()
    return {"ok": True}


# ─── Feed endpoints ──────────────────────────────────────────────────────────
ALLOWED_REACTION_TYPES = {"upvote", "love", "insightful", "celebrate"}


def _post_row_to_dict(row, author_name=None):
    tags = []
    try:
        tags = json.loads(row.tags_json or "[]")
    except (json.JSONDecodeError, TypeError):
        pass
    attachments = []
    try:
        attachments = json.loads(row.attachments_json or "[]")
    except (json.JSONDecodeError, TypeError):
        pass
    is_pinned = getattr(row, "is_pinned", False) or False
    return {
        "id": row.id,
        "author_id": row.author_id,
        "author_name": author_name or "",
        "community_id": row.community_id,
        "channel_id": row.channel_id,
        "type": row.type or "discussion",
        "title": row.title or "",
        "content": row.content or "",
        "tags": tags,
        "attachments": attachments,
        "comment_count": row.comment_count or 0,
        "reaction_count": row.reaction_count or 0,
        "reaction_counts": {"upvote": 0, "love": 0, "insightful": 0, "celebrate": 0},
        "user_reactions": [],
        "save_count": row.save_count or 0,
        "view_count": row.view_count or 0,
        "moderation_status": row.moderation_status or "active",
        "is_pinned": is_pinned,
        "pinned_at": (row.pinned_at.isoformat() + "Z") if getattr(row, "pinned_at", None) else None,
        "created_at": (row.created_at.isoformat() + "Z") if row.created_at else None,
        "updated_at": (row.updated_at.isoformat() + "Z") if row.updated_at else None,
    }


def _batch_attach_reactions(db, items, uid=None):
    """Attach per-type reaction_counts and user_reactions to each item dict in-place."""
    if not items:
        return items
    post_ids = [item["id"] for item in items]
    id_map = {item["id"]: item for item in items}
    in_clause = ",".join(str(int(pid)) for pid in post_ids)

    r = db.execute(
        text(f"SELECT post_id, type, COUNT(*) as cnt FROM post_reactions WHERE post_id IN ({in_clause}) GROUP BY post_id, type")
    )
    for row in r.fetchall():
        if row.post_id in id_map and row.type in ALLOWED_REACTION_TYPES:
            id_map[row.post_id]["reaction_counts"][row.type] = int(row.cnt)

    if uid:
        r = db.execute(
            text(f"SELECT post_id, type FROM post_reactions WHERE post_id IN ({in_clause}) AND user_id = :uid"),
            {"uid": uid},
        )
        for row in r.fetchall():
            if row.post_id in id_map and row.type in ALLOWED_REACTION_TYPES:
                id_map[row.post_id]["user_reactions"].append(row.type)

    return items


@router.get("/feed", summary="Global feed")
def get_global_feed(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Global feed from joined and followed communities."""
    uid = _user_id(user)
    r = db.execute(
        text("""
            SELECT p.id, p.author_id, p.community_id, p.channel_id, p.type, p.title, p.content,
                   p.tags_json, p.attachments_json, p.comment_count, p.reaction_count, p.save_count, p.view_count,
                   p.moderation_status, p.is_pinned, p.pinned_at, p.created_at, p.updated_at,
                   u.full_name as author_name,
                   c.name as community_name,
                   ch.name as channel_name
            FROM posts p
            JOIN users u ON u.user_numerical = p.author_id
            JOIN communities c ON c.id = p.community_id
            LEFT JOIN channels ch ON ch.id = p.channel_id
            WHERE p.moderation_status = 'active'
              AND EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = p.community_id AND cm.user_id = :uid)
            ORDER BY p.created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"uid": uid, "lim": limit, "off": offset},
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        d = _post_row_to_dict(row, row.author_name)
        d["community_name"] = row.community_name or ""
        d["channel_name"] = row.channel_name or ""
        items.append(d)
    _batch_attach_reactions(db, items, uid)

    total_row = db.execute(
        text("""
            SELECT COUNT(*) as n FROM posts p
            WHERE p.moderation_status = 'active'
              AND EXISTS (SELECT 1 FROM community_members cm WHERE cm.community_id = p.community_id AND cm.user_id = :uid)
        """),
        {"uid": uid},
    ).fetchone()
    total = total_row.n if total_row else 0
    return {"items": items, "total": total}


@router.get("/feed/saved", summary="Saved posts feed")
def get_saved_feed(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """User's saved posts."""
    uid = _user_id(user)
    r = db.execute(
        text("""
            SELECT p.id, p.author_id, p.community_id, p.channel_id, p.type, p.title, p.content,
                   p.tags_json, p.attachments_json, p.comment_count, p.reaction_count, p.save_count, p.view_count,
                   p.moderation_status, p.is_pinned, p.pinned_at, p.created_at, p.updated_at,
                   u.full_name as author_name,
                   c.name as community_name,
                   ch.name as channel_name
            FROM post_saves ps
            JOIN posts p ON p.id = ps.post_id AND p.moderation_status = 'active'
            JOIN users u ON u.user_numerical = p.author_id
            JOIN communities c ON c.id = p.community_id
            LEFT JOIN channels ch ON ch.id = p.channel_id
            WHERE ps.user_id = :uid
            ORDER BY ps.created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"uid": uid, "lim": limit, "off": offset},
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        d = _post_row_to_dict(row, row.author_name)
        d["community_name"] = row.community_name or ""
        d["channel_name"] = row.channel_name or ""
        items.append(d)
    _batch_attach_reactions(db, items, uid)

    total_row = db.execute(
        text("SELECT COUNT(*) as n FROM post_saves ps JOIN posts p ON p.id = ps.post_id AND p.moderation_status = 'active' WHERE ps.user_id = :uid"),
        {"uid": uid},
    ).fetchone()
    total = total_row.n if total_row else 0
    return {"items": items, "total": total}


def _feed_order_clause(sort: str, pinned_first: bool = True) -> tuple[str, str]:
    """Return (order_by_sql, useful_join) for feed queries."""
    useful_join = ""
    if sort == "trending":
        core = "(COALESCE(p.reaction_count, 0) + COALESCE(p.comment_count, 0)) DESC, p.created_at DESC"
    elif sort == "useful":
        useful_join = "LEFT JOIN (SELECT post_id, COUNT(*) as useful_cnt FROM post_useful GROUP BY post_id) pu ON pu.post_id = p.id"
        core = "COALESCE(pu.useful_cnt, 0) DESC, p.created_at DESC"
    elif sort == "unanswered":
        core = "p.created_at DESC"
    elif sort == "pinned":
        core = "p.is_pinned DESC NULLS LAST, COALESCE(p.pinned_at, p.created_at) DESC NULLS LAST, p.created_at DESC"
    else:
        core = "p.created_at DESC"
    if pinned_first and sort not in ("pinned", "unanswered"):
        order_sql = f"ORDER BY COALESCE(p.is_pinned, false) DESC, COALESCE(p.pinned_at, p.created_at) DESC NULLS LAST, {core}"
    else:
        order_sql = f"ORDER BY {core}"
    return order_sql, useful_join


@router.get("/communities/{community_id}/feed", summary="Community feed")
def get_community_feed(
    community_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
    channel_id: Optional[int] = Query(None),
    sort: Optional[str] = Query("latest"),
    type_filter: Optional[str] = Query(None, alias="type"),
    tags: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Feed for a single community, optionally filtered by channel, sort, type, tags."""
    uid = _user_id(user)
    r = db.execute(
        text("SELECT id, type, institution_id, organisation_id FROM communities WHERE id = :cid"),
        {"cid": community_id},
    )
    crow = r.fetchone()
    if not crow:
        raise HTTPException(status_code=404, detail="Community not found")
    if not _user_can_see_community(uid, crow, db):
        raise HTTPException(status_code=404, detail="Community not found")
    params = {"cid": community_id, "lim": limit, "off": offset}
    ch_filter = ""
    if channel_id:
        ch_filter = " AND p.channel_id = :chid"
        params["chid"] = channel_id

    type_filter_sql = ""
    if type_filter:
        type_filter_sql = " AND p.type = :typ"
        params["typ"] = type_filter

    tags_filter_sql = ""
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
        if tag_list:
            or_clauses = [f"LOWER(p.tags_json) LIKE :tag_like_{i}" for i in range(len(tag_list))]
            tags_filter_sql = " AND (" + " OR ".join(or_clauses) + ")"
            for i, tag in enumerate(tag_list):
                params[f"tag_like_{i}"] = f"%\"{tag}\"%"

    unanswered_filter = ""
    if sort == "unanswered":
        unanswered_filter = " AND p.type = 'question' AND COALESCE(p.comment_count, 0) = 0"

    order_sql, useful_join = _feed_order_clause(sort, pinned_first=(sort != "unanswered"))

    r = db.execute(
        text(f"""
            SELECT p.id, p.author_id, p.community_id, p.channel_id, p.type, p.title, p.content,
                   p.tags_json, p.attachments_json, p.comment_count, p.reaction_count, p.save_count, p.view_count,
                   p.moderation_status, p.is_pinned, p.pinned_at, p.created_at, p.updated_at,
                   u.full_name as author_name,
                   c.name as community_name,
                   ch.name as channel_name
            FROM posts p
            {useful_join}
            JOIN users u ON u.user_numerical = p.author_id
            JOIN communities c ON c.id = p.community_id
            LEFT JOIN channels ch ON ch.id = p.channel_id
            WHERE p.community_id = :cid AND p.moderation_status = 'active' {ch_filter} {type_filter_sql} {unanswered_filter} {tags_filter_sql}
            {order_sql}
            LIMIT :lim OFFSET :off
        """),
        params,
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        d = _post_row_to_dict(row, row.author_name)
        d["community_name"] = row.community_name or ""
        d["channel_name"] = row.channel_name or ""
        items.append(d)
    _batch_attach_reactions(db, items, uid)

    count_params = {k: v for k, v in params.items() if k not in ("lim", "off")}
    if useful_join:
        count_sql = f"SELECT COUNT(*) as n FROM posts p {useful_join} WHERE p.community_id = :cid AND p.moderation_status = 'active' {ch_filter} {type_filter_sql} {unanswered_filter} {tags_filter_sql}"
    else:
        count_sql = f"SELECT COUNT(*) as n FROM posts p WHERE p.community_id = :cid AND p.moderation_status = 'active' {ch_filter} {type_filter_sql} {unanswered_filter} {tags_filter_sql}"
    total_row = db.execute(text(count_sql), count_params).fetchone()
    total = total_row.n if total_row else 0
    return {"items": items, "total": total}


@router.get("/channels/{channel_id}/feed", summary="Channel feed")
def get_channel_feed(
    channel_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
    sort: Optional[str] = Query("latest"),
    type_filter: Optional[str] = Query(None, alias="type"),
    tags: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=50),
    offset: int = Query(0, ge=0),
):
    """Feed for a single channel with optional sort, type, tags."""
    params = {"chid": channel_id, "lim": limit, "off": offset}

    type_filter_sql = ""
    if type_filter:
        type_filter_sql = " AND p.type = :typ"
        params["typ"] = type_filter

    tags_filter_sql = ""
    if tags:
        tag_list = [t.strip().lower() for t in tags.split(",") if t.strip()]
        if tag_list:
            or_clauses = [f"LOWER(p.tags_json) LIKE :tag_like_{i}" for i in range(len(tag_list))]
            tags_filter_sql = " AND (" + " OR ".join(or_clauses) + ")"
            for i, tag in enumerate(tag_list):
                params[f"tag_like_{i}"] = f"%\"{tag}\"%"

    unanswered_filter = ""
    if sort == "unanswered":
        unanswered_filter = " AND p.type = 'question' AND COALESCE(p.comment_count, 0) = 0"

    order_sql, useful_join = _feed_order_clause(sort, pinned_first=(sort != "unanswered"))

    r = db.execute(
        text(f"""
            SELECT p.id, p.author_id, p.community_id, p.channel_id, p.type, p.title, p.content,
                   p.tags_json, p.attachments_json, p.comment_count, p.reaction_count, p.save_count, p.view_count,
                   p.moderation_status, p.is_pinned, p.pinned_at, p.created_at, p.updated_at,
                   u.full_name as author_name,
                   c.name as community_name,
                   ch.name as channel_name
            FROM posts p
            {useful_join}
            JOIN users u ON u.user_numerical = p.author_id
            JOIN communities c ON c.id = p.community_id
            LEFT JOIN channels ch ON ch.id = p.channel_id
            WHERE p.channel_id = :chid AND p.moderation_status = 'active' {type_filter_sql} {unanswered_filter} {tags_filter_sql}
            {order_sql}
            LIMIT :lim OFFSET :off
        """),
        params,
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        d = _post_row_to_dict(row, row.author_name)
        d["community_name"] = row.community_name or ""
        d["channel_name"] = row.channel_name or ""
        items.append(d)
    uid_ch = _user_id(user)
    _batch_attach_reactions(db, items, uid_ch)

    count_params = {k: v for k, v in params.items() if k not in ("lim", "off")}
    if useful_join:
        count_sql = f"SELECT COUNT(*) as n FROM posts p {useful_join} WHERE p.channel_id = :chid AND p.moderation_status = 'active' {type_filter_sql} {unanswered_filter} {tags_filter_sql}"
    else:
        count_sql = f"SELECT COUNT(*) as n FROM posts p WHERE p.channel_id = :chid AND p.moderation_status = 'active' {type_filter_sql} {unanswered_filter} {tags_filter_sql}"
    total_row = db.execute(text(count_sql), count_params).fetchone()
    total = total_row.n if total_row else 0
    return {"items": items, "total": total}


# ─── Posts ───────────────────────────────────────────────────────────────────
@router.post("/posts", summary="Create post")
def create_post(data: PostCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Create a new post."""
    uid = _user_id(user)
    tags_json = json.dumps(data.tags or [])
    attachments_json = "[]"

    r = db.execute(
        text("""
            INSERT INTO posts (author_id, community_id, channel_id, type, title, content, tags_json, attachments_json)
            VALUES (:uid, :cid, :chid, :typ, :title, :content, :tags, :att)
            RETURNING id, created_at
        """),
        {
            "uid": uid,
            "cid": data.community_id,
            "chid": data.channel_id,
            "typ": data.type or "discussion",
            "title": data.title or "",
            "content": data.content or "",
            "tags": tags_json,
            "att": attachments_json,
        },
    )
    row = r.fetchone()
    db.commit()
    try:
        from shared.telemetry.emitters.feed_emitter import track_post_created
        track_post_created(db, uid, row.id, data.community_id, data.channel_id)
    except Exception as e:
        logging.getLogger(__name__).warning("Post telemetry tracking failed: %s", e)
    return {"id": row.id, "created_at": row.created_at.isoformat() if row.created_at else None}


@router.get("/posts/{post_id}", summary="Get post")
def get_post(post_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Get post by id with author, community, channel."""
    r = db.execute(
        text("""
            SELECT p.id, p.author_id, p.community_id, p.channel_id, p.type, p.title, p.content,
                   p.tags_json, p.attachments_json, p.comment_count, p.reaction_count, p.save_count, p.view_count,
                   p.moderation_status, p.is_pinned, p.pinned_at, p.created_at, p.updated_at,
                   u.full_name as author_name,
                   c.name as community_name,
                   ch.name as channel_name
            FROM posts p
            JOIN users u ON u.user_numerical = p.author_id
            JOIN communities c ON c.id = p.community_id
            LEFT JOIN channels ch ON ch.id = p.channel_id
            WHERE p.id = :pid
        """),
        {"pid": post_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    if row.moderation_status != "active":
        raise HTTPException(status_code=404, detail="Post not found")

    db.execute(text("UPDATE posts SET view_count = view_count + 1 WHERE id = :pid"), {"pid": post_id})
    db.commit()

    uid_gp = _user_id(user)
    d = _post_row_to_dict(row, row.author_name)
    d["community_name"] = row.community_name or ""
    d["channel_name"] = row.channel_name or ""
    _batch_attach_reactions(db, [d], uid_gp)
    return d


@router.patch("/posts/{post_id}", summary="Update post")
def update_post(post_id: int, data: PostCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Update post (author only)."""
    uid = _user_id(user)
    r = db.execute(text("SELECT author_id FROM posts WHERE id = :pid"), {"pid": post_id}).fetchone()
    if not r or r.author_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized to update this post")

    tags_json = json.dumps(data.tags or [])
    db.execute(
        text("""
            UPDATE posts SET title = :title, content = :content, tags_json = :tags, updated_at = NOW()
            WHERE id = :pid
        """),
        {"pid": post_id, "title": data.title or "", "content": data.content or "", "tags": tags_json},
    )
    db.commit()
    return {"ok": True}


@router.delete("/posts/{post_id}", summary="Delete post")
def delete_post(post_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Soft delete - set moderation_status to removed."""
    uid = _user_id(user)
    r = db.execute(text("SELECT author_id FROM posts WHERE id = :pid"), {"pid": post_id}).fetchone()
    if not r or r.author_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    db.execute(
        text("UPDATE posts SET moderation_status = 'removed', updated_at = NOW() WHERE id = :pid"),
        {"pid": post_id},
    )
    db.commit()
    return {"ok": True}


# ─── Comments ───────────────────────────────────────────────────────────────
@router.get("/posts/{post_id}/comments", summary="List comments")
def list_comments(post_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """List comments for a post."""
    r = db.execute(
        text("""
            SELECT c.id, c.post_id, c.author_id, c.parent_id, c.content, c.is_accepted_answer, c.created_at,
                   u.full_name as author_name
            FROM comments c
            JOIN users u ON u.user_numerical = c.author_id
            WHERE c.post_id = :pid
            ORDER BY c.is_accepted_answer DESC, c.created_at ASC
        """),
        {"pid": post_id},
    )
    rows = r.fetchall()
    items = [
        {
            "id": row.id,
            "post_id": row.post_id,
            "author_id": row.author_id,
            "author_name": row.author_name or "",
            "parent_id": row.parent_id,
            "content": row.content,
            "is_accepted_answer": row.is_accepted_answer or False,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]
    return {"items": items, "total": len(items)}


@router.post("/posts/{post_id}/comments", summary="Add comment")
def add_comment(post_id: int, data: CommentCreate, user=Depends(get_current_user), db=Depends(get_db)):
    """Add a comment to a post."""
    uid = _user_id(user)
    r = db.execute(
        text("""
            INSERT INTO comments (post_id, author_id, content) VALUES (:pid, :uid, :content)
            RETURNING id
        """),
        {"pid": post_id, "uid": uid, "content": data.content or ""},
    )
    comment_row = r.fetchone()
    db.execute(text("UPDATE posts SET comment_count = comment_count + 1, updated_at = NOW() WHERE id = :pid"), {"pid": post_id})
    db.commit()
    try:
        from shared.telemetry.emitters.feed_emitter import track_comment_added
        cid = comment_row.id if comment_row and hasattr(comment_row, "id") else 0
        track_comment_added(db, uid, cid, post_id)
    except Exception:
        pass
    return {"ok": True}


@router.post("/posts/{post_id}/comments/{comment_id}/accept", summary="Accept answer")
def accept_answer(post_id: int, comment_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Accept a comment as the answer (for question posts)."""
    uid = _user_id(user)
    r = db.execute(text("SELECT author_id, type FROM posts WHERE id = :pid"), {"pid": post_id}).fetchone()
    if not r or r.author_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    if r.type != "question":
        raise HTTPException(status_code=400, detail="Only question posts support accepted answers")

    db.execute(text("UPDATE comments SET is_accepted_answer = false WHERE post_id = :pid"), {"pid": post_id})
    db.execute(
        text("UPDATE comments SET is_accepted_answer = true WHERE id = :cid AND post_id = :pid"),
        {"cid": comment_id, "pid": post_id},
    )
    db.commit()
    return {"ok": True}


# ─── Reactions, save, useful ─────────────────────────────────────────────────
@router.post("/posts/{post_id}/reactions", summary="Add reaction")
def add_reaction(post_id: int, type: str = Query("upvote"), user=Depends(get_current_user), db=Depends(get_db)):
    """Add or toggle reaction."""
    reaction_type = type or "upvote"
    if reaction_type not in ALLOWED_REACTION_TYPES:
        raise HTTPException(status_code=400, detail=f"Reaction type must be one of: {', '.join(sorted(ALLOWED_REACTION_TYPES))}")
    uid = _user_id(user)
    db.execute(
        text("""
            INSERT INTO post_reactions (post_id, user_id, type) VALUES (:pid, :uid, :typ)
            ON CONFLICT (post_id, user_id, type) DO NOTHING
        """),
        {"pid": post_id, "uid": uid, "typ": reaction_type},
    )
    db.execute(
        text("UPDATE posts SET reaction_count = (SELECT COUNT(*) FROM post_reactions WHERE post_id = :pid), updated_at = NOW() WHERE id = :pid"),
        {"pid": post_id},
    )
    db.commit()
    try:
        from shared.telemetry.emitters.feed_emitter import track_reaction_added
        track_reaction_added(db, uid, post_id, reaction_type)
    except Exception:
        pass
    return {"ok": True}


@router.delete("/posts/{post_id}/reactions", summary="Remove reaction")
def remove_reaction(post_id: int, type: str = Query("upvote"), user=Depends(get_current_user), db=Depends(get_db)):
    """Remove reaction."""
    reaction_type = type or "upvote"
    if reaction_type not in ALLOWED_REACTION_TYPES:
        raise HTTPException(status_code=400, detail=f"Reaction type must be one of: {', '.join(sorted(ALLOWED_REACTION_TYPES))}")
    uid = _user_id(user)
    db.execute(
        text("DELETE FROM post_reactions WHERE post_id = :pid AND user_id = :uid AND type = :typ"),
        {"pid": post_id, "uid": uid, "typ": reaction_type},
    )
    db.execute(
        text("UPDATE posts SET reaction_count = GREATEST(0, (SELECT COUNT(*) FROM post_reactions WHERE post_id = :pid)), updated_at = NOW() WHERE id = :pid"),
        {"pid": post_id},
    )
    db.commit()
    return {"ok": True}


@router.post("/posts/{post_id}/save", summary="Save post")
def save_post(post_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Save a post."""
    uid = _user_id(user)
    db.execute(
        text("""
            INSERT INTO post_saves (post_id, user_id) VALUES (:pid, :uid)
            ON CONFLICT (post_id, user_id) DO NOTHING
        """),
        {"pid": post_id, "uid": uid},
    )
    db.execute(
        text("UPDATE posts SET save_count = (SELECT COUNT(*) FROM post_saves WHERE post_id = :pid), updated_at = NOW() WHERE id = :pid"),
        {"pid": post_id},
    )
    db.commit()
    return {"ok": True}


@router.delete("/posts/{post_id}/save", summary="Unsave post")
def unsave_post(post_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Unsave a post."""
    uid = _user_id(user)
    db.execute(text("DELETE FROM post_saves WHERE post_id = :pid AND user_id = :uid"), {"pid": post_id, "uid": uid})
    db.execute(
        text("UPDATE posts SET save_count = GREATEST(0, (SELECT COUNT(*) FROM post_saves WHERE post_id = :pid)), updated_at = NOW() WHERE id = :pid"),
        {"pid": post_id},
    )
    db.commit()
    return {"ok": True}


@router.post("/posts/{post_id}/useful", summary="Mark as useful")
def mark_useful(post_id: int, user=Depends(get_current_user), db=Depends(get_db)):
    """Mark a post as useful (for questions)."""
    uid = _user_id(user)
    db.execute(
        text("""
            INSERT INTO post_useful (post_id, user_id) VALUES (:pid, :uid)
            ON CONFLICT (post_id, user_id) DO NOTHING
        """),
        {"pid": post_id, "uid": uid},
    )
    db.commit()
    return {"ok": True}
