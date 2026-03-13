"""
CV API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
import sys
import os
import uuid

_core_backend_path = os.path.join(os.path.dirname(__file__), '../../../../../../core/backend')
if _core_backend_path not in sys.path:
    sys.path.insert(0, _core_backend_path)

from app.modules.shared import models, database, schemas
from app.modules.shared.audit import log_audit
from app.config import settings as _app_settings
from ..services.template_loader import load_templates
from ..services.cv_service import (
    cv_versions_table_exists,
    enrich_cvs_with_verifier_names,
    snapshot_cv_version,
    restore_cv_version as _restore_cv_version,
    save_uploaded_file,
    ensure_template_in_db,
)

router = APIRouter(prefix="/api/v1/cvs", tags=["cvs"])

UPLOAD_DIR = _app_settings.UPLOAD_DIR
ALLOWED_PROOF_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".gif", ".webp"}


@router.get("/", response_model=List[schemas.CVSchema])
def get_cvs(
    candidate_id: Optional[str] = None,
    institution_id: Optional[str] = None,
    template_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(database.get_db)
):
    """Get all CVs with optional filtering"""
    query = db.query(models.CV)

    if candidate_id:
        query = query.filter(models.CV.candidate_id == candidate_id)
    if template_id:
        query = query.filter(models.CV.template_id == template_id)
    if institution_id:
        matching_ids = [
            t["id"] for t in load_templates()
            if t.get("institution_id") == institution_id
            or t.get("college_slug") == institution_id
        ]
        if matching_ids:
            query = query.filter(models.CV.template_id.in_(matching_ids))
        else:
            query = query.filter(models.CV.template_id == "__no_match__")
    if status:
        query = query.filter(models.CV.status == status)

    # Subquery: select only CV ids (no JSON column) to avoid DISTINCT/equality on json type.
    if institution_id:
        ids_subq = query.with_entities(models.CV.id)
        cvs_list = db.query(models.CV).filter(models.CV.id.in_(ids_subq)).all()
    else:
        cvs_list = query.all()
    return enrich_cvs_with_verifier_names(db, cvs_list)


@router.get("/{cv_id}", response_model=schemas.CVSchema)
def get_cv(cv_id: str, db: Session = Depends(database.get_db)):
    """Get a specific CV"""
    cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    enriched = enrich_cvs_with_verifier_names(db, [cv])
    return enriched[0]


@router.get("/{cv_id}/versions")
def get_cv_versions(cv_id: str, db: Session = Depends(database.get_db)):
    """List version history for a CV"""
    cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if not cv_versions_table_exists(db):
        return []
    r = db.execute(text("""
        SELECT id, cv_id, version, created_at
        FROM cv_versions
        WHERE cv_id = :cv_id
        ORDER BY version DESC
    """), {"cv_id": cv_id})
    return [dict(row._mapping) for row in r]


@router.get("/{cv_id}/versions/{version_id}")
def get_cv_version(cv_id: str, version_id: str, db: Session = Depends(database.get_db)):
    """Get a specific version's data"""
    cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    if not cv_versions_table_exists(db):
        raise HTTPException(status_code=404, detail="Version not found")
    r = db.execute(text("""
        SELECT id, cv_id, version, data, created_at
        FROM cv_versions
        WHERE cv_id = :cv_id AND id = :version_id
    """), {"cv_id": cv_id, "version_id": version_id})
    row = r.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Version not found")
    return dict(row._mapping)


@router.post("/{cv_id}/restore")
def restore_cv_version(
    cv_id: str,
    body: dict = Body(...),
    db: Session = Depends(database.get_db)
):
    """Restore a CV to a previous version. Creates new version entry with restored data."""
    version_id = body.get("version_id")
    if not version_id:
        raise HTTPException(status_code=400, detail="version_id required")
    if not cv_versions_table_exists(db):
        raise HTTPException(status_code=501, detail="Version control not available")

    db_cv = _restore_cv_version(cv_id, version_id, db)
    if not db_cv:
        db_cv_check = db.query(models.CV).filter(models.CV.id == cv_id).first()
        if not db_cv_check:
            raise HTTPException(status_code=404, detail="CV not found")
        raise HTTPException(status_code=404, detail="Version not found")

    enriched = enrich_cvs_with_verifier_names(db, [db_cv])
    return enriched[0]


@router.post("/", response_model=schemas.CVSchema)
def create_cv(cv_data: schemas.CVCreateSchema, db: Session = Depends(database.get_db)):
    """Create a new CV"""
    template = next((t for t in load_templates() if t["id"] == cv_data.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="CV template not found")

    ensure_template_in_db(db, cv_data.template_id)

    # Verify candidate exists
    candidate = db.query(models.User).filter(
        models.User.id == cv_data.candidate_id
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cv_id = f"cv_{uuid.uuid4().hex[:12]}"
    db_cv = models.CV(
        id=cv_id,
        candidate_id=cv_data.candidate_id,
        template_id=cv_data.template_id,
        data=cv_data.data or {},
        status=cv_data.status or "DRAFT"
    )

    try:
        db.add(db_cv)
        log_audit(
            db, user_id=cv_data.candidate_id, action="CV_CREATED",
            entity_type="cv", entity_id=cv_id,
            institution_id=candidate.institution_id,
            details={"template_id": cv_data.template_id},
        )
        db.commit()
        db.refresh(db_cv)
        enriched = enrich_cvs_with_verifier_names(db, [db_cv])
        return enriched[0]
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"Database constraint violated: {str(e)}")
    except Exception as e:
        db.rollback()
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create CV: {str(e)}"
        )


