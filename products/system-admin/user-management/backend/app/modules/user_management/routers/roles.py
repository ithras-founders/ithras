"""RBAC API: roles, permissions, user profile assignments."""
import uuid
import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session

from app.modules.shared import models, database, schemas
from app.modules.shared.auth import get_current_user, require_permission, _links_table_exists
from app.modules.shared.subscription import (
    company_is_onboarded,
    get_institution_allowed_roles,
    get_company_allowed_roles,
)
from app.modules.shared.links import get_active_institution_links, get_active_organization_links
from app.modules.shared.profile_builders import (
    build_profile_from_institution_link,
    build_profile_from_organization_link,
    build_profile_from_ura,
)

router = APIRouter(prefix="/api/v1", tags=["rbac"])

INSTITUTION_SCOPED_ROLES = frozenset({
    "CANDIDATE", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "INSTITUTION_ADMIN",
    "FACULTY_OBSERVER", "ALUMNI",
})
ORGANIZATION_SCOPED_ROLES = frozenset({"RECRUITER"})


# --- Permissions ---

@router.get("/permissions/", response_model=List[schemas.PermissionSchema])
def list_permissions(db: Session = Depends(database.get_db)):
    return db.query(models.Permission).order_by(models.Permission.category, models.Permission.code).all()


# --- Roles ---

@router.get("/roles/", response_model=List[schemas.RoleSchema])
def list_roles(
    type: Optional[str] = None,
    institution_id: Optional[str] = None,
    db: Session = Depends(database.get_db),
):
    q = db.query(models.Role)
    if type:
        q = q.filter(models.Role.type == type)
    if institution_id:
        q = q.filter((models.Role.institution_id == institution_id) | (models.Role.institution_id.is_(None)))
    return q.order_by(models.Role.name).all()


@router.get("/roles/assignable", response_model=List[schemas.RoleSchema])
def list_assignable_roles(
    institution_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
):
    """Return roles that can be assigned for the given institution or company context."""
    if institution_id and company_id:
        raise HTTPException(status_code=400, detail="Provide either institution_id or company_id, not both")
    if not institution_id and not company_id:
        raise HTTPException(status_code=400, detail="Provide institution_id or company_id")
    if institution_id:
        allowed = get_institution_allowed_roles(db, institution_id)
    else:
        allowed = get_company_allowed_roles(db, company_id)
    if not allowed:
        return []
    roles = db.query(models.Role).filter(models.Role.id.in_(allowed)).order_by(models.Role.name).all()
    return roles


