"""Admin API - community management, channels, members, moderation, requests."""
import json
import re
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import require_admin

from admin.community_sync import ensure_community_has_general_channel

router = APIRouter(tags=["admin-communities"])


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", (s or "").lower()).strip("-") or "n-a"


def _admin_id(user) -> int:
    return int(getattr(user, "user_numerical", None) or getattr(user, "id", 0))


def _log_action(db, admin_id: int, action: str, community_id: Optional[int] = None, details: Optional[dict] = None):
    db.execute(
        text("""
            INSERT INTO community_admin_actions (community_id, admin_user_id, action, details_json)
            VALUES (:cid, :aid, :act, :details)
        """),
        {"cid": community_id, "aid": admin_id, "act": action, "details": json.dumps(details or {})},
    )
    try:
        from shared.telemetry.emitters.audit_emitter import track_audit_action
        track_audit_action(
            db, admin_id, action, "community",
            str(community_id) if community_id else None,
            metadata=details,
        )
    except Exception:
        pass


# ─── Pydantic models ────────────────────────────────────────────────────────
class CommunityCreate(BaseModel):
    name: str
    type: str = "public"
    description: Optional[str] = None
    institution_id: Optional[int] = None
    organisation_id: Optional[int] = None
    function_key: Optional[str] = None
    has_channels: bool = True  # All communities have at least a General channel
    visibility: Optional[str] = "public"
    discoverable: Optional[bool] = True
    join_approval_required: Optional[bool] = False
    posting_permission: Optional[str] = "members"
    rules: Optional[str] = None


class CommunityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    visibility: Optional[str] = None
    discoverable: Optional[bool] = None
    join_approval_required: Optional[bool] = None
    posting_permission: Optional[str] = None
    rules: Optional[str] = None


class ChannelCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ChannelUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class MemberRoleUpdate(BaseModel):
    role: str


class PostModerationUpdate(BaseModel):
    moderation_status: Optional[str] = None
    is_locked: Optional[bool] = None


class CommunityRequestApprove(BaseModel):
    pass


class CommunityRequestReject(BaseModel):
    reason: Optional[str] = None


class CommunityRequestChanges(BaseModel):
    message: Optional[str] = None


