"""Shared audit query helpers used by audit and telemetry routers."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Optional

from sqlalchemy import desc, func
from sqlalchemy.orm import Session

from app.modules.shared.models.core import AuditLog, User


@dataclass
class AuditQueryFilters:
    user_id: Optional[str] = None
    action: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    institution_id: Optional[str] = None
    company_id: Optional[str] = None
    from_date: Optional[str] = None
    to_date: Optional[str] = None


def _parse_iso(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value)
    except ValueError:
        return None


def _enrich_with_user_names(db: Session, logs: list[AuditLog]) -> list[dict]:
    user_ids = {log.user_id for log in logs if log.user_id}
    name_map: dict[str, tuple[Optional[str], Optional[str]]] = {}
    if user_ids:
        users = db.query(User).filter(User.id.in_(list(user_ids))).all()
        name_map = {u.id: (u.name, u.email) for u in users}
    result = []
    for log in logs:
        result.append(
            {
                "id": log.id,
                "timestamp": log.timestamp,
                "user_id": log.user_id,
                "action": log.action,
                "entity_type": log.entity_type,
                "entity_id": log.entity_id,
                "institution_id": log.institution_id,
                "company_id": log.company_id,
                "details": log.details,
                "metadata_": log.metadata_,
                "ip_address": log.ip_address,
                "user_name": name_map.get(log.user_id, (None, None))[0],
                "user_email": name_map.get(log.user_id, (None, None))[1],
            }
        )
    return result


def build_audit_query(db: Session, filters: AuditQueryFilters):
    query = db.query(AuditLog)
    if filters.user_id:
        query = query.filter(AuditLog.user_id == filters.user_id)
    if filters.action:
        query = query.filter(AuditLog.action == filters.action)
    if filters.entity_type:
        query = query.filter(AuditLog.entity_type == filters.entity_type)
    if filters.entity_id:
        query = query.filter(AuditLog.entity_id == filters.entity_id)
    if filters.institution_id:
        query = query.filter(AuditLog.institution_id == filters.institution_id)
    if filters.company_id:
        query = query.filter(AuditLog.company_id == filters.company_id)
    from_dt = _parse_iso(filters.from_date)
    if from_dt is not None:
        query = query.filter(AuditLog.timestamp >= from_dt)
    to_dt = _parse_iso(filters.to_date)
    if to_dt is not None:
        query = query.filter(AuditLog.timestamp <= to_dt)
    return query


def get_audit_logs_page(
    db: Session,
    filters: AuditQueryFilters,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    query = build_audit_query(db, filters)
    total = query.count()
    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(limit).all()
    return {"total": total, "items": _enrich_with_user_names(db, logs)}


def get_entity_audit_timeline(
    db: Session,
    entity_type: str,
    entity_id: str,
    filters: AuditQueryFilters,
    limit: int = 50,
    offset: int = 0,
) -> dict:
    entity_filters = AuditQueryFilters(
        user_id=filters.user_id,
        action=filters.action,
        entity_type=entity_type,
        entity_id=entity_id,
        institution_id=filters.institution_id,
        company_id=filters.company_id,
        from_date=filters.from_date,
        to_date=filters.to_date,
    )
    return get_audit_logs_page(db, entity_filters, limit=limit, offset=offset)


def get_audit_summary(db: Session, filters: AuditQueryFilters, bucket: str = "hour") -> dict:
    query = build_audit_query(db, filters)

    action_rows = (
        query.with_entities(AuditLog.action, func.count(AuditLog.id).label("count"))
        .group_by(AuditLog.action)
        .all()
    )
    entity_rows = (
        query.with_entities(AuditLog.entity_type, func.count(AuditLog.id).label("count"))
        .group_by(AuditLog.entity_type)
        .all()
    )
    total = query.count()

    # PostgreSQL bucketed trend (hour/day).
    bucket_key = "day" if bucket == "day" else "hour"
    trend_rows = (
        query.with_entities(
            func.date_trunc(bucket_key, AuditLog.timestamp).label("bucket"),
            func.count(AuditLog.id).label("count"),
        )
        .group_by(func.date_trunc(bucket_key, AuditLog.timestamp))
        .order_by(func.date_trunc(bucket_key, AuditLog.timestamp))
        .all()
    )

    return {
        "total": total,
        "actions": {row.action: row.count for row in action_rows if row.action},
        "entities": {row.entity_type: row.count for row in entity_rows if row.entity_type},
        "trend": [{"bucket": row.bucket, "count": row.count} for row in trend_rows if row.bucket is not None],
        "bucket": bucket_key,
    }
