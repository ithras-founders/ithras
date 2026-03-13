"""Placement domain models: Cycle, JobPosting, Shortlist, Workflow, Application, HistoricalHire"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class JobPosting(Base):
    __tablename__ = "jobs"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"))
    cycle_id = Column(String, ForeignKey("cycles.id"), nullable=True, index=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    title = Column(String)
    sector = Column(String)
    slot = Column(String)
    slot_rank = Column(Integer, nullable=True)  # 0=Day0, 1=Day1, etc. For slot ordering
    fixed_comp = Column(Float)
    variable_comp = Column(Float)
    esops_vested = Column(Float)
    joining_bonus = Column(Float)
    performance_bonus = Column(Float)
    is_top_decile = Column(Boolean, default=False)
    opening_date = Column(DateTime)
    jd_status = Column(String)  # Draft, Submitted, Approved
    min_cgpa = Column(Float, nullable=True)
    max_backlogs = Column(Integer, nullable=True)
    cycle = relationship("Cycle", foreign_keys=[cycle_id])
    institution = relationship("Institution", foreign_keys=[institution_id])


class Shortlist(Base):
    __tablename__ = "shortlists"
    id = Column(String, primary_key=True)
    candidate_id = Column(String, ForeignKey("users.id"), index=True)
    job_id = Column(String, ForeignKey("jobs.id"), index=True)
    status = Column(String)  # Active, Held, Accepted, Dropped
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)


class Cycle(Base):
    __tablename__ = "cycles"
    id = Column(String, primary_key=True)
    name = Column(String)
    type = Column(String)  # FINAL, SUMMER
    category = Column(String)  # CURRENT, HISTORICAL
    status = Column(String)  # DRAFT, APPLICATIONS_OPEN, CLOSED, etc.
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    institution = relationship("Institution", foreign_keys=[institution_id])


class HistoricalHire(Base):
    __tablename__ = "historical_hires"
    id = Column(String, primary_key=True)
    name = Column(String)
    company_id = Column(String, ForeignKey("companies.id"))
    year = Column(Integer)
    role = Column(String)
    cycle_id = Column(String, ForeignKey("cycles.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class WorkflowTemplate(Base):
    __tablename__ = "workflow_templates"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    template_type = Column(String, default="PLACEMENT_CYCLE")  # GOVERNANCE | PLACEMENT_CYCLE
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    stages = relationship("WorkflowTemplateStage", back_populates="template", cascade="all, delete-orphan")
    institution = relationship("Institution", foreign_keys=[institution_id])


class WorkflowTemplateStage(Base):
    __tablename__ = "workflow_template_stages"
    id = Column(String, primary_key=True)
    template_id = Column(String, ForeignKey("workflow_templates.id"), nullable=False)
    stage_number = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    stage_type = Column(String, default="APPLICATION")
    is_approval_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    template = relationship("WorkflowTemplate", foreign_keys=[template_id], back_populates="stages")


class Workflow(Base):
    __tablename__ = "workflows"
    id = Column(String, primary_key=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="DRAFT")  # DRAFT, ACTIVE, COMPLETED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    company = relationship("Company", foreign_keys=[company_id])
    job = relationship("JobPosting", foreign_keys=[job_id])
    institution = relationship("Institution", foreign_keys=[institution_id])
    creator = relationship("User", foreign_keys=[created_by])


class WorkflowStage(Base):
    __tablename__ = "workflow_stages"
    id = Column(String, primary_key=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    stage_number = Column(Integer, nullable=False)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    stage_type = Column(String, default="APPLICATION")  # APPLICATION, SHORTLIST, INTERVIEW, OFFER, etc.
    is_approval_required = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    workflow = relationship("Workflow", foreign_keys=[workflow_id])


class Application(Base):
    __tablename__ = "applications"
    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id"), nullable=False)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    cv_id = Column(String, ForeignKey("cvs.id"), nullable=False)
    current_stage_id = Column(String, ForeignKey("workflow_stages.id"), nullable=True)
    status = Column(String, default="SUBMITTED")  # SUBMITTED, IN_PROGRESS, SHORTLISTED, REJECTED, SELECTED
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    student = relationship("User", foreign_keys=[student_id])
    job = relationship("JobPosting", foreign_keys=[job_id])
    workflow = relationship("Workflow", foreign_keys=[workflow_id])
    cv = relationship("CV", foreign_keys=[cv_id])
    current_stage = relationship("WorkflowStage", foreign_keys=[current_stage_id])


class ApplicationStageProgress(Base):
    __tablename__ = "application_stage_progress"
    id = Column(String, primary_key=True)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False)
    stage_id = Column(String, ForeignKey("workflow_stages.id"), nullable=False)
    status = Column(String, default="PENDING")  # PENDING, IN_PROGRESS, PASSED, FAILED
    moved_at = Column(DateTime, default=datetime.datetime.utcnow)
    moved_by = Column(String, ForeignKey("users.id"), nullable=True)
    application = relationship("Application", foreign_keys=[application_id])
    stage = relationship("WorkflowStage", foreign_keys=[stage_id])
    mover = relationship("User", foreign_keys=[moved_by])


class ApplicationTimelineEvent(Base):
    """Explicit timeline events for application (stage moves, status changes, etc.)."""
    __tablename__ = "application_timeline_events"
    id = Column(String, primary_key=True)
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String, nullable=False)  # SUBMITTED, STAGE_MOVED, OFFER_RECEIVED, etc.
    payload = Column(JSON, nullable=True)
    actor_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    application = relationship("Application", foreign_keys=[application_id])
    actor = relationship("User", foreign_keys=[actor_id])


class ApplicationAttachment(Base):
    """Document attachments for an application (cover letter, extra docs)."""
    __tablename__ = "application_attachments"
    id = Column(String, primary_key=True)
    application_id = Column(String, ForeignKey("applications.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    asset_type = Column(String, default="document")
    url = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    application = relationship("Application", foreign_keys=[application_id])


class EligibilityRule(Base):
    """Cycle or job-level eligibility rule."""
    __tablename__ = "eligibility_rules"
    id = Column(String, primary_key=True)
    cycle_id = Column(String, ForeignKey("cycles.id", ondelete="CASCADE"), nullable=True, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    rule_type = Column(String, nullable=False)  # MIN_CGPA, MAX_BACKLOGS, BATCH_IDS, PROGRAM_IDS
    value = Column(JSON, nullable=True)  # e.g. {"min": 7.0} or {"batch_ids": ["b1","b2"]}
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class EligibilityOverrideRequest(Base):
    """Placement team request to override eligibility for a student."""
    __tablename__ = "eligibility_override_requests"
    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    cycle_id = Column(String, ForeignKey("cycles.id", ondelete="CASCADE"), nullable=True, index=True)
    requested_by = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reason = Column(String, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    decided_by = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class PlacementOutcome(Base):
    """Placement outcome record for a student (accepted offer, joined, etc.)."""
    __tablename__ = "placement_outcomes"
    id = Column(String, primary_key=True)
    student_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    offer_id = Column(String, ForeignKey("offers.id", ondelete="SET NULL"), nullable=True, index=True)
    company_id = Column(String, ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True, index=True)
    cycle_id = Column(String, ForeignKey("cycles.id", ondelete="SET NULL"), nullable=True, index=True)
    outcome_type = Column(String, nullable=False)  # OFFER_ACCEPTED, JOINED, etc.
    ctc = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Offer(Base):
    __tablename__ = "offers"
    id = Column(String, primary_key=True)
    application_id = Column(String, ForeignKey("applications.id"), nullable=False, index=True)
    candidate_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False, index=True)
    job_id = Column(String, ForeignKey("jobs.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="PENDING")  # PENDING, ACCEPTED, REJECTED, WITHDRAWN
    ctc = Column(Float, nullable=True)
    deadline = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)
    application = relationship("Application", foreign_keys=[application_id])
    candidate = relationship("User", foreign_keys=[candidate_id])
    company = relationship("Company", foreign_keys=[company_id])
    job = relationship("JobPosting", foreign_keys=[job_id])
