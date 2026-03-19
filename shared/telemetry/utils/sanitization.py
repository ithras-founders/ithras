"""Sanitization and redaction utilities for telemetry metadata."""
import re
from typing import Any

REDACTED_PLACEHOLDER = "[REDACTED]"

# Keys (case-insensitive) that must never be stored in telemetry
REDACTED_FIELDS = frozenset({
    "password", "passwd", "pwd", "token", "secret", "api_key", "apikey",
    "authorization", "auth", "cookie", "session", "credential", "credentials",
    "access_token", "refresh_token", "bearer", "jwt", "ssn", "credit_card",
    "card_number", "cvv", "cvc", "pin", "private_key", "secret_key",
})


def _is_sensitive_key(key: str) -> bool:
    """Check if a key is sensitive (case-insensitive, partial match)."""
    k = key.lower().replace("-", "").replace("_", "")
    return any(s in k for s in REDACTED_FIELDS)


def sanitize_telemetry_metadata(meta: dict[str, Any] | None) -> dict[str, Any]:
    """
    Recursively sanitize metadata by redacting sensitive keys.
    Never store raw secrets, tokens, passwords, or auth data.
    """
    if meta is None:
        return {}

    result: dict[str, Any] = {}
    for k, v in meta.items():
        if _is_sensitive_key(k):
            result[k] = REDACTED_PLACEHOLDER
        elif isinstance(v, dict):
            result[k] = sanitize_telemetry_metadata(v)
        elif isinstance(v, list):
            result[k] = [
                sanitize_telemetry_metadata(x) if isinstance(x, dict) else x
                for x in v
            ]
        else:
            result[k] = v
    return result


def redact_sensitive_fields(obj: dict[str, Any], fields: list[str] | None = None) -> dict[str, Any]:
    """
    Redact specified fields from an object. If fields is None, use REDACTED_FIELDS.
    """
    if obj is None:
        return {}
    fields_to_redact = {f.lower() for f in (fields or list(REDACTED_FIELDS))}
    result = dict(obj)
    for k in list(result.keys()):
        if k.lower() in fields_to_redact or _is_sensitive_key(k):
            result[k] = REDACTED_PLACEHOLDER
    return result
