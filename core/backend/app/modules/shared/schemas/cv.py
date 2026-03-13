"""CV domain schemas: CVTemplate, CV, TemplateConfig"""
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


# CV Template Configuration Schemas
# All config schemas use extra="allow" to permit optional enterprise fields:
# page.backgroundColor, section.backgroundColor, entryType.backgroundColor,
# field.pdfMapping.formats (bold|italic|underline|strikethrough|uppercase),
# field.pdfMapping.backgroundColor, fixedElements.header.height, fixedElements.footer.height.
class PageConfigSchema(BaseModel):
    size: str = "A4"
    margins: Dict[str, float] = {"top": 20, "bottom": 20, "left": 20, "right": 20}
    backgroundColor: Optional[str] = None  # e.g. "white", "#f5f5f5"


class TypographyConfigSchema(BaseModel):
    baseFont: Dict[str, Any] = {"family": "serif", "size": 10.5, "lineHeight": 1.2}
    headerFont: Dict[str, Any] = {"sizes": {"h1": 14, "h2": 12, "h3": 10}, "weights": {"h1": 900, "h2": 700, "h3": 600}}
    bulletStyle: str = "disc"
    bulletIndentation: float = 4.0


class SpacingConfigSchema(BaseModel):
    lineSpacing: float = 1.2
    bulletSpacing: float = 0.5
    sectionTitleBefore: float = 6.0
    sectionTitleAfter: float = 3.0
    sectionSpacing: float = 8.0
    rowSpacing: float = 4.0


class OverflowPolicySchema(BaseModel):
    allowOverflow: bool = True
    restrictOverflow: bool = False
    limitType: Optional[str] = None
    limitValue: Optional[float] = None


class TypographyOverridesSchema(BaseModel):
    fontSize: Optional[float] = None  # pt
    fontWeight: Optional[str] = None  # "bold" | "normal"
    textAlign: Optional[str] = None  # "left" | "center" | "right"

    class Config:
        extra = "allow"


class FieldConfigSchema(BaseModel):
    id: str
    label: str
    type: str
    required: bool = False
    validation: Optional[Dict[str, Any]] = None
    overflowRule: Optional[OverflowPolicySchema] = None
    # pdfMapping: location, format/formats, prefix, suffix, backgroundColor
    # formats: List[str] e.g. ["bold","italic","underline","strikethrough","uppercase"]
    pdfMapping: Optional[Dict[str, Any]] = {}
    options: Optional[List[str]] = None
    placeholder: Optional[str] = None  # e.g. "{{name}}" for variable substitution
    defaultValue: Optional[str] = None  # alias for placeholder
    typographyOverrides: Optional[TypographyOverridesSchema] = None

    class Config:
        extra = "allow"


class EntryTypeConfigSchema(BaseModel):
    id: str
    name: str
    repeatable: bool = False
    minEntries: int = 0
    maxEntries: Optional[int] = None
    layout: str = "two_column"  # two_column, full_width, inline_subheader
    backgroundColor: Optional[str] = None
    leftBucketWidth: Optional[str] = None
    rightContentWidth: Optional[str] = None
    alignment: str = "top"
    leftBucketContentSource: Optional[str] = "fixed"
    leftBucketText: Optional[str] = None
    leftBucketVariable: Optional[str] = None
    leftBucketFieldId: Optional[str] = None
    candidateCanReorder: bool = False
    fields: Optional[List[FieldConfigSchema]] = []
    # pdfMapping may include transform: "rotate(-90deg)" for vertical text

    class Config:
        extra = "allow"


