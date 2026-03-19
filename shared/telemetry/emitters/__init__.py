"""Domain-specific telemetry emitters."""
from .api_emitter import track_api_request
from .auth_emitter import track_login_success, track_login_failure, track_logout
from .audit_emitter import track_audit_action
from .community_emitter import track_community_joined
from .entity_emitter import track_entity_change
from .error_emitter import track_error
from .feed_emitter import track_post_created, track_comment_added, track_reaction_added
from .messaging_emitter import track_message_sent, track_request_accepted, track_request_ignored
from .moderation_emitter import track_moderation_action
from .network_emitter import track_connection_requested, track_connection_accepted, track_follow_added
from .search_emitter import track_search_performed

__all__ = [
    "track_api_request",
    "track_community_joined",
    "track_login_success",
    "track_login_failure",
    "track_logout",
    "track_audit_action",
    "track_entity_change",
    "track_error",
    "track_post_created",
    "track_comment_added",
    "track_reaction_added",
    "track_message_sent",
    "track_request_accepted",
    "track_request_ignored",
    "track_moderation_action",
    "track_connection_requested",
    "track_connection_accepted",
    "track_follow_added",
    "track_search_performed",
]
