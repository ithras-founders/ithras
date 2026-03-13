"""Governance domain schemas: Policy, PolicyProposal, WorkflowApproval, Notification, JDSubmission"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


class PolicySchema(BaseModel):
    id: str
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    governance_type: str = "UNIVERSAL"
    status: str
    is_template: bool = False
    template_name: Optional[str] = None
    cycle_id: Optional[str] = None
    levels: List[Dict[str, Any]] = []
    stages: List[Dict[str, Any]] = []
    global_caps: Dict[str, Any] = {}
    student_statuses: List[Dict[str, Any]] = []
    stage_restrictions: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PolicyCreateSchema(BaseModel):
    id: str
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    governance_type: Optional[str] = "UNIVERSAL"
    status: str
    is_template: Optional[bool] = False
    template_name: Optional[str] = None
    cycle_id: Optional[str] = None
    levels: Optional[List[Dict[str, Any]]] = None
    stages: Optional[List[Dict[str, Any]]] = None
    global_caps: Optional[Dict[str, Any]] = None
    student_statuses: Optional[List[Dict[str, Any]]] = None
    stage_restrictions: Optional[Dict[str, Any]] = None


class PolicyUpdateSchema(BaseModel):
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    governance_type: Optional[str] = None
    status: Optional[str] = None
    is_template: Optional[bool] = None
    template_name: Optional[str] = None
    cycle_id: Optional[str] = None
    levels: Optional[List[Dict[str, Any]]] = None
    stages: Optional[List[Dict[str, Any]]] = None
    global_caps: Optional[Dict[str, Any]] = None
    student_statuses: Optional[List[Dict[str, Any]]] = None
    stage_restrictions: Optional[Dict[str, Any]] = None


class PolicyTemplateApplySchema(BaseModel):
    template_id: str
    cycle_id: str
    name: Optional[str] = None


class PolicyTemplateAssignInstitutionSchema(BaseModel):
    """Map a governance template to an institution (or institution+program)."""
    institution_id: str
    program_id: Optional[str] = None
    name: Optional[str] = None


class PolicyProposalSchema(BaseModel):
    id: str
    policy_id: str
    proposed_by: str
    timestamp: datetime
    changes: Dict[str, Any] = {}
    status: str = "PENDING"

    class Config:
        from_attributes = True


class WorkflowApprovalSchema(BaseModel):
    id: str
    workflow_id: str
    company_id: str
    approval_type: str
    requested_by: str
    requested_data: Dict[str, Any]
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowApprovalCreateSchema(BaseModel):
    workflow_id: str
    company_id: str
    approval_type: str
    requested_by: str
    requested_data: Dict[str, Any]


class WorkflowApprovalUpdateSchema(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[str] = None
    rejection_reason: Optional[str] = None


class NotificationSchema(BaseModel):
    id: str
    user_id: Optional[str] = None
    recipient_type: str
    notification_type: str
    title: str
    message: str
    data: Dict[str, Any]
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationCreateSchema(BaseModel):
    user_id: Optional[str] = None
    recipient_type: str = "USER"
    notification_type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = {}


class ApplicationRequestSchema(BaseModel):
    id: str
    workflow_id: str
    company_id: str
    institution_id: str
    requested_by: str
    request_type: str
    status: str
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    scheduled_open_at: Optional[datetime] = None
    scheduled_close_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationRequestCreateSchema(BaseModel):
    workflow_id: str
    company_id: str
    institution_id: str
    requested_by: str
    scheduled_open_at: Optional[datetime] = None
    scheduled_close_at: Optional[datetime] = None


class JDSubmissionSchema(BaseModel):
    id: str
    workflow_id: str
    company_id: str
    job_title: str
    job_description: Optional[str] = None
    sector: Optional[str] = None
    slot: Optional[str] = None
    fixed_comp: Optional[float] = None
    variable_comp: Optional[float] = None
    esops_vested: Optional[float] = None
    joining_bonus: Optional[float] = None
    performance_bonus: Optional[float] = None
    is_top_decile: bool
    submitted_at: datetime
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class JDSubmissionCreateSchema(BaseModel):
    workflow_id: str
    company_id: str
    job_title: str
    job_description: Optional[str] = None
    sector: Optional[str] = None
    slot: Optional[str] = None
    fixed_comp: Optional[float] = None
    variable_comp: Optional[float] = None
    esops_vested: Optional[float] = None
    joining_bonus: Optional[float] = None
    performance_bonus: Optional[float] = None
    is_top_decile: Optional[bool] = False
