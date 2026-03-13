"""Core domain schemas: Institution, User, Company, RBAC"""
from pydantic import BaseModel, field_validator
from typing import List, Optional, Dict, Any
from datetime import datetime


def _coerce_allowed_roles(v):
    """Coerce None or invalid value to empty list for allowed_roles."""
    if v is None:
        return []
    return list(v) if isinstance(v, (list, tuple)) else []


class ResponseSchema(BaseModel):
    status: str


class InstitutionSchema(BaseModel):
    id: str
    name: str
    tier: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None
    allowed_roles: List[str] = []
    created_at: datetime
    updated_at: datetime

    _normalize_allowed_roles = field_validator("allowed_roles", mode="before")(_coerce_allowed_roles)

    class Config:
        from_attributes = True


class InstitutionCreateSchema(BaseModel):
    id: str
    name: str
    tier: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None
    allowed_roles: Optional[List[str]] = None
    status: Optional[str] = "PENDING"  # PENDING | LISTED | PARTNER


class InstitutionUpdateSchema(BaseModel):
    name: Optional[str] = None
    tier: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None
    allowed_roles: Optional[List[str]] = None
    about: Optional[str] = None
    website: Optional[str] = None
    founding_year: Optional[int] = None
    student_count_range: Optional[str] = None
    status: Optional[str] = None  # PENDING | LISTED | PARTNER


class ProgramSchema(BaseModel):
    id: str
    institution_id: str
    name: str
    code: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProgramCreateSchema(BaseModel):
    id: str
    institution_id: str
    name: str
    code: Optional[str] = None


