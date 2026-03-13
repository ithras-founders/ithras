"""Core domain models: Institution, User, Company, AuditLog"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class Institution(Base):
    __tablename__ = "institutions"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    tier = Column(String)  # Tier 1, Tier 2, Tier 3, Lateral
    location = Column(String)
    logo_url = Column(String, nullable=True)
    about = Column(Text, nullable=True)
    website = Column(String, nullable=True)
    founding_year = Column(Integer, nullable=True)
    student_count_range = Column(String, nullable=True)  # e.g. "1,001-5,000"
    onboarding_status = Column(String, default="FULLY_ONBOARDED")  # PRESENT_ONLY | FULLY_ONBOARDED
    features = Column(JSON, default=list)  # e.g. ["placement", "governance", "institution_admin"]
    allowed_roles = Column(JSON, default=list)  # e.g. ["CANDIDATE","PLACEMENT_TEAM","INSTITUTION_ADMIN",...]
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Program(Base):
    __tablename__ = "programs"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    institution = relationship("Institution", foreign_keys=[institution_id])
    batches = relationship("Batch", back_populates="program")


class Batch(Base):
    __tablename__ = "batches"
    id = Column(String, primary_key=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    program = relationship("Program", foreign_keys=[program_id], back_populates="batches")


class Company(Base):
    __tablename__ = "companies"
    id = Column(String, primary_key=True)
    name = Column(String)
    last_year_hires = Column(Integer, default=0)
    cumulative_hires_3y = Column(Integer, default=0)
    last_year_median_fixed = Column(Float)
    logo_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    headquarters = Column(String, nullable=True)
    founding_year = Column(Integer, nullable=True)
    onboarding_status = Column(String, default="ONBOARDED")  # deprecated: use status
    status = Column(String, default="PENDING", nullable=False)  # PENDING | VERIFIED | PARTNER
    allowed_roles = Column(JSON, default=list)  # e.g. ["RECRUITER"]


class BusinessUnit(Base):
    """Org-level subdivision (e.g. Engineering, Product, Sales)."""
    __tablename__ = "business_units"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    company = relationship("Company", foreign_keys=[company_id])


class CompanyFunction(Base):
    """Functional area / department (e.g. Engineering, Sales, Finance)."""
    __tablename__ = "company_functions"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    company = relationship("Company", foreign_keys=[company_id])


class CompanyDesignation(Base):
    """Job level / title (e.g. Associate, Manager, VP)."""
    __tablename__ = "company_designations"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    level = Column(Integer, nullable=True)  # sort order / hierarchy
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    company = relationship("Company", foreign_keys=[company_id])


class InstitutionDegree(Base):
    """Degree offered by institution (e.g. B.Tech, MBA, PhD)."""
    __tablename__ = "institution_degrees"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    degree_type = Column(String, nullable=True)  # UG, PG, PhD, DIPLOMA, CERTIFICATE
    program_id = Column(String, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    institution = relationship("Institution", foreign_keys=[institution_id])
    program = relationship("Program", foreign_keys=[program_id])


class InstitutionCertification(Base):
    """Certification offered by institution."""
    __tablename__ = "institution_certifications"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    issuing_body = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    institution = relationship("Institution", foreign_keys=[institution_id])


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    full_name = Column(String, nullable=True)  # Canonical display name; falls back to name
    phone = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    role = Column(String)  # CANDIDATE, RECRUITER, PT, OBSERVER, ADMIN (deprecated: use individual_*_links)
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)  # deprecated: use individual_organization_links
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True)  # deprecated: use individual_institution_links
    program_id = Column(String, ForeignKey("programs.id"), nullable=True)  # deprecated: use individual_institution_links
    batch_id = Column(String, ForeignKey("batches.id"), nullable=True, index=True)
    sector_preferences = Column(JSON, default=list)
    password_hash = Column(String, nullable=True)
    roll_number = Column(String, nullable=True)
    profile_photo_url = Column(String, nullable=True)
    student_subtype = Column(String, nullable=True)  # UNDERGRADUATE, GRADUATE, DOCTORAL, OTHERS (for CANDIDATE)
    is_verified = Column(Boolean, default=False, nullable=False)  # Placeholder for verification module; manually-entered users = False
    email_hidden = Column(Boolean, default=False, nullable=False)  # Hide email on public profile
    cgpa = Column(Float, nullable=True)  # For eligibility checks
    placement_status = Column(String, nullable=True)  # UNPLACED, PLACED
    backlog_count = Column(Integer, default=0)  # For eligibility (max backlogs)
    institution = relationship("Institution", foreign_keys=[institution_id])
    program = relationship("Program", foreign_keys=[program_id])
    batch = relationship("Batch", foreign_keys=[batch_id])
    institution_links = relationship("IndividualInstitutionLink", back_populates="user", foreign_keys="IndividualInstitutionLink.user_id")
    organization_links = relationship("IndividualOrganizationLink", back_populates="user", foreign_keys="IndividualOrganizationLink.user_id")


class IndividualInstitutionLink(Base):
    """Time-bound association: user + institution + degree (program) + role. Uses existing Program as degree."""
    __tablename__ = "individual_institution_links"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    institution_id = Column(String, ForeignKey("institutions.id", ondelete="CASCADE"), nullable=True, index=True)  # null = general (no institution)
    program_id = Column(String, ForeignKey("programs.id", ondelete="CASCADE"), nullable=True, index=True)  # degree
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # null = ongoing; when end_date < now -> alumni
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", foreign_keys=[user_id], back_populates="institution_links")
    institution = relationship("Institution", foreign_keys=[institution_id])
    program = relationship("Program", foreign_keys=[program_id])
    role = relationship("Role", foreign_keys=[role_id])


class IndividualOrganizationLink(Base):
    """Time-bound association: user + company + business_unit + role."""
    __tablename__ = "individual_organization_links"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    business_unit_id = Column(String, ForeignKey("business_units.id", ondelete="CASCADE"), nullable=True, index=True)
    role_id = Column(String, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=True)  # null = ongoing; when end_date < now -> alumni
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    user = relationship("User", foreign_keys=[user_id], back_populates="organization_links")
    company = relationship("Company", foreign_keys=[company_id])
    business_unit = relationship("BusinessUnit", foreign_keys=[business_unit_id])
    role = relationship("Role", foreign_keys=[role_id])


class UserProfileChangeRequest(Base):
    __tablename__ = "user_profile_change_requests"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    requested_by = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    requested_changes = Column(JSON, default=dict)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    reviewed_by = Column(String, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    user = relationship("User", foreign_keys=[user_id])
    requester = relationship("User", foreign_keys=[requested_by])
    reviewer = relationship("User", foreign_keys=[reviewed_by])
    institution = relationship("Institution", foreign_keys=[institution_id])


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    user_id = Column(String, index=True)
    action = Column(String, index=True)
    entity_type = Column(String, nullable=True, index=True)
    entity_id = Column(String, nullable=True)
    institution_id = Column(String, nullable=True, index=True)
    company_id = Column(String, nullable=True, index=True)
    details = Column(Text, nullable=True)
    metadata_ = Column("metadata", Text, nullable=True)
    ip_address = Column(String, nullable=True)
