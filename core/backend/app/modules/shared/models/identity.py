"""
Identity & Access domain models.
AuthSession for DB-backed sessions; User and Links imported from core.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base
import datetime

# Re-export from core for identity domain consumers
from .core import User, IndividualInstitutionLink, IndividualOrganizationLink


class AuthSession(Base):
    """DB-backed session for authentication. Maps to auth_sessions table."""
    __tablename__ = "auth_sessions"
    __table_args__ = {"info": {"domain": "identity"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", foreign_keys=[user_id])
