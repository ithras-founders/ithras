"""HR Mode: Talent Pools and Saved Searches."""
import os
import sys
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List, Any

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import models, database
from app.modules.shared.auth import require_role

router = APIRouter(prefix="/api/v1/hr", tags=["hr-talent-pools"])


class TalentPoolCreate(BaseModel):
    name: str
    description: Optional[str] = None


class TalentPoolUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class AddToPoolRequest(BaseModel):
    candidate_ids: List[str]


class SavedSearchCreate(BaseModel):
    name: str
    criteria: Optional[dict] = None


@router.get("/talent-pools")
def list_talent_pools(
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """List talent pools for the user's company."""
    if not getattr(user, "company_id", None):
        return {"items": []}
    pools = (
        db.query(models.TalentPool)
        .filter(models.TalentPool.company_id == user.company_id)
        .order_by(models.TalentPool.created_at.desc())
        .all()
    )
    return {"items": [{"id": p.id, "name": p.name, "description": p.description, "created_at": p.created_at} for p in pools]}


@router.post("/talent-pools")
def create_talent_pool(
    data: TalentPoolCreate,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Create a talent pool."""
    if not getattr(user, "company_id", None):
        raise HTTPException(status_code=400, detail="Recruiter must have a company")
    pool_id = f"tp_{uuid.uuid4().hex[:16]}"
    pool = models.TalentPool(
        id=pool_id,
        company_id=user.company_id,
        created_by=user.id,
        name=data.name,
        description=data.description,
    )
    db.add(pool)
    db.commit()
    db.refresh(pool)
    return {"id": pool.id, "name": pool.name, "description": pool.description, "created_at": pool.created_at}


@router.get("/talent-pools/{pool_id}")
def get_talent_pool(
    pool_id: str,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Get pool with members."""
    pool = db.query(models.TalentPool).filter(models.TalentPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    if pool.company_id != getattr(user, "company_id", None) and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    members = (
        db.query(models.TalentPoolMember)
        .filter(models.TalentPoolMember.pool_id == pool_id)
        .order_by(models.TalentPoolMember.added_at.desc())
        .all()
    )
    candidate_ids = [m.candidate_id for m in members]
    users = {u.id: u for u in db.query(models.User).filter(models.User.id.in_(candidate_ids)).all()} if candidate_ids else {}
    items = []
    for m in members:
        u = users.get(m.candidate_id)
        items.append({
            "id": m.id,
            "candidate_id": m.candidate_id,
            "candidate_name": u.name or u.email if u else "Unknown",
            "added_at": m.added_at,
        })
    return {"id": pool.id, "name": pool.name, "description": pool.description, "members": items}


@router.post("/talent-pools/{pool_id}/add")
def add_to_pool(
    pool_id: str,
    data: AddToPoolRequest,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Add candidates to a talent pool."""
    pool = db.query(models.TalentPool).filter(models.TalentPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    if pool.company_id != getattr(user, "company_id", None) and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    existing = {m.candidate_id for m in db.query(models.TalentPoolMember).filter(
        models.TalentPoolMember.pool_id == pool_id,
        models.TalentPoolMember.candidate_id.in_(data.candidate_ids),
    ).all()}
    added = 0
    for cid in data.candidate_ids:
        if cid in existing:
            continue
        m = models.TalentPoolMember(
            id=f"tpm_{uuid.uuid4().hex[:16]}",
            pool_id=pool_id,
            candidate_id=cid,
        )
        db.add(m)
        added += 1
    db.commit()
    return {"message": f"Added {added} candidates", "added": added}


@router.delete("/talent-pools/{pool_id}/members/{candidate_id}")
def remove_from_pool(
    pool_id: str,
    candidate_id: str,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Remove a candidate from a talent pool."""
    pool = db.query(models.TalentPool).filter(models.TalentPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    if pool.company_id != getattr(user, "company_id", None) and getattr(user, "role", None) != "SYSTEM_ADMIN":
        raise HTTPException(status_code=403, detail="Access denied")
    m = db.query(models.TalentPoolMember).filter(
        models.TalentPoolMember.pool_id == pool_id,
        models.TalentPoolMember.candidate_id == candidate_id,
    ).first()
    if not m:
        raise HTTPException(status_code=404, detail="Member not in pool")
    db.delete(m)
    db.commit()
    return {"message": "Removed"}


@router.get("/saved-searches")
def list_saved_searches(
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """List saved searches for the user's company."""
    if not getattr(user, "company_id", None):
        return {"items": []}
    items = (
        db.query(models.SavedSearch)
        .filter(models.SavedSearch.company_id == user.company_id)
        .order_by(models.SavedSearch.created_at.desc())
        .all()
    )
    return {"items": [{"id": s.id, "name": s.name, "criteria": s.criteria, "created_at": s.created_at} for s in items]}


@router.post("/saved-searches")
def create_saved_search(
    data: SavedSearchCreate,
    user=Depends(require_role("RECRUITER", "PLACEMENT_TEAM", "PLACEMENT_ADMIN", "SYSTEM_ADMIN")),
    db: Session = Depends(database.get_db),
):
    """Save a search with criteria."""
    if not getattr(user, "company_id", None):
        raise HTTPException(status_code=400, detail="Recruiter must have a company")
    search_id = f"ss_{uuid.uuid4().hex[:16]}"
    s = models.SavedSearch(
        id=search_id,
        company_id=user.company_id,
        created_by=user.id,
        name=data.name,
        criteria=data.criteria,
    )
    db.add(s)
    db.commit()
    db.refresh(s)
    return {"id": s.id, "name": s.name, "criteria": s.criteria, "created_at": s.created_at}