# ─── Communities ────────────────────────────────────────────────────────────
@router.get("/communities", summary="List all communities (admin)")
def list_communities(
    user=Depends(require_admin),
    db=Depends(get_db),
    type_filter: Optional[str] = Query(None, alias="type"),
    status: Optional[str] = Query(None),
    institution_id: Optional[int] = Query(None),
    organisation_id: Optional[int] = Query(None),
    function_key: Optional[str] = Query(None),
    has_channels: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    conditions = ["1=1"]
    params = {"lim": limit, "off": offset}
    if type_filter:
        conditions.append("c.type = :typ")
        params["typ"] = type_filter
    if status:
        conditions.append("c.status = :status")
        params["status"] = status
    if institution_id is not None:
        conditions.append("c.institution_id = :iid")
        params["iid"] = institution_id
    if organisation_id is not None:
        conditions.append("c.organisation_id = :oid")
        params["oid"] = organisation_id
    if function_key is not None:
        conditions.append("c.function_key = :fkey")
        params["fkey"] = function_key
    if has_channels is not None:
        conditions.append("c.has_channels = :hc")
        params["hc"] = has_channels
    if search:
        conditions.append("(c.name ILIKE :q OR c.description ILIKE :q OR i.name ILIKE :q OR o.name ILIKE :q)")
        params["q"] = f"%{search}%"

    where = " AND ".join(conditions)
    r = db.execute(
        text(f"""
            SELECT c.id, c.name, c.slug, c.type, c.description, c.has_channels, c.status,
                   c.member_count, c.created_at, c.updated_at,
                   c.institution_id, c.organisation_id, c.function_key,
                   i.name as institution_name, o.name as organisation_name,
                   (SELECT COUNT(*) FROM posts p WHERE p.community_id = c.id) as post_count,
                   (SELECT MAX(p.created_at) FROM posts p WHERE p.community_id = c.id) as last_activity
            FROM communities c
            LEFT JOIN institutions i ON i.id = c.institution_id
            LEFT JOIN organisations o ON o.id = c.organisation_id
            WHERE {where}
            ORDER BY c.created_at DESC
            LIMIT :lim OFFSET :off
        """),
        params,
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        parent = None
        if row.institution_name:
            parent = row.institution_name
        elif row.organisation_name:
            parent = row.organisation_name
        elif row.function_key:
            parent = row.function_key
        items.append({
            "id": row.id,
            "name": row.name,
            "slug": row.slug,
            "type": row.type,
            "description": row.description or "",
            "parent_entity_id": row.institution_id or row.organisation_id,
            "parent_entity_name": parent,
            "has_channels": row.has_channels or False,
            "member_count": row.member_count or 0,
            "post_count": row.post_count or 0,
            "status": row.status or "listed",
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "last_activity": row.last_activity.isoformat() if row.last_activity else None,
        })

    count_params = {k: v for k, v in params.items() if k not in ("lim", "off")}
    total_row = db.execute(text(f"SELECT COUNT(*) as n FROM communities c LEFT JOIN institutions i ON i.id = c.institution_id LEFT JOIN organisations o ON o.id = c.organisation_id WHERE {where}"), count_params).fetchone()
    total = total_row.n if total_row else 0
    return {"items": items, "total": total}


@router.get("/communities/{community_id}", summary="Get community detail (admin)")
def get_community_detail(community_id: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(
        text("""
            SELECT c.id, c.name, c.slug, c.type, c.description, c.has_channels, c.status,
                   c.member_count, c.created_at, c.updated_at,
                   c.institution_id, c.organisation_id, c.function_key,
                   c.visibility, c.discoverable, c.join_approval_required,
                   c.posting_permission, c.rules,
                   i.name as institution_name, o.name as organisation_name
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

    channels = []
    if row.has_channels:
        ch_rows = db.execute(
            text("""
                SELECT ch.id, ch.name, ch.slug, ch.description, ch.created_at,
                       (SELECT COUNT(*) FROM posts p WHERE p.channel_id = ch.id) as post_count
                FROM channels ch
                WHERE ch.community_id = :cid ORDER BY ch.name
            """),
            {"cid": community_id},
        ).fetchall()
        channels = [{"id": r.id, "name": r.name, "slug": r.slug, "description": r.description or "", "post_count": r.post_count or 0, "created_at": r.created_at.isoformat() if r.created_at else None} for r in ch_rows]

    post_count = db.execute(text("SELECT COUNT(*) FROM posts WHERE community_id = :cid"), {"cid": community_id}).scalar() or 0
    active_30d = db.execute(
        text("""
            SELECT COUNT(DISTINCT author_id) FROM posts
            WHERE community_id = :cid AND created_at >= NOW() - INTERVAL '30 days'
        """),
        {"cid": community_id},
    ).scalar() or 0

    parent = row.institution_name or row.organisation_name or row.function_key
    return {
        "id": row.id,
        "name": row.name,
        "slug": row.slug,
        "type": row.type,
        "description": row.description or "",
        "parent_entity_id": row.institution_id or row.organisation_id,
        "parent_entity_name": parent,
        "has_channels": row.has_channels or False,
        "status": row.status or "listed",
        "created_at": row.created_at.isoformat() if row.created_at else None,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
        "visibility": getattr(row, "visibility", "public") or "public",
        "discoverable": getattr(row, "discoverable", True) if getattr(row, "discoverable", None) is not None else True,
        "join_approval_required": getattr(row, "join_approval_required", False) or False,
        "posting_permission": getattr(row, "posting_permission", "members") or "members",
        "rules": getattr(row, "rules", None) or "",
        "member_count": row.member_count or 0,
        "channel_count": len(channels),
        "post_count": post_count,
        "active_users_30d": active_30d,
        "channels": channels,
    }


@router.post("/communities", summary="Create community (admin)")
def create_community(data: CommunityCreate, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    base_slug = _slug(data.name)
    slug = base_slug
    n = 0
    while True:
        r = db.execute(text("SELECT 1 FROM communities WHERE slug = :s"), {"s": slug})
        if not r.scalar():
            break
        n += 1
        slug = f"{base_slug}-{n}"

    db.execute(
        text("""
            INSERT INTO communities (name, slug, type, description, institution_id, organisation_id, function_key,
                                     has_channels, status, visibility, discoverable, join_approval_required,
                                     posting_permission, rules)
            VALUES (:name, :slug, :typ, :desc, :iid, :oid, :fkey, true, 'listed',
                    COALESCE(:vis, 'public'), COALESCE(:disc, true), COALESCE(:join_app, false),
                    COALESCE(:post_perm, 'members'), :rules)
        """),
        {
            "name": data.name,
            "slug": slug,
            "typ": data.type,
            "desc": data.description or "",
            "iid": data.institution_id,
            "oid": data.organisation_id,
            "fkey": data.function_key,
            "vis": data.visibility,
            "disc": data.discoverable,
            "join_app": data.join_approval_required,
            "post_perm": data.posting_permission,
            "rules": data.rules or "",
        },
    )
    cid = db.execute(text("SELECT lastval()")).scalar()
    # All communities must have a General channel
    desc = "For current students" if data.type == "institution" else "For current employees" if data.type == "organisation" else "General discussion"
    ensure_community_has_general_channel(db, cid, desc)
    db.execute(text("UPDATE communities SET has_channels = true WHERE id = :cid"), {"cid": cid})
    _log_action(db, admin_id, "community_created", cid, {"name": data.name})
    db.commit()
    return {"id": cid, "slug": slug}


@router.patch("/communities/{community_id}", summary="Update community (admin)")
def update_community(community_id: int, data: CommunityUpdate, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")

    updates = []
    params = {"cid": community_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description
    if data.status is not None:
        updates.append("status = :status")
        params["status"] = data.status
    if data.visibility is not None:
        updates.append("visibility = :vis")
        params["vis"] = data.visibility
    if data.discoverable is not None:
        updates.append("discoverable = :disc")
        params["disc"] = data.discoverable
    if data.join_approval_required is not None:
        updates.append("join_approval_required = :join_app")
        params["join_app"] = data.join_approval_required
    if data.posting_permission is not None:
        updates.append("posting_permission = :post_perm")
        params["post_perm"] = data.posting_permission
    if data.rules is not None:
        updates.append("rules = :rules")
        params["rules"] = data.rules
    if not updates:
        return {"ok": True}
    updates.append("updated_at = NOW()")
    db.execute(text(f"UPDATE communities SET {', '.join(updates)} WHERE id = :cid"), params)
    _log_action(db, admin_id, "community_updated", community_id, {"fields": [u.split(" = ")[0] for u in updates[:-1]]})
    db.commit()
    return {"ok": True}


@router.post("/communities/{community_id}/archive", summary="Archive community (admin)")
def archive_community(community_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")
    db.execute(text("UPDATE communities SET status = 'archived', updated_at = NOW() WHERE id = :cid"), {"cid": community_id})
    _log_action(db, admin_id, "community_archived", community_id, {})
    db.commit()
    return {"ok": True}


@router.delete("/communities/{community_id}", summary="Delete community (admin)")
def delete_community(community_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")
    db.execute(text("DELETE FROM communities WHERE id = :cid"), {"cid": community_id})
    _log_action(db, admin_id, "community_deleted", community_id, {})
    db.commit()
    return {"ok": True}


# ─── Channels ───────────────────────────────────────────────────────────────
@router.get("/communities/{community_id}/channels", summary="List channels with post counts (admin)")
def list_community_channels(community_id: int, user=Depends(require_admin), db=Depends(get_db)):
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")
    ch_rows = db.execute(
        text("""
            SELECT ch.id, ch.name, ch.slug, ch.description, ch.created_at,
                   (SELECT COUNT(*) FROM posts p WHERE p.channel_id = ch.id) as post_count,
                   (SELECT COUNT(DISTINCT p.author_id) FROM posts p WHERE p.channel_id = ch.id) as member_participation
            FROM channels ch
            WHERE ch.community_id = :cid ORDER BY ch.name
        """),
        {"cid": community_id},
    ).fetchall()
    items = [{"id": r.id, "name": r.name, "slug": r.slug, "description": r.description or "", "post_count": r.post_count or 0, "member_participation": r.member_participation or 0, "created_at": r.created_at.isoformat() if r.created_at else None} for r in ch_rows]
    return {"items": items, "total": len(items)}


@router.post("/communities/{community_id}/channels", summary="Create channel (admin)")
def create_channel(community_id: int, data: ChannelCreate, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id, has_channels FROM communities WHERE id = :cid"), {"cid": community_id})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Community not found")
    slug = _slug(data.name)
    r2 = db.execute(text("SELECT 1 FROM channels WHERE community_id = :cid AND slug = :s"), {"cid": community_id, "s": slug})
    if r2.scalar():
        slug = f"{slug}-{community_id}"
    db.execute(
        text("INSERT INTO channels (community_id, name, slug, description) VALUES (:cid, :name, :slug, :desc)"),
        {"cid": community_id, "name": data.name, "slug": slug, "desc": data.description or ""},
    )
    ch_id = db.execute(text("SELECT lastval()")).scalar()
    _log_action(db, admin_id, "channel_added", community_id, {"channel_name": data.name})
    db.commit()
    return {"id": ch_id}


@router.patch("/channels/{channel_id}", summary="Update channel (admin)")
def update_channel(channel_id: int, data: ChannelUpdate, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id, community_id FROM channels WHERE id = :chid"), {"chid": channel_id})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Channel not found")
    updates = []
    params = {"chid": channel_id}
    if data.name is not None:
        updates.append("name = :name")
        params["name"] = data.name
    if data.description is not None:
        updates.append("description = :desc")
        params["desc"] = data.description
    if not updates:
        return {"ok": True}
    db.execute(text(f"UPDATE channels SET {', '.join(updates)} WHERE id = :chid"), params)
    _log_action(db, admin_id, "channel_updated", row.community_id, {"channel_id": channel_id})
    db.commit()
    return {"ok": True}


@router.delete("/channels/{channel_id}", summary="Delete channel (admin)")
def delete_channel(channel_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id, community_id, name, slug FROM channels WHERE id = :chid"), {"chid": channel_id})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Channel not found")
    if (row.slug or "").lower() == "general":
        raise HTTPException(status_code=400, detail="Cannot delete the General channel; every community must have at least this channel")
    db.execute(text("DELETE FROM channels WHERE id = :chid"), {"chid": channel_id})
    _log_action(db, admin_id, "channel_deleted", row.community_id, {"channel_name": row.name})
    db.commit()
    return {"ok": True}


# ─── Members ────────────────────────────────────────────────────────────────
@router.get("/communities/{community_id}/members", summary="List community members (admin)")
def list_community_members(
    community_id: int,
    user=Depends(require_admin),
    db=Depends(get_db),
):
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")
    rows = db.execute(
        text("""
            SELECT cm.user_id, cm.role, cm.created_at as joined_at,
                   u.full_name,
                   (SELECT COUNT(*) FROM posts p WHERE p.community_id = :cid AND p.author_id = cm.user_id) as post_count,
                   (SELECT COUNT(*) FROM comments c JOIN posts p ON p.id = c.post_id WHERE p.community_id = :cid AND c.author_id = cm.user_id) as comment_count
            FROM community_members cm
            JOIN users u ON u.user_numerical = cm.user_id
            WHERE cm.community_id = :cid
            ORDER BY cm.role DESC, cm.created_at DESC
        """),
        {"cid": community_id},
    ).fetchall()
    items = []
    for row in rows:
        activity = (row.post_count or 0) + (row.comment_count or 0)
        activity_level = "high" if activity > 10 else ("medium" if activity > 0 else "low")
        items.append({
            "userId": row.user_id,
            "fullName": row.full_name or "",
            "role": row.role or "member",
            "joinedAt": row.joined_at.isoformat() if row.joined_at else None,
            "activityLevel": activity_level,
            "postCount": row.post_count or 0,
        })
    return {"items": items, "total": len(items)}


@router.patch("/communities/{community_id}/members/{user_id}", summary="Update member role (admin)")
def update_member_role(community_id: int, user_id: int, data: MemberRoleUpdate, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    if data.role not in ("member", "moderator", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    r = db.execute(text("SELECT 1 FROM community_members WHERE community_id = :cid AND user_id = :uid"), {"cid": community_id, "uid": user_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Member not found")
    db.execute(text("UPDATE community_members SET role = :role WHERE community_id = :cid AND user_id = :uid"), {"role": data.role, "cid": community_id, "uid": user_id})
    _log_action(db, admin_id, "moderator_assigned", community_id, {"user_id": user_id, "role": data.role})
    db.commit()
    return {"ok": True}


@router.delete("/communities/{community_id}/members/{user_id}", summary="Remove member (admin)")
def remove_member(community_id: int, user_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    db.execute(text("DELETE FROM community_members WHERE community_id = :cid AND user_id = :uid"), {"cid": community_id, "uid": user_id})
    db.execute(text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"), {"cid": community_id})
    _log_action(db, admin_id, "member_removed", community_id, {"user_id": user_id})
    db.commit()
    return {"ok": True}


@router.post("/communities/{community_id}/members/{user_id}/ban", summary="Ban member (admin)")
def ban_member(community_id: int, user_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    db.execute(text("DELETE FROM community_members WHERE community_id = :cid AND user_id = :uid"), {"cid": community_id, "uid": user_id})
    db.execute(
        text("""
            INSERT INTO community_member_bans (community_id, user_id, banned_by)
            VALUES (:cid, :uid, :aid)
            ON CONFLICT (community_id, user_id) DO NOTHING
        """),
        {"cid": community_id, "uid": user_id, "aid": admin_id},
    )
    db.execute(text("UPDATE communities SET member_count = (SELECT COUNT(*) FROM community_members WHERE community_id = :cid) WHERE id = :cid"), {"cid": community_id})
    _log_action(db, admin_id, "member_banned", community_id, {"user_id": user_id})
    db.commit()
    return {"ok": True}


# ─── Moderation ─────────────────────────────────────────────────────────────
@router.get("/communities/{community_id}/posts", summary="List posts for moderation (admin)")
def list_community_posts(
    community_id: int,
    user=Depends(require_admin),
    db=Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")
    rows = db.execute(
        text("""
            SELECT p.id, p.author_id, p.type, p.title, p.comment_count, p.reaction_count, p.save_count,
                   p.moderation_status, p.created_at, p.is_locked,
                   u.full_name as author_name, ch.name as channel_name
            FROM posts p
            JOIN users u ON u.user_numerical = p.author_id
            LEFT JOIN channels ch ON ch.id = p.channel_id
            WHERE p.community_id = :cid
            ORDER BY p.created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"cid": community_id, "lim": limit, "off": offset},
    ).fetchall()
    items = []
    for row in rows:
        engagement = (row.comment_count or 0) + (row.reaction_count or 0) + (row.save_count or 0)
        items.append({
            "id": row.id,
            "authorId": row.author_id,
            "authorName": row.author_name or "",
            "type": row.type or "discussion",
            "title": row.title or "",
            "channelName": row.channel_name or "",
            "engagement": engagement,
            "createdAt": row.created_at.isoformat() if row.created_at else None,
            "moderationStatus": row.moderation_status or "active",
            "isLocked": getattr(row, "is_locked", False) or False,
        })
    total = db.execute(text("SELECT COUNT(*) FROM posts WHERE community_id = :cid"), {"cid": community_id}).scalar() or 0
    return {"items": items, "total": total}


@router.patch("/posts/{post_id}", summary="Update post moderation (admin)")
def update_post_moderation(post_id: int, data: PostModerationUpdate, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id, community_id FROM posts WHERE id = :pid"), {"pid": post_id})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    updates = []
    params = {"pid": post_id}
    if data.moderation_status is not None:
        updates.append("moderation_status = :status")
        params["status"] = data.moderation_status
    if data.is_locked is not None:
        updates.append("is_locked = :locked")
        params["locked"] = data.is_locked
    if not updates:
        return {"ok": True}
    updates.append("updated_at = NOW()")
    db.execute(text(f"UPDATE posts SET {', '.join(updates)} WHERE id = :pid"), params)
    _log_action(db, admin_id, "post_moderated", row.community_id, {"post_id": post_id, "moderation_status": data.moderation_status})
    db.commit()
    try:
        from shared.telemetry.emitters.moderation_emitter import track_moderation_action
        meta = {"community_id": row.community_id}
        if data.moderation_status is not None:
            meta["moderation_status"] = data.moderation_status
        if data.is_locked is not None:
            meta["is_locked"] = data.is_locked
        track_moderation_action(db, admin_id, "post_moderated", "post", str(post_id), metadata=meta)
    except Exception:
        pass
    return {"ok": True}


@router.post("/posts/{post_id}/flag", summary="Flag post (admin)")
def flag_post(post_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id, community_id FROM posts WHERE id = :pid"), {"pid": post_id})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Post not found")
    db.execute(text("UPDATE posts SET moderation_status = 'flagged', updated_at = NOW() WHERE id = :pid"), {"pid": post_id})
    _log_action(db, admin_id, "post_flagged", row.community_id, {"post_id": post_id})
    db.commit()
    try:
        from shared.telemetry.emitters.moderation_emitter import track_moderation_action
        track_moderation_action(db, admin_id, "post_flagged", "post", str(post_id), metadata={"community_id": row.community_id})
    except Exception:
        pass
    return {"ok": True}


# ─── Community Requests ─────────────────────────────────────────────────────
@router.get("/community-requests", summary="List community requests (admin)")
def list_community_requests(
    user=Depends(require_admin),
    db=Depends(get_db),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    conditions = ["1=1"]
    params = {"lim": limit, "off": offset}
    if status:
        conditions.append("cr.status = :status")
        params["status"] = status
    where = " AND ".join(conditions)
    rows = db.execute(
        text(f"""
            SELECT cr.id, cr.user_id, cr.name, cr.description, cr.category, cr.purpose, cr.rules_json,
                   cr.status, cr.created_at, cr.target_audience,
                   u.full_name as requester_name
            FROM community_requests cr
            JOIN users u ON u.user_numerical = cr.user_id
            WHERE {where}
            ORDER BY cr.created_at DESC
            LIMIT :lim OFFSET :off
        """),
        params,
    ).fetchall()
    items = []
    for row in rows:
        rules = []
        try:
            rules = json.loads(row.rules_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        items.append({
            "id": row.id,
            "requesterId": row.user_id,
            "requesterName": row.requester_name or "",
            "name": row.name,
            "description": row.description or "",
            "category": row.category or "",
            "purpose": row.purpose or "",
            "targetAudience": getattr(row, "target_audience", None) or "",
            "rules": rules,
            "status": row.status or "pending",
            "createdAt": row.created_at.isoformat() if row.created_at else None,
        })
    total = db.execute(text(f"SELECT COUNT(*) FROM community_requests cr WHERE {where}"), {k: v for k, v in params.items() if k not in ("lim", "off")}).scalar() or 0
    return {"items": items, "total": total}


@router.post("/community-requests/{request_id}/approve", summary="Approve community request (admin)")
def approve_community_request(request_id: int, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(
        text("SELECT id, user_id, name, description, category, purpose, rules_json FROM community_requests WHERE id = :rid AND status = 'pending'"),
        {"rid": request_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    slug = _slug(row.name)
    n = 0
    while True:
        r2 = db.execute(text("SELECT 1 FROM communities WHERE slug = :s"), {"s": slug})
        if not r2.scalar():
            break
        n += 1
        slug = f"{slug}-{n}"
    db.execute(
        text("""
            INSERT INTO communities (name, slug, type, description, has_channels, status)
            VALUES (:name, :slug, 'public', :desc, true, 'listed')
        """),
        {"name": row.name, "slug": slug, "desc": row.description or ""},
    )
    cid = db.execute(text("SELECT lastval()")).scalar()
    ensure_community_has_general_channel(db, cid, "General discussion")
    db.execute(text("INSERT INTO community_members (community_id, user_id, role) VALUES (:cid, :uid, 'admin')"), {"cid": cid, "uid": row.user_id})
    db.execute(text("UPDATE community_requests SET status = 'approved' WHERE id = :rid"), {"rid": request_id})
    db.execute(text("UPDATE communities SET member_count = 1 WHERE id = :cid"), {"cid": cid})
    _log_action(db, admin_id, "community_request_approved", cid, {"request_id": request_id})
    db.commit()
    return {"id": cid, "slug": slug}


@router.post("/community-requests/{request_id}/reject", summary="Reject community request (admin)")
def reject_community_request(request_id: int, data: Optional[CommunityRequestReject] = None, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id FROM community_requests WHERE id = :rid AND status = 'pending'"), {"rid": request_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    db.execute(text("UPDATE community_requests SET status = 'rejected' WHERE id = :rid"), {"rid": request_id})
    _log_action(db, admin_id, "community_request_rejected", None, {"request_id": request_id, "reason": data.reason if data else None})
    db.commit()
    return {"ok": True}


@router.post("/community-requests/{request_id}/request-changes", summary="Request changes (admin)")
def request_changes_community_request(request_id: int, data: CommunityRequestChanges, user=Depends(require_admin), db=Depends(get_db)):
    admin_id = _admin_id(user)
    r = db.execute(text("SELECT id FROM community_requests WHERE id = :rid AND status = 'pending'"), {"rid": request_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Request not found or already processed")
    db.execute(text("UPDATE community_requests SET status = 'changes_requested' WHERE id = :rid"), {"rid": request_id})
    _log_action(db, admin_id, "community_request_changes_requested", None, {"request_id": request_id, "message": data.message})
    db.commit()
    return {"ok": True}


# ─── Activity Log ───────────────────────────────────────────────────────────
@router.get("/communities/{community_id}/activity", summary="Community activity log (admin)")
def get_community_activity(
    community_id: int,
    user=Depends(require_admin),
    db=Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    r = db.execute(text("SELECT id FROM communities WHERE id = :cid"), {"cid": community_id})
    if not r.scalar():
        raise HTTPException(status_code=404, detail="Community not found")
    rows = db.execute(
        text("""
            SELECT caa.id, caa.action, caa.admin_user_id, caa.details_json, caa.created_at,
                   u.full_name as admin_name
            FROM community_admin_actions caa
            JOIN users u ON u.user_numerical = caa.admin_user_id
            WHERE caa.community_id = :cid
            ORDER BY caa.created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"cid": community_id, "lim": limit, "off": offset},
    ).fetchall()
    items = []
    for row in rows:
        details = {}
        try:
            details = json.loads(row.details_json or "{}")
        except (json.JSONDecodeError, TypeError):
            pass
        items.append({
            "id": row.id,
            "action": row.action,
            "adminUserId": row.admin_user_id,
            "adminName": row.admin_name or "",
            "timestamp": row.created_at.isoformat() if row.created_at else None,
            "details": details,
        })
    total = db.execute(text("SELECT COUNT(*) FROM community_admin_actions WHERE community_id = :cid"), {"cid": community_id}).scalar() or 0
    return {"items": items, "total": total}