@router.get("/roles/{role_id}", response_model=schemas.RoleSchema)
def get_role(role_id: str, db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role


@router.post("/roles/", response_model=schemas.RoleSchema)
def create_role(data: schemas.RoleCreateSchema, db: Session = Depends(database.get_db)):
    role_id = f"custom_{uuid.uuid4().hex[:12]}"
    role = models.Role(
        id=role_id,
        name=data.name,
        type="CUSTOM",
        description=data.description,
        institution_id=data.institution_id,
        is_system=False,
    )
    if data.permission_codes:
        perms = db.query(models.Permission).filter(models.Permission.code.in_(data.permission_codes)).all()
        role.permissions = perms
    db.add(role)
    db.commit()
    db.refresh(role)
    return role


@router.put("/roles/{role_id}", response_model=schemas.RoleSchema)
def update_role(role_id: str, data: schemas.RoleUpdateSchema, db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if data.name is not None:
        role.name = data.name
    if data.description is not None:
        role.description = data.description
    if data.permission_codes is not None:
        perms = db.query(models.Permission).filter(models.Permission.code.in_(data.permission_codes)).all()
        role.permissions = perms
    role.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(role)
    return role


@router.delete("/roles/{role_id}")
def delete_role(role_id: str, db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    if role.is_system:
        raise HTTPException(status_code=400, detail="Cannot delete a system role")
    assignments = db.query(models.UserRoleAssignment).filter(models.UserRoleAssignment.role_id == role_id).count()
    if assignments > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete role with {assignments} active assignment(s)")
    db.delete(role)
    db.commit()
    return {"status": "deleted"}


@router.get("/roles/{role_id}/permissions", response_model=List[schemas.PermissionSchema])
def get_role_permissions(role_id: str, db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    return role.permissions


@router.put("/roles/{role_id}/permissions", response_model=List[schemas.PermissionSchema])
def set_role_permissions(role_id: str, permission_codes: List[str], db: Session = Depends(database.get_db)):
    role = db.query(models.Role).filter(models.Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    perms = db.query(models.Permission).filter(models.Permission.code.in_(permission_codes)).all()
    role.permissions = perms
    role.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(role)
    return role.permissions


# --- User Profiles (role assignments) ---

def _count_active_profiles(db: Session, user_id: str, exclude_link_id: str = None, exclude_ura_id: str = None) -> int:
    """Count active profiles. When links exist, count links; else count URA."""
    now = datetime.datetime.utcnow()
    if _links_table_exists(db):
        inst_links = get_active_institution_links(db, user_id)
        org_links = get_active_organization_links(db, user_id)
        count = 0
        for l in inst_links:
            if exclude_link_id and l.id == exclude_link_id:
                continue
            count += 1
        for l in org_links:
            if exclude_link_id and l.id == exclude_link_id:
                continue
            count += 1
        return count
    q = (
        db.query(models.UserRoleAssignment)
        .filter(models.UserRoleAssignment.user_id == user_id, models.UserRoleAssignment.is_active == True)
        .filter(
            (models.UserRoleAssignment.expires_at.is_(None)) | (models.UserRoleAssignment.expires_at > now)
        )
    )
    if exclude_ura_id:
        q = q.filter(models.UserRoleAssignment.id != exclude_ura_id)
    return q.count()


@router.get("/users/{user_id}/profiles")
def list_user_profiles(user_id: str, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if _links_table_exists(db):
        inst_links = get_active_institution_links(db, user_id)
        org_links = get_active_organization_links(db, user_id)
        profiles = (
            [build_profile_from_institution_link(l) for l in inst_links]
            + [build_profile_from_organization_link(l) for l in org_links]
        )
        # Sort by granted_at desc (most recent first)
        profiles.sort(key=lambda p: p.get("granted_at") or "", reverse=True)
        return profiles
    assignments = (
        db.query(models.UserRoleAssignment)
        .filter(models.UserRoleAssignment.user_id == user_id)
        .order_by(models.UserRoleAssignment.granted_at.desc())
        .all()
    )
    return [build_profile_from_ura(a) for a in assignments]


@router.post("/users/{user_id}/profiles")
def assign_profile(
    user_id: str,
    data: schemas.ProfileCreateSchema,
    granted_by: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
    current_user=Depends(require_permission("users.manage_roles")),
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    role = db.query(models.Role).filter(models.Role.id == data.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    # Every role assignment must have an institution or organization context
    if data.role_id in ORGANIZATION_SCOPED_ROLES:
        if not data.company_id:
            raise HTTPException(
                status_code=400,
                detail="Role RECRUITER requires a company. Select an organization.",
            )
        allowed = get_company_allowed_roles(db, data.company_id)
        if data.role_id not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Role {data.role_id} is not allowed for this organization.",
            )
        if not company_is_onboarded(db, data.company_id):
            raise HTTPException(
                status_code=403,
                detail="Cannot assign recruiter role: organization must be onboarded first.",
            )
    elif data.role_id in INSTITUTION_SCOPED_ROLES:
        if not data.institution_id:
            raise HTTPException(
                status_code=400,
                detail="Institution-scoped roles require an institution. Select an institution.",
            )
        allowed = get_institution_allowed_roles(db, data.institution_id)
        if data.role_id not in allowed:
            raise HTTPException(
                status_code=403,
                detail=f"Role {data.role_id} is not allowed for this institution.",
            )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Role {data.role_id} must be assigned with an institution or organization context.",
        )

    now = datetime.datetime.utcnow()
    end_date = data.expires_at if data.expires_at else None

    if _links_table_exists(db):
        # Check for existing link
        if data.company_id:
            existing_link = (
                db.query(models.IndividualOrganizationLink)
                .filter(
                    models.IndividualOrganizationLink.user_id == user_id,
                    models.IndividualOrganizationLink.role_id == data.role_id,
                    models.IndividualOrganizationLink.company_id == data.company_id,
                )
                .filter(
                    (models.IndividualOrganizationLink.end_date.is_(None))
                    | (models.IndividualOrganizationLink.end_date >= now)
                )
                .first()
            )
            if existing_link:
                raise HTTPException(status_code=400, detail="This role assignment already exists for this user and context")
        else:
            existing_link = (
                db.query(models.IndividualInstitutionLink)
                .filter(
                    models.IndividualInstitutionLink.user_id == user_id,
                    models.IndividualInstitutionLink.role_id == data.role_id,
                    models.IndividualInstitutionLink.institution_id == data.institution_id,
                    models.IndividualInstitutionLink.program_id == data.program_id,
                )
                .filter(
                    (models.IndividualInstitutionLink.end_date.is_(None))
                    | (models.IndividualInstitutionLink.end_date >= now)
                )
                .first()
            )
            if existing_link:
                raise HTTPException(status_code=400, detail="This role assignment already exists for this user and context")

        if data.company_id:
            link_id = f"iol_{uuid.uuid4().hex[:12]}"
            link = models.IndividualOrganizationLink(
                id=link_id,
                user_id=user_id,
                company_id=data.company_id,
                business_unit_id=None,
                role_id=data.role_id,
                start_date=now,
                end_date=end_date,
            )
            db.add(link)
        else:
            link_id = f"iil_{uuid.uuid4().hex[:12]}"
            link = models.IndividualInstitutionLink(
                id=link_id,
                user_id=user_id,
                institution_id=data.institution_id,
                program_id=data.program_id,
                role_id=data.role_id,
                start_date=now,
                end_date=end_date,
            )
            db.add(link)
    else:
        existing = (
            db.query(models.UserRoleAssignment)
            .filter(
                models.UserRoleAssignment.user_id == user_id,
                models.UserRoleAssignment.role_id == data.role_id,
                models.UserRoleAssignment.institution_id == data.institution_id,
                models.UserRoleAssignment.company_id == data.company_id,
                models.UserRoleAssignment.program_id == data.program_id,
            )
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="This role assignment already exists for this user and context")

        assignment = models.UserRoleAssignment(
            id=f"ura_{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            role_id=data.role_id,
            institution_id=data.institution_id,
            company_id=data.company_id,
            program_id=data.program_id,
            granted_by=granted_by,
            expires_at=data.expires_at,
            is_active=True,
        )
        db.add(assignment)

    if not user.role or user.role == "GENERAL":
        user.role = data.role_id
        if data.institution_id:
            user.institution_id = data.institution_id
        if data.company_id:
            user.company_id = data.company_id
        if data.program_id:
            user.program_id = data.program_id

    db.commit()
    if _links_table_exists(db):
        db.refresh(link)
        return build_profile_from_organization_link(link) if data.company_id else build_profile_from_institution_link(link)
    db.refresh(assignment)
    return build_profile_from_ura(assignment)


@router.put("/users/{user_id}/profiles/{assignment_id}")
def update_profile(
    user_id: str,
    assignment_id: str,
    data: schemas.ProfileUpdateSchema,
    db: Session = Depends(database.get_db),
):
    if assignment_id.startswith("iil_"):
        link = (
            db.query(models.IndividualInstitutionLink)
            .filter(
                models.IndividualInstitutionLink.id == assignment_id,
                models.IndividualInstitutionLink.user_id == user_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(status_code=404, detail="Profile assignment not found")
        if data.expires_at is not None:
            link.end_date = data.expires_at
        if data.is_active is not None and not data.is_active:
            link.end_date = datetime.datetime.utcnow()
        db.commit()
        db.refresh(link)
        return build_profile_from_institution_link(link)
    if assignment_id.startswith("iol_"):
        link = (
            db.query(models.IndividualOrganizationLink)
            .filter(
                models.IndividualOrganizationLink.id == assignment_id,
                models.IndividualOrganizationLink.user_id == user_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(status_code=404, detail="Profile assignment not found")
        if data.expires_at is not None:
            link.end_date = data.expires_at
        if data.is_active is not None and not data.is_active:
            link.end_date = datetime.datetime.utcnow()
        db.commit()
        db.refresh(link)
        return build_profile_from_organization_link(link)

    assignment = (
        db.query(models.UserRoleAssignment)
        .filter(
            models.UserRoleAssignment.id == assignment_id,
            models.UserRoleAssignment.user_id == user_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Profile assignment not found")
    if data.expires_at is not None:
        assignment.expires_at = data.expires_at
    if data.is_active is not None:
        assignment.is_active = data.is_active
    db.commit()
    db.refresh(assignment)
    return build_profile_from_ura(assignment)


@router.delete("/users/{user_id}/profiles/{assignment_id}")
def revoke_profile(user_id: str, assignment_id: str, db: Session = Depends(database.get_db)):
    is_link = assignment_id.startswith("iil_") or assignment_id.startswith("iol_")
    exclude_link = assignment_id if is_link else None
    exclude_ura = None if is_link else assignment_id
    if _count_active_profiles(db, user_id, exclude_link_id=exclude_link, exclude_ura_id=exclude_ura) == 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot revoke the last role. Every user must have at least one role.",
        )

    if assignment_id.startswith("iil_"):
        link = (
            db.query(models.IndividualInstitutionLink)
            .filter(
                models.IndividualInstitutionLink.id == assignment_id,
                models.IndividualInstitutionLink.user_id == user_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(status_code=404, detail="Profile assignment not found")
        db.delete(link)
        db.commit()
        return {"status": "revoked"}
    if assignment_id.startswith("iol_"):
        link = (
            db.query(models.IndividualOrganizationLink)
            .filter(
                models.IndividualOrganizationLink.id == assignment_id,
                models.IndividualOrganizationLink.user_id == user_id,
            )
            .first()
        )
        if not link:
            raise HTTPException(status_code=404, detail="Profile assignment not found")
        db.delete(link)
        db.commit()
        return {"status": "revoked"}

    assignment = (
        db.query(models.UserRoleAssignment)
        .filter(
            models.UserRoleAssignment.id == assignment_id,
            models.UserRoleAssignment.user_id == user_id,
        )
        .first()
    )
    if not assignment:
        raise HTTPException(status_code=404, detail="Profile assignment not found")
    db.delete(assignment)
    db.commit()
    return {"status": "revoked"}


@router.post("/users/{user_id}/profiles/batch-revoke")
def batch_revoke_profiles(
    user_id: str,
    assignment_ids: List[str] = Body(..., embed=True),
    db: Session = Depends(database.get_db),
    _=Depends(require_permission("users.manage_roles")),
):
    """Revoke multiple profile assignments in one request."""
    ids = [a for a in (assignment_ids or []) if isinstance(a, str) and a.strip()]
    if not ids:
        raise HTTPException(status_code=400, detail="assignment_ids is required")

    if _count_active_profiles(db, user_id, exclude_link_id=None, exclude_ura_id=None) - len(ids) <= 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot revoke all roles. Every user must have at least one role.",
        )

    revoked = []
    for assignment_id in ids:
        if assignment_id.startswith("iil_"):
            link = db.query(models.IndividualInstitutionLink).filter(
                models.IndividualInstitutionLink.id == assignment_id,
                models.IndividualInstitutionLink.user_id == user_id,
            ).first()
            if link:
                db.delete(link)
                revoked.append(assignment_id)
            continue
        if assignment_id.startswith("iol_"):
            link = db.query(models.IndividualOrganizationLink).filter(
                models.IndividualOrganizationLink.id == assignment_id,
                models.IndividualOrganizationLink.user_id == user_id,
            ).first()
            if link:
                db.delete(link)
                revoked.append(assignment_id)
            continue

        assignment = db.query(models.UserRoleAssignment).filter(
            models.UserRoleAssignment.id == assignment_id,
            models.UserRoleAssignment.user_id == user_id,
        ).first()
        if assignment:
            db.delete(assignment)
            revoked.append(assignment_id)

    db.commit()
    return {"status": "ok", "revoked": revoked}
