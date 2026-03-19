"""Network API - connections, follows, overlap discovery, suggestions."""
import json
import logging
from datetime import datetime
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.auth import get_current_user

from .overlap import compute_overlap_reasons, count_mutual_connections

router = APIRouter(prefix="/api/v1/network", tags=["network"])


def _uid(user) -> int:
    return int(getattr(user, "user_numerical", None) or getattr(user, "id", 0))


def _yyyymm() -> str:
    now = datetime.now()
    return f"{now.year}-{str(now.month).zfill(2)}"


def _has_profile_data_for(db, uid: int, data_type: str) -> bool:
    """Check if user has profile data needed for the given network view."""
    if data_type == "suggestions":
        r = db.execute(
            text("SELECT 1 FROM education_entries WHERE user_id = :uid AND institution_id IS NOT NULL LIMIT 1"),
            {"uid": uid},
        )
        if r.fetchone():
            return True
        r = db.execute(
            text("SELECT 1 FROM experience_groups eg WHERE eg.user_id = :uid AND eg.organisation_id IS NOT NULL LIMIT 1"),
            {"uid": uid},
        )
        return r.fetchone() is not None
    if data_type == "org":
        r = db.execute(
            text("SELECT 1 FROM experience_groups WHERE user_id = :uid AND organisation_id IS NOT NULL LIMIT 1"),
            {"uid": uid},
        )
        return r.fetchone() is not None
    if data_type == "institution":
        r = db.execute(
            text("SELECT 1 FROM education_entries WHERE user_id = :uid AND institution_id IS NOT NULL LIMIT 1"),
            {"uid": uid},
        )
        return r.fetchone() is not None
    if data_type == "function":
        r = db.execute(
            text("""
                SELECT 1 FROM experience_groups eg
                JOIN internal_movements im ON im.experience_group_id = eg.id
                WHERE eg.user_id = :uid AND im.function IS NOT NULL AND im.function != ''
                LIMIT 1
            """),
            {"uid": uid},
        )
        return r.fetchone() is not None
    return False


def _user_summary(db, user_id: int) -> dict | None:
    """Get minimal user summary for cards."""
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
    # Current org
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
    # Institution, major, graduation year
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
    # Function from current role
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
        "graduation_year": (str(re.end_month)[:4] if (re and re.end_month and len(str(re.end_month)) >= 4) else None),
        "function": rf.function if rf and rf.function else None,
    }


# ─── Notifications ───────────────────────────────────────────────────────────
def _notifications_safe(db, uid: int, limit: int):
    """Query notifications; return empty if table missing (migration not run)."""
    try:
        r = db.execute(
            text("SELECT COUNT(*) as n FROM user_notifications WHERE user_id = :uid AND read_at IS NULL"),
            {"uid": uid},
        )
        unread_count = r.fetchone().n if r else 0
        r = db.execute(
            text("""
                SELECT id, type, payload_json, read_at, created_at
                FROM user_notifications
                WHERE user_id = :uid
                ORDER BY created_at DESC
                LIMIT :lim
            """),
            {"uid": uid, "lim": limit},
        )
        rows = r.fetchall()
        items = []
        for row in rows:
            payload = {}
            if row.payload_json:
                try:
                    payload = json.loads(row.payload_json)
                except (json.JSONDecodeError, TypeError):
                    pass
            items.append({
                "id": row.id,
                "type": row.type,
                "payload": payload,
                "read_at": row.read_at.isoformat() if row.read_at else None,
                "created_at": row.created_at.isoformat() if row.created_at else None,
            })
        return {"unread_count": unread_count, "items": items}
    except Exception as e:
        logging.getLogger(__name__).warning("Notifications query failed (table may not exist): %s", e)
        try:
            db.rollback()
        except Exception:
            pass
        return {"unread_count": 0, "items": []}


@router.get("/notifications", summary="List notifications (unread count + recent)")
def list_notifications(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
):
    uid = _uid(user)
    return _notifications_safe(db, uid, limit)


