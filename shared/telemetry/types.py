"""Telemetry enums and constants."""
from enum import Enum


class TelemetryDomain(str, Enum):
    API = "api"
    USER_ACTIVITY = "user_activity"
    AUDIT = "audit"
    AUTH = "auth"
    COMMUNITY = "community"
    FEED = "feed"
    MESSAGING = "messaging"
    NETWORK = "network"
    ENTITY = "entity"
    JOB = "job"
    WEBHOOK = "webhook"
    ERROR = "error"
    SEARCH = "search"
    MODERATION = "moderation"
    COMPLIANCE = "compliance"


class TelemetryStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"
    PENDING = "pending"
    UNKNOWN = "unknown"


class TelemetrySeverity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    ERROR = "error"
    CRITICAL = "critical"


class ActorType(str, Enum):
    USER = "user"
    SYSTEM = "system"
    ADMIN = "admin"
    SERVICE = "service"
    UNKNOWN = "unknown"


class EntityType(str, Enum):
    USER = "user"
    INSTITUTION = "institution"
    ORGANISATION = "organisation"
    COMMUNITY = "community"
    CHANNEL = "channel"
    POST = "post"
    COMMENT = "comment"
    CONVERSATION = "conversation"
    MESSAGE = "message"
    CONNECTION = "connection"
    FOLLOW = "follow"
    REQUEST = "request"
    JOB = "job"
    WEBHOOK = "webhook"
    OTHER = "other"
