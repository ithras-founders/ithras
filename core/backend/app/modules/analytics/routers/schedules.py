"""
Analytics scheduled reports CRUD.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from pydantic import BaseModel

from app.modules.shared import database
from app.modules.analytics.schema import ensure_analytics_tables as _ensure_tables

router = APIRouter(prefix="/api/v1/analytics/schedules", tags=["analytics-schedules"])


class ScheduleCreate(BaseModel):
    report_id: int
    cron_expr: Optional[str] = None
    recipients: Optional[List[str]] = None
    enabled: bool = True


class ScheduleUpdate(BaseModel):
    cron_expr: Optional[str] = None
    recipients: Optional[List[str]] = None
    enabled: Optional[bool] = None


class ScheduleOut(BaseModel):
    id: int
    report_id: int
    cron_expr: Optional[str] = None
    recipients: Optional[List[str]] = None
    enabled: bool
    created_at: Optional[str] = None


@router.get("", response_model=List[ScheduleOut])
def list_schedules(db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    rows = db.execute(text("""
        SELECT id, report_id, cron_expr, recipients_json, enabled, created_at
        FROM analytics_schedules ORDER BY id
    """)).fetchall()
    return [
        ScheduleOut(
            id=r[0], report_id=r[1], cron_expr=r[2],
            recipients=json.loads(r[3]) if r[3] else None,
            enabled=bool(r[4]),
            created_at=r[5].isoformat() if r[5] else None,
        )
        for r in rows
    ]


@router.get("/{schedule_id}", response_model=ScheduleOut)
def get_schedule(schedule_id: int, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    row = db.execute(text(
        "SELECT id, report_id, cron_expr, recipients_json, enabled, created_at FROM analytics_schedules WHERE id = :id"
    ), {"id": schedule_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return ScheduleOut(
        id=row[0], report_id=row[1], cron_expr=row[2],
        recipients=json.loads(row[3]) if row[3] else None,
        enabled=bool(row[4]),
        created_at=row[5].isoformat() if row[5] else None,
    )


@router.post("", response_model=ScheduleOut)
def create_schedule(req: ScheduleCreate, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    db.execute(text("""
        INSERT INTO analytics_schedules (report_id, cron_expr, recipients_json, enabled)
        VALUES (:report_id, :cron_expr, :recipients_json, :enabled)
    """), {
        "report_id": req.report_id,
        "cron_expr": req.cron_expr or "",
        "recipients_json": json.dumps(req.recipients or []),
        "enabled": req.enabled,
    })
    db.commit()
    row = db.execute(text("SELECT id, report_id, cron_expr, recipients_json, enabled, created_at FROM analytics_schedules ORDER BY id DESC LIMIT 1")).fetchone()
    return ScheduleOut(
        id=row[0], report_id=row[1], cron_expr=row[2],
        recipients=json.loads(row[3]) if row[3] else None,
        enabled=bool(row[4]),
        created_at=row[5].isoformat() if row[5] else None,
    )


@router.put("/{schedule_id}", response_model=ScheduleOut)
def update_schedule(schedule_id: int, req: ScheduleUpdate, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    existing = db.execute(text("SELECT id FROM analytics_schedules WHERE id = :id"), {"id": schedule_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Schedule not found")
    if req.cron_expr is not None or req.recipients is not None or req.enabled is not None:
        # Build dynamic update
        updates = []
        params = {"id": schedule_id}
        if req.cron_expr is not None:
            updates.append("cron_expr = :cron_expr")
            params["cron_expr"] = req.cron_expr
        if req.recipients is not None:
            updates.append("recipients_json = :recipients_json")
            params["recipients_json"] = json.dumps(req.recipients)
        if req.enabled is not None:
            updates.append("enabled = :enabled")
            params["enabled"] = req.enabled
        db.execute(text(f"UPDATE analytics_schedules SET {', '.join(updates)} WHERE id = :id"), params)
        db.commit()
    return get_schedule(schedule_id, db)


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    r = db.execute(text("DELETE FROM analytics_schedules WHERE id = :id"), {"id": schedule_id})
    db.commit()
    if r.rowcount == 0:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return {"deleted": schedule_id}
