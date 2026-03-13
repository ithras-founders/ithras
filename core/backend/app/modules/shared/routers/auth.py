"""Authentication API - login with email and password, profile switching.

Uses IndividualInstitutionLink and IndividualOrganizationLink (link model) as the source of profiles
when migration 028 has run. Falls back to UserRoleAssignment when links table does not exist.
"""
import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, field_validator
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.modules.shared import models, database
from app.modules.shared.password import verify_password, hash_password
from app.modules.shared.audit import log_audit
from app.modules.shared.session_store import create_session, delete_session
from app.modules.shared.jwt_utils import create_access_token
from app.modules.shared.auth import get_current_user, get_current_token
from app.modules.shared.links import get_active_institution_links, get_active_organization_links
from app.modules.shared.profile_builders import (
    build_profile_from_institution_link,
    build_profile_from_organization_link,
    build_profile_from_ura,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


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


class LoginRequest(BaseModel):
    email: str
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        """Strip whitespace and lowercase for case-insensitive matching."""
        if isinstance(v, str):
            return v.strip().lower()
        return v


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str
    role: str = "CANDIDATE"  # CANDIDATE or PROFESSIONAL
    student_subtype: str | None = None  # UNDERGRADUATE, GRADUATE, DOCTORAL, OTHERS (for CANDIDATE)


class SwitchProfileRequest(BaseModel):
    profile_id: str


class MeUpdateRequest(BaseModel):
    """Fields a user can update for their own account (profile.self.edit scope)."""
    name: str | None = None
    full_name: str | None = None
    email: str | None = None
    phone: str | None = None
    profile_photo_url: str | None = None
    email_hidden: bool | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            return v.strip().lower()
        return v


def _get_active_profiles(db: Session, user_id: str) -> list:
    """Get all active profiles. Uses links when migration 028 applied, else UserRoleAssignment."""
    if _links_table_exists(db):
        inst_links = get_active_institution_links(db, user_id)
        org_links = get_active_organization_links(db, user_id)
        return (
            [build_profile_from_institution_link(l) for l in inst_links]
            + [build_profile_from_organization_link(l) for l in org_links]
        )
    # Pre-028 fallback: UserRoleAssignment
    now = datetime.datetime.utcnow()
    uras = (
        db.query(models.UserRoleAssignment)
        .filter(
            models.UserRoleAssignment.user_id == user_id,
            models.UserRoleAssignment.is_active == True,
        )
        .filter(
            (models.UserRoleAssignment.expires_at.is_(None))
            | (models.UserRoleAssignment.expires_at > now),
        )
        .order_by(models.UserRoleAssignment.granted_at.desc())
        .all()
    )
    return [build_profile_from_ura(u) for u in uras]


@router.post("/register", summary="Self-register for general users (no institution)")
def register(req: RegisterRequest, db: Session = Depends(database.get_db)):
    """Create account for students/professionals without an onboarded institution."""
    if req.role not in ("CANDIDATE", "PROFESSIONAL"):
        raise HTTPException(status_code=400, detail="Registration only supports CANDIDATE or PROFESSIONAL role")
    existing = db.query(models.User).filter(models.User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    role_exists = db.query(models.Role).filter(models.Role.id == req.role).first()
    if not role_exists:
        raise HTTPException(status_code=400, detail=f"Role {req.role} not found")
    user_id = f"general_{uuid.uuid4().hex[:12]}"
    db_user = models.User(
        id=user_id,
        email=req.email,
        name=req.name,
        role=req.role,
        institution_id=None,
        program_id=None,
        company_id=None,
        password_hash=hash_password(req.password),
        sector_preferences=[],
        student_subtype=req.student_subtype if req.role == "CANDIDATE" else None,
    )
    db.add(db_user)
    if _links_table_exists(db):
        link_id = f"iil_{user_id}_{req.role}_{uuid.uuid4().hex[:8]}"
        inst_link = models.IndividualInstitutionLink(
            id=link_id,
            user_id=user_id,
            institution_id=None,
            program_id=None,
            role_id=req.role,
            start_date=datetime.datetime.utcnow(),
            end_date=None,
        )
        db.add(inst_link)
    else:
        ura_id = f"migrated_{user_id}_{req.role}"
        ura = models.UserRoleAssignment(
            id=ura_id,
            user_id=user_id,
            role_id=req.role,
            institution_id=None,
            company_id=None,
            program_id=None,
            is_active=True,
        )
        db.add(ura)
    log_audit(db, user_id=user_id, action="USER_REGISTERED", entity_type="user", entity_id=user_id, details={"email": req.email, "role": req.role})
    db.commit()
    db.refresh(db_user)
    profiles = _get_active_profiles(db, user_id)
    active_profile = profiles[0] if profiles else None
    session_id = create_session(db, user_id)
    access_token = create_access_token(user_id)
    db.commit()
    return {
        "session_id": session_id,
        "access_token": access_token,
        "user": {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "role": db_user.role,
            "company_id": db_user.company_id,
            "institution_id": db_user.institution_id,
            "program_id": db_user.program_id,
            "sector_preferences": db_user.sector_preferences or [],
            "student_subtype": db_user.student_subtype,
            "email_hidden": getattr(db_user, "email_hidden", False),
        },
        "profiles": profiles,
        "active_profile": active_profile,
    }


@router.post("/login", summary="Login with email and password")
def login(req: LoginRequest, db: Session = Depends(database.get_db)):
    """Authenticate and return user info with session_id and active profiles."""
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    profiles = _get_active_profiles(db, user.id)
    active_profile = profiles[0] if profiles else None

    session_id = create_session(db, user.id)
    access_token = create_access_token(user.id)

    log_audit(
        db, user_id=user.id, action="USER_LOGIN",
        entity_type="user", entity_id=user.id,
        institution_id=user.institution_id,
        company_id=user.company_id,
    )
    db.commit()

    return {
        "session_id": session_id,
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "company_id": user.company_id,
            "institution_id": user.institution_id,
            "program_id": user.program_id,
            "sector_preferences": user.sector_preferences or [],
            "student_subtype": getattr(user, "student_subtype", None),
            "email_hidden": getattr(user, "email_hidden", False),
        },
        "profiles": profiles,
        "active_profile": active_profile,
    }


@router.get("/me", summary="Validate session and return current user")
def me(user=Depends(get_current_user)):
    """Lightweight session validation. Returns 401 if session is invalid or expired."""
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "full_name": getattr(user, "full_name", None) or user.name,
            "phone": getattr(user, "phone", None),
            "is_active": getattr(user, "is_active", True),
            "role": user.role,
            "company_id": user.company_id,
            "institution_id": user.institution_id,
            "program_id": user.program_id,
            "sector_preferences": user.sector_preferences or [],
            "student_subtype": getattr(user, "student_subtype", None),
            "profile_photo_url": getattr(user, "profile_photo_url", None),
            "email_hidden": getattr(user, "email_hidden", False),
        },
    }


