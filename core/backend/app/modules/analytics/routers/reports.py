"""
Analytics reports CRUD - saved queries with chart config.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Any
from pydantic import BaseModel

from app.modules.shared import database
from app.modules.analytics.schema import ensure_analytics_tables as _ensure_tables

router = APIRouter(prefix="/api/v1/analytics/reports", tags=["analytics-reports"])


class ReportCreate(BaseModel):
    name: str
    query: str
    params: Optional[List[Any]] = None
    chart_config: Optional[dict] = None


class ReportUpdate(BaseModel):
    name: Optional[str] = None
    query: Optional[str] = None
    params: Optional[List[Any]] = None
    chart_config: Optional[dict] = None


class ReportOut(BaseModel):
    id: int
    name: str
    query: str
    params: Optional[List[Any]] = None
    chart_config: Optional[dict] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


@router.get("", response_model=List[ReportOut])
def list_reports(db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    rows = db.execute(text("""
        SELECT id, name, query, params_json, chart_config_json, created_at, updated_at
        FROM analytics_reports ORDER BY updated_at DESC
    """)).fetchall()
    return [
        ReportOut(
            id=r[0], name=r[1], query=r[2],
            params=r[3], chart_config=r[4],
            created_at=r[5].isoformat() if r[5] else None,
            updated_at=r[6].isoformat() if r[6] else None,
        )
        for r in rows
    ]


@router.get("/{report_id}", response_model=ReportOut)
def get_report(report_id: int, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    row = db.execute(text(
        "SELECT id, name, query, params_json, chart_config_json, created_at, updated_at FROM analytics_reports WHERE id = :id"
    ), {"id": report_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Report not found")
    return ReportOut(
        id=row[0], name=row[1], query=row[2],
        params=row[3], chart_config=row[4],
        created_at=row[5].isoformat() if row[5] else None,
        updated_at=row[6].isoformat() if row[6] else None,
    )


@router.post("", response_model=ReportOut)
def create_report(req: ReportCreate, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    db.execute(text("""
        INSERT INTO analytics_reports (name, query, params_json, chart_config_json)
        VALUES (:name, :query, :params_json, :chart_config_json)
    """), {
        "name": req.name,
        "query": req.query,
        "params_json": json.dumps(req.params or []),
        "chart_config_json": json.dumps(req.chart_config or {}),
    })
    db.commit()
    row = db.execute(text("SELECT id, name, query, params_json, chart_config_json, created_at, updated_at FROM analytics_reports ORDER BY id DESC LIMIT 1")).fetchone()
    return ReportOut(
        id=row[0], name=row[1], query=row[2],
        params=json.loads(row[3]) if row[3] else None,
        chart_config=json.loads(row[4]) if row[4] else None,
        created_at=row[5].isoformat() if row[5] else None,
        updated_at=row[6].isoformat() if row[6] else None,
    )


@router.put("/{report_id}", response_model=ReportOut)
def update_report(report_id: int, req: ReportUpdate, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    existing = db.execute(text("SELECT id FROM analytics_reports WHERE id = :id"), {"id": report_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")
    db.execute(text("""
        UPDATE analytics_reports
        SET name = COALESCE(:name, name),
            query = COALESCE(:query, query),
            params_json = COALESCE(:params_json, params_json),
            chart_config_json = COALESCE(:chart_config_json, chart_config_json),
            updated_at = NOW()
        WHERE id = :id
    """), {
        "id": report_id,
        "name": req.name,
        "query": req.query,
        "params_json": json.dumps(req.params) if req.params is not None else None,
        "chart_config_json": json.dumps(req.chart_config) if req.chart_config is not None else None,
    })
    db.commit()
    return get_report(report_id, db)


@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    r = db.execute(text("DELETE FROM analytics_reports WHERE id = :id"), {"id": report_id})
    db.commit()
    if r.rowcount == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"deleted": report_id}