@router.patch("/notifications/{nid}/read", summary="Mark notification as read")
def mark_notification_read(
    nid: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    try:
        db.execute(
            text("UPDATE user_notifications SET read_at = NOW() WHERE id = :nid AND user_id = :uid"),
            {"nid": nid, "uid": uid},
        )
        db.commit()
    except Exception as e:
        logging.getLogger(__name__).warning("Mark notification read failed: %s", e)
        db.rollback()
    return {"ok": True}


@router.patch("/notifications/read-all", summary="Mark all notifications as read")
def mark_all_notifications_read(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    try:
        db.execute(text("UPDATE user_notifications SET read_at = NOW() WHERE user_id = :uid AND read_at IS NULL"), {"uid": uid})
        db.commit()
    except Exception as e:
        logging.getLogger(__name__).warning("Mark all notifications read failed: %s", e)
        db.rollback()
    return {"ok": True}


# ─── Pydantic models ────────────────────────────────────────────────────────
class ConnectionCreate(BaseModel):
    recipient_id: int


class ConnectionStatusUpdate(BaseModel):
    status: str  # accepted | rejected


class FollowCreate(BaseModel):
    following_id: int


# ─── Connections ─────────────────────────────────────────────────────────────
@router.get("/connections", summary="List accepted connections")
def list_connections(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT id, requester_id, recipient_id, status, created_at
            FROM user_connections
            WHERE status = 'accepted' AND (requester_id = :uid OR recipient_id = :uid)
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"uid": uid, "lim": limit, "off": offset},
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        other_id = row.recipient_id if row.requester_id == uid else row.requester_id
        summary = _user_summary(db, other_id)
        if summary:
            summary["mutual_connections_count"] = count_mutual_connections(db, uid, other_id)
            items.append({
                "id": row.id,
                "requester_id": row.requester_id,
                "recipient_id": row.recipient_id,
                "status": row.status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "other_user": summary,
            })
    count_row = db.execute(
        text("""
            SELECT COUNT(*) as n FROM user_connections
            WHERE status = 'accepted' AND (requester_id = :uid OR recipient_id = :uid)
        """),
        {"uid": uid},
    ).fetchone()
    total = count_row.n if count_row else 0
    return {"items": items, "total": total}


@router.get("/connections/pending", summary="List pending connection requests received")
def list_pending_connections(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT id, requester_id, recipient_id, status, created_at
            FROM user_connections
            WHERE recipient_id = :uid AND status = 'pending'
            ORDER BY created_at DESC
        """),
        {"uid": uid},
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        summary = _user_summary(db, row.requester_id)
        if summary:
            items.append({
                "id": row.id,
                "requester_id": row.requester_id,
                "recipient_id": row.recipient_id,
                "status": row.status,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "requester": summary,
            })
    return {"items": items}


@router.post("/connections", summary="Send connection request")
def create_connection(
    body: ConnectionCreate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    if body.recipient_id == uid:
        raise HTTPException(status_code=400, detail="Cannot connect to yourself")
    # Check if recipient exists (professional or admin - admins can receive connections for internal networking)
    r = db.execute(
        text("SELECT user_numerical FROM users WHERE user_numerical = :rid AND user_type IN ('professional', 'admin')"),
        {"rid": body.recipient_id},
    )
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    # Check existing
    r = db.execute(
        text("""
            SELECT id, status FROM user_connections
            WHERE (requester_id = :uid AND recipient_id = :rid) OR (requester_id = :rid AND recipient_id = :uid)
        """),
        {"uid": uid, "rid": body.recipient_id},
    )
    existing = r.fetchone()
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="Already connected")
        if existing.status == "pending":
            raise HTTPException(status_code=400, detail="Connection request already sent")
    db.execute(
        text("""
            INSERT INTO user_connections (requester_id, recipient_id, status)
            VALUES (:uid, :rid, 'pending')
        """),
        {"uid": uid, "rid": body.recipient_id},
    )
    conn_row = db.execute(
        text("SELECT id FROM user_connections WHERE requester_id = :uid AND recipient_id = :rid"),
        {"uid": uid, "rid": body.recipient_id},
    ).fetchone()
    conn_id = conn_row.id if conn_row else None
    # Notify recipient immediately
    try:
        payload = json.dumps({"requester_id": uid, "connection_id": conn_id})
        db.execute(
            text("""
                INSERT INTO user_notifications (user_id, type, payload_json, read_at)
                VALUES (:uid, 'connection_request', :payload, NULL)
            """),
            {"uid": body.recipient_id, "payload": payload},
        )
    except Exception:
        pass
    db.commit()
    r = db.execute(
        text("""
            SELECT id, requester_id, recipient_id, status, created_at
            FROM user_connections
            WHERE requester_id = :uid AND recipient_id = :rid
        """),
        {"uid": uid, "rid": body.recipient_id},
    )
    row = r.fetchone()
    return {
        "id": row.id,
        "requester_id": row.requester_id,
        "recipient_id": row.recipient_id,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.patch("/connections/{conn_id}", summary="Accept or reject connection request")
def update_connection(
    conn_id: int,
    body: ConnectionStatusUpdate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    if body.status not in ("accepted", "rejected"):
        raise HTTPException(status_code=400, detail="status must be accepted or rejected")
    r = db.execute(
        text("SELECT id, recipient_id, status FROM user_connections WHERE id = :cid"),
        {"cid": conn_id},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Connection request not found")
    if row.recipient_id != uid:
        raise HTTPException(status_code=403, detail="Only recipient can accept or reject")
    if row.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")
    db.execute(
        text("UPDATE user_connections SET status = :st WHERE id = :cid"),
        {"st": body.status, "cid": conn_id},
    )
    # Mark related notification as read
    try:
        db.execute(
            text("""
                UPDATE user_notifications SET read_at = NOW()
                WHERE user_id = :uid AND type = 'connection_request'
                  AND payload_json IS NOT NULL
                  AND (payload_json::jsonb->>'connection_id') = :cid
            """),
            {"uid": uid, "cid": str(conn_id)},
        )
    except Exception:
        pass
    db.commit()
    try:
        if body.status == "accepted":
            from shared.telemetry.emitters.network_emitter import track_connection_accepted
            track_connection_accepted(db, uid, conn_id, row.requester_id)
    except Exception:
        pass
    r = db.execute(
        text("SELECT id, requester_id, recipient_id, status, created_at FROM user_connections WHERE id = :cid"),
        {"cid": conn_id},
    )
    row = r.fetchone()
    return {
        "id": row.id,
        "requester_id": row.requester_id,
        "recipient_id": row.recipient_id,
        "status": row.status,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


# ─── Follows ───────────────────────────────────────────────────────────────
@router.get("/follows", summary="List users current user follows")
def list_follows(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT id, follower_id, following_id, created_at
            FROM user_follows
            WHERE follower_id = :uid
            ORDER BY created_at DESC
            LIMIT :lim OFFSET :off
        """),
        {"uid": uid, "lim": limit, "off": offset},
    )
    rows = r.fetchall()
    items = []
    for row in rows:
        summary = _user_summary(db, row.following_id)
        if summary:
            items.append({
                "id": row.id,
                "follower_id": row.follower_id,
                "following_id": row.following_id,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "following": summary,
            })
    count_row = db.execute(
        text("SELECT COUNT(*) as n FROM user_follows WHERE follower_id = :uid"),
        {"uid": uid},
    ).fetchone()
    total = count_row.n if count_row else 0
    return {"items": items, "total": total}


@router.post("/follows", summary="Follow a user")
def create_follow(
    body: FollowCreate,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    if body.following_id == uid:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    r = db.execute(
        text("SELECT user_numerical FROM users WHERE user_numerical = :fid AND user_type = 'professional'"),
        {"fid": body.following_id},
    )
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="User not found")
    try:
        db.execute(
            text("""
                INSERT INTO user_follows (follower_id, following_id)
                VALUES (:uid, :fid)
            """),
            {"uid": uid, "fid": body.following_id},
        )
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=400, detail="Already following")
    r = db.execute(
        text("SELECT id, follower_id, following_id, created_at FROM user_follows WHERE follower_id = :uid AND following_id = :fid"),
        {"uid": uid, "fid": body.following_id},
    )
    row = r.fetchone()
    try:
        from shared.telemetry.emitters.network_emitter import track_follow_added
        track_follow_added(db, uid, body.following_id, row.id if row else None)
    except Exception:
        pass
    return {
        "id": row.id,
        "follower_id": row.follower_id,
        "following_id": row.following_id,
        "created_at": row.created_at.isoformat() if row.created_at else None,
    }


