from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Dict
import os
import uuid
import datetime

from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.modules.shared.auth import (
    get_current_user,
    get_current_user_optional,
    require_role,
    _links_table_exists,
)
from app.modules.shared.links import (
    get_all_institution_links,
    get_all_organization_links,
    get_active_institution_links,
    get_active_organization_links,
    is_alumni,
    is_link_active,
)
from app.modules.shared.subscription import (
    get_institution_allowed_roles,
    get_company_allowed_roles,
    company_is_onboarded,
    institution_is_fully_onboarded,
)
from app.config import settings as _app_settings
from ..services.profile_change_service import (
    serialize_profile_request,
    create_profile_change,
    approve_profile_change,
    reject_profile_change,
)

router = APIRouter(prefix="/api/v1/users", tags=["users"])

UPLOAD_DIR = _app_settings.UPLOAD_DIR

# Map service ValueError messages to HTTP responses
_PROFILE_ERROR_MAP = {
    "user_not_found": (404, "User not found"),
    "not_candidate": (400, "Only student profile changes require approval"),
    "self_only": (403, "Students can only request changes for themselves"),
    "no_valid_fields": (400, "No valid profile fields supplied"),
    "invalid_program": (400, "Program must belong to the student's institution"),
    "pending_exists": (400, "A profile update request is already pending approval"),
    "not_found": (404, "Profile change request not found"),
    "not_pending": (400, "Request is not pending"),
    "reason_required": (400, "Rejection reason is required"),
}

def _active_scope_ids(user: models.User, db: Session) -> tuple[set[str], set[str]]:
    institution_ids = {user.institution_id} if user.institution_id else set()
    company_ids = {user.company_id} if user.company_id else set()
    if not _links_table_exists(db):
        return institution_ids, company_ids

    now = datetime.datetime.utcnow()
    institution_ids.update(
        link.institution_id
        for link in get_active_institution_links(db, user.id, now)
        if link.institution_id
    )
    company_ids.update(
        link.company_id
        for link in get_active_organization_links(db, user.id, now)
        if link.company_id
    )
    return institution_ids, company_ids


def _ensure_within_scope(
    current_user: models.User,
    db: Session,
    *,
    target_institution_id: Optional[str] = None,
    target_company_id: Optional[str] = None,
) -> None:
    if current_user.role == "SYSTEM_ADMIN":
        return

    institution_ids, company_ids = _active_scope_ids(current_user, db)
    if target_institution_id and target_institution_id not in institution_ids:
        raise HTTPException(status_code=403, detail="Institution scope access denied")
    if target_company_id and target_company_id not in company_ids:
        raise HTTPException(status_code=403, detail="Company scope access denied")


def _ensure_self(current_user: models.User, target_user_id: str) -> None:
    if current_user.id != target_user_id:
        raise HTTPException(status_code=403, detail="You can only perform this action for yourself")


