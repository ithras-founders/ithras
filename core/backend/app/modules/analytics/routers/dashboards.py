"""
Analytics dashboards CRUD - layout with report widgets.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional, Any
from pydantic import BaseModel

from app.modules.shared import database
from app.modules.analytics.seed_defaults import seed_default_analytics
from app.modules.analytics.schema import ensure_analytics_tables as _ensure_tables

router = APIRouter(prefix="/api/v1/analytics/dashboards", tags=["analytics-dashboards"])


class DashboardCreate(BaseModel):
    name: str
    layout: Optional[dict] = None


class DashboardUpdate(BaseModel):
    name: Optional[str] = None
    layout: Optional[dict] = None


class DashboardOut(BaseModel):
    id: int
    name: str
    layout: dict
    created_at: Optional[str] = None


@router.get("", response_model=List[DashboardOut])
def list_dashboards(db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    seed_default_analytics(db)
    rows = db.execute(text("""
        SELECT id, name, layout_json, created_at FROM analytics_dashboards ORDER BY id
    """)).fetchall()
    return [
        DashboardOut(
            id=r[0],
            name=r[1],
            layout=json.loads(r[2]) if isinstance(r[2], str) else (r[2] or {"widgets": []}),
            created_at=r[3].isoformat() if r[3] else None,
        )
        for r in rows
    ]


@router.get("/{dashboard_id}", response_model=DashboardOut)
def get_dashboard(dashboard_id: int, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    row = db.execute(text(
        "SELECT id, name, layout_json, created_at FROM analytics_dashboards WHERE id = :id"
    ), {"id": dashboard_id}).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return DashboardOut(
        id=row[0],
        name=row[1],
        layout=json.loads(row[2]) if isinstance(row[2], str) else (row[2] or {"widgets": []}),
        created_at=row[3].isoformat() if row[3] else None,
    )


@router.post("", response_model=DashboardOut)
def create_dashboard(req: DashboardCreate, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    layout = req.layout or {"widgets": []}
    db.execute(text("""
        INSERT INTO analytics_dashboards (name, layout_json)
        VALUES (:name, :layout_json)
    """), {
        "name": req.name,
        "layout_json": json.dumps(layout),
    })
    db.commit()
    row = db.execute(text("""
        SELECT id, name, layout_json, created_at FROM analytics_dashboards ORDER BY id DESC LIMIT 1
    """)).fetchone()
    return DashboardOut(
        id=row[0],
        name=row[1],
        layout=json.loads(row[2]) if isinstance(row[2], str) else (row[2] or {"widgets": []}),
        created_at=row[3].isoformat() if row[3] else None,
    )


@router.put("/{dashboard_id}", response_model=DashboardOut)
def update_dashboard(dashboard_id: int, req: DashboardUpdate, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    existing = db.execute(text("SELECT id FROM analytics_dashboards WHERE id = :id"), {"id": dashboard_id}).fetchone()
    if not existing:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    updates = []
    params = {"id": dashboard_id}
    if req.name is not None:
        updates.append("name = :name")
        params["name"] = req.name
    if req.layout is not None:
        updates.append("layout_json = :layout_json")
        params["layout_json"] = json.dumps(req.layout)
    if updates:
        db.execute(text(f"UPDATE analytics_dashboards SET {', '.join(updates)} WHERE id = :id"), params)
        db.commit()
    return get_dashboard(dashboard_id, db)


@router.delete("/{dashboard_id}")
def delete_dashboard(dashboard_id: int, db: Session = Depends(database.get_db)):
    _ensure_tables(db)
    r = db.execute(text("DELETE FROM analytics_dashboards WHERE id = :id"), {"id": dashboard_id})
    db.commit()
    if r.rowcount == 0:
        raise HTTPException(status_code=404, detail="Dashboard not found")
    return {"deleted": dashboard_id}
