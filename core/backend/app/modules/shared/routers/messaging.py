"""Messaging API: conversations, messages, inbox."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from .. import models, database
from ..auth import get_current_user

router = APIRouter(prefix="/api/v1/messaging", tags=["messaging"])


class SendMessageRequest(BaseModel):
    body: str


@router.get("/conversations")
def list_conversations(
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """List conversations the current user participates in."""
    participant_ids = (
        db.query(models.ConversationParticipant.conversation_id)
        .filter(models.ConversationParticipant.user_id == current_user.id)
        .all()
    )
    conv_ids = [p[0] for p in participant_ids]
    if not conv_ids:
        return {"items": []}
    convs = db.query(models.Conversation).filter(models.Conversation.id.in_(conv_ids)).order_by(models.Conversation.updated_at.desc()).all()
    items = []
    for c in convs:
        other = (
            db.query(models.ConversationParticipant)
            .filter(models.ConversationParticipant.conversation_id == c.id, models.ConversationParticipant.user_id != current_user.id)
            .first()
        )
        last_msg = db.query(models.Message).filter(models.Message.conversation_id == c.id).order_by(models.Message.created_at.desc()).first()
        other_user = db.query(models.User).filter(models.User.id == other.user_id).first() if other else None
        other_name = (other_user.name or other_user.email) if other_user else None
        items.append({
            "id": c.id,
            "updated_at": c.updated_at,
            "other_user_id": other.user_id if other else None,
            "other_user_name": other_name,
            "last_message": last_msg.body[:80] + "..." if last_msg and len(last_msg.body) > 80 else (last_msg.body if last_msg else None),
        })
    return {"items": items}


@router.post("/conversations/direct/{other_user_id}")
def get_or_create_direct(
    other_user_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get or create a direct conversation with another user."""
    if other_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot message yourself")
    other = db.query(models.User).filter(models.User.id == other_user_id).first()
    if not other:
        raise HTTPException(status_code=404, detail="User not found")
    # Find existing conversation
    my_convs = db.query(models.ConversationParticipant.conversation_id).filter(models.ConversationParticipant.user_id == current_user.id).all()
    my_conv_ids = [c[0] for c in my_convs]
    their_conv = (
        db.query(models.ConversationParticipant.conversation_id)
        .filter(
            models.ConversationParticipant.user_id == other_user_id,
            models.ConversationParticipant.conversation_id.in_(my_conv_ids),
        )
        .first()
    )
    if their_conv:
        return {"id": their_conv[0], "created": False}
    conv_id = f"conv_{uuid.uuid4().hex[:16]}"
    db.add(models.Conversation(id=conv_id))
    db.add(models.ConversationParticipant(id=f"cp_{uuid.uuid4().hex[:12]}", conversation_id=conv_id, user_id=current_user.id))
    db.add(models.ConversationParticipant(id=f"cp_{uuid.uuid4().hex[:12]}", conversation_id=conv_id, user_id=other_user_id))
    db.commit()
    return {"id": conv_id, "created": True}


@router.get("/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: str,
    limit: int = Query(50, ge=1, le=100),
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Get messages in a conversation."""
    part = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == current_user.id,
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant")
    msgs = (
        db.query(models.Message)
        .filter(models.Message.conversation_id == conversation_id)
        .order_by(models.Message.created_at.desc())
        .limit(limit)
        .all()
    )
    msgs = list(reversed(msgs))
    return {"items": [{"id": m.id, "sender_id": m.sender_id, "body": m.body, "created_at": m.created_at} for m in msgs]}


@router.post("/conversations/{conversation_id}/messages")
def send_message(
    conversation_id: str,
    data: SendMessageRequest,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Send a message in a conversation."""
    part = db.query(models.ConversationParticipant).filter(
        models.ConversationParticipant.conversation_id == conversation_id,
        models.ConversationParticipant.user_id == current_user.id,
    ).first()
    if not part:
        raise HTTPException(status_code=403, detail="Not a participant")
    msg_id = f"msg_{uuid.uuid4().hex[:16]}"
    msg = models.Message(id=msg_id, conversation_id=conversation_id, sender_id=current_user.id, body=data.body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return {"id": msg.id, "body": msg.body, "created_at": msg.created_at}
