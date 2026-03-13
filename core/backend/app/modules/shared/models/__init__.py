"""
Domain models split by module for better modularity.
Import order matters for SQLAlchemy relationship resolution.
"""
from . import core
from . import identity
from . import opportunities
from . import placement
from . import recruitment
from . import messaging
from . import cv
from . import calendar
from . import governance
from . import analytics
from . import rbac

# Re-export all model classes for backward compatibility
from .core import (
    Institution,
    Program,
    Batch,
    Company,
    BusinessUnit,
    CompanyFunction,
    CompanyDesignation,
    InstitutionDegree,
    InstitutionCertification,
    User,
    UserProfileChangeRequest,
    AuditLog,
    IndividualInstitutionLink,
    IndividualOrganizationLink,
)
from .placement import (
    JobPosting,
    Shortlist,
    Cycle,
    HistoricalHire,
    WorkflowTemplate,
    WorkflowTemplateStage,
    Workflow,
    WorkflowStage,
    Application,
    ApplicationStageProgress,
    ApplicationTimelineEvent,
    ApplicationAttachment,
    EligibilityRule,
    EligibilityOverrideRequest,
    PlacementOutcome,
    Offer,
)
from .cv import CV, CVVersion, CVTemplate, CVTemplateVisibilityOverride, PortfolioAsset
from .calendar import CalendarSlot, TimetableBlock, SlotBooking, StudentSlotAvailability
from .governance import Policy, PolicyProposal, WorkflowApproval, ApplicationRequest, Notification, NotificationPreference, JDSubmission
from .analytics import AnalyticsReport, AnalyticsDashboard, AnalyticsSchedule
from .rbac import Role, Permission, UserRoleAssignment, role_permissions
from .identity import AuthSession
from .opportunities import SavedOpportunity, CompanyFollow
from .recruitment import TalentPool, TalentPoolMember, SavedSearch
from .messaging import Conversation, ConversationParticipant, Message

__all__ = [
    "Institution",
    "Program",
    "Batch",
    "Company",
    "BusinessUnit",
    "User",
    "UserProfileChangeRequest",
    "AuditLog",
    "IndividualInstitutionLink",
    "IndividualOrganizationLink",
    "JobPosting",
    "Shortlist",
    "Cycle",
    "HistoricalHire",
    "WorkflowTemplate",
    "WorkflowTemplateStage",
    "Workflow",
    "WorkflowStage",
    "Application",
    "ApplicationStageProgress",
    "ApplicationTimelineEvent",
    "ApplicationAttachment",
    "EligibilityRule",
    "EligibilityOverrideRequest",
    "PlacementOutcome",
    "Offer",
    "CV",
    "CVVersion",
    "CVTemplate",
    "CVTemplateVisibilityOverride",
    "PortfolioAsset",
    "CalendarSlot",
    "TimetableBlock",
    "SlotBooking",
    "StudentSlotAvailability",
    "Policy",
    "PolicyProposal",
    "WorkflowApproval",
    "ApplicationRequest",
    "Notification",
    "NotificationPreference",
    "JDSubmission",
    "AnalyticsReport",
    "AnalyticsDashboard",
    "AnalyticsSchedule",
    "Role",
    "Permission",
    "UserRoleAssignment",
    "role_permissions",
    "AuthSession",
    "SavedOpportunity",
    "CompanyFollow",
    "TalentPool",
    "TalentPoolMember",
    "SavedSearch",
    "Conversation",
    "ConversationParticipant",
    "Message",
]
