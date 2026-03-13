"""JWT utilities for stateless authentication alongside session-based auth."""
import datetime
from typing import Optional

import jwt

from app.config import settings

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


def is_jwt_token(token: str) -> bool:
    """Heuristic: JWT has 3 base64 parts separated by dots."""
    if not token or not token.strip():
        return False
    parts = token.strip().split(".")
    return len(parts) == 3
