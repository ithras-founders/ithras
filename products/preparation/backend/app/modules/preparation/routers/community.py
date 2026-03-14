"""Structured community: posts and comments."""
import os
import sys
import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from fastapi import APIRouter, Depends, HTTPException, Query

# Resolve core backend path: from routers/ go up to repo root then core/backend
_core = os.path.join(os.path.dirname(__file__), "../../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user, _user_has_permission
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/prep-community", tags=["prep-community"])

ALLOWED_CHANNELS = {"CAT_STRATEGY", "SCHOOL_PI_IIMA", "SCHOOL_PI_IIMB", "SCHOOL_PI_XLRI", "WAT_REVIEW", "GD_REVIEW"}

CHANNELS_CONFIG = [
    {"code": "CAT_STRATEGY", "name": "CAT Strategy", "description": "CAT prep and percentile strategy"},
    {"code": "SCHOOL_PI_IIMA", "name": "IIM Ahmedabad PI", "description": "IIMA interview questions and prep"},
    {"code": "SCHOOL_PI_IIMB", "name": "IIM Bangalore PI", "description": "IIMB interview questions and prep"},
    {"code": "SCHOOL_PI_XLRI", "name": "XLRI PI", "description": "XLRI interview questions and prep"},
    {"code": "WAT_REVIEW", "name": "WAT Review", "description": "Written Ability Test topics and feedback"},
    {"code": "GD_REVIEW", "name": "GD Review", "description": "Group Discussion prompts and structure"},
]


def _channel_to_schema(ch, db, user_id, member_count=None, is_joined=None):
    """Build channel schema from DB model or config dict."""
    if hasattr(ch, "id"):
        mc = member_count
        if mc is None and hasattr(ch, "members"):
            mc = len(ch.members) if ch.members else 0
        elif mc is None:
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
        return schemas.PrepCommunityChannelSchema(
            id=ch.id,
            code=ch.code,
            name=ch.name,
            description=ch.description,
            image_url=getattr(ch, "image_url", None),
            community_id=ch.community_id,
            community_name=ch.community.name if ch.community else None,
            visibility=getattr(ch, "visibility", None) or "public",
            member_count=mc,
            is_joined=ij,
        )
    return schemas.PrepCommunityChannelSchema(**{**ch, "id": None, "image_url": None, "community_id": None, "community_name": None, "member_count": 0, "is_joined": False})


def _community_to_schema(c, db, user_id):
    """Build community schema from DB model."""
    member_count = db.query(func.count(models.PrepCommunityMember.user_id)).filter(
        models.PrepCommunityMember.community_id == c.id
    ).scalar() or 0
    is_joined = False
    if user_id:
        is_joined = db.query(models.PrepCommunityMember).filter(
            models.PrepCommunityMember.community_id == c.id,
            models.PrepCommunityMember.user_id == user_id,
        ).first() is not None
    channels = [_channel_to_schema(ch, db, user_id) for ch in sorted(c.channels, key=lambda x: x.sort_order)]
    return schemas.PrepCommunitySchema(
        id=c.id,
        code=c.code,
        name=c.name,
        description=c.description,
        cover_image_url=c.cover_image_url,
        sort_order=c.sort_order or 0,
        member_count=member_count,
        is_joined=is_joined,
        channels=channels,
    )


@router.get("/mentors")
def list_mentors(
    limit: int = Query(5, ge=1, le=20),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Top mentors by verification score. Placeholder - returns empty list until mentor/verification data is available."""
    return {"items": []}


@router.get("/communities", response_model=list[schemas.PrepCommunitySchema])
def list_communities(
    joined: bool | None = Query(None, description="Filter to user's joined communities only"),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List communities with cover, name, description, member_count, is_joined."""
    q = db.query(models.PrepCommunity).options(
        joinedload(models.PrepCommunity.channels)
    ).order_by(models.PrepCommunity.sort_order, models.PrepCommunity.name)
    if joined and current_user:
        sub = db.query(models.PrepCommunityMember.community_id).filter(
            models.PrepCommunityMember.user_id == current_user.id
        )
        q = q.filter(models.PrepCommunity.id.in_(sub))
    communities = q.all()
    return [_community_to_schema(c, db, current_user.id if current_user else None) for c in communities]


@router.get("/communities/{id_or_code}", response_model=schemas.PrepCommunitySchema)
def get_community(
    id_or_code: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get single community by id or code with channels."""
    community = db.query(models.PrepCommunity).options(
        joinedload(models.PrepCommunity.channels)
    ).filter(
        (models.PrepCommunity.id == id_or_code) | (models.PrepCommunity.code == id_or_code)
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    return _community_to_schema(community, db, current_user.id if current_user else None)


@router.post("/communities/{community_id}/join")
def join_community(
    community_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Join a community."""
    community = db.query(models.PrepCommunity).filter(
        (models.PrepCommunity.id == community_id) | (models.PrepCommunity.code == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    existing = db.query(models.PrepCommunityMember).filter(
        models.PrepCommunityMember.community_id == community.id,
        models.PrepCommunityMember.user_id == current_user.id,
    ).first()
    if existing:
        return {"status": "already_joined", "community_id": community.id}
    member = models.PrepCommunityMember(user_id=current_user.id, community_id=community.id)
    db.add(member)
    db.commit()
    return {"status": "joined", "community_id": community.id}


@router.delete("/communities/{community_id}/leave")
def leave_community(
    community_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Leave a community."""
    community = db.query(models.PrepCommunity).filter(
        (models.PrepCommunity.id == community_id) | (models.PrepCommunity.code == community_id)
    ).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    db.query(models.PrepCommunityMember).filter(
        models.PrepCommunityMember.community_id == community.id,
        models.PrepCommunityMember.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"status": "left", "community_id": community.id}


@router.post("/channels/{channel_id}/join")
def join_channel(
    channel_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Join a channel."""
    channel = db.query(models.PrepCommunityChannel).filter(
        (models.PrepCommunityChannel.id == channel_id) | (models.PrepCommunityChannel.code == channel_id)
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    existing = db.query(models.PrepChannelMember).filter(
        models.PrepChannelMember.channel_id == channel.id,
        models.PrepChannelMember.user_id == current_user.id,
    ).first()
    if existing:
        return {"status": "already_joined", "channel_id": channel.id}
    member = models.PrepChannelMember(user_id=current_user.id, channel_id=channel.id)
    db.add(member)
    db.commit()
    return {"status": "joined", "channel_id": channel.id}


@router.delete("/channels/{channel_id}/leave")
def leave_channel(
    channel_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Leave a channel."""
    channel = db.query(models.PrepCommunityChannel).filter(
        (models.PrepCommunityChannel.id == channel_id) | (models.PrepCommunityChannel.code == channel_id)
    ).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    db.query(models.PrepChannelMember).filter(
        models.PrepChannelMember.channel_id == channel.id,
        models.PrepChannelMember.user_id == current_user.id,
    ).delete()
    db.commit()
    return {"status": "left", "channel_id": channel.id}


@router.get("/channels", response_model=list[schemas.PrepCommunityChannelSchema])
def list_channels(
    community_id: str | None = Query(None, description="Filter by community id or code"),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List channels from DB. Falls back to config if DB has no channels."""
    q = db.query(models.PrepCommunityChannel).options(
        joinedload(models.PrepCommunityChannel.community)
    ).join(models.PrepCommunity)
    if community_id:
        q = q.filter(
            (models.PrepCommunity.id == community_id) | (models.PrepCommunity.code == community_id)
        )
    q = q.order_by(models.PrepCommunity.sort_order, models.PrepCommunityChannel.sort_order, models.PrepCommunityChannel.name)
    channels = q.all()
    if channels:
        return [_channel_to_schema(ch, db, current_user.id if current_user else None) for ch in channels]
    return [schemas.PrepCommunityChannelSchema(**c) for c in CHANNELS_CONFIG]


@router.get("/posts", response_model=list[schemas.PrepCommunityPostSchema])
def list_posts(
    channel: str | None = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List community posts (ACTIVE only). Pinned first, then by date."""
    q = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.status == "ACTIVE")
    if channel:
        q = q.filter(models.PrepCommunityPost.channel == channel)
    return (
        q.order_by(
            models.PrepCommunityPost.pinned_at.desc().nullslast(),
            models.PrepCommunityPost.created_at.desc(),
        )
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.post("/posts", response_model=schemas.PrepCommunityPostSchema)
def create_post(
    data: schemas.PrepCommunityPostCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create a community post. Requires mandatory channel and tags."""
    if data.channel not in ALLOWED_CHANNELS:
        raise HTTPException(status_code=400, detail=f"Channel must be one of: {', '.join(sorted(ALLOWED_CHANNELS))}")
    post_id = f"pst_{uuid.uuid4().hex[:12]}"
    post = models.PrepCommunityPost(
        id=post_id,
        channel=data.channel,
        author_id=current_user.id,
        title=data.title,
        body=data.body,
        tags=data.tags or [],
    )
    db.add(post)
    log_audit(db, user_id=current_user.id, action="PREP_POST_CREATED", entity_type="prep_community_post", entity_id=post_id)
    db.commit()
    db.refresh(post)
    return post


@router.get("/posts/{post_id}", response_model=schemas.PrepCommunityPostSchema)
def get_post(
    post_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get a single post. Returns 404 if HIDDEN/DELETED (unless caller is moderator/admin)."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status in ("HIDDEN", "DELETED"):
        can_mod = _user_has_permission(db, current_user.id, "preparation.community.moderate") or _user_has_permission(db, current_user.id, "preparation.community.admin")
        if not can_mod:
            raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.get("/channels/{channel_code}/leaderboard")
def get_channel_leaderboard(
    channel_code: str,
    limit: int = Query(10, ge=1, le=50),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Top contributors in a channel by posts + comments count."""
    if channel_code not in ALLOWED_CHANNELS:
        raise HTTPException(status_code=404, detail="Channel not found")
    # Aggregate: count posts and comments per author for this channel
    from sqlalchemy import text
    rows = db.execute(
        text("""
            WITH post_authors AS (
                SELECT author_id AS user_id, 1 AS contribution FROM prep_community_posts
                WHERE channel = :channel AND status = 'ACTIVE'
            ),
            comment_authors AS (
                SELECT c.author_id AS user_id, 1 AS contribution
                FROM prep_community_comments c
                JOIN prep_community_posts p ON p.id = c.post_id
                WHERE p.channel = :channel AND c.status = 'ACTIVE' AND p.status = 'ACTIVE'
            ),
            combined AS (
                SELECT user_id, SUM(contribution) AS score FROM (
                    SELECT * FROM post_authors UNION ALL SELECT * FROM comment_authors
                ) x GROUP BY user_id
            )
            SELECT c.user_id, u.name, c.score
            FROM combined c
            JOIN users u ON u.id = c.user_id
            ORDER BY c.score DESC
            LIMIT :limit
        """),
        {"channel": channel_code, "limit": limit},
    ).fetchall()
    items = [{"user_id": r[0], "name": r[1] or "Anonymous", "score": r[2]} for r in rows]
    return {"items": items}


@router.get("/posts/{post_id}/comments", response_model=list[schemas.PrepCommunityCommentSchema])
def list_comments(
    post_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List comments (replies) on a post. ACTIVE only."""
    return (
        db.query(models.PrepCommunityComment)
        .filter(
            models.PrepCommunityComment.post_id == post_id,
            models.PrepCommunityComment.status == "ACTIVE",
        )
        .order_by(models.PrepCommunityComment.created_at)
        .all()
    )


@router.post("/posts/{post_id}/comments", response_model=schemas.PrepCommunityCommentSchema)
def create_comment(
    post_id: str,
    data: schemas.PrepCommunityCommentCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Add comment (reply) to post."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.status != "ACTIVE":
        raise HTTPException(status_code=400, detail="Cannot comment on this post")
    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    comment = models.PrepCommunityComment(
        id=comment_id,
        post_id=post_id,
        author_id=current_user.id,
        body=data.body,
    )
    db.add(comment)
    log_audit(db, user_id=current_user.id, action="PREP_COMMENT_CREATED", entity_type="prep_community_comment", entity_id=comment_id)
    db.commit()
    db.refresh(comment)
    return comment