@router.put("/{cv_id}", response_model=schemas.CVSchema)
def update_cv(
    cv_id: str,
    cv_update: schemas.CVUpdateSchema,
    db: Session = Depends(database.get_db)
):
    """Update a CV. Snapshots current data to cv_versions before update when versioning is enabled."""
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")

    snapshot_cv_version(cv_id, db, db_cv.data or {})

    for key, value in cv_update.model_dump(exclude_unset=True).items():
        setattr(db_cv, key, value)

    candidate = db.query(models.User).filter(models.User.id == db_cv.candidate_id).first()
    log_audit(
        db, user_id=db_cv.candidate_id, action="CV_UPDATED",
        entity_type="cv", entity_id=cv_id,
        institution_id=candidate.institution_id if candidate else None,
    )
    db.commit()
    db.refresh(db_cv)
    enriched = enrich_cvs_with_verifier_names(db, [db_cv])
    return enriched[0]


@router.delete("/{cv_id}")
def delete_cv(cv_id: str, db: Session = Depends(database.get_db)):
    """Delete a CV (hard delete). Cascades to cv_versions if present."""
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")
    candidate = db.query(models.User).filter(models.User.id == db_cv.candidate_id).first()
    log_audit(
        db, user_id=db_cv.candidate_id, action="CV_DELETED",
        entity_type="cv", entity_id=cv_id,
        institution_id=candidate.institution_id if candidate else None,
        details={},
    )
    db.delete(db_cv)
    db.commit()
    return {"message": "CV deleted"}


@router.post("/{cv_id}/verify", response_model=schemas.CVSchema)
def verify_cv(
    cv_id: str,
    verification: schemas.CVVerificationSchema,
    db: Session = Depends(database.get_db)
):
    """Verify or reject a CV (for Placement Team/Admin)"""
    from datetime import datetime

    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")

    db_cv.status = verification.status
    db_cv.verified_by = verification.verified_by
    db_cv.verified_at = datetime.utcnow()
    db_cv.verification_notes = verification.notes

    candidate = db.query(models.User).filter(models.User.id == db_cv.candidate_id).first()
    log_audit(
        db, user_id=verification.verified_by, action="CV_VERIFIED",
        entity_type="cv", entity_id=cv_id,
        institution_id=candidate.institution_id if candidate else None,
        details={"status": verification.status, "candidate_id": db_cv.candidate_id},
    )
    db.commit()
    db.refresh(db_cv)
    return db_cv


@router.post("/proof-upload")
async def proof_upload(file: UploadFile = File(...)):
    """Upload a proof/attachment file. Returns the URL to use in cv.data."""
    try:
        filename = await save_uploaded_file(
            file, ALLOWED_PROOF_EXTENSIONS, UPLOAD_DIR, "proof_"
        )
        return {"url": f"/uploads/{filename}"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{cv_id}/pdf", response_model=schemas.CVSchema)
async def save_cv_pdf(
    cv_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(database.get_db)
):
    """Persist a generated CV PDF and attach it to the CV record."""
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")

    ext = os.path.splitext(file.filename or "")[1].lower() or ".pdf"
    if ext != ".pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    try:
        filename = await save_uploaded_file(
            file, {".pdf"}, UPLOAD_DIR, f"cv_{cv_id}_", default_ext=".pdf"
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    db_cv.pdf_url = f"/uploads/{filename}"
    db.commit()
    db.refresh(db_cv)
    enriched = enrich_cvs_with_verifier_names(db, [db_cv])
    return enriched[0]


@router.post("/{cv_id}/verify-entry")
def verify_entry(
    cv_id: str,
    body: dict = Body(...),
    db: Session = Depends(database.get_db)
):
    """Verify or reject a specific CV entry or bullet point.
    Supports optional bullet_index for point-level verification.
    """
    from datetime import datetime

    section_id = body.get("section_id")
    entry_index = body.get("entry_index", 0)
    bullet_index = body.get("bullet_index")  # Optional: for bullet-level verification
    status = body.get("status")
    notes = body.get("notes") or ""
    verified_by = body.get("verified_by")
    if not section_id or not status or not verified_by:
        raise HTTPException(status_code=400, detail="section_id, status, verified_by required")
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")
    data = dict(db_cv.data or {})
    verification = data.get("verification") or {}
    section_ver = verification.get(section_id) or {}
    entry_key = str(entry_index)
    current = section_ver.get(entry_key)
    if not isinstance(current, dict):
        current = {"entry": current} if current else {}
    ver_record = {
        "status": status,
        "verifiedBy": verified_by,
        "verifiedAt": datetime.utcnow().isoformat(),
        "notes": notes,
    }
    if bullet_index is not None:
        bullets = current.get("bullets") or {}
        bullets[str(bullet_index)] = ver_record
        current["bullets"] = bullets
    else:
        current["entry"] = ver_record
    section_ver[entry_key] = current
    verification[section_id] = section_ver
    data["verification"] = verification
    db_cv.data = data
    db.commit()
    db.refresh(db_cv)
    return db_cv


@router.post("/{cv_id}/export-pdf")
def export_cv_pdf(
    cv_id: str,
    db: Session = Depends(database.get_db)
):
    """Export CV as PDF (server-side, optional)

    Note: This is an optional server-side PDF export endpoint.
    The primary PDF export is done client-side using html2pdf.js.
    This endpoint can be used for server-side PDF generation if needed.
    """
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        raise HTTPException(status_code=404, detail="CV not found")

    template = next((t for t in load_templates() if t["id"] == db_cv.template_id), None)
    if not template:
        raise HTTPException(status_code=404, detail="CV template not found")

    return {
        "message": "Server-side PDF export endpoint. Client-side PDF export is recommended using html2pdf.js.",
        "cv_id": cv_id,
        "template_id": template["id"],
        "note": "Use the client-side exportToPDF function for PDF generation"
    }
