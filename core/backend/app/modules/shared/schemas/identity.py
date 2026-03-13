"""Identity & Access domain schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class UserRead(BaseModel):
    """Canonical user read schema for identity domain."""
    id: str
    email: str
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool = True
    profile_photo_url: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user profile (self-scoped)."""
    name: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None


class ProfileSwitchRequest(BaseModel):
    """Request to switch active profile context."""
    profile_id: str


class ActiveProfileContext(BaseModel):
    """Active profile context with scope for permission resolution."""
    id: str
    role_id: str
    institution_id: Optional[str] = None
    company_id: Optional[str] = None
    batch_id: Optional[str] = None
    business_unit_id: Optional[str] = None
    permissions: List[str] = []
