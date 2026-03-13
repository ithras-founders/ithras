"""Organization & Institution structure schemas."""
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, Field


class InstitutionRead(BaseModel):
    """Institution read schema for organization domain."""
    id: str
    name: str
    tier: Optional[str] = None
    location: Optional[str] = None
    logo_url: Optional[str] = None
    about: Optional[str] = None
    website: Optional[str] = None
    founding_year: Optional[int] = None
    student_count_range: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompanyRead(BaseModel):
    """Company read schema for organization domain."""
    id: str
    name: Optional[str] = None
    last_year_hires: int = 0
    cumulative_hires_3y: int = 0
    last_year_median_fixed: Optional[float] = None
    logo_url: Optional[str] = None
    description: Optional[str] = None
    headquarters: Optional[str] = None
    founding_year: Optional[int] = None

    class Config:
        from_attributes = True


class BatchRead(BaseModel):
    """Batch read schema."""
    id: str
    program_id: str
    name: str
    year: Optional[int] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProgramRead(BaseModel):
    """Program read schema with batch count."""
    id: str
    institution_id: str
    name: str
    code: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class BusinessUnitRead(BaseModel):
    """Business unit read schema."""
    id: str
    company_id: str
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True


class InstitutionStructureRead(BaseModel):
    """Institution with programs and batches."""
    institution: InstitutionRead
    programs: List[ProgramRead] = Field(default_factory=list)
    batches_by_program: Dict[str, List[BatchRead]] = Field(default_factory=dict)  # program_id -> list of BatchRead


class CompanyFunctionRead(BaseModel):
    id: str
    company_id: str
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True


class CompanyDesignationRead(BaseModel):
    id: str
    company_id: str
    name: str
    level: Optional[int] = None

    class Config:
        from_attributes = True


class InstitutionDegreeRead(BaseModel):
    id: str
    institution_id: str
    name: str
    degree_type: Optional[str] = None
    program_id: Optional[str] = None

    class Config:
        from_attributes = True


class InstitutionCertificationRead(BaseModel):
    id: str
    institution_id: str
    name: str
    issuing_body: Optional[str] = None
    description: Optional[str] = None

    class Config:
        from_attributes = True


class InstitutionAboutRead(BaseModel):
    """Institution About page - LinkedIn-style."""
    institution: InstitutionRead
    programs: List[ProgramRead] = Field(default_factory=list)
    degrees: List[InstitutionDegreeRead] = Field(default_factory=list)
    certifications: List[InstitutionCertificationRead] = Field(default_factory=list)
    stats: dict = Field(default_factory=dict)  # e.g. { "total_users": 1200, "total_programs": 12, "total_alumni": 800 }


class CompanyAboutRead(BaseModel):
    """Company About page - LinkedIn-style."""
    company: CompanyRead
    business_units: List[BusinessUnitRead] = Field(default_factory=list)
    designations: List[CompanyDesignationRead] = Field(default_factory=list)
    functions: List[CompanyFunctionRead] = Field(default_factory=list)
    stats: dict = Field(default_factory=dict)  # e.g. { "total_users": 50, "total_current": 45, "total_alumni": 5 }


# Create/Update schemas for admin CRUD
class BusinessUnitCreate(BaseModel):
    name: str
    code: Optional[str] = None


class CompanyFunctionCreate(BaseModel):
    name: str
    code: Optional[str] = None


class CompanyDesignationCreate(BaseModel):
    name: str
    level: Optional[int] = None


class InstitutionDegreeCreate(BaseModel):
    name: str
    degree_type: Optional[str] = None
    program_id: Optional[str] = None


class InstitutionCertificationCreate(BaseModel):
    name: str
    issuing_body: Optional[str] = None
    description: Optional[str] = None
