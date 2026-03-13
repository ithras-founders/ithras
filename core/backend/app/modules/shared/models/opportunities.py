"""Opportunities domain models: SavedOpportunity, CompanyFollow.

JobPosting lives in placement (jobs table). This module adds discovery/save entities.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base
import datetime


class SavedOpportunity(Base):
    """User bookmark for a job/opportunity."""
    __tablename__ = "saved_opportunities"
    __table_args__ = (
        UniqueConstraint("user_id", "job_id", name="uq_saved_opportunity_user_job"),
        {"info": {"domain": "opportunities"}},
    )

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class CompanyFollow(Base):
    """User follows a company for updates."""
    __tablename__ = "company_follows"
    __table_args__ = (
        UniqueConstraint("user_id", "company_id", name="uq_company_follow_user_company"),
        {"info": {"domain": "opportunities"}},
    )

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
