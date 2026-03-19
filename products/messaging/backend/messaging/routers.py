"""Messaging API - conversations, messages, requests (trust-aware, priority inbox)."""
import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import get_current_user

from .helpers import user_summary, get_relationship_type, get_overlap_context

router = APIRouter(prefix="/api/v1/messages", tags=["messages"])


def _uid(user) -> int:
    return int(getattr(user, "user_numerical", None) or getattr(user, "id", 0))


# ─── Pydantic models ────────────────────────────────────────────────────────
class MessageSend(BaseModel):
    content: str
    content_type: str = "richtext"


class MessageRequestCreate(BaseModel):
    recipient_id: int
    content: str


class MessageRequestAction(BaseModel):
    action: str  # accept | ignore | archive | block


class ConversationCreate(BaseModel):
    participant_ids: list[int]
    title: Optional[str] = None  # for groups


# ─── Inbox: conversations by priority ────────────────────────────────────────
def _build_conv_item(db, cid, ctype, ctitle, p0, p1, last_at, last_content, unread, is_archived, is_muted, uid):
    other_id = p1 if p1 and p1 != uid else p0
    if not other_id:
        return None
    rel = get_relationship_type(db, uid, other_id)
    overlap = get_overlap_context(db, uid, other_id)
    s = user_summary(db, other_id)
    title = ctitle if ctype == "group" else (s["full_name"] if s else f"User {other_id}")
    return {
        "id": cid,
        "type": ctype,
        "title": title,
        "participant_ids": [p for p in [p0, p1] if p],
        "other_user": s,
        "last_message_preview": (last_content or "")[:100] if last_content else "",
        "last_message_at": last_at.isoformat() if last_at else None,
        "unread_count": unread or 0,
        "priority_level": rel,
        "relationship_type": rel,
        "relationship_context": overlap or [],
        "is_archived": is_archived or False,
        "is_muted": is_muted or False,
    }


