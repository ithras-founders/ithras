"""Community management - moderators CRUD, channels. Requires preparation.community.admin or system.admin."""
import os
import sys
import uuid
import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import text

_core = os.path.join(os.path.dirname(__file__), "../../../../../../core/backend")
if _core not in sys.path:
    sys.path.insert(0, _core)

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user, _user_has_permission
from app.modules.shared.audit import log_audit

router = APIRouter(prefix="/api/v1/admin/prep-community", tags=["prep-community-management"])

CHANNELS_CONFIG = [
    {"code": "CAT_STRATEGY", "name": "CAT Strategy", "description": "CAT prep and percentile strategy"},
    {"code": "SCHOOL_PI_IIMA", "name": "IIM Ahmedabad PI", "description": "IIMA interview questions and prep"},
    {"code": "SCHOOL_PI_IIMB", "name": "IIM Bangalore PI", "description": "IIMB interview questions and prep"},
    {"code": "SCHOOL_PI_XLRI", "name": "XLRI PI", "description": "XLRI interview questions and prep"},
    {"code": "WAT_REVIEW", "name": "WAT Review", "description": "Written Ability Test topics and feedback"},
    {"code": "GD_REVIEW", "name": "GD Review", "description": "Group Discussion prompts and structure"},
]


def _require_admin(user=Depends(get_current_user), db: Session = Depends(database.get_db)):
    """Require preparation.community.admin or system.admin."""
    if _user_has_permission(db, user.id, "preparation.community.admin") or _user_has_permission(db, user.id, "system.admin"):
        return user
    from fastapi import status
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Community admin permission required")


class ModeratorAssignment(BaseModel):
    user_id: str
    role_id: str = "PREP_COMMUNITY_MODERATOR"  # or PREP_COMMUNITY_ADMIN


@router.get("/channels", response_model=list[schemas.PrepCommunityChannelSchema])
def list_channels(
    current_user=Depends(_require_admin),
):
    """List channels (from config)."""
    return [schemas.PrepCommunityChannelSchema(**c) for c in CHANNELS_CONFIG]


@router.get("/moderators")
def list_moderators(
    current_user=Depends(_require_admin),
    db: Session = Depends(database.get_db),
):
    """List users with PREP_COMMUNITY_MODERATOR or PREP_COMMUNITY_ADMIN role."""
    rows = db.execute(
        text("""
            SELECT u.id, u.email, u.name, ura.role_id
            FROM user_role_assignments ura
            JOIN users u ON u.id = ura.user_id
            WHERE ura.role_id IN ('PREP_COMMUNITY_MODERATOR', 'PREP_COMMUNITY_ADMIN')
            AND ura.is_active = true
            AND (ura.expires_at IS NULL OR ura.expires_at > :now)
        """),
        {"now": datetime.datetime.utcnow()},
    ).fetchall()
    return [{"user_id": r[0], "email": r[1], "name": r[2], "role_id": r[3]} for r in rows]


@router.post("/moderators")
def assign_moderator(
    data: ModeratorAssignment,
    current_user=Depends(_require_admin),
    db: Session = Depends(database.get_db),
):
    """Assign moderator or admin role to a user."""
    if data.role_id not in ("PREP_COMMUNITY_MODERATOR", "PREP_COMMUNITY_ADMIN"):
        raise HTTPException(status_code=400, detail="role_id must be PREP_COMMUNITY_MODERATOR or PREP_COMMUNITY_ADMIN")
    user = db.query(models.User).filter(models.User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    assignment_id = f"ura_{uuid.uuid4().hex[:12]}"
    now = datetime.datetime.utcnow()
    existing = (
        db.query(models.UserRoleAssignment)
        .filter(
            models.UserRoleAssignment.user_id == data.user_id,
            models.UserRoleAssignment.role_id == data.role_id,
            models.UserRoleAssignment.institution_id.is_(None),
            models.UserRoleAssignment.company_id.is_(None),
            models.UserRoleAssignment.is_active == True,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already has this role")
    ura = models.UserRoleAssignment(
        id=assignment_id,
        user_id=data.user_id,
        role_id=data.role_id,
        institution_id=None,
        company_id=None,
        program_id=None,
        granted_by=current_user.id,
        granted_at=now,
        is_active=True,
    )
    db.add(ura)
    log_audit(db, user_id=current_user.id, action="PREP_MODERATOR_ASSIGNED", entity_type="user_role_assignment", entity_id=assignment_id, details={"user_id": data.user_id, "role_id": data.role_id})
    db.commit()
    return {"user_id": data.user_id, "role_id": data.role_id, "assignment_id": assignment_id}


@router.delete("/moderators/{user_id}")
def remove_moderator(
    user_id: str,
    role_id: str = "PREP_COMMUNITY_MODERATOR",
    current_user=Depends(_require_admin),
    db: Session = Depends(database.get_db),
):
    """Remove moderator/admin role from user. Deactivates the assignment."""
    if role_id not in ("PREP_COMMUNITY_MODERATOR", "PREP_COMMUNITY_ADMIN"):
        raise HTTPException(status_code=400, detail="role_id must be PREP_COMMUNITY_MODERATOR or PREP_COMMUNITY_ADMIN")
    ura = (
        db.query(models.UserRoleAssignment)
        .filter(
            models.UserRoleAssignment.user_id == user_id,
            models.UserRoleAssignment.role_id == role_id,
            models.UserRoleAssignment.is_active == True,
        )
        .first()
    )
    if not ura:
        raise HTTPException(status_code=404, detail="No active assignment found")
    ura.is_active = False
    log_audit(db, user_id=current_user.id, action="PREP_MODERATOR_REMOVED", entity_type="user", entity_id=user_id, details={"role_id": role_id})
    db.commit()
    return {"user_id": user_id, "role_id": role_id, "removed": True}
