"""Messaging domain: Conversation, Message."""
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from ..database import Base
import datetime


class Conversation(Base):
    """1:1 or group conversation thread."""
    __tablename__ = "conversations"
    id = Column(String, primary_key=True)
    conversation_type = Column(String, default="DIRECT")  # DIRECT, GROUP
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class ConversationParticipant(Base):
    """Participant in a conversation."""
    __tablename__ = "conversation_participants"
    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)


class Message(Base):
    """Message in a conversation."""
    __tablename__ = "messages"
    id = Column(String, primary_key=True)
    conversation_id = Column(String, ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    body = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
