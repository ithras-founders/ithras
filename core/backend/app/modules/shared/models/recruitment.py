"""Recruitment domain models: TalentPool, TalentPoolMember, SavedSearch.


JobProfile lives in job_profiles table (raw SQL in recruitment-lateral).
Shortlist lives in placement.
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from ..database import Base
import datetime


class TalentPool(Base):
    """Recruiter talent pool for grouping candidates."""
    __tablename__ = "talent_pools"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class TalentPoolMember(Base):
    """Candidate membership in a talent pool."""
    __tablename__ = "talent_pool_members"
    id = Column(String, primary_key=True)
    pool_id = Column(String, ForeignKey("talent_pools.id", ondelete="CASCADE"), nullable=False, index=True)
    candidate_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    added_at = Column(DateTime, default=datetime.datetime.utcnow)


class SavedSearch(Base):
    """Saved search criteria for recruiters."""
    __tablename__ = "saved_searches"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    criteria = Column(JSON, nullable=True)  # filters, query, etc.
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
