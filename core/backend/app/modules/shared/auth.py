"""Auth dependencies: get_current_user, require_role, require_permission."""
import datetime
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import text
from sqlalchemy.orm import Session

from . import models, database
from .session_store import get_session
from .jwt_utils import decode_access_token, is_jwt_token

security = HTTPBearer(auto_error=False)


def _extract_token(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    x_token: str | None = Header(None, alias="x-auth-token"),
) -> str | None:
    """Extract token from Authorization: Bearer <token> or x-auth-token header."""
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        return credentials.credentials.strip()
    if x_token and x_token.strip():
        return x_token.strip()
    return None


def _resolve_user_id(token: str, db: Session) -> str | None:
    """Resolve user_id from JWT or session. Returns None if invalid."""
    if is_jwt_token(token):
        return decode_access_token(token)
    return get_session(db, token)


def get_current_user(
    token: str | None = Depends(_extract_token),
    db: Session = Depends(database.get_db),
):
    """Dependency that returns the authenticated User or raises 401. Accepts JWT or session token."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = _resolve_user_id(token, db)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session invalid. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if getattr(user, "is_active", True) is False:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account deactivated. Contact support.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def get_current_token(
    token: str | None = Depends(_extract_token),
    _: models.User = Depends(get_current_user),
) -> str:
    """Dependency that returns the validated session token. Use after get_current_user."""
    return token  # get_current_user already validated it exists and is valid


def get_current_user_optional(
    token: str | None = Depends(_extract_token),
    db: Session = Depends(database.get_db),
):
    """Dependency that returns the User if authenticated, else None. Accepts JWT or session token."""
    if not token:
        return None
    user_id = _resolve_user_id(token, db)
    if not user_id:
        return None
    return db.query(models.User).filter(models.User.id == user_id).first()


def _links_table_exists(db: Session) -> bool:
    """True if individual_institution_links exists (migration 028 applied)."""
    dialect = getattr(db.get_bind().dialect, "name", "postgresql")
    if dialect == "sqlite":
        r = db.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='individual_institution_links'"))
    else:
        r = db.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='individual_institution_links'")
        )
    return r.fetchone() is not None


def _user_has_permission(db: Session, user_id: str, permission_code: str) -> bool:
    """Check if user has the given permission via any active link or UserRoleAssignment."""
    now = datetime.datetime.utcnow()
    if _links_table_exists(db):
        row = db.execute(
            text("""
                SELECT 1 FROM (
                    SELECT role_id FROM individual_institution_links
                    WHERE user_id = :user_id AND (end_date IS NULL OR end_date > :now)
                    UNION
                    SELECT role_id FROM individual_organization_links
                    WHERE user_id = :user_id AND (end_date IS NULL OR end_date > :now)
                ) links
                JOIN role_permissions rp ON rp.role_id = links.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE p.code = :code
                LIMIT 1
            """),
            {"user_id": user_id, "now": now, "code": permission_code},
        ).fetchone()
    else:
        row = db.execute(
            text("""
                SELECT 1 FROM user_role_assignments ura
                JOIN role_permissions rp ON rp.role_id = ura.role_id
                JOIN permissions p ON p.id = rp.permission_id
                WHERE ura.user_id = :user_id AND ura.is_active = true
                  AND (ura.expires_at IS NULL OR ura.expires_at > :now)
                  AND p.code = :code
                LIMIT 1
            """),
            {"user_id": user_id, "now": now, "code": permission_code},
        ).fetchone()
    return row is not None


# Limited permissions for recruiters at non-onboarded organizations
_RECRUITER_LIMITED_PERMISSIONS = frozenset({
    "recruitment.job_profiles.view",
    "recruitment.job_profiles.create",
})


def _user_has_permission_with_subscription(db: Session, user_id: str, permission_code: str) -> bool:
    """Check permission with subscription/onboarding gating. First passes base RBAC, then applies feature checks."""
    if not _user_has_permission(db, user_id, permission_code):
        return False

    # system.admin bypasses all subscription checks
    if _user_has_permission(db, user_id, "system.admin"):
        return True

    from . import subscription
    from .links import get_active_institution_links, get_active_organization_links

    # Placement: require institution to have "placement" feature (if user has inst links)
    if permission_code.startswith("placement."):
        if not _links_table_exists(db):
            return True
        inst_links = get_active_institution_links(db, user_id)
        inst_ids = [l.institution_id for l in inst_links if l.institution_id]
        if inst_ids:
            if not any(subscription.institution_has_feature(db, iid, "placement") for iid in inst_ids):
                return False
        return True

    # Governance: require institution to have "governance" feature (if user has inst links)
    if permission_code.startswith("governance."):
        if not _links_table_exists(db):
            return True
        inst_links = get_active_institution_links(db, user_id)
        inst_ids = [l.institution_id for l in inst_links if l.institution_id]
        if inst_ids:
            if not any(subscription.institution_has_feature(db, iid, "governance") for iid in inst_ids):
                return False
        return True

    # Recruitment: if user has org links and org not onboarded, allow only limited set
    if permission_code.startswith("recruitment."):
        if not _links_table_exists(db):
            return True
        org_links = get_active_organization_links(db, user_id)
        for link in org_links:
            if link.company_id and not subscription.company_is_onboarded(db, link.company_id):
                if permission_code not in _RECRUITER_LIMITED_PERMISSIONS:
                    return False
                break
        return True

    return True


def _user_has_role(db: Session, user_id: str, role_ids: list[str]) -> bool:
    """Check if user has any of the given roles via active link or UserRoleAssignment."""
    if not role_ids:
        return False
    now = datetime.datetime.utcnow()
    placeholders = ", ".join([f":r{i}" for i in range(len(role_ids))])
    params = {"user_id": user_id, "now": now, **{f"r{i}": r for i, r in enumerate(role_ids)}}
    if _links_table_exists(db):
        query = text(f"""
            SELECT 1 FROM (
                SELECT role_id FROM individual_institution_links
                WHERE user_id = :user_id AND (end_date IS NULL OR end_date > :now)
                UNION
                SELECT role_id FROM individual_organization_links
                WHERE user_id = :user_id AND (end_date IS NULL OR end_date > :now)
            ) links
            WHERE role_id IN ({placeholders})
            LIMIT 1
        """)
    else:
        query = text(f"""
            SELECT 1 FROM user_role_assignments
            WHERE user_id = :user_id AND is_active = true
              AND (expires_at IS NULL OR expires_at > :now)
              AND role_id IN ({placeholders})
            LIMIT 1
        """)
    row = db.execute(query, params).fetchone()
    return row is not None


def require_permission(permission_code: str):
    """Dependency factory that requires the given permission."""

    def _check(user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
        if _user_has_permission(db, user.id, permission_code):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission_code}",
        )

    return _check


def require_permission_with_subscription(permission_code: str):
    """Dependency factory that requires the permission with subscription/onboarding gating."""

    def _check(user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
        if _user_has_permission_with_subscription(db, user.id, permission_code):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: {permission_code}",
        )

    return _check


def require_role(*allowed_roles: str):
    """Dependency factory that requires one of the given role IDs."""

    def _check(user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
        if _user_has_role(db, user.id, list(allowed_roles)):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role required: one of {allowed_roles}",
        )

    return _check


def require_users_list_access():
    """Dependency: allow listing users if user has placement/recruiter/admin role OR preparation.community.admin."""

    def _check(user: models.User = Depends(get_current_user), db: Session = Depends(database.get_db)):
        if _user_has_role(db, user.id, ["PLACEMENT_TEAM", "PLACEMENT_ADMIN", "RECRUITER", "SYSTEM_ADMIN"]):
            return user
        if _user_has_permission(db, user.id, "preparation.community.admin"):
            return user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: role or preparation.community.admin required",
        )

    return _check


def get_institution_scope(
    user: models.User = Depends(get_current_user),
) -> str | None:
    """Return the user's active institution_id for scoping queries.

    System admins (no institution_id) get None, meaning unscoped / cross-institution.
    All other users get their institution_id so queries are auto-filtered.
    """
    return user.institution_id


def require_institution_scope(
    user: models.User = Depends(get_current_user),
) -> str:
    """Like get_institution_scope but raises 403 if the user has no institution context."""
    if not user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires an institution context. Switch to an institution-scoped profile.",
        )
    return user.institution_id
