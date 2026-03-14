"""Community moderation endpoints - hide, pin, delete posts and comments."""
import os
import sys
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user, require_permission
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/prep-community/admin", tags=["prep-community-admin"])


def _require_moderate(user=Depends(get_current_user), db: Session = Depends(database.get_db)):
    """Require moderate or admin permission."""
    from app.modules.shared.auth import _user_has_permission
    if _user_has_permission(db, user.id, "preparation.community.moderate") or _user_has_permission(db, user.id, "preparation.community.admin") or _user_has_permission(db, user.id, "system.admin"):
        return user
    from fastapi import status
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Moderation permission required")


@router.get("/posts", response_model=list[schemas.PrepCommunityPostSchema])
def list_all_posts(
    channel: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status"),  # ACTIVE, HIDDEN, DELETED
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """List all posts including HIDDEN/DELETED. For moderation queue."""
    q = db.query(models.PrepCommunityPost)
    if channel:
        q = q.filter(models.PrepCommunityPost.channel == channel)
    if status_filter:
        q = q.filter(models.PrepCommunityPost.status == status_filter)
    return q.order_by(models.PrepCommunityPost.created_at.desc()).offset(offset).limit(limit).all()


@router.patch("/posts/{post_id}/hide", response_model=schemas.PrepCommunityPostSchema)
def hide_post(
    post_id: str,
    reason: str | None = Query(None),
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Hide a post (set status=HIDDEN)."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "HIDDEN"
    post.moderated_by = current_user.id
    post.moderated_at = datetime.datetime.utcnow()
    post.moderation_reason = reason
    log_audit(db, user_id=current_user.id, action="PREP_POST_HIDDEN", entity_type="prep_community_post", entity_id=post_id)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/posts/{post_id}/unhide", response_model=schemas.PrepCommunityPostSchema)
def unhide_post(
    post_id: str,
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Unhide a post (set status=ACTIVE)."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "ACTIVE"
    post.moderated_by = current_user.id
    post.moderated_at = datetime.datetime.utcnow()
    post.moderation_reason = None
    log_audit(db, user_id=current_user.id, action="PREP_POST_UNHIDDEN", entity_type="prep_community_post", entity_id=post_id)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/posts/{post_id}/pin", response_model=schemas.PrepCommunityPostSchema)
def pin_post(
    post_id: str,
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Pin a post to top of channel feed."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.pinned_at = datetime.datetime.utcnow()
    log_audit(db, user_id=current_user.id, action="PREP_POST_PINNED", entity_type="prep_community_post", entity_id=post_id)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/posts/{post_id}/unpin", response_model=schemas.PrepCommunityPostSchema)
def unpin_post(
    post_id: str,
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Unpin a post."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.pinned_at = None
    log_audit(db, user_id=current_user.id, action="PREP_POST_UNPINNED", entity_type="prep_community_post", entity_id=post_id)
    db.commit()
    db.refresh(post)
    return post


@router.delete("/posts/{post_id}", response_model=schemas.PrepCommunityPostSchema)
def delete_post(
    post_id: str,
    reason: str | None = Query(None),
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Soft delete a post (set status=DELETED)."""
    post = db.query(models.PrepCommunityPost).filter(models.PrepCommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    post.status = "DELETED"
    post.moderated_by = current_user.id
    post.moderated_at = datetime.datetime.utcnow()
    post.moderation_reason = reason
    log_audit(db, user_id=current_user.id, action="PREP_POST_DELETED", entity_type="prep_community_post", entity_id=post_id)
    db.commit()
    db.refresh(post)
    return post


@router.patch("/comments/{comment_id}/hide", response_model=schemas.PrepCommunityCommentSchema)
def hide_comment(
    comment_id: str,
    reason: str | None = Query(None),
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Hide a comment."""
    comment = db.query(models.PrepCommunityComment).filter(models.PrepCommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.status = "HIDDEN"
    comment.moderated_by = current_user.id
    comment.moderated_at = datetime.datetime.utcnow()
    comment.moderation_reason = reason
    log_audit(db, user_id=current_user.id, action="PREP_COMMENT_HIDDEN", entity_type="prep_community_comment", entity_id=comment_id)
    db.commit()
    db.refresh(comment)
    return comment


@router.patch("/comments/{comment_id}/unhide", response_model=schemas.PrepCommunityCommentSchema)
def unhide_comment(
    comment_id: str,
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Unhide a comment."""
    comment = db.query(models.PrepCommunityComment).filter(models.PrepCommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.status = "ACTIVE"
    comment.moderated_by = current_user.id
    comment.moderated_at = datetime.datetime.utcnow()
    comment.moderation_reason = None
    log_audit(db, user_id=current_user.id, action="PREP_COMMENT_UNHIDDEN", entity_type="prep_community_comment", entity_id=comment_id)
    db.commit()
    db.refresh(comment)
    return comment


@router.delete("/comments/{comment_id}", response_model=schemas.PrepCommunityCommentSchema)
def delete_comment(
    comment_id: str,
    reason: str | None = Query(None),
    current_user=Depends(_require_moderate),
    db: Session = Depends(database.get_db),
):
    """Soft delete a comment."""
    comment = db.query(models.PrepCommunityComment).filter(models.PrepCommunityComment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.status = "DELETED"
    comment.moderated_by = current_user.id
    comment.moderated_at = datetime.datetime.utcnow()
    comment.moderation_reason = reason
    log_audit(db, user_id=current_user.id, action="PREP_COMMENT_DELETED", entity_type="prep_community_comment", entity_id=comment_id)
    db.commit()
    db.refresh(comment)
    return comment