@router.patch("/me", summary="Update current user's display name or email")
def update_me(
    req: MeUpdateRequest,
    user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Users can change their display name (username) or email. Email must remain unique."""
    changes = req.model_dump(exclude_unset=True)
    if not changes:
        _u = {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "company_id": user.company_id, "institution_id": user.institution_id, "program_id": user.program_id, "sector_preferences": user.sector_preferences or [], "student_subtype": getattr(user, "student_subtype", None), "email_hidden": getattr(user, "email_hidden", False)}
        if getattr(user, "profile_photo_url", None):
            _u["profile_photo_url"] = user.profile_photo_url
        return {"user": _u}
    if "email" in changes and changes["email"]:
        existing = db.query(models.User).filter(
            models.User.email == changes["email"],
            models.User.id != user.id,
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="An account with this email already exists")
    for key, value in changes.items():
        if value is not None:
            setattr(user, key, value)
    log_audit(
        db, user_id=user.id, action="USER_SELF_UPDATE",
        entity_type="user", entity_id=user.id,
        institution_id=user.institution_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(user)
    _user_obj = {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "company_id": user.company_id,
        "institution_id": user.institution_id,
        "program_id": user.program_id,
        "sector_preferences": user.sector_preferences or [],
        "student_subtype": getattr(user, "student_subtype", None),
        "email_hidden": getattr(user, "email_hidden", False),
    }
    if getattr(user, "profile_photo_url", None):
        _user_obj["profile_photo_url"] = user.profile_photo_url
    return {"user": _user_obj}


@router.post("/logout", summary="Logout and invalidate session")
def logout(
    _user=Depends(get_current_user),
    token: str = Depends(get_current_token),
    db: Session = Depends(database.get_db),
):
    """Invalidate the current session. Client should send Authorization: Bearer <session_id>."""
    delete_session(db, token)
    return {"message": "Logged out"}


@router.post("/switch-profile", summary="Switch active profile")
def switch_profile(
    req: SwitchProfileRequest,
    user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Switch active profile. Returns the selected profile with permissions. Requires auth."""
    now = datetime.datetime.utcnow()
    profile_id = req.profile_id

    def _user_response():
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "company_id": user.company_id,
            "institution_id": user.institution_id,
            "program_id": user.program_id,
            "sector_preferences": user.sector_preferences or [],
        }

    if _links_table_exists(db):
        inst_link = (
            db.query(models.IndividualInstitutionLink)
            .filter(
                models.IndividualInstitutionLink.id == profile_id,
                models.IndividualInstitutionLink.user_id == user.id,
            )
            .first()
        )
        if inst_link:
            if inst_link.end_date and inst_link.end_date < now:
                raise HTTPException(status_code=400, detail="This profile has expired")
            user.role = inst_link.role_id
            user.institution_id = inst_link.institution_id
            user.company_id = None
            user.program_id = inst_link.program_id
            db.commit()
            return {"active_profile": build_profile_from_institution_link(inst_link), "user": _user_response()}

        org_link = (
            db.query(models.IndividualOrganizationLink)
            .filter(
                models.IndividualOrganizationLink.id == profile_id,
                models.IndividualOrganizationLink.user_id == user.id,
            )
            .first()
        )
        if org_link:
            if org_link.end_date and org_link.end_date < now:
                raise HTTPException(status_code=400, detail="This profile has expired")
            user.role = org_link.role_id
            user.institution_id = None
            user.company_id = org_link.company_id
            user.program_id = None
            db.commit()
            return {"active_profile": build_profile_from_organization_link(org_link), "user": _user_response()}
    else:
        # Pre-028 fallback: UserRoleAssignment
        ura = (
            db.query(models.UserRoleAssignment)
            .filter(
                models.UserRoleAssignment.id == profile_id,
                models.UserRoleAssignment.user_id == user.id,
                models.UserRoleAssignment.is_active == True,
            )
            .first()
        )
        if ura:
            if ura.expires_at and ura.expires_at < now:
                raise HTTPException(status_code=400, detail="This profile has expired")
            user.role = ura.role_id
            user.institution_id = ura.institution_id
            user.company_id = ura.company_id
            user.program_id = ura.program_id
            db.commit()
            return {"active_profile": build_profile_from_ura(ura), "user": _user_response()}

    raise HTTPException(status_code=404, detail="Profile not found or inactive")
