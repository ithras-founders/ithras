"""Auth dependencies: get_current_user (JWT-only, no DB)."""
from types import SimpleNamespace

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from .jwt_utils import decode_token_to_user, is_jwt_token

security = HTTPBearer(auto_error=False)


def _token_dep(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> str | None:
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        return credentials.credentials.strip()
    return None


def get_current_user(
    token: str | None = Depends(_token_dep),
):
    """Returns user from JWT. No DB. Accepts any valid JWT from login."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_dict = decode_token_to_user(token)
    if not user_dict:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return SimpleNamespace(**user_dict)


def get_current_token(
    token: str | None = Depends(_token_dep),
    _= Depends(get_current_user),
) -> str:
    """Returns the validated token."""
    return token


def get_current_user_optional(
    token: str | None = Depends(_token_dep),
):
    """Returns user from JWT or None if not authenticated."""
    if not token:
        return None
    user_dict = decode_token_to_user(token)
    if not user_dict:
        return None
    return SimpleNamespace(**user_dict)


def require_admin(user=Depends(get_current_user)):
    """Requires authenticated user with user_type == 'admin'. Raises 403 if not admin."""
    if getattr(user, "user_type", "professional") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return user
