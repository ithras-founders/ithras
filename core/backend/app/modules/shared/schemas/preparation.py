"""Preparation domain schemas: PrepProfile, PrepPlan, PrepAttempt, Community, etc."""
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime


class PrepProfileSchema(BaseModel):
    id: str
    user_id: str
    cat_percentile: Optional[float] = None
    grad_stream: Optional[str] = None
    work_ex_years: Optional[float] = None
    achievements: List[str] = []
    extracurriculars: List[str] = []
    target_schools: List[str] = []
    baseline_metadata: Dict[str, Any] = {}
    admission_readiness_score: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrepProfileCreateSchema(BaseModel):
    cat_percentile: Optional[float] = None
    grad_stream: Optional[str] = None
    work_ex_years: Optional[float] = None
    achievements: List[str] = []
    extracurriculars: List[str] = []
    target_schools: List[str] = []


class PrepProfileUpdateSchema(BaseModel):
    cat_percentile: Optional[float] = None
    grad_stream: Optional[str] = None
    work_ex_years: Optional[float] = None
    achievements: Optional[List[str]] = None
    extracurriculars: Optional[List[str]] = None
    target_schools: Optional[List[str]] = None


class PrepPlanSchema(BaseModel):
    id: str
    profile_id: str
    weekly_goals: List[Dict[str, Any]] = []
    status: str = "ACTIVE"
    due_dates: Dict[str, str] = {}
    week_start: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrepPlanCreateSchema(BaseModel):
    profile_id: str
    weekly_goals: List[Dict[str, Any]] = []
    status: str = "ACTIVE"
    due_dates: Dict[str, str] = {}
    week_start: Optional[datetime] = None


class PrepPlanUpdateSchema(BaseModel):
    weekly_goals: Optional[List[Dict[str, Any]]] = None
    status: Optional[str] = None
    due_dates: Optional[Dict[str, str]] = None
    week_start: Optional[datetime] = None


class PrepQuestionBankSchema(BaseModel):
    id: str
    category: str
    school_tag: Optional[str] = None
    difficulty: Optional[str] = None
    source: Optional[str] = None
    question_text: str
    prompt_text: Optional[str] = None
    extra_meta: Dict[str, Any] = {}
    created_at: datetime

    class Config:
        from_attributes = True


class PrepAttemptSchema(BaseModel):
    id: str
    user_id: str
    question_id: Optional[str] = None
    prompt_id: Optional[str] = None
    answer_text: Optional[str] = None
    duration_sec: Optional[int] = None
    transcript_ref: Optional[str] = None
    attempt_type: str = "TEXT"
    created_at: datetime

    class Config:
        from_attributes = True


class PrepAttemptCreateSchema(BaseModel):
    question_id: Optional[str] = None
    prompt_id: Optional[str] = None
    answer_text: Optional[str] = None
    duration_sec: Optional[int] = None
    transcript_ref: Optional[str] = None
    attempt_type: str = "TEXT"


class PrepRubricScoreSchema(BaseModel):
    id: str
    attempt_id: str
    clarity: Optional[float] = None
    structure: Optional[float] = None
    relevance: Optional[float] = None
    confidence: Optional[float] = None
    aggregate_score: float
    dimensions: Dict[str, float] = {}
    feedback_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PrepMilestoneSchema(BaseModel):
    id: str
    user_id: str
    milestone_type: str
    completed_at: datetime
    extra_meta: Dict[str, Any] = {}

    class Config:
        from_attributes = True


class PrepMilestoneCreateSchema(BaseModel):
    milestone_type: str


class PrepCommunityPostSchema(BaseModel):
    id: str
    channel: str
    author_id: str
    title: str
    body: str
    tags: List[str] = []
    status: str = "ACTIVE"
    pinned_at: Optional[datetime] = None
    moderated_by: Optional[str] = None
    moderated_at: Optional[datetime] = None
    moderation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PrepCommunityPostCreateSchema(BaseModel):
    channel: str
    title: str
    body: str
    tags: List[str] = []


class PrepCommunityCommentSchema(BaseModel):
    id: str
    post_id: str
    author_id: str
    body: str
    status: str = "ACTIVE"
    moderated_by: Optional[str] = None
    moderated_at: Optional[datetime] = None
    moderation_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PrepCommunityCommentCreateSchema(BaseModel):
    body: str


class ReadinessBaselineSchema(BaseModel):
    """Response for profile intake readiness baseline."""
    admission_readiness_score: float
    strength_weakness_radar: Dict[str, float]  # academics, story, communication, business_awareness, confidence
    top_5_actions: List[str]


class CVReadinessScoreSchema(BaseModel):
    """Rule-based CV checklist score response."""
    score: float
    checklist: Dict[str, bool]  # dimension -> passed
    suggestions: List[str]


class PrepCommunitySchema(BaseModel):
    """Community with cover, name, description, channels."""
    id: str
    code: str
    name: str
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    sort_order: int = 0
    member_count: int = 0
    is_joined: bool = False
    channels: List["PrepCommunityChannelSchema"] = []

    class Config:
        from_attributes = True


class PrepCommunityChannelSchema(BaseModel):
    """Channel/theme for community feed."""
    id: Optional[str] = None
    code: str
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    community_id: Optional[str] = None
    community_name: Optional[str] = None
    visibility: str = "public"  # public, private, restricted
    member_count: int = 0
    is_joined: bool = False

    class Config:
        from_attributes = True
