"""Reusable audit logging utility."""
import json
from sqlalchemy.orm import Session
from .models.core import AuditLog


def log_audit(
    db: Session,
    user_id: str,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    institution_id: str = None,
    company_id: str = None,
    details=None,
    metadata=None,
    ip_address: str = None,
):
    entry = AuditLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        institution_id=institution_id,
        company_id=company_id,
        details=json.dumps(details) if isinstance(details, dict) else details,
        metadata_=json.dumps(metadata) if isinstance(metadata, dict) else metadata,
        ip_address=ip_address,
    )
    db.add(entry)
    try:
        db.flush()
    except Exception:
        db.rollback()
    return entry
