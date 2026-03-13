"""
Profile change request service - serialization, create, approve, reject.
"""
import datetime
import uuid
from typing import Dict, Optional

from sqlalchemy.orm import Session

from app.modules.shared import models
from app.modules.shared.audit import log_audit


def serialize_profile_request(
    request: models.UserProfileChangeRequest,
    db: Session,
    users_by_id: Optional[Dict[str, models.User]] = None,
) -> dict:
    """Return response payload with user/requester/reviewer display metadata."""
    if users_by_id is None:
        users_by_id = {}

    def _get_user(user_id: Optional[str]):
        if not user_id:
            return None
        if user_id in users_by_id:
            return users_by_id[user_id]
        user = db.query(models.User).filter(models.User.id == user_id).first()
        users_by_id[user_id] = user
        return user

    target_user = _get_user(request.user_id)
    requester = _get_user(request.requested_by)
    reviewer = _get_user(request.reviewed_by)

    return {
        "id": request.id,
        "user_id": request.user_id,
        "institution_id": request.institution_id,
        "requested_by": request.requested_by,
        "requested_changes": request.requested_changes or {},
        "status": request.status,
        "reviewed_by": request.reviewed_by,
        "reviewed_at": request.reviewed_at,
        "rejection_reason": request.rejection_reason,
        "created_at": request.created_at,
        "updated_at": request.updated_at,
        "user_name": target_user.name if target_user else None,
        "user_email": target_user.email if target_user else None,
        "requested_by_name": requester.name if requester else None,
        "requested_by_email": requester.email if requester else None,
        "reviewed_by_name": reviewer.name if reviewer else None,
        "reviewed_by_email": reviewer.email if reviewer else None,
    }


def create_profile_change(
    user_id: str,
    requested_by: str,
    changes: dict,
    db: Session,
) -> models.UserProfileChangeRequest:
    """
    Create a profile change request for a student.
    Raises ValueError with a message key for HTTPException (user_not_found, not_candidate, etc).
    """
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise ValueError("user_not_found")
    if db_user.role != "CANDIDATE":
        raise ValueError("not_candidate")
    if requested_by != user_id:
        raise ValueError("self_only")

    allowed_fields = {"name", "roll_number", "program_id", "sector_preferences"}
    requested_changes = {
        k: v for k, v in (changes or {}).items()
        if k in allowed_fields
    }

    if not requested_changes:
        raise ValueError("no_valid_fields")

    if "program_id" in requested_changes and requested_changes["program_id"]:
        program = db.query(models.Program).filter(
            models.Program.id == requested_changes["program_id"],
            models.Program.institution_id == db_user.institution_id,
        ).first()
        if not program:
            raise ValueError("invalid_program")

    pending = db.query(models.UserProfileChangeRequest).filter(
        models.UserProfileChangeRequest.user_id == user_id,
        models.UserProfileChangeRequest.status == "PENDING",
    ).first()
    if pending:
        raise ValueError("pending_exists")

    db_req = models.UserProfileChangeRequest(
        id=f"uprofile_req_{uuid.uuid4().hex[:12]}",
        user_id=user_id,
        institution_id=db_user.institution_id,
        requested_by=requested_by,
        requested_changes=requested_changes,
        status="PENDING",
        created_at=datetime.datetime.utcnow(),
        updated_at=datetime.datetime.utcnow(),
    )
    db.add(db_req)
    log_audit(
        db, user_id=user_id, action="PROFILE_CHANGE_REQUESTED",
        entity_type="profile_change_request", entity_id=db_req.id,
        institution_id=db_user.institution_id,
        details={"fields": list(requested_changes.keys())},
    )
    db.commit()
    db.refresh(db_req)
    return db_req


def approve_profile_change(request_id: str, reviewer_id: str, db: Session) -> models.UserProfileChangeRequest:
    """
    Approve a profile change request and apply changes to the user.
    Returns the updated request model. Raises ValueError if not found or not pending.
    """
    db_req = db.query(models.UserProfileChangeRequest).filter(
        models.UserProfileChangeRequest.id == request_id,
    ).first()
    if not db_req:
        raise ValueError("not_found")
    if db_req.status != "PENDING":
        raise ValueError("not_pending")

    db_user = db.query(models.User).filter(models.User.id == db_req.user_id).first()
    if not db_user:
        raise ValueError("user_not_found")

    for key, value in (db_req.requested_changes or {}).items():
        if key in {"name", "roll_number", "program_id", "sector_preferences"}:
            setattr(db_user, key, value)

    db_req.status = "APPROVED"
    db_req.reviewed_by = reviewer_id
    db_req.reviewed_at = datetime.datetime.utcnow()
    db_req.rejection_reason = None
    db_req.updated_at = datetime.datetime.utcnow()

    log_audit(
        db, user_id=reviewer_id, action="PROFILE_CHANGE_APPROVED",
        entity_type="profile_change_request", entity_id=request_id,
        institution_id=db_req.institution_id,
        details={"student_id": db_req.user_id, "fields": list((db_req.requested_changes or {}).keys())},
    )
    db.commit()
    db.refresh(db_req)
    return db_req


def reject_profile_change(
    request_id: str, reason: str, reviewer_id: str, db: Session
) -> models.UserProfileChangeRequest:
    """
    Reject a profile change request.
    Returns the updated request model. Raises ValueError if not found, not pending, or missing reason.
    """
    if not (reason or "").strip():
        raise ValueError("reason_required")

    db_req = db.query(models.UserProfileChangeRequest).filter(
        models.UserProfileChangeRequest.id == request_id,
    ).first()
    if not db_req:
        raise ValueError("not_found")
    if db_req.status != "PENDING":
        raise ValueError("not_pending")

    db_req.status = "REJECTED"
    db_req.reviewed_by = reviewer_id
    db_req.reviewed_at = datetime.datetime.utcnow()
    db_req.rejection_reason = reason
    db_req.updated_at = datetime.datetime.utcnow()

    log_audit(
        db, user_id=reviewer_id, action="PROFILE_CHANGE_REJECTED",
        entity_type="profile_change_request", entity_id=request_id,
        institution_id=db_req.institution_id,
        details={"student_id": db_req.user_id, "reason": reason},
    )
    db.commit()
    db.refresh(db_req)
    return db_req
