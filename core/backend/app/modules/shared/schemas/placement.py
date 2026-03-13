"""Placement domain schemas: Job, Cycle, Shortlist, Workflow, Application, HistoricalHire"""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class JobSchema(BaseModel):
    id: str
    company_id: str
    cycle_id: Optional[str] = None
    institution_id: Optional[str] = None
    title: str
    sector: str
    slot: str
    fixed_comp: float
    variable_comp: float = 0
    esops_vested: float = 0
    joining_bonus: float = 0
    performance_bonus: float = 0
    is_top_decile: bool = False
    opening_date: Optional[datetime] = None
    jd_status: str = "Draft"

    class Config:
        from_attributes = True


class JobCreateSchema(BaseModel):
    id: str
    company_id: str
    cycle_id: Optional[str] = None
    institution_id: Optional[str] = None
    title: str
    sector: str
    slot: str
    fixed_comp: float
    variable_comp: Optional[float] = 0
    esops_vested: Optional[float] = 0
    joining_bonus: Optional[float] = 0
    performance_bonus: Optional[float] = 0
    is_top_decile: Optional[bool] = False
    opening_date: Optional[datetime] = None
    jd_status: Optional[str] = "Draft"


class JobUpdateSchema(BaseModel):
    cycle_id: Optional[str] = None
    institution_id: Optional[str] = None
    title: Optional[str] = None
    sector: Optional[str] = None
    slot: Optional[str] = None
    fixed_comp: Optional[float] = None
    variable_comp: Optional[float] = None
    esops_vested: Optional[float] = None
    joining_bonus: Optional[float] = None
    performance_bonus: Optional[float] = None
    is_top_decile: Optional[bool] = None
    opening_date: Optional[datetime] = None
    jd_status: Optional[str] = None


class CycleSchema(BaseModel):
    id: str
    name: str
    type: str
    category: str
    status: str
    institution_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CycleCreateSchema(BaseModel):
    id: str
    name: str
    type: str
    category: str
    status: str
    institution_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class CycleUpdateSchema(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    institution_id: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class ShortlistSchema(BaseModel):
    id: str
    candidate_id: str
    job_id: str
    status: str
    received_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ShortlistCreateSchema(BaseModel):
    candidate_id: str
    job_id: str
    status: str = "Active"


class OfferSchema(BaseModel):
    id: str
    application_id: str
    candidate_id: str
    company_id: str
    job_id: str
    status: str
    ctc: Optional[float] = None
    deadline: Optional[datetime] = None
    created_at: datetime
    responded_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OfferCreateSchema(BaseModel):
    application_id: str
    candidate_id: str
    company_id: str
    job_id: str
    ctc: Optional[float] = None
    deadline: Optional[datetime] = None


class HistoricalHireSchema(BaseModel):
    id: str
    name: str
    company_id: str
    year: int
    role: str
    cycle_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowTemplateStageSchema(BaseModel):
    id: str
    template_id: str
    stage_number: int
    name: str
    description: Optional[str] = None
    stage_type: str
    is_approval_required: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowTemplateStageCreateSchema(BaseModel):
    stage_number: int
    name: str
    description: Optional[str] = None
    stage_type: Optional[str] = "APPLICATION"
    is_approval_required: Optional[bool] = True


class WorkflowTemplateSchema(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    template_type: str
    institution_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    stages: List["WorkflowTemplateStageSchema"] = []

    class Config:
        from_attributes = True


class WorkflowTemplateCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: Optional[str] = "PLACEMENT_CYCLE"
    institution_id: Optional[str] = None
    stages: Optional[List[WorkflowTemplateStageCreateSchema]] = []


class WorkflowTemplateUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    template_type: Optional[str] = None
    institution_id: Optional[str] = None


class WorkflowTemplateApplySchema(BaseModel):
    institution_id: str
    company_id: str
    job_id: Optional[str] = None
    created_by: str
    workflow_name: Optional[str] = None


class WorkflowSchema(BaseModel):
    id: str
    company_id: str
    job_id: Optional[str] = None
    institution_id: str
    name: str
    description: Optional[str] = None
    created_by: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkflowCreateSchema(BaseModel):
    company_id: str
    job_id: Optional[str] = None
    institution_id: str
    name: str
    description: Optional[str] = None
    created_by: str
    status: Optional[str] = "DRAFT"


class WorkflowUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None


class WorkflowStageSchema(BaseModel):
    id: str
    workflow_id: str
    stage_number: int
    name: str
    description: Optional[str] = None
    stage_type: str
    is_approval_required: bool
    created_at: datetime

    class Config:
        from_attributes = True


class WorkflowStageCreateSchema(BaseModel):
    workflow_id: str
    stage_number: int
    name: str
    description: Optional[str] = None
    stage_type: Optional[str] = "APPLICATION"
    is_approval_required: Optional[bool] = True


class WorkflowStageUpdateSchema(BaseModel):
    stage_number: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    stage_type: Optional[str] = None
    is_approval_required: Optional[bool] = None


class ApplicationSchema(BaseModel):
    id: str
    student_id: str
    job_id: Optional[str] = None
    workflow_id: str
    cv_id: str
    current_stage_id: Optional[str] = None
    status: str
    submitted_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApplicationCreateSchema(BaseModel):
    student_id: str
    job_id: Optional[str] = None
    workflow_id: str
    cv_id: str


class ApplicationUpdateSchema(BaseModel):
    current_stage_id: Optional[str] = None
    status: Optional[str] = None


class ApplicationStageProgressSchema(BaseModel):
    id: str
    application_id: str
    stage_id: str
    status: str
    moved_at: datetime
    moved_by: Optional[str] = None

    class Config:
        from_attributes = True


class ApplicationTimelineEventSchema(BaseModel):
    id: str
    application_id: str
    event_type: str
    payload: Optional[Dict[str, Any]] = None
    actor_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationAttachmentSchema(BaseModel):
    id: str
    application_id: str
    name: str
    asset_type: str = "document"
    url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApplicationAttachmentCreateSchema(BaseModel):
    name: str
    asset_type: Optional[str] = "document"
    url: Optional[str] = None
    file_path: Optional[str] = None


class BulkProgressStudentsSchema(BaseModel):
    workflow_id: str
    stage_id: str
    student_ids: List[str]
    requested_by: str
