"""
CV Template API endpoints — read-only, served from JSON files on disk.

Templates live in products/cv/templates/*.json and are loaded at import time
with a filesystem watcher that reloads on change.
Visibility overrides are stored in cv_template_visibility_overrides and merge with JSON values.
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import os
import json
import glob as _glob

from app.modules.shared import database, models
from app.modules.shared.auth import _links_table_exists
from app.modules.shared.links import get_all_institution_links

router = APIRouter(prefix="/api/v1/cv-templates", tags=["cv-templates"])

_TEMPLATES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "../../../../../templates")
)


def _get_visibility_overrides(db: Session) -> dict[str, dict]:
    """Fetch all visibility overrides from DB. Returns {template_id: {institution_ids, batch_ids, program_ids}}."""
    overrides = {}
    try:
        rows = db.query(models.CVTemplateVisibilityOverride).all()
        for r in rows:
            overrides[r.template_id] = {
                "institution_ids": r.institution_ids,
                "batch_ids": r.batch_ids,
                "program_ids": r.program_ids,
            }
    except Exception:
        pass
    return overrides


def _effective_visibility(template: dict, override: Optional[dict]) -> dict:
    """Merge template visibility with override. Override values replace when not None."""
    batch_ids = template.get("batch_ids") or []
    program_ids = template.get("program_ids") or []
    institution_ids = None  # None = use template default; [] = all
    if override:
        if override.get("batch_ids") is not None:
            batch_ids = override["batch_ids"] if isinstance(override["batch_ids"], list) else []
        if override.get("program_ids") is not None:
            program_ids = override["program_ids"] if isinstance(override["program_ids"], list) else []
        if override.get("institution_ids") is not None:
            institution_ids = override["institution_ids"] if isinstance(override["institution_ids"], list) else []
    return {"batch_ids": batch_ids, "program_ids": program_ids, "institution_ids": institution_ids}


def _load_templates() -> list[dict]:
    """Read every *.json file in the templates directory."""
    templates = []
    pattern = os.path.join(_TEMPLATES_DIR, "*.json")
    for path in sorted(_glob.glob(pattern)):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("id"):
                templates.append(data)
        except Exception:
            continue
    return templates


@router.get("/")
def list_templates(
    institution_id: Optional[str] = None,
    allocated_for: Optional[str] = None,
    college: Optional[str] = None,
    include_visibility: bool = Query(default=False),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(database.get_db),
):
    """List all templates (read from JSON files). Optional include_visibility merges DB overrides."""
    templates = _load_templates()

    if institution_id:
        templates = [t for t in templates if t.get("institution_id") == institution_id]
    if allocated_for:
        templates = [
            t for t in templates
            if t.get("institution_id") == allocated_for
            or t.get("college_slug") == allocated_for
        ]
    if college:
        templates = [t for t in templates if t.get("college_slug") == college]

    if include_visibility:
        overrides_map = _get_visibility_overrides(db)
        items = []
        for t in templates[offset : offset + limit]:
            eff = _effective_visibility(t, overrides_map.get(t["id"]))
            item = dict(t)
            if eff.get("institution_ids") is not None:
                item["institution_ids"] = eff["institution_ids"]
            item["batch_ids"] = eff["batch_ids"]
            item["program_ids"] = eff["program_ids"]
            items.append(item)
    else:
        items = templates[offset : offset + limit]

    total = len(templates)
    return {"items": items, "total": total}


@router.get("/active")
def get_active_template(
    institution_id: str = Query(...),
    program_id: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    batch_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
):
    """Find the active (published) template for an institution.
    Respects visibility: when program_id/batch_id provided, only returns templates visible to that context."""
    templates = _load_templates()
    overrides_map = _get_visibility_overrides(db)

    # Prefer templates matching institution and visibility
    for t in templates:
        if t.get("status") != "PUBLISHED":
            continue
        if t.get("institution_id") != institution_id and t.get("college_slug") != institution_id:
            continue
        if _template_matches_visibility(t, batch_id, program_id, overrides_map.get(t["id"])):
            return t

    # Fallback: return first published template for institution (ignore visibility)
    for t in templates:
        if t.get("status") == "PUBLISHED":
            if t.get("institution_id") == institution_id or t.get("college_slug") == institution_id:
                return t

    # Last resort: any published template
    for t in templates:
        if t.get("status") == "PUBLISHED":
            return t

    return None


def _template_matches_visibility(
    template: dict,
    batch_id: Optional[str] = None,
    program_id: Optional[str] = None,
    override: Optional[dict] = None,
) -> bool:
    """Check if template is visible for given batch_id and program_id.
    Empty/absent batch_ids or program_ids means visible to all.
    Uses override from DB when provided."""
    eff = _effective_visibility(template, override)
    batch_ids = eff["batch_ids"]
    program_ids = eff["program_ids"]
    if batch_id is not None and batch_ids and batch_id not in batch_ids:
        return False
    if program_id is not None and program_ids and program_id not in program_ids:
        return False
    return True


def _allocations_for_institution(
    institution_id: str,
    batch_id: Optional[str] = None,
    program_id: Optional[str] = None,
    overrides_map: Optional[dict] = None,
) -> list:
    """Return synthetic allocation list from templates matching the institution.
    When batch_id/program_id are provided, filter by visibility settings.
    When override has institution_ids, template must match that list."""
    templates = _load_templates()
    overrides_map = overrides_map or {}
    results = []
    for t in templates:
        if t.get("institution_id") != institution_id and t.get("college_slug") != institution_id:
            continue
        override = overrides_map.get(t["id"])
        eff = _effective_visibility(t, override)
        if eff.get("institution_ids") is not None and eff["institution_ids"]:
            if institution_id not in eff["institution_ids"]:
                continue
        if not _template_matches_visibility(t, batch_id, program_id, override):
            continue
        results.append({
            "id": f"alloc_{t['id']}",
            "template_id": t["id"],
            "institution_id": institution_id,
            "status": "PUBLISHED" if t.get("status") == "PUBLISHED" else "ALLOCATED",
            "created_at": None,
            "updated_at": None,
        })
    return results


def _global_template_allocations(
    batch_id: Optional[str] = None,
    program_id: Optional[str] = None,
    overrides_map: Optional[dict] = None,
    user_institution_ids: Optional[set] = None,
) -> list:
    """Return allocations for global templates (institution_id is null). Available to all users.
    When override has institution_ids, only include if user's institutions intersect."""
    templates = _load_templates()
    overrides_map = overrides_map or {}
    user_institution_ids = user_institution_ids or set()
    results = []
    for t in templates:
        if t.get("institution_id") is not None:
            continue
        if t.get("status") != "PUBLISHED":
            continue
        override = overrides_map.get(t["id"])
        eff = _effective_visibility(t, override)
        if eff.get("institution_ids") is not None and eff["institution_ids"]:
            if not (user_institution_ids & set(eff["institution_ids"])):
                continue
        if not _template_matches_visibility(t, batch_id, program_id, override):
            continue
        results.append({
            "id": f"alloc_{t['id']}",
            "template_id": t["id"],
            "institution_id": "global",
            "status": "PUBLISHED",
            "created_at": None,
            "updated_at": None,
        })
    return results


