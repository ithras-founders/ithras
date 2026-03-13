"""Audit log API -- query, filter, and summarize activity across the system."""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.modules.shared import database
from app.modules.shared.services.audit_query import (
    AuditQueryFilters,
    get_audit_logs_page,
    get_audit_summary as get_audit_summary_data,
    get_entity_audit_timeline,
)

router = APIRouter(prefix="/api/v1/audit-logs", tags=["audit-logs"])

@router.get("/")
def get_audit_logs(
    user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    entity_id: Optional[str] = Query(None),
    institution_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db),
):
    filters = AuditQueryFilters(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        institution_id=institution_id,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
    )
    return get_audit_logs_page(db, filters, limit=limit, offset=offset)


@router.get("/summary")
def get_audit_summary(
    institution_id: Optional[str] = Query(None),
    company_id: Optional[str] = Query(None),
    from_date: Optional[str] = Query(None),
    to_date: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
):
    filters = AuditQueryFilters(
        institution_id=institution_id,
        company_id=company_id,
        from_date=from_date,
        to_date=to_date,
    )
    # Keep backwards-compatible response shape on the legacy route.
    return get_audit_summary_data(db, filters).get("actions", {})


@router.get("/{entity_type}/{entity_id}")
def get_entity_audit_trail(
    entity_type: str,
    entity_id: str,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(database.get_db),
):
    return get_entity_audit_timeline(
        db,
        entity_type=entity_type,
        entity_id=entity_id,
        filters=AuditQueryFilters(),
        limit=limit,
        offset=offset,
    )
