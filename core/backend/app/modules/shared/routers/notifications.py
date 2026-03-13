"""
Notifications API Router
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import uuid
from ...shared import models, database, schemas
from ...shared.cache import get_cached, cache_response, invalidate_pattern
from ...shared.auth import get_current_user

router = APIRouter(prefix="/api/v1/notifications", tags=["notifications"])


class NotificationPreferenceUpdate(BaseModel):
    channel: Optional[str] = None
    notification_type: Optional[str] = None
    enabled: Optional[bool] = None

CACHE_TTL_NOTIFICATIONS = 30

def _notifications_cache_key(user_id: str, is_read: Optional[bool]) -> str:
    return f"notifications:{user_id}:{is_read}"

@router.get("/", response_model=List[schemas.NotificationSchema])
def get_notifications(
    user_id: str = Query(...),
    is_read: Optional[bool] = Query(None),
    db: Session = Depends(database.get_db)
):
    """Get notifications for a user"""
    cache_key = _notifications_cache_key(user_id, is_read)
    cached = get_cached(cache_key)
    if cached is not None:
        return cached
    query = db.query(models.Notification).filter(models.Notification.user_id == user_id)
    
    if is_read is not None:
        query = query.filter(models.Notification.is_read == is_read)
    
    notifications = query.order_by(models.Notification.created_at.desc()).all()
    result = [schemas.NotificationSchema.model_validate(n) for n in notifications]
    cache_response(cache_key, [r.model_dump() for r in result], CACHE_TTL_NOTIFICATIONS)
    return result

@router.get("/unread-count")
def get_unread_count(user_id: str = Query(...), db: Session = Depends(database.get_db)):
    """Get unread notification count"""
    count = db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).count()
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=schemas.NotificationSchema)
def mark_notification_read(notification_id: str, db: Session = Depends(database.get_db)):
    """Mark a notification as read"""
    db_notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not db_notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    db_notification.is_read = True
    db.commit()
    db.refresh(db_notification)
    invalidate_pattern("notifications:*")
    return db_notification

@router.delete("/{notification_id}")
def delete_notification(
    notification_id: str,
    user_id: str = Query(..., description="Must match notification owner"),
    db: Session = Depends(database.get_db),
):
    """Delete a notification. User-scoped: user_id must match notification owner."""
    notif = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == user_id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    db.delete(notif)
    db.commit()
    invalidate_pattern("notifications:*")
    return {"message": "Notification deleted"}


@router.put("/read-all")
def mark_all_notifications_read(user_id: str = Query(...), db: Session = Depends(database.get_db)):
    """Mark all notifications as read for a user"""
    db.query(models.Notification).filter(
        models.Notification.user_id == user_id,
        models.Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    invalidate_pattern("notifications:*")
    return {"message": "All notifications marked as read"}

@router.get("/preferences")
def get_notification_preferences(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get notification preferences for the current user."""
    prefs = (
        db.query(models.NotificationPreference)
        .filter(models.NotificationPreference.user_id == current_user.id)
        .all()
    )
    return {"items": [{"id": p.id, "channel": p.channel, "notification_type": p.notification_type, "enabled": p.enabled} for p in prefs]}


@router.put("/preferences")
def update_notification_preferences(
    data: NotificationPreferenceUpdate,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create or update a notification preference."""
    channel = data.channel or "in_app"
    pref = (
        db.query(models.NotificationPreference)
        .filter(
            models.NotificationPreference.user_id == current_user.id,
            models.NotificationPreference.channel == channel,
        )
        .first()
    )
    if not pref:
        pref = models.NotificationPreference(
            id=f"np_{uuid.uuid4().hex[:12]}",
            user_id=current_user.id,
            channel=channel,
            notification_type=data.notification_type,
            enabled=data.enabled if data.enabled is not None else True,
        )
        db.add(pref)
    elif data.enabled is not None:
        pref.enabled = data.enabled
    db.commit()
    db.refresh(pref)
    return {"id": pref.id, "channel": pref.channel, "notification_type": pref.notification_type, "enabled": pref.enabled}


@router.post("/", response_model=schemas.NotificationSchema)
def create_notification(
    notification_data: schemas.NotificationCreateSchema,
    db: Session = Depends(database.get_db)
):
    """Create a new notification"""
    notification_id = f"notif_{uuid.uuid4().hex[:12]}"
    
    db_notification = models.Notification(
        id=notification_id,
        user_id=notification_data.user_id,
        recipient_type=notification_data.recipient_type,
        notification_type=notification_data.notification_type,
        title=notification_data.title,
        message=notification_data.message,
        data=notification_data.data or {},
        is_read=False
    )
    
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    invalidate_pattern("notifications:*")
    return db_notification