@router.get("/allocations/for-user/{user_id}")
def get_allocations_for_user(
    user_id: str,
    db: Session = Depends(database.get_db),
):
    """Return allocations for institutions the user is linked to, plus global templates for all users.
    Filter by user.batch_id and user.program_id when template has visibility settings."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    batch_id = user.batch_id if user else None
    program_id = user.program_id if user else None

    institution_ids = set()
    if _links_table_exists(db):
        for link in get_all_institution_links(db, user_id):
            if link.institution_id:
                institution_ids.add(link.institution_id)
    if not institution_ids and user and user.institution_id:
        institution_ids.add(user.institution_id)

    results = []
    seen_template_ids = set()
    overrides_map = _get_visibility_overrides(db)

    # Add global templates first (available to all users)
    for alloc in _global_template_allocations(
        batch_id, program_id, overrides_map, institution_ids
    ):
        if alloc["template_id"] not in seen_template_ids:
            seen_template_ids.add(alloc["template_id"])
            results.append(alloc)

    # Add institution-specific templates
    for inst_id in institution_ids:
        for alloc in _allocations_for_institution(inst_id, batch_id, program_id, overrides_map):
            if alloc["template_id"] not in seen_template_ids:
                seen_template_ids.add(alloc["template_id"])
                results.append(alloc)
    return results


@router.get("/allocations/{institution_id}")
def get_allocations(
    institution_id: str,
    batch_id: Optional[str] = Query(None),
    program_id: Optional[str] = Query(None),
    db: Session = Depends(database.get_db),
):
    """Return synthetic allocation list from templates matching the institution.
    Optional batch_id and program_id filter by visibility settings."""
    overrides_map = _get_visibility_overrides(db)
    return _allocations_for_institution(institution_id, batch_id, program_id, overrides_map)


class VisibilityPatchBody(BaseModel):
    institution_ids: Optional[list[str]] = None
    batch_ids: Optional[list[str]] = None
    program_ids: Optional[list[str]] = None


@router.get("/{template_id}/visibility")
def get_template_visibility(
    template_id: str,
    db: Session = Depends(database.get_db),
):
    """Get visibility override for a template. Returns null fields when no override exists."""
    row = db.query(models.CVTemplateVisibilityOverride).filter(
        models.CVTemplateVisibilityOverride.template_id == template_id
    ).first()
    if not row:
        return {"institution_ids": None, "batch_ids": None, "program_ids": None}
    return {
        "institution_ids": row.institution_ids,
        "batch_ids": row.batch_ids,
        "program_ids": row.program_ids,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.patch("/{template_id}/visibility")
def patch_template_visibility(
    template_id: str,
    body: VisibilityPatchBody,
    db: Session = Depends(database.get_db),
):
    """Update visibility override for a template. Omit a field to leave unchanged. Pass [] for visible to all."""
    templates = _load_templates()
    if not any(t.get("id") == template_id for t in templates):
        raise HTTPException(status_code=404, detail="CV template not found")

    row = db.query(models.CVTemplateVisibilityOverride).filter(
        models.CVTemplateVisibilityOverride.template_id == template_id
    ).first()
    if not row:
        row = models.CVTemplateVisibilityOverride(template_id=template_id)
        db.add(row)
    if body.institution_ids is not None:
        row.institution_ids = body.institution_ids if body.institution_ids else []
    if body.batch_ids is not None:
        row.batch_ids = body.batch_ids if body.batch_ids else []
    if body.program_ids is not None:
        row.program_ids = body.program_ids if body.program_ids else []
    db.commit()
    db.refresh(row)
    return {
        "template_id": template_id,
        "institution_ids": row.institution_ids,
        "batch_ids": row.batch_ids,
        "program_ids": row.program_ids,
        "updated_at": row.updated_at.isoformat() if row.updated_at else None,
    }


@router.get("/{template_id}")
def get_template(template_id: str):
    """Load a specific template by its ID (filename stem match)."""
    templates = _load_templates()
    for t in templates:
        if t.get("id") == template_id:
            return t
    raise HTTPException(status_code=404, detail="CV template not found")