@router.delete("/follows/{follow_id}", summary="Unfollow a user")
def delete_follow(
    follow_id: int,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    r = db.execute(
        text("SELECT id FROM user_follows WHERE id = :fid AND follower_id = :uid"),
        {"fid": follow_id, "uid": uid},
    )
    if not r.fetchone():
        raise HTTPException(status_code=404, detail="Follow not found")
    db.execute(text("DELETE FROM user_follows WHERE id = :fid"), {"fid": follow_id})
    db.commit()
    return {"ok": True}


# ─── Overview ───────────────────────────────────────────────────────────────
@router.get("/overview", summary="Network overview stats")
def overview(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    yyyymm = _yyyymm()
    # Connections count
    r = db.execute(
        text("""
            SELECT COUNT(*) as n FROM user_connections
            WHERE status = 'accepted' AND (requester_id = :uid OR recipient_id = :uid)
        """),
        {"uid": uid},
    )
    row = r.fetchone()
    connections_count = row.n if row else 0
    # Following count
    r = db.execute(
        text("SELECT COUNT(*) as n FROM user_follows WHERE follower_id = :uid"),
        {"uid": uid},
    )
    row = r.fetchone()
    following_count = row.n if row else 0
    # Same org (current) - users from my current orgs
    r = db.execute(
        text("""
            SELECT COUNT(DISTINCT eg2.user_id) as n
            FROM experience_groups eg1
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
                AND (im1.end_month IS NULL OR im1.end_month >= :yyyymm)
            JOIN experience_groups eg2 ON eg2.organisation_id = eg1.organisation_id AND eg2.user_id != :uid
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
                AND (im2.end_month IS NULL OR im2.end_month >= :yyyymm)
            WHERE eg1.user_id = :uid AND eg1.organisation_id IS NOT NULL
        """),
        {"uid": uid, "yyyymm": yyyymm},
    )
    row = r.fetchone()
    same_org_count = row.n if row else 0
    # Same institution
    r = db.execute(
        text("""
            SELECT COUNT(DISTINCT e2.user_id) as n
            FROM education_entries e1
            JOIN education_entries e2 ON e2.institution_id = e1.institution_id AND e2.user_id != :uid
            WHERE e1.user_id = :uid AND e1.institution_id IS NOT NULL
        """),
        {"uid": uid},
    )
    row = r.fetchone()
    same_institution_count = row.n if row else 0
    # Same function
    r = db.execute(
        text("""
            SELECT COUNT(DISTINCT eg2.user_id) as n
            FROM experience_groups eg1
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
                AND im1.function IS NOT NULL AND im1.function != ''
            JOIN experience_groups eg2 ON eg2.user_id != :uid
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
                AND im2.function = im1.function
            WHERE eg1.user_id = :uid
        """),
        {"uid": uid},
    )
    row = r.fetchone()
    same_function_count = row.n if row else 0
    return {
        "connections_count": connections_count,
        "following_count": following_count,
        "same_org_count": same_org_count,
        "same_institution_count": same_institution_count,
        "same_function_count": same_function_count,
    }


# ─── Org Network ────────────────────────────────────────────────────────────
@router.get("/org-network", summary="People grouped by organization")
def org_network(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    yyyymm = _yyyymm()
    # My org ids (current and previous)
    r = db.execute(
        text("""
            SELECT DISTINCT eg.organisation_id, o.name
            FROM experience_groups eg
            LEFT JOIN organisations o ON o.id = eg.organisation_id
            WHERE eg.user_id = :uid AND eg.organisation_id IS NOT NULL
        """),
        {"uid": uid},
    )
    my_orgs = [(row.organisation_id, row.name) for row in r.fetchall()]
    # Connected user ids
    r = db.execute(
        text("""
            SELECT CASE WHEN requester_id = :uid THEN recipient_id ELSE requester_id END as conn_id
            FROM user_connections WHERE (requester_id = :uid OR recipient_id = :uid) AND status = 'accepted'
        """),
        {"uid": uid},
    )
    connected_ids = {row.conn_id for row in r.fetchall()}
    groups = []
    for org_id, org_name in my_orgs:
        if not org_id:
            continue
        # Current at org
        r = db.execute(
            text("""
                SELECT DISTINCT eg.user_id
                FROM experience_groups eg
                JOIN internal_movements im ON im.experience_group_id = eg.id
                    AND (im.end_month IS NULL OR im.end_month >= :yyyymm)
                WHERE eg.organisation_id = :oid AND eg.user_id != :uid
            """),
            {"oid": org_id, "uid": uid, "yyyymm": yyyymm},
        )
        current_ids = [row.user_id for row in r.fetchall() if row.user_id not in connected_ids]
        # Alumni at org
        r = db.execute(
            text("""
                SELECT DISTINCT eg.user_id
                FROM experience_groups eg
                JOIN internal_movements im ON im.experience_group_id = eg.id
                    AND im.end_month IS NOT NULL AND im.end_month < :yyyymm
                WHERE eg.organisation_id = :oid AND eg.user_id != :uid
            """),
            {"oid": org_id, "uid": uid, "yyyymm": yyyymm},
        )
        alumni_ids = [row.user_id for row in r.fetchall() if row.user_id not in connected_ids]
        all_ids = list(dict.fromkeys(current_ids + alumni_ids))
        if all_ids:
            people = []
            for oid in all_ids[:20]:
                s = _user_summary(db, oid)
                if s:
                    people.append(s)
            groups.append({
                "organisation_id": org_id,
                "organisation_name": org_name or "Unknown",
                "count": len(all_ids),
                "people": people,
            })
    profile_has_data = _has_profile_data_for(db, uid, "org")
    return {"groups": groups, "profile_has_data": profile_has_data}


# ─── Institution Network ─────────────────────────────────────────────────────
@router.get("/institution-network", summary="People grouped by institution + major + year")
def institution_network(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT DISTINCT e.institution_id, i.name, e.majors_json, e.end_month
            FROM education_entries e
            LEFT JOIN institutions i ON i.id = e.institution_id
            WHERE e.user_id = :uid
        """),
        {"uid": uid},
    )
    my_edu = []
    for row in r.fetchall():
        majors = []
        try:
            majors = json.loads(row.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        my_edu.append({
            "institution_id": row.institution_id,
            "institution_name": row.name,
            "majors": majors,
            "graduation_year": row.end_month[:4] if (row.end_month and len(row.end_month) >= 4) else None,
        })
    connected_ids = set()
    r = db.execute(
        text("""
            SELECT CASE WHEN requester_id = :uid THEN recipient_id ELSE requester_id END as conn_id
            FROM user_connections WHERE (requester_id = :uid OR recipient_id = :uid) AND status = 'accepted'
        """),
        {"uid": uid},
    )
    connected_ids = {row.conn_id for row in r.fetchall()}
    groups = []
    seen = set()
    for edu in my_edu:
        inst_id = edu["institution_id"]
        if not inst_id or (inst_id, edu.get("graduation_year") or "", tuple(edu.get("majors") or [])) in seen:
            continue
        seen.add((inst_id, edu.get("graduation_year") or "", tuple(edu.get("majors") or [])))
        r = db.execute(
            text("""
                SELECT DISTINCT e.user_id
                FROM education_entries e
                WHERE e.institution_id = :iid AND e.user_id != :uid
            """),
            {"iid": inst_id, "uid": uid},
        )
        other_ids = [row.user_id for row in r.fetchall() if row.user_id not in connected_ids]
        if other_ids:
            people = [_user_summary(db, oid) for oid in other_ids[:15]]
            people = [p for p in people if p]
            groups.append({
                "institution_id": inst_id,
                "institution_name": edu["institution_name"] or "Unknown",
                "major": edu["majors"][0] if edu.get("majors") else None,
                "graduation_year": edu.get("graduation_year"),
                "count": len(other_ids),
                "people": people,
            })
    profile_has_data = _has_profile_data_for(db, uid, "institution")
    return {"groups": groups, "profile_has_data": profile_has_data}


# ─── Function Network ───────────────────────────────────────────────────────
@router.get("/function-network", summary="People grouped by function")
def function_network(
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    r = db.execute(
        text("""
            SELECT DISTINCT im.function
            FROM experience_groups eg
            JOIN internal_movements im ON im.experience_group_id = eg.id
            WHERE eg.user_id = :uid AND im.function IS NOT NULL AND im.function != ''
        """),
        {"uid": uid},
    )
    my_functions = [row.function for row in r.fetchall()]
    connected_ids = set()
    r = db.execute(
        text("""
            SELECT CASE WHEN requester_id = :uid THEN recipient_id ELSE requester_id END as conn_id
            FROM user_connections WHERE (requester_id = :uid OR recipient_id = :uid) AND status = 'accepted'
        """),
        {"uid": uid},
    )
    connected_ids = {row.conn_id for row in r.fetchall()}
    groups = []
    for fn in my_functions:
        r = db.execute(
            text("""
                SELECT DISTINCT eg.user_id
                FROM experience_groups eg
                JOIN internal_movements im ON im.experience_group_id = eg.id
                WHERE im.function = :fn AND eg.user_id != :uid
            """),
            {"fn": fn, "uid": uid},
        )
        other_ids = [row.user_id for row in r.fetchall() if row.user_id not in connected_ids]
        if other_ids:
            people = [_user_summary(db, oid) for oid in other_ids[:15]]
            people = [p for p in people if p]
            groups.append({
                "function": fn,
                "count": len(other_ids),
                "people": people,
            })
    profile_has_data = _has_profile_data_for(db, uid, "function")
    return {"groups": groups, "profile_has_data": profile_has_data}


# ─── Suggestions ────────────────────────────────────────────────────────────
@router.get("/suggestions", summary="Suggested connections")
def suggestions(
    user=Depends(get_current_user),
    db=Depends(get_db),
    limit: int = Query(20, ge=1, le=50),
):
    uid = _uid(user)
    try:
        return _suggestions_impl(db, uid, limit)
    except Exception as e:
        logging.getLogger(__name__).exception("Suggestions failed: %s", e)
        try:
            db.rollback()
            return {"items": [], "profile_has_data": _has_profile_data_for(db, uid, "suggestions")}
        except Exception:
            return {"items": [], "profile_has_data": False}


def _suggestions_impl(db, uid: int, limit: int):
    # Exclude self, connections, and follows (user_connections has requester_id, recipient_id)
    r = db.execute(
        text("""
            SELECT CASE WHEN requester_id = :uid THEN recipient_id ELSE requester_id END AS conn_id
            FROM user_connections
            WHERE status = 'accepted' AND (requester_id = :uid OR recipient_id = :uid)
        """),
        {"uid": uid},
    )
    connected = {row.conn_id for row in r.fetchall()}
    r = db.execute(
        text("SELECT following_id FROM user_follows WHERE follower_id = :uid"),
        {"uid": uid},
    )
    following = {row.following_id for row in r.fetchall()}
    exclude = connected | following | {uid}
    # Collect candidates from overlaps
    candidates: dict[int, list[dict]] = {}
    yyyymm = _yyyymm()
    # Same institution
    r = db.execute(
        text("""
            SELECT e2.user_id
            FROM education_entries e1
            JOIN education_entries e2 ON e2.institution_id = e1.institution_id AND e2.user_id != :uid
            WHERE e1.user_id = :uid AND e1.institution_id IS NOT NULL
        """),
        {"uid": uid},
    )
    for row in r.fetchall():
        if row.user_id not in exclude:
            candidates.setdefault(row.user_id, [])
    # Same org
    r = db.execute(
        text("""
            SELECT eg2.user_id
            FROM experience_groups eg1
            JOIN internal_movements im1 ON im1.experience_group_id = eg1.id
            JOIN experience_groups eg2 ON eg2.organisation_id = eg1.organisation_id AND eg2.user_id != :uid
            JOIN internal_movements im2 ON im2.experience_group_id = eg2.id
            WHERE eg1.user_id = :uid AND eg1.organisation_id IS NOT NULL
        """),
        {"uid": uid},
    )
    for row in r.fetchall():
        if row.user_id not in exclude:
            candidates.setdefault(row.user_id, [])
    # Mutual connections
    r = db.execute(
        text("""
            WITH my_conns AS (
                SELECT CASE WHEN requester_id = :uid THEN recipient_id ELSE requester_id END as conn_id
                FROM user_connections WHERE (requester_id = :uid OR recipient_id = :uid) AND status = 'accepted'
            )
            SELECT c.requester_id as oid FROM user_connections c
            WHERE c.recipient_id IN (SELECT conn_id FROM my_conns) AND c.status = 'accepted'
            UNION
            SELECT c.recipient_id FROM user_connections c
            WHERE c.requester_id IN (SELECT conn_id FROM my_conns) AND c.status = 'accepted'
        """),
        {"uid": uid},
    )
    for row in r.fetchall():
        oid = row.oid
        if oid not in exclude and oid != uid:
            candidates.setdefault(oid, [])
    # Build suggestion list with overlap reasons
    items = []
    for oid in list(candidates.keys())[:limit]:
        summary = _user_summary(db, oid)
        if not summary:
            continue
        reasons = compute_overlap_reasons(db, uid, oid)
        mutual = count_mutual_connections(db, uid, oid)
        if mutual and not any(r["type"] == "mutual" for r in reasons):
            reasons.insert(0, {"type": "mutual_connections", "label": f"You share {mutual} mutual connection{'s' if mutual != 1 else ''}"})
        summary["overlap_reasons"] = reasons
        summary["mutual_connections_count"] = mutual
        strength = mutual * 10 + len(reasons) * 5
        items.append({"user": summary, "strength": min(100, strength)})
    items.sort(key=lambda x: -x["strength"])
    profile_has_data = _has_profile_data_for(db, uid, "suggestions")
    return {
        "items": [{"user": i["user"], "strength": i["strength"]} for i in items],
        "profile_has_data": profile_has_data,
    }


# ─── Profile Overlap ────────────────────────────────────────────────────────
@router.get("/profiles/{slug}/overlap", summary="Overlap and mutual connections for a profile")
def profile_overlap(
    slug: str,
    user=Depends(get_current_user),
    db=Depends(get_db),
):
    uid = _uid(user)
    r = db.execute(
        text("SELECT user_numerical FROM users WHERE profile_slug = :s AND user_type IN ('professional', 'admin')"),
        {"s": slug},
    )
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    target_id = row.user_numerical
    if target_id == uid:
        return {"mutual_connections": [], "overlap_badges": [], "connection_status": None, "is_following": False, "target_user_id": None}

    # Connection status
    r = db.execute(
        text("""
            SELECT status FROM user_connections
            WHERE (requester_id = :uid AND recipient_id = :oid) OR (requester_id = :oid AND recipient_id = :uid)
        """),
        {"uid": uid, "oid": target_id},
    )
    conn_row = r.fetchone()
    connection_status = conn_row.status if conn_row else None

    # Is following
    r = db.execute(
        text("SELECT id FROM user_follows WHERE follower_id = :uid AND following_id = :oid"),
        {"uid": uid, "oid": target_id},
    )
    follow_row = r.fetchone()
    is_following = follow_row is not None
    follow_id = follow_row.id if follow_row else None

    overlap_badges = compute_overlap_reasons(db, uid, target_id)
    mutual_count = count_mutual_connections(db, uid, target_id)
    mutual_users = []
    if mutual_count > 0:
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
                SELECT m.conn_id FROM my_conns m JOIN other_conns o ON m.conn_id = o.conn_id
            """),
            {"uid": uid, "oid": target_id},
        )
        for row in r.fetchall():
            s = _user_summary(db, row.conn_id)
            if s:
                mutual_users.append(s)
    return {
        "mutual_connections": mutual_users[:10],
        "mutual_connections_count": mutual_count,
        "overlap_badges": overlap_badges,
        "connection_status": connection_status,
        "is_following": is_following,
        "follow_id": follow_id,
        "target_user_id": target_id,
    }