class SectionConfigSchema(BaseModel):
    id: str
    title: str
    mandatory: bool = False
    backgroundColor: Optional[str] = None
    lockOrder: bool = True
    candidateCanReorder: bool = False
    candidateCanEditTitle: bool = False
    visibilityRule: str = "always"
    layoutStyle: str = "two_column"  # two_column, default, label_left_content_right, two_column_header
    sectionHeaderStyle: Optional[Dict[str, Any]] = None  # alignRHS, showSubHeaders, titleAlign, titleCaps, titleDivider
    typographyOverrides: Optional[TypographyOverridesSchema] = None  # fontSize, fontWeight, textAlign per section
    componentType: Optional[str] = None  # "table" | "list" | "header_block" | "text_block"
    columnCount: Optional[int] = None  # for layoutStyle "multi_column" when > 2
    subCategories: Optional[List[Dict[str, Any]]] = None  # [{label, fieldId}] for label_left_content_right
    spacingOverrides: Optional[Dict[str, Any]] = None
    entryTypes: Optional[List[EntryTypeConfigSchema]] = []
    order: int = 0

    class Config:
        extra = "allow"


class TemplateConfigSchema(BaseModel):
    page: Optional[PageConfigSchema] = None
    typography: Optional[TypographyConfigSchema] = None
    spacing: Optional[SpacingConfigSchema] = None
    overflowPolicy: Optional[OverflowPolicySchema] = None
    sections: Optional[List[SectionConfigSchema]] = None
    fixedElements: Optional[Dict[str, Any]] = None
    autoVariables: Optional[List[str]] = None
    template_category: Optional[str] = None  # institutional, canva_modern, canva_minimal, canva_creative
    designTokens: Optional[Dict[str, Any]] = None  # primary, accent, background, borderRadius, shadow

    class Config:
        extra = "allow"


class CVTemplateSchema(BaseModel):
    id: str
    institution_id: Optional[str] = None
    name: str
    pdf_url: Optional[str] = None
    status: Optional[str] = "DRAFT"
    version: Optional[int] = 1
    parent_template_id: Optional[str] = None
    program_id: Optional[str] = None
    department: Optional[str] = None
    college_slug: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    template_structure: Optional[Dict[str, Any]] = None
    sections: Optional[List[Any]] = None  # Legacy: List[str]; New: list of section objects
    fields: Optional[Dict[str, Any]] = None  # Legacy: Dict[str, List[str]]; New: nested structures
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    is_active: Optional[bool] = True

    class Config:
        from_attributes = True


class CVTemplateCreateSchema(BaseModel):
    institution_id: Optional[str] = None  # Null for system-admin global templates
    name: str
    pdf_url: Optional[str] = None
    program_id: Optional[str] = None
    department: Optional[str] = None
    college_slug: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    template_structure: Optional[Dict[str, Any]] = None
    sections: Optional[List[str]] = None
    fields: Optional[Dict[str, List[str]]] = None
    created_by: str


class CVTemplateUpdateSchema(BaseModel):
    name: Optional[str] = None
    institution_id: Optional[str] = None
    program_id: Optional[str] = None
    department: Optional[str] = None
    college_slug: Optional[str] = None
    config: Optional[Dict[str, Any]] = None
    template_structure: Optional[Dict[str, Any]] = None
    sections: Optional[List[str]] = None
    fields: Optional[Dict[str, List[str]]] = None
    is_active: Optional[bool] = None
    status: Optional[str] = None


class CVTemplatePublishSchema(BaseModel):
    migration_rule: Optional[str] = None


class CVSchema(BaseModel):
    id: str
    candidate_id: str
    template_id: str
    data: Dict[str, Any] = {}
    pdf_url: Optional[str] = None
    status: str = "DRAFT"
    verified_by: Optional[str] = None
    verified_by_name: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CVCreateSchema(BaseModel):
    candidate_id: str
    template_id: str
    data: Optional[Dict[str, Any]] = None
    status: Optional[str] = "DRAFT"


class CVUpdateSchema(BaseModel):
    data: Optional[Dict[str, Any]] = None
    status: Optional[str] = None
    pdf_url: Optional[str] = None


class CVVerificationSchema(BaseModel):
    status: str
    verified_by: str
    notes: Optional[str] = None


class CVTemplateAllocationSchema(BaseModel):
    id: str
    template_id: str
    institution_id: str
    status: str = "ALLOCATED"
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class CVTemplateWithAllocationSchema(CVTemplateSchema):
    allocation_id: Optional[str] = None
    allocation_status: Optional[str] = None
