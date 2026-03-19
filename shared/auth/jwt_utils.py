"""JWT utilities for stateless authentication alongside session-based auth."""
import datetime
from typing import Optional

import jwt

from shared.database.config import settings

JWT_ALGORITHM = "HS256"
JWT_EXPIRY_HOURS = 24 * 7  # 7 days, matches session TTL


_DEV_FALLBACK = "dev-only-jwt-secret-change-in-production"


def _get_secret() -> str:
    secret = settings.JWT_SECRET
    if not secret:
        if settings.IS_CLOUD_RUN:
            raise RuntimeError("JWT_SECRET is not set. Set it via environment variable.")
        return _DEV_FALLBACK
    return secret


def create_access_token(user_id: str) -> str:
    """Create a JWT access token for the user."""
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": user_id,
        "iat": now,
        "exp": expires,
        "type": "access",
    }
    return jwt.encode(payload, _get_secret(), algorithm=JWT_ALGORITHM)


def create_token_for_user(user_id: str, email: str, name: str) -> str:
    """Create JWT with full user payload (no DB). Used when accepting any credentials."""
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": expires,
        "type": "access",
    }
    return jwt.encode(payload, _get_secret(), algorithm=JWT_ALGORITHM)


def create_token_for_db_user(
    user_numerical: int,
    username: str,
    email: str,
    full_name: str,
    user_type: str = "professional",
) -> str:
    """Create JWT for DB-backed user. Payload includes user_numerical, username, email, full_name, user_type."""
    now = datetime.datetime.utcnow()
    expires = now + datetime.timedelta(hours=JWT_EXPIRY_HOURS)
    payload = {
        "sub": str(user_numerical),
        "user_numerical": user_numerical,
        "username": username,
        "email": email,
        "full_name": full_name,
        "user_type": user_type,
        "iat": now,
        "exp": expires,
        "type": "access",
    }
    return jwt.encode(payload, _get_secret(), algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Optional[str]:
    """
    Decode and validate JWT. Returns user_id (sub) if valid, else None.
    Does not raise - returns None for invalid/expired tokens.
    """
    if not token or not token.strip():
        return None
    try:
        payload = jwt.decode(
            token.strip(),
            _get_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": True, "verify_iat": True},
        )
        if payload.get("type") != "access":
            return None
        return payload.get("sub")
    except jwt.PyJWTError:
        return None


def decode_token_to_user(token: str) -> Optional[dict]:
    """
    Decode JWT and return user dict {id, email, name}. Returns None if invalid.
    For DB-backed users: id = user_numerical, name = full_name.
    """
    if not token or not token.strip():
        return None
    try:
        payload = jwt.decode(
            token.strip(),
            _get_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"verify_exp": True, "verify_iat": True},
        )
        if payload.get("type") != "access":
            return None
        user_id = payload.get("sub") or ""
        email = payload.get("email") or ""
        name = payload.get("full_name") or payload.get("name") or "User"
        user_type = payload.get("user_type") or "professional"
        return {
            "id": str(payload.get("user_numerical", user_id)) if payload.get("user_numerical") is not None else user_id,
            "email": email,
            "name": name,
            "user_type": user_type,
        }
    except jwt.PyJWTError:
        return None


def is_jwt_token(token: str) -> bool:
    """Heuristic: JWT has 3 base64 parts separated by dots."""
    if not token or not token.strip():
        return False
    parts = token.strip().split(".")
    return len(parts) == 3