@router.get("/inbox", summary="List conversations by priority sections")
def list_inbox(
    user=Depends(get_current_user),
    db=Depends(get_db),
    section: Optional[str] = Query(None, description="priority | following | requests | other | archived"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    Returns inbox sections: priority (connections), following, requests (followers), other, archived.
    Each section has { items, total }.
    """
    uid = _uid(user)
    sections = {"priority": [], "following": [], "requests": [], "other": [], "archived": []}

    r = db.execute(
        text("""
            SELECT c.id, c.type, c.title, c.last_message_at, c.is_archived, c.is_muted
            FROM conversations c
            JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = :uid
            WHERE c.type = 'direct'
            ORDER BY c.last_message_at DESC NULLS LAST
        """),
        {"uid": uid},
    )
    for row in r.fetchall():
        r2 = db.execute(
            text("SELECT user_id FROM conversation_participants WHERE conversation_id = :cid AND user_id != :uid"),
            {"cid": row.id, "uid": uid},
        )
        other = r2.fetchone()
        other_id = other.user_id if other else None
        if not other_id:
            continue
        r3 = db.execute(
            text("SELECT content FROM messages WHERE conversation_id = :cid ORDER BY created_at DESC LIMIT 1"),
            {"cid": row.id},
        )
        last_msg = r3.fetchone()
        r4 = db.execute(
            text("""
                SELECT COUNT(*) as n FROM messages m
                JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id AND cp.user_id = :uid
                WHERE m.conversation_id = :cid AND m.sender_id != :uid
                  AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
            """),
            {"cid": row.id, "uid": uid},
        )
        unread_row = r4.fetchone()
        item = _build_conv_item(
            db, row.id, row.type, row.title, uid, other_id,
            row.last_message_at, last_msg.content if last_msg else None,
            unread_row.n if unread_row else 0, row.is_archived, row.is_muted, uid,
        )
        if not item:
            continue
        if row.is_archived:
            sections["archived"].append(item)
        elif item["relationship_type"] == "connection":
            sections["priority"].append(item)
        elif item["relationship_type"] == "following":
            sections["following"].append(item)
        elif item["relationship_type"] == "follower":
            sections["requests"].append(item)
        else:
            sections["other"].append(item)

    if section:
        items = sections.get(section, [])
        return {"items": items[offset : offset + limit], "total": len(items)}

    return {
        "priority": {"items": sections["priority"][:limit], "total": len(sections["priority"])},
        "following": {"items": sections["following"][:limit], "total": len(sections["following"])},
        "requests": {"items": sections["requests"][:limit], "total": len(sections["requests"])},
        "other": {"items": sections["other"][:limit], "total": len(sections["other"])},
        "archived": {"items": sections["archived"][:limit], "total": len(sections["archived"])},
    }


@router.get("/conversations/{conv_id}", summary="Get conversation with messages")
def get_conversation(
    conv_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    before_id: Optional[int] = Query(None),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT c.id, c.type, c.title, c.created_at, c.last_message_at
            FROM conversations c
            JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = :uid
            WHERE c.id = :cid
        """),
        {"cid": conv_id, "uid": uid},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Conversation not found")
    participants = []
    r2 = db.execute(
        text("""
            SELECT user_id FROM conversation_participants WHERE conversation_id = :cid
        """),
        {"cid": conv_id},
    )
    for p in r2.fetchall():
        s = user_summary(db, p.user_id)
        if s:
            rel = get_relationship_type(db, uid, p.user_id)
            overlap = get_overlap_context(db, uid, p.user_id)
            participants.append({**s, "relationship_type": rel, "overlap_context": overlap})
    q = """
        SELECT id, conversation_id, sender_id, content, content_type, status, created_at, updated_at, is_edited
        FROM messages
        WHERE conversation_id = :cid
    """
    params = {"cid": conv_id}
    if before_id:
        q += " AND id < :bid ORDER BY created_at DESC LIMIT :lim"
        params["bid"] = before_id
        params["lim"] = limit
    else:
        q += " ORDER BY created_at DESC LIMIT :lim"
        params["lim"] = limit
    r3 = db.execute(text(q), params)
    messages = []
    for m in r3.fetchall():
        sender = user_summary(db, m.sender_id) if m.sender_id else None
        messages.append({
            "id": m.id,
            "conversation_id": m.conversation_id,
            "sender_id": m.sender_id,
            "content": m.content,
            "content_type": m.content_type,
            "status": m.status,
            "created_at": m.created_at.isoformat() if m.created_at else None,
            "updated_at": m.updated_at.isoformat() if m.updated_at else None,
            "is_edited": m.is_edited,
            "sender": sender,
        })
    messages.reverse()
    db.execute(
        text("""
            UPDATE conversation_participants SET last_read_at = NOW()
            WHERE conversation_id = :cid AND user_id = :uid
        """),
        {"cid": conv_id, "uid": uid},
    )
    db.commit()
    return {
        "id": row.id,
        "type": row.type,
        "title": row.title,
        "participants": participants,
        "messages": messages,
        "has_more": len(messages) == limit,
    }


@router.post("/conversations", summary="Start or get direct conversation")
def create_or_get_conversation(
    body: ConversationCreate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    if not body.participant_ids:
        raise HTTPException(status_code=400, detail="At least one participant required")
    other_ids = [x for x in body.participant_ids if x != uid]
    if not other_ids:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    if len(other_ids) > 1:
        raise HTTPException(status_code=400, detail="Group conversations not yet supported")
    other_id = other_ids[0]
    r = db.execute(
        text("""
            SELECT c.id FROM conversations c
            JOIN conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = :uid
            JOIN conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = :oid
            WHERE c.type = 'direct'
        """),
        {"uid": uid, "oid": other_id},
    )
    existing = r.fetchone()
    if existing:
        return {"id": existing.id, "existing": True}
    db.execute(
        text("INSERT INTO conversations (type) VALUES ('direct')"),
    )
    r2 = db.execute(text("SELECT LASTVAL()"))
    conv_id = r2.fetchone()[0]
    db.execute(
        text("""
            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (:cid, :uid), (:cid, :oid)
        """),
        {"cid": conv_id, "uid": uid, "oid": other_id},
    )
    db.commit()
    return {"id": conv_id, "existing": False}


@router.post("/conversations/{conv_id}/messages", summary="Send message")
def send_message(
    conv_id: int,
    body: MessageSend,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    r = db.execute(
        text("SELECT 1 FROM conversation_participants WHERE conversation_id = :cid AND user_id = :uid"),
        {"cid": conv_id, "uid": uid},
    )
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Conversation not found")
    if not (body.content or "").strip():
        raise HTTPException(status_code=400, detail="Message content required")
    db.execute(
        text("""
            INSERT INTO messages (conversation_id, sender_id, content, content_type)
            VALUES (:cid, :uid, :content, :ctype)
        """),
        {"cid": conv_id, "uid": uid, "content": body.content[:65535], "ctype": body.content_type or "richtext"},
    )
    db.execute(
        text("UPDATE conversations SET last_message_at = NOW(), updated_at = NOW() WHERE id = :cid"),
        {"cid": conv_id},
    )
    db.commit()
    try:
        from shared.telemetry.emitters.messaging_emitter import track_message_sent
        track_message_sent(db, uid, conv_id)
    except Exception:
        pass
    r2 = db.execute(text("SELECT id, created_at FROM messages WHERE conversation_id = :cid ORDER BY id DESC LIMIT 1"), {"cid": conv_id})
    msg = r2.fetchone()
    return {
        "id": msg.id,
        "conversation_id": conv_id,
        "sender_id": uid,
        "content": body.content,
        "content_type": body.content_type,
        "created_at": msg.created_at.isoformat() if msg.created_at else None,
    }


# ─── Message requests ─────────────────────────────────────────────────────────
@router.get("/requests", summary="List message requests (pending, accepted, etc.)")
def list_message_requests(
    user=Depends(get_current_user),
    db=Depends(get_db),
    status_filter: Optional[str] = Query("pending", description="pending | accepted | ignored | archived"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT id, sender_id, recipient_id, preview_content, status, relationship_type, overlap_context, created_at
            FROM message_requests
            WHERE recipient_id = :uid AND status = :st
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"uid": uid, "st": status_filter or "pending", "lim": limit, "off": offset},
    )
    items = []
    for row in r.fetchall():
        sender = user_summary(db, row.sender_id)
        if sender:
            overlap = row.overlap_context
            if isinstance(overlap, str):
                try:
                    overlap = json.loads(overlap) if overlap else []
                except Exception:
                    overlap = []
            items.append({
                "id": row.id,
                "sender_id": row.sender_id,
                "recipient_id": row.recipient_id,
                "sender": sender,
                "preview_content": row.preview_content,
                "relationship_type": row.relationship_type,
                "overlap_context": overlap or [],
                "status": row.status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })
    count = db.execute(
        text("SELECT COUNT(*) as n FROM message_requests WHERE recipient_id = :uid AND status = :st"),
        {"uid": uid, "st": status_filter or "pending"},
    ).fetchone()
    return {"items": items, "total": count.n if count else 0}


@router.post("/requests", summary="Send message request (cold message)")
def create_message_request(
    body: MessageRequestCreate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    if body.recipient_id == uid:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    r = db.execute(
        text("SELECT user_numerical FROM users WHERE user_numerical = :rid AND user_type = 'professional'"),
        {"rid": body.recipient_id},
    )
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    rel = get_relationship_type(db, uid, body.recipient_id)
    overlap = get_overlap_context(db, uid, body.recipient_id)
    overlap_json = json.dumps(overlap) if overlap else None
    r = db.execute(
        text("""
            SELECT id, status FROM message_requests
            WHERE sender_id = :uid AND recipient_id = :rid
        """),
        {"uid": uid, "rid": body.recipient_id},
    )
    existing = r.fetchone()
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Conversation already exists")
        if existing.status == "pending":
            raise HTTPException(status_code=400, detail="Request already sent")
        if existing.status == "blocked":
            raise HTTPException(status_code=400, detail="Cannot message this user")
        if existing.status in ("ignored", "archived"):
            db.execute(
                text("""
                    UPDATE message_requests SET preview_content = :content, relationship_type = :rel,
                        overlap_context = :overlap, status = 'pending', resolved_at = NULL
                    WHERE id = :eid
                """),
                {"content": (body.content or "")[:1000], "rel": rel, "overlap": overlap_json, "eid": existing.id},
            )
        else:
            raise HTTPException(status_code=400, detail="Request already exists")
    else:
        db.execute(
            text("""
                INSERT INTO message_requests (sender_id, recipient_id, preview_content, relationship_type, overlap_context)
                VALUES (:uid, :rid, :content, :rel, :overlap)
            """),
            {"uid": uid, "rid": body.recipient_id, "content": (body.content or "")[:1000], "rel": rel, "overlap": overlap_json},
        )
    db.commit()
    r2 = db.execute(
        text("SELECT id, created_at FROM message_requests WHERE sender_id = :uid AND recipient_id = :rid"),
        {"uid": uid, "rid": body.recipient_id},
    )
    row = r2.fetchone()
    return {
        "id": row.id,
        "sender_id": uid,
        "recipient_id": body.recipient_id,
        "status": "pending",
        "relationship_type": rel,
        "overlap_context": overlap,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.post("/requests/{req_id}/action", summary="Accept, ignore, archive, or block request")
def message_request_action(
    req_id: int,
    body: MessageRequestAction,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    if body.action not in ("accept", "ignore", "archive", "block"):
        raise HTTPException(status_code=400, detail="Invalid action")
    r = db.execute(
        text("SELECT id, sender_id, recipient_id, status FROM message_requests WHERE id = :rid"),
        {"rid": req_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Request not found")
    if row.recipient_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized")
    if row.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    db.execute(
        text("UPDATE message_requests SET status = :st, resolved_at = NOW() WHERE id = :rid"),
        {"st": body.action if body.action != "accept" else "accepted", "rid": req_id},
    )
    conv_id = None
    if body.action == "accept":
        db.execute(text("INSERT INTO conversations (type) VALUES ('direct')"))
        r2 = db.execute(text("SELECT LASTVAL()"))
        conv_id = r2.fetchone()[0]
        db.execute(
            text("""
                INSERT INTO conversation_participants (conversation_id, user_id)
                VALUES (:cid, :uid), (:cid, :oid)
            """),
            {"cid": conv_id, "uid": uid, "oid": row.sender_id},
        )
        db.execute(
            text("UPDATE message_requests SET conversation_id = :cid WHERE id = :rid"),
            {"cid": conv_id, "rid": req_id},
        )
    db.commit()
    try:
        if body.action == "accept":
            from shared.telemetry.emitters.messaging_emitter import track_request_accepted
            track_request_accepted(db, uid, req_id, conv_id)
        elif body.action == "ignore":
            from shared.telemetry.emitters.messaging_emitter import track_request_ignored
            track_request_ignored(db, uid, req_id)
    except Exception:
        pass
    return {"action": body.action, "conversation_id": conv_id}


# ─── Search ──────────────────────────────────────────────────────────────────
@router.get("/search/users", summary="Search users for new conversation")
def search_users(
    user=Depends(get_current_user),
    db=Depends(get_db),
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=50),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT user_numerical FROM users
            WHERE user_type = 'professional' AND user_numerical != :uid
              AND (full_name ILIKE :q OR profile_slug ILIKE :q OR email ILIKE :q)
            LIMIT :lim
        """),
        {"uid": uid, "q": f"%{q}%", "lim": limit},
    )
    items = []
    for row in r.fetchall():
        s = user_summary(db, row.user_numerical)
        if s:
            rel = get_relationship_type(db, uid, row.user_numerical)
            overlap = get_overlap_context(db, uid, row.user_numerical)
            items.append({**s, "relationship_type": rel, "overlap_context": overlap})
    try:
        from shared.telemetry.emitters.search_emitter import track_search_performed
        track_search_performed(db, "user", q, len(items), uid)
    except Exception:
        pass
    return {"items": items}
