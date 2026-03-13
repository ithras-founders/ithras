"""Network API: follow/unfollow, status, followers, following, connections."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional

from app.modules.shared import database
from app.modules.shared.auth import get_current_user
from app.modules.shared.models.core import User
from app.modules.shared.models import governance as gov_models

router = APIRouter(prefix="/api/v1/feed/network", tags=["feed-network"])


def _allow_feed_user(user: User):
    if user.role not in ("CANDIDATE", "RECRUITER", "SYSTEM_ADMIN", "PROFESSIONAL"):
        raise HTTPException(status_code=403, detail="Network access requires CANDIDATE, RECRUITER, PROFESSIONAL, or SYSTEM_ADMIN role")


def _serialize_user(row) -> dict:
    r = row._mapping if hasattr(row, "_mapping") else dict(row)
    return {
        "id": r.get("id"),
        "name": r.get("name") or r.get("email") or "Unknown",
        "email": r.get("email"),
        "profile_photo_url": r.get("profile_photo_url"),
        "role": r.get("role"),
        "student_subtype": r.get("student_subtype"),
    }


@router.post("/follow/{user_id}", response_model=dict)
def follow_user(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add current user as follower of target. Creates notification for target."""
    _allow_feed_user(user)
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot follow yourself")
    target = db.execute(text("SELECT id, name FROM users WHERE id = :id"), {"id": user_id}).fetchone()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    existing = db.execute(
        text("SELECT id FROM user_follows WHERE follower_id = :fid AND following_id = :gid"),
        {"fid": user.id, "gid": user_id},
    ).fetchone()
    if existing:
        return {"following": True}
    follow_id = f"uf_{uuid.uuid4().hex}"
    db.execute(
        text("INSERT INTO user_follows (id, follower_id, following_id) VALUES (:id, :fid, :gid)"),
        {"id": follow_id, "fid": user.id, "gid": user_id},
    )
    notif_id = f"notif_{uuid.uuid4().hex[:12]}"
    follower_name = user.name or user.email or "Someone"
    db.add(
        gov_models.Notification(
            id=notif_id,
            user_id=user_id,
            recipient_type="USER",
            notification_type="NETWORK_ADDED",
            title=f"{follower_name} added you to their network",
            message=f"{follower_name} wants to connect. Add them to your network to become connections.",
            data={"follower_id": user.id, "follower_name": follower_name},
        )
    )
    db.commit()
    return {"following": True}


@router.delete("/follow/{user_id}", response_model=dict)
def unfollow_user(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Remove follow relationship."""
    _allow_feed_user(user)
    db.execute(
        text("DELETE FROM user_follows WHERE follower_id = :fid AND following_id = :gid"),
        {"fid": user.id, "gid": user_id},
    )
    db.commit()
    return {"following": False}


@router.get("/status/{user_id}", response_model=dict)
def get_network_status(
    user_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """For current user: whether following target, and whether mutual (in_network)."""
    _allow_feed_user(user)
    following = db.execute(
        text("SELECT 1 FROM user_follows WHERE follower_id = :fid AND following_id = :gid"),
        {"fid": user.id, "gid": user_id},
    ).fetchone() is not None
    in_network = False
    if following:
        reverse = db.execute(
            text("SELECT 1 FROM user_follows WHERE follower_id = :fid AND following_id = :gid"),
            {"fid": user_id, "gid": user.id},
        ).fetchone()
        in_network = reverse is not None
    return {"following": following, "in_network": in_network}


@router.get("/followers", response_model=dict)
def list_followers(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List users who follow the current user (who added you to their network)."""
    _allow_feed_user(user)
    rows = db.execute(
        text("""
            SELECT u.id, u.name, u.email, u.profile_photo_url, u.role, u.student_subtype, uf.created_at
            FROM user_follows uf
            JOIN users u ON u.id = uf.follower_id
            WHERE uf.following_id = :uid
            ORDER BY uf.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"uid": user.id, "limit": limit, "offset": offset},
    ).fetchall()
    items = [_serialize_user(r) for r in rows]
    return {"items": items, "limit": limit, "offset": offset}


@router.get("/following", response_model=dict)
def list_following(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List users the current user follows."""
    _allow_feed_user(user)
    rows = db.execute(
        text("""
            SELECT u.id, u.name, u.email, u.profile_photo_url, u.role, u.student_subtype, uf.created_at
            FROM user_follows uf
            JOIN users u ON u.id = uf.following_id
            WHERE uf.follower_id = :uid
            ORDER BY uf.created_at DESC
            LIMIT :limit OFFSET :offset
        """),
        {"uid": user.id, "limit": limit, "offset": offset},
    ).fetchall()
    items = [_serialize_user(r) for r in rows]
    return {"items": items, "limit": limit, "offset": offset}


@router.get("/connections", response_model=dict)
def list_connections(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user: User = Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List mutually connected users (in network)."""
    _allow_feed_user(user)
    rows = db.execute(
        text("""
            SELECT u.id, u.name, u.email, u.profile_photo_url, u.role, u.student_subtype
            FROM user_follows uf1
            JOIN user_follows uf2 ON uf1.following_id = uf2.follower_id AND uf1.follower_id = uf2.following_id
            JOIN users u ON u.id = uf1.following_id
            WHERE uf1.follower_id = :uid
            ORDER BY u.name
            LIMIT :limit OFFSET :offset
        """),
        {"uid": user.id, "limit": limit, "offset": offset},
    ).fetchall()
    items = [_serialize_user(r) for r in rows]
    return {"items": items, "limit": limit, "offset": offset}
