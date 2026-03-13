"""Governance domain models: Policy, PolicyProposal, WorkflowApproval, Notification, JDSubmission"""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from ..database import Base
import datetime


class Policy(Base):
    __tablename__ = "policies"
    id = Column(String, primary_key=True)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=True, index=True)
    program_id = Column(String, ForeignKey("programs.id"), nullable=True, index=True)
    governance_type = Column(String, default="UNIVERSAL")  # UNIVERSAL, CLUSTER_COHORT, DAY_PROCESS, ROLLING
    status = Column(String)  # ACTIVE, PROPOSED, DRAFT, TEMPLATE
    is_template = Column(Boolean, default=False)  # True if this is a reusable template
    template_name = Column(String, nullable=True)  # Name for template identification
    cycle_id = Column(String, ForeignKey("cycles.id"), nullable=True)  # Associated cycle (null for templates)
    levels = Column(JSON, default=[])  # List of policy levels
    stages = Column(JSON, default=[])  # List of policy stages
    global_caps = Column(JSON, default={})  # maxShortlists, distribution
    student_statuses = Column(JSON, default=[])  # List of student statuses with restrictions
    stage_restrictions = Column(JSON, default={})  # { stageId: { levelName: { offers: [], shortlists: [] } } }
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    institution = relationship("Institution", foreign_keys=[institution_id])
    program = relationship("Program", foreign_keys=[program_id])


class PolicyProposal(Base):
    __tablename__ = "policy_proposals"
    id = Column(String, primary_key=True)
    policy_id = Column(String, ForeignKey("policies.id"))
    proposed_by = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    changes = Column(JSON, default={})
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED


class WorkflowApproval(Base):
    __tablename__ = "workflow_approvals"
    id = Column(String, primary_key=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    approval_type = Column(String, nullable=False)  # JD_SUBMISSION, STAGE_PROGRESSION, etc.
    requested_by = Column(String, ForeignKey("users.id"), nullable=False)
    requested_data = Column(JSON, default={})  # Form data, selected students, etc.
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    workflow = relationship("Workflow", foreign_keys=[workflow_id])
    company = relationship("Company", foreign_keys=[company_id])
    requester = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])


class NotificationPreference(Base):
    """User notification delivery preferences."""
    __tablename__ = "notification_preferences"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    channel = Column(String, default="in_app")  # in_app, email, push
    notification_type = Column(String, nullable=True)  # null = all types
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    recipient_type = Column(String, default="USER")  # USER, COMPANY, INSTITUTION
    notification_type = Column(String, nullable=False)  # WORKFLOW_REQUEST, APPROVAL_REQUIRED, etc.
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    data = Column(JSON, default={})
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    recipient = relationship("User", foreign_keys=[user_id])


class ApplicationRequest(Base):
    """Placement team request to open a workflow for applications. Recruiter must approve."""
    __tablename__ = "application_requests"
    id = Column(String, primary_key=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    institution_id = Column(String, ForeignKey("institutions.id"), nullable=False, index=True)
    requested_by = Column(String, ForeignKey("users.id"), nullable=False)
    request_type = Column(String, default="OPEN_APPLICATIONS")  # OPEN_APPLICATIONS
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    approved_by = Column(String, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    rejection_reason = Column(String, nullable=True)
    scheduled_open_at = Column(DateTime, nullable=True)
    scheduled_close_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    workflow = relationship("Workflow", foreign_keys=[workflow_id])
    company = relationship("Company", foreign_keys=[company_id])
    institution = relationship("Institution", foreign_keys=[institution_id])
    requester = relationship("User", foreign_keys=[requested_by])
    approver = relationship("User", foreign_keys=[approved_by])


class JDSubmission(Base):
    __tablename__ = "jd_submissions"
    id = Column(String, primary_key=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False)
    company_id = Column(String, ForeignKey("companies.id"), nullable=False)
    job_title = Column(String, nullable=False)
    job_description = Column(String, nullable=True)
    sector = Column(String, nullable=True)
    slot = Column(String, nullable=True)
    fixed_comp = Column(Float, nullable=True)
    variable_comp = Column(Float, nullable=True)
    esops_vested = Column(Float, nullable=True)
    joining_bonus = Column(Float, nullable=True)
    performance_bonus = Column(Float, nullable=True)
    is_top_decile = Column(Boolean, default=False)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    workflow = relationship("Workflow", foreign_keys=[workflow_id])
    company = relationship("Company", foreign_keys=[company_id])
