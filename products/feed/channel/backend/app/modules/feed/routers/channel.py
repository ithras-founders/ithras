"""Feed channel management: visibility (private/public/restricted), filters."""
import os
import sys
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

_core = os.path.join(os.path.dirname(__file__), "../../../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import database, models
from app.modules.shared.auth import get_current_user

router = APIRouter(prefix="/api/v1/feed", tags=["feed-channel"])


class VisibilityUpdate(BaseModel):
    visibility: str  # public, private, restricted


def _user_can_access_channel(channel, user_id: str | None, db: Session) -> bool:
    """Check if user can access channel based on visibility."""
    vis = getattr(channel, "visibility", None) or "public"
    if vis == "public":
        return True
    if not user_id:
        return False
    if vis == "private":
        # Only channel members (or community admins) - simplified: members only
        return db.query(models.PrepChannelMember).filter(
            models.PrepChannelMember.channel_id == channel.id,
            models.PrepChannelMember.user_id == user_id,
        ).first() is not None
    if vis == "restricted":
        # Members of the community
        return db.query(models.PrepCommunityMember).filter(
            models.PrepCommunityMember.community_id == channel.community_id,
            models.PrepCommunityMember.user_id == user_id,
        ).first() is not None
    return True


def _channel_to_dict(ch, db, user_id, member_count=None, is_joined=None):
    from app.modules.shared import schemas
    from sqlalchemy import func
    mc = member_count
    if mc is None:
        mc = db.query(func.count(models.PrepChannelMember.user_id)).filter(
            models.PrepChannelMember.channel_id == ch.id
        ).scalar() or 0
    ij = is_joined
    if ij is None and user_id:
        ij = db.query(models.PrepChannelMember).filter(
            models.PrepChannelMember.channel_id == ch.id,
            models.PrepChannelMember.user_id == user_id,
        ).first() is not None
    elif ij is None:
        ij = False
    return {
        "id": ch.id,
        "code": ch.code,
        "name": ch.name,
        "description": ch.description or None,
        "image_url": getattr(ch, "image_url", None),
        "community_id": ch.community_id,
        "visibility": getattr(ch, "visibility", None) or "public",
        "member_count": mc,
        "is_joined": ij,
    }


@router.get("/channels")
def list_channels(
    visibility: str | None = Query(None, description="Filter by visibility: public, private, restricted"),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List feed channels with visibility. Filters by user access when visibility filter is used."""
    q = db.query(models.PrepCommunityChannel).options(
        joinedload(models.PrepCommunityChannel.community)
    ).order_by(models.PrepCommunityChannel.sort_order, models.PrepCommunityChannel.name)
    channels = q.all()
    user_id = current_user.id if current_user else None
    out = []
    for ch in channels:
        if visibility and (getattr(ch, "visibility", None) or "public") != visibility:
            continue
        if not _user_can_access_channel(ch, user_id, db):
            continue
        out.append(_channel_to_dict(ch, db, user_id))
    return {"items": out}


@router.put("/channels/{channel_id}/visibility")
def set_channel_visibility(
    channel_id: str,
    data: VisibilityUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Set channel visibility (public, private, restricted). Requires SYSTEM_ADMIN or community admin."""
    if data.visibility not in ("public", "private", "restricted"):
        raise HTTPException(status_code=400, detail="visibility must be public, private, or restricted")
    channel = db.query(models.PrepCommunityChannel).filter(
        (models.PrepCommunityChannel.id == channel_id) | (models.PrepCommunityChannel.code == channel_id)
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    if current_user.role != "SYSTEM_ADMIN":
        # TODO: check community admin
        raise HTTPException(status_code=403, detail="Only admins can change channel visibility")
    channel.visibility = data.visibility
    db.commit()
    return _channel_to_dict(channel, db, current_user.id)


@router.get("/channels/{channel_id}/posts")
def list_channel_posts(
    channel_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List posts in channel, filtered by visibility and user access."""
    channel = db.query(models.PrepCommunityChannel).filter(
        (models.PrepCommunityChannel.id == channel_id) | (models.PrepCommunityChannel.code == channel_id)
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    user_id = current_user.id if current_user else None
    if not _user_can_access_channel(channel, user_id, db):
        raise HTTPException(status_code=403, detail="Access denied to this channel")
    # Use prep_community_posts filtered by channel code
    posts = db.query(models.PrepCommunityPost).filter(
        models.PrepCommunityPost.channel == channel.code,
        models.PrepCommunityPost.status == "ACTIVE",
    ).order_by(
        models.PrepCommunityPost.pinned_at.desc().nullslast(),
        models.PrepCommunityPost.created_at.desc(),
    ).offset(offset).limit(limit).all()
    from app.modules.shared import schemas
    return {"items": [schemas.PrepCommunityPostSchema.model_validate(p) for p in posts]}
