"""CV domain models: CV, CVVersion, CVTemplate, CVTemplateVisibilityOverride, PortfolioAsset

Templates can be in DB (cv_templates) or JSON files on disk.
Visibility overrides are stored in cv_template_visibility_overrides.
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class CVTemplateVisibilityOverride(Base):
    """Per-template visibility overrides. When present, replaces JSON template visibility."""
    __tablename__ = "cv_template_visibility_overrides"
    __table_args__ = {"info": {"domain": "cv"}}

    template_id = Column(String, primary_key=True)
    institution_ids = Column(JSON, nullable=True)  # null = use template default, [] = all
    batch_ids = Column(JSON, nullable=True)
    program_ids = Column(JSON, nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class CVTemplate(Base):
    """CV template metadata (maps to cv_templates table)."""
    __tablename__ = "cv_templates"
    __table_args__ = {"info": {"domain": "cv"}}

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String, default="PUBLISHED")
    config = Column(JSON, nullable=True)
    college_slug = Column(String, nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class CV(Base):
    __tablename__ = "cvs"
    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    template_id = Column(String, nullable=False, index=True)
    data = Column(JSON, default={})  # CV data filled by student
    pdf_url = Column(String)  # Generated PDF URL
    status = Column(String, default="DRAFT")  # DRAFT, SUBMITTED, VERIFIED, REJECTED
    verified_by = Column(String, ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verification_notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    candidate = relationship("User", foreign_keys=[candidate_id])


class CVVersion(Base):
    """Version history for CVs (audit trail)."""
    __tablename__ = "cv_versions"
    __table_args__ = {"info": {"domain": "cv"}}

    id = Column(String, primary_key=True)
    cv_id = Column(String, ForeignKey("cvs.id", ondelete="CASCADE"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    data = Column(JSON, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    cv = relationship("CV", foreign_keys=[cv_id])


class PortfolioAsset(Base):
    """User portfolio asset (file or link) attachable to CV/application."""
    __tablename__ = "portfolio_assets"
    __table_args__ = {"info": {"domain": "cv"}}

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    asset_type = Column(String, nullable=False)  # file, link
    url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