@router.get("/")
def get_users(
    q: Optional[str] = None,
    role: Optional[str] = None,
    role_in: Optional[str] = Query(None, description="Comma-separated roles, e.g. PLACEMENT_TEAM,PLACEMENT_ADMIN"),
    email: Optional[str] = None,
    institution_id: Optional[str] = None,
    company_id: Optional[str] = None,
    program_id: Optional[str] = None,
    batch_id: Optional[str] = None,
    cv_status: Optional[str] = None,
    sector: Optional[str] = None,
    is_alumni: Optional[bool] = Query(None, description="When true with institution_id or company_id, return users with ended links (alumni)"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: models.User = Depends(get_current_user),
    _: models.User = Depends(require_role("SYSTEM_ADMIN", "PLACEMENT_ADMIN", "PLACEMENT_TEAM", "RECRUITER")),
    db: Session = Depends(database.get_db),
):
    """Get users with optional filtering and pagination. q = text search on name, email, roll_number."""
    now = datetime.datetime.utcnow()
    _ensure_within_scope(
        current_user,
        db,
        target_institution_id=institution_id,
        target_company_id=company_id,
    )

    query = db.query(models.User)
    if is_alumni:
        if _links_table_exists(db):
            if institution_id:
                alumni_subq = (
                    db.query(models.IndividualInstitutionLink.user_id)
                    .filter(
                        models.IndividualInstitutionLink.institution_id == institution_id,
                        models.IndividualInstitutionLink.end_date.isnot(None),
                        models.IndividualInstitutionLink.end_date < now,
                    )
                    .distinct()
                )
                query = query.filter(models.User.id.in_(alumni_subq))
                query = query.filter(models.User.role != 'SYSTEM_ADMIN')
            elif company_id:
                alumni_subq = (
                    db.query(models.IndividualOrganizationLink.user_id)
                    .filter(
                        models.IndividualOrganizationLink.company_id == company_id,
                        models.IndividualOrganizationLink.end_date.isnot(None),
                        models.IndividualOrganizationLink.end_date < now,
                    )
                    .distinct()
                )
                query = query.filter(models.User.id.in_(alumni_subq))
        elif institution_id:
            query = query.filter(
                models.User.institution_id == institution_id,
                models.User.role == 'ALUMNI',
            )
            query = query.filter(models.User.role != 'SYSTEM_ADMIN')
        elif company_id:
            query = query.filter(models.User.id.in_([]))  # No legacy fallback for company alumni
    elif institution_id:
        query = query.filter(models.User.role != 'SYSTEM_ADMIN')
        if _links_table_exists(db):
            active_inst_subq = (
                db.query(models.IndividualInstitutionLink.user_id)
                .filter(
                    models.IndividualInstitutionLink.institution_id == institution_id,
                    or_(
                        models.IndividualInstitutionLink.end_date.is_(None),
                        models.IndividualInstitutionLink.end_date >= now,
                    ),
                )
                .distinct()
            )
            query = query.filter(
                or_(
                    models.User.institution_id == institution_id,
                    models.User.id.in_(active_inst_subq),
                )
            )
        else:
            query = query.filter(models.User.institution_id == institution_id)
    elif company_id:
        if _links_table_exists(db):
            active_org_subq = (
                db.query(models.IndividualOrganizationLink.user_id)
                .filter(
                    models.IndividualOrganizationLink.company_id == company_id,
                    or_(
                        models.IndividualOrganizationLink.end_date.is_(None),
                        models.IndividualOrganizationLink.end_date >= now,
                    ),
                )
                .distinct()
            )
            query = query.filter(
                or_(
                    models.User.company_id == company_id,
                    models.User.id.in_(active_org_subq),
                )
            )
        else:
            query = query.filter(models.User.company_id == company_id)
    if role_in and role_in.strip():
        roles = [r.strip() for r in role_in.split(",") if r.strip()]
        if roles:
            query = query.filter(models.User.role.in_(roles))
    elif role:
        query = query.filter(models.User.role == role)
    if email:
        query = query.filter(models.User.email == email)
    if program_id:
        query = query.filter(models.User.program_id == program_id)
    if batch_id:
        query = query.filter(models.User.batch_id == batch_id)
    if q and q.strip():
        term = f"%{q.strip()}%"
        query = query.filter(
            or_(
                models.User.name.ilike(term),
                models.User.email.ilike(term),
                models.User.roll_number.ilike(term),
            )
        )
    if cv_status and cv_status.strip():
        statuses = [s.strip().upper() for s in cv_status.split(",") if s.strip()]
        if statuses:
            subq = db.query(models.CV.candidate_id).filter(models.CV.status.in_(statuses)).distinct()
            query = query.filter(models.User.id.in_(subq))
    if sector and sector.strip():
        from sqlalchemy import cast, String
        sector_val = sector.strip()
        query = query.filter(cast(models.User.sector_preferences, String).ilike(f"%{sector_val}%"))
    from app.modules.shared.pagination import paginate_query
    items, total = paginate_query(query, limit, offset)
    return {"items": items, "total": total}


@router.get("/{user_id}/profile", response_model=schemas.UserProfileResponseSchema)
def get_user_profile(
    user_id: str,
    current_user: Optional[models.User] = Depends(get_current_user_optional),
    db: Session = Depends(database.get_db),
):
    """Get user with institution/org links and profile type for LinkedIn-style profile display."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    inst_links = []
    org_links = []
    profile_type = "public"

    if _links_table_exists(db):
        for link in get_all_institution_links(db, user_id):
            if not link.institution_id:
                # Include general links only when they have program data (degree to display).
                # Skip links with no program to avoid showing role (e.g. "PROFESSIONAL") as degree.
                prog = link.program or (link.program_id and db.query(models.Program).filter(models.Program.id == link.program_id).first())
                if not link.program_id and not (prog and prog.name):
                    continue
                inst = None
            else:
                inst = link.institution or db.query(models.Institution).filter(models.Institution.id == link.institution_id).first()
                prog = link.program or (link.program_id and db.query(models.Program).filter(models.Program.id == link.program_id).first())
            role = link.role
            tag = "Alumni" if is_alumni(link) else "Current"
            inst_links.append(schemas.InstitutionLinkSchema(
                id=link.id,
                institution_id=link.institution_id,
                institution_name=inst.name if inst else None,
                institution_logo_url=inst.logo_url if inst else None,
                program_id=link.program_id,
                program_name=prog.name if prog else None,
                role_id=link.role_id,
                role_name=role.id if role else link.role_id,
                start_date=link.start_date,
                end_date=link.end_date,
                tag=tag,
            ))
            if link.institution_id and institution_is_fully_onboarded(db, link.institution_id):
                profile_type = "student"

        for link in get_all_organization_links(db, user_id):
            company = link.company or (link.company_id and db.query(models.Company).filter(models.Company.id == link.company_id).first())
            role = link.role
            tag = "Alumni" if is_alumni(link) else "Current"
            org_links.append(schemas.OrganizationLinkSchema(
                id=link.id,
                company_id=link.company_id,
                company_name=company.name if company else None,
                company_logo_url=company.logo_url if company else None,
                role_id=link.role_id,
                role_name=role.id if role else link.role_id,
                start_date=link.start_date,
                end_date=link.end_date,
                tag=tag,
            ))
            if company_is_onboarded(db, link.company_id):
                profile_type = "recruiter" if profile_type == "public" else profile_type

    # Fallback: when links are empty but user has legacy institution_id/company_id,
    # synthesize link-like payloads so public profile and system admin can display them.
    _LEGACY_PLACEHOLDER_DATE = datetime.datetime(2000, 1, 1)
    if not inst_links and user.institution_id:
        inst = db.query(models.Institution).filter(models.Institution.id == user.institution_id).first()
        prog = None
        if user.program_id:
            prog = db.query(models.Program).filter(models.Program.id == user.program_id).first()
        inst_links.append(schemas.InstitutionLinkSchema(
            id=f"legacy_inst_{user_id}",
            institution_id=user.institution_id,
            institution_name=inst.name if inst else None,
            institution_logo_url=inst.logo_url if inst else None,
            program_id=user.program_id,
            program_name=prog.name if prog else None,
            role_id="CANDIDATE",
            role_name="Student",
            start_date=_LEGACY_PLACEHOLDER_DATE,
            end_date=None,
            tag="Current",
        ))
        if user.institution_id and institution_is_fully_onboarded(db, user.institution_id):
            profile_type = "student"

    if not org_links and user.company_id:
        company = db.query(models.Company).filter(models.Company.id == user.company_id).first()
        org_links.append(schemas.OrganizationLinkSchema(
            id=f"legacy_org_{user_id}",
            company_id=user.company_id,
            company_name=company.name if company else None,
            company_logo_url=company.logo_url if company else None,
            role_id="RECRUITER",
            role_name="Recruiter",
            start_date=_LEGACY_PLACEHOLDER_DATE,
            end_date=None,
            tag="Current",
        ))
        if company_is_onboarded(db, user.company_id):
            profile_type = "recruiter" if profile_type == "public" else profile_type

    # Build user payload. Hide email for non-owners when email_hidden is True.
    is_owner = current_user and current_user.id == user_id
    email_hidden = getattr(user, "email_hidden", False)
    user_data = {
        "id": user.id,
        "email": None if (not is_owner and email_hidden) else user.email,
        "name": user.name,
        "role": user.role,
        "company_id": user.company_id,
        "institution_id": user.institution_id,
        "program_id": user.program_id,
        "batch_id": user.batch_id,
        "sector_preferences": user.sector_preferences or [],
        "roll_number": user.roll_number,
        "profile_photo_url": getattr(user, "profile_photo_url", None),
        "student_subtype": getattr(user, "student_subtype", None),
        "is_verified": getattr(user, "is_verified", None),
        "email_hidden": email_hidden,
    }
    return schemas.UserProfileResponseSchema(
        user=schemas.UserProfileSchema.model_validate(user_data),
        institution_links=inst_links,
        organization_links=org_links,
        profile_type=profile_type,
    )


@router.get("/{user_id}", response_model=schemas.UserSchema)
def get_user(user_id: str, db: Session = Depends(database.get_db)):
    """Get a specific user by ID"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=schemas.UserSchema)
def create_user(
    user: schemas.UserCreateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Create a new user. Every user must have an institution or organization context."""
    existing = db.query(models.User).filter(models.User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    role_id = user.role or "CANDIDATE"
    if role_id == "RECRUITER":
        if not user.company_id:
            raise HTTPException(status_code=400, detail="Recruiter role requires a company")
        if role_id not in get_company_allowed_roles(db, user.company_id):
            raise HTTPException(status_code=403, detail="RECRUITER is not allowed for this organization")
        if not company_is_onboarded(db, user.company_id):
            raise HTTPException(status_code=403, detail="Organization must be onboarded to add recruiters")
    else:
        if not user.institution_id:
            raise HTTPException(status_code=400, detail="Institution-scoped roles require an institution")
        if role_id not in get_institution_allowed_roles(db, user.institution_id):
            raise HTTPException(status_code=403, detail=f"Role {role_id} is not allowed for this institution")

    if user.role == "CANDIDATE" and user.institution_id:
        if not user.program_id:
            raise HTTPException(
                status_code=400,
                detail="Students with institution require program_id"
            )
        program = db.query(models.Program).filter(
            models.Program.id == user.program_id,
            models.Program.institution_id == user.institution_id
        ).first()
        if not program:
            raise HTTPException(
                status_code=400,
                detail="Program must belong to the selected institution"
            )

    db_user = models.User(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        company_id=user.company_id,
        institution_id=user.institution_id,
        program_id=user.program_id,
        sector_preferences=user.sector_preferences or [],
        roll_number=user.roll_number,
        student_subtype=getattr(user, "student_subtype", None),
    )
    db.add(db_user)

    # Create initial profile (link or URA) so user has at least one role
    now = datetime.datetime.utcnow()
    role_id = user.role or "CANDIDATE"
    if _links_table_exists(db):
        if user.company_id:
            link = models.IndividualOrganizationLink(
                id=f"iol_{uuid.uuid4().hex[:12]}",
                user_id=user.id,
                company_id=user.company_id,
                business_unit_id=None,
                role_id=role_id,
                start_date=now,
                end_date=None,
            )
            db.add(link)
        else:
            link = models.IndividualInstitutionLink(
                id=f"iil_{uuid.uuid4().hex[:12]}",
                user_id=user.id,
                institution_id=user.institution_id,
                program_id=user.program_id,
                role_id=role_id,
                start_date=now,
                end_date=None,
            )
            db.add(link)
    else:
        ura = models.UserRoleAssignment(
            id=f"ura_{uuid.uuid4().hex[:12]}",
            user_id=user.id,
            role_id=role_id,
            institution_id=user.institution_id,
            company_id=user.company_id,
            program_id=user.program_id,
            granted_by=current_user.id,
            is_active=True,
        )
        db.add(ura)

    log_audit(
        db, user_id=current_user.id, action="USER_CREATED",
        entity_type="user", entity_id=user.id,
        institution_id=user.institution_id,
        company_id=user.company_id,
        details={"role": user.role, "email": user.email},
    )
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=schemas.UserSchema)
def update_user(
    user_id: str,
    user_update: schemas.UserUpdateSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Update a user"""
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    changes = user_update.dict(exclude_unset=True)
    for key, value in changes.items():
        setattr(db_user, key, value)

    # Sync links: when institution_id/company_id is updated via Profile edit, ensure a link exists
    # so get_user_profile returns data for public profile and system admin.
    if _links_table_exists(db):
        now = datetime.datetime.utcnow()
        if "institution_id" in changes and db_user.institution_id:
            active_inst = get_active_institution_links(db, user_id, now)
            has_inst_link = any(l.institution_id == db_user.institution_id for l in active_inst)
            if not has_inst_link:
                link = models.IndividualInstitutionLink(
                    id=f"iil_{uuid.uuid4().hex[:12]}",
                    user_id=user_id,
                    institution_id=db_user.institution_id,
                    program_id=db_user.program_id,
                    role_id="CANDIDATE",
                    start_date=now,
                    end_date=None,
                )
                db.add(link)
        if "company_id" in changes and db_user.company_id:
            active_org = get_active_organization_links(db, user_id, now)
            has_org_link = any(l.company_id == db_user.company_id for l in active_org)
            if not has_org_link:
                link = models.IndividualOrganizationLink(
                    id=f"iol_{uuid.uuid4().hex[:12]}",
                    user_id=user_id,
                    company_id=db_user.company_id,
                    business_unit_id=None,
                    role_id="RECRUITER",
                    start_date=now,
                    end_date=None,
                )
                db.add(link)

    log_audit(
        db, user_id=current_user.id, action="USER_UPDATED",
        entity_type="user", entity_id=user_id,
        institution_id=db_user.institution_id,
        details={"changed_fields": list(changes.keys())},
    )
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    """Delete a user. System admins cannot be deleted."""
    from sqlalchemy.exc import IntegrityError
    from app.modules.shared.session_store import delete_sessions_for_user

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.role == "SYSTEM_ADMIN":
        raise HTTPException(
            status_code=400,
            detail="System administrators cannot be deleted",
        )
    delete_sessions_for_user(db, user_id)
    log_audit(
        db, user_id=current_user.id, action="USER_DELETED",
        entity_type="user", entity_id=user_id,
        institution_id=db_user.institution_id,
        company_id=db_user.company_id,
        details={"email": db_user.email, "name": db_user.name, "role": db_user.role},
    )
    db.delete(db_user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Cannot delete user: they have applications, shortlists, CVs, or other linked data. Remove or reassign those first.",
        )
    return {"message": "User deleted successfully"}


@router.post("/{user_id}/profile-change-requests", response_model=schemas.UserProfileChangeRequestSchema)
def create_profile_change_request(
    user_id: str,
    req: schemas.UserProfileChangeRequestCreateSchema,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Students submit profile edits for placement-team approval."""
    _ensure_self(current_user, user_id)
    if req.requested_by != current_user.id:
        raise HTTPException(status_code=403, detail="requested_by must match the authenticated user")

    try:
        db_req = create_profile_change(
            user_id=user_id,
            requested_by=req.requested_by,
            changes=req.requested_changes,
            db=db,
        )
        return serialize_profile_request(db_req, db=db)
    except ValueError as e:
        key = str(e)
        if key in _PROFILE_ERROR_MAP:
            status, msg = _PROFILE_ERROR_MAP[key]
            raise HTTPException(status_code=status, detail=msg)
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/requests/profile-change", response_model=List[schemas.UserProfileChangeRequestSchema])
def list_profile_change_requests(
    institution_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: models.User = Depends(get_current_user),
    _: models.User = Depends(require_role("SYSTEM_ADMIN", "PLACEMENT_ADMIN", "PLACEMENT_TEAM", "RECRUITER")),
    db: Session = Depends(database.get_db)
):
    """List profile update requests for placement representatives."""
    _ensure_within_scope(current_user, db, target_institution_id=institution_id)

    query = db.query(models.UserProfileChangeRequest)
    if institution_id:
        query = query.filter(models.UserProfileChangeRequest.institution_id == institution_id)
    if status:
        query = query.filter(models.UserProfileChangeRequest.status == status)
    requests = query.order_by(models.UserProfileChangeRequest.created_at.desc()).all()
    if not requests:
        return []
    user_ids = set()
    for r in requests:
        if r.user_id:
            user_ids.add(r.user_id)
        if r.requested_by:
            user_ids.add(r.requested_by)
        if r.reviewed_by:
            user_ids.add(r.reviewed_by)
    users = db.query(models.User).filter(models.User.id.in_(list(user_ids))).all() if user_ids else []
    users_by_id = {u.id: u for u in users}
    return [serialize_profile_request(r, db, users_by_id=users_by_id) for r in requests]


@router.get("/{user_id}/profile-change-requests", response_model=List[schemas.UserProfileChangeRequestSchema])
def list_user_profile_change_requests(
    user_id: str,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """List a student's profile update requests."""
    _ensure_self(current_user, user_id)

    requests = db.query(models.UserProfileChangeRequest).filter(
        models.UserProfileChangeRequest.user_id == user_id
    ).order_by(models.UserProfileChangeRequest.created_at.desc()).all()
    if not requests:
        return []
    user_ids = set()
    for r in requests:
        if r.user_id:
            user_ids.add(r.user_id)
        if r.requested_by:
            user_ids.add(r.requested_by)
        if r.reviewed_by:
            user_ids.add(r.reviewed_by)
    users = db.query(models.User).filter(models.User.id.in_(list(user_ids))).all() if user_ids else []
    users_by_id = {u.id: u for u in users}
    return [serialize_profile_request(r, db, users_by_id=users_by_id) for r in requests]


@router.put("/profile-change-requests/{request_id}/approve", response_model=schemas.UserProfileChangeRequestSchema)
def approve_profile_change_request(
    request_id: str,
    review: schemas.UserProfileChangeRequestReviewSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    try:
        db_req = approve_profile_change(request_id, current_user.id, db)
        return serialize_profile_request(db_req, db=db)
    except ValueError as e:
        key = str(e)
        if key in _PROFILE_ERROR_MAP:
            status, msg = _PROFILE_ERROR_MAP[key]
            raise HTTPException(status_code=status, detail=msg)
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/profile-change-requests/{request_id}/reject", response_model=schemas.UserProfileChangeRequestSchema)
def reject_profile_change_request(
    request_id: str,
    review: schemas.UserProfileChangeRequestReviewSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(database.get_db),
):
    try:
        db_req = reject_profile_change(
            request_id, review.rejection_reason or "", current_user.id, db
        )
        return serialize_profile_request(db_req, db=db)
    except ValueError as e:
        key = str(e)
        if key in _PROFILE_ERROR_MAP:
            status, msg = _PROFILE_ERROR_MAP[key]
            raise HTTPException(status_code=status, detail=msg)
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{user_id}/profile-photo")
async def upload_profile_photo(
    user_id: str,
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(database.get_db)
):
    """Upload a profile photo for a user"""
    _ensure_self(current_user, user_id)

    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"profile_{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    photo_url = f"/uploads/{filename}"
    db_user.profile_photo_url = photo_url
    db.commit()
    db.refresh(db_user)
    return {"url": photo_url, "user": schemas.UserSchema.from_orm(db_user)}