class ProgramUpdateSchema(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None


class BatchSchema(BaseModel):
    id: str
    program_id: str
    name: str
    year: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BatchCreateSchema(BaseModel):
    id: str
    program_id: str
    name: str
    year: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class BatchUpdateSchema(BaseModel):
    name: Optional[str] = None
    year: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class UserSchema(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company_id: Optional[str] = None
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    batch_id: Optional[str] = None
    sector_preferences: List[str] = []
    roll_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    student_subtype: Optional[str] = None
    is_verified: Optional[bool] = None
    email_hidden: Optional[bool] = None

    class Config:
        from_attributes = True


class UserProfileSchema(BaseModel):
    """User schema for profile display. email is Optional when email_hidden and viewer != owner."""
    id: str
    email: Optional[str] = None
    name: str
    role: str
    company_id: Optional[str] = None
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    batch_id: Optional[str] = None
    sector_preferences: List[str] = []
    roll_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    student_subtype: Optional[str] = None
    is_verified: Optional[bool] = None
    email_hidden: Optional[bool] = None

    class Config:
        from_attributes = True


class InstitutionLinkSchema(BaseModel):
    """Education/Institution association for profile display."""
    id: str
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    institution_logo_url: Optional[str] = None
    program_id: Optional[str] = None
    program_name: Optional[str] = None
    role_id: str
    role_name: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    tag: str  # "Alumni" | "Current"


class OrganizationLinkSchema(BaseModel):
    """Experience/Organization association for profile display."""
    id: str
    company_id: str
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    role_id: str
    role_name: Optional[str] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    tag: str  # "Alumni" | "Current"


class UserProfileResponseSchema(BaseModel):
    """Enhanced user payload with links and profile type for LinkedIn-style profiles."""
    user: UserProfileSchema
    institution_links: List[InstitutionLinkSchema] = []
    organization_links: List[OrganizationLinkSchema] = []
    profile_type: str  # "public" | "student" | "recruiter"


class UserCreateSchema(BaseModel):
    id: str
    email: str
    name: str
    role: str
    company_id: Optional[str] = None
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    sector_preferences: Optional[List[str]] = None
    roll_number: Optional[str] = None
    student_subtype: Optional[str] = None


class UserUpdateSchema(BaseModel):
    email: Optional[str] = None
    name: Optional[str] = None
    role: Optional[str] = None
    company_id: Optional[str] = None
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    sector_preferences: Optional[List[str]] = None
    roll_number: Optional[str] = None
    profile_photo_url: Optional[str] = None
    student_subtype: Optional[str] = None


class UserProfileChangeRequestSchema(BaseModel):
    id: str
    user_id: str
    institution_id: Optional[str] = None
    requested_by: str
    requested_changes: Dict[str, Any] = {}
    status: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    requested_by_name: Optional[str] = None
    requested_by_email: Optional[str] = None
    reviewed_by_name: Optional[str] = None
    reviewed_by_email: Optional[str] = None

    class Config:
        from_attributes = True


class UserProfileChangeRequestCreateSchema(BaseModel):
    requested_by: str
    requested_changes: Dict[str, Any]


class UserProfileChangeRequestReviewSchema(BaseModel):
    reviewed_by: str
    rejection_reason: Optional[str] = None


class CompanySchema(BaseModel):
    id: str
    name: str
    last_year_hires: int = 0
    cumulative_hires_3y: int = 0
    last_year_median_fixed: Optional[float] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    founding_year: Optional[int] = None
    allowed_roles: List[str] = []
    status: Optional[str] = "PARTNER"  # PENDING | LISTED | PARTNER

    _normalize_allowed_roles = field_validator("allowed_roles", mode="before")(_coerce_allowed_roles)

    class Config:
        from_attributes = True


class CompanyCreateSchema(BaseModel):
    id: str
    name: str
    last_year_hires: Optional[int] = 0
    cumulative_hires_3y: Optional[int] = 0
    last_year_median_fixed: Optional[float] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    founding_year: Optional[int] = None
    allowed_roles: Optional[List[str]] = None
    status: Optional[str] = "PENDING"  # PENDING | LISTED | PARTNER


class CompanyUpdateSchema(BaseModel):
    name: Optional[str] = None
    last_year_hires: Optional[int] = None
    cumulative_hires_3y: Optional[int] = None
    last_year_median_fixed: Optional[float] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    founding_year: Optional[int] = None
    allowed_roles: Optional[List[str]] = None
    status: Optional[str] = None  # PENDING | LISTED | PARTNER


# --- RBAC Schemas ---

class PermissionSchema(BaseModel):
    id: str
    code: str
    name: str
    category: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class RoleSchema(BaseModel):
    id: str
    name: str
    type: str
    description: Optional[str] = None
    institution_id: Optional[str] = None
    is_system: bool = False
    permissions: List[PermissionSchema] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class RoleCreateSchema(BaseModel):
    name: str
    description: Optional[str] = None
    institution_id: Optional[str] = None
    permission_codes: List[str] = []


class RoleUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_codes: Optional[List[str]] = None


class ProfileSchema(BaseModel):
    """A user's role assignment (profile) with resolved role and permissions."""
    id: str
    role: RoleSchema
    institution_id: Optional[str] = None
    institution_name: Optional[str] = None
    institution_logo_url: Optional[str] = None
    company_id: Optional[str] = None
    company_name: Optional[str] = None
    company_logo_url: Optional[str] = None
    program_id: Optional[str] = None
    program_name: Optional[str] = None
    permissions: List[str] = []
    granted_at: Optional[datetime] = None
    expires_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        from_attributes = True


class ProfileCreateSchema(BaseModel):
    role_id: str
    institution_id: Optional[str] = None
    company_id: Optional[str] = None
    program_id: Optional[str] = None
    expires_at: Optional[datetime] = None


class ProfileUpdateSchema(BaseModel):
    expires_at: Optional[datetime] = None
    is_active: Optional[bool] = None


class LoginResponseSchema(BaseModel):
    user: UserSchema
    profiles: List[ProfileSchema]
    active_profile: Optional[ProfileSchema] = None


class SwitchProfileRequest(BaseModel):
    profile_id: str


# --- Audit Log Schemas ---

class AuditLogSchema(BaseModel):
    id: int
    timestamp: datetime
    user_id: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    institution_id: Optional[str] = None
    company_id: Optional[str] = None
    details: Optional[str] = None
    metadata_: Optional[str] = None
    ip_address: Optional[str] = None
    user_name: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class AuditLogCreateSchema(BaseModel):
    user_id: Optional[str] = None
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    institution_id: Optional[str] = None
    company_id: Optional[str] = None
    details: Optional[str] = None
    metadata_: Optional[str] = None
    ip_address: Optional[str] = None
