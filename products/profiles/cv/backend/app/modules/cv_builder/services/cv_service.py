"""
CV service layer - enrichment, versioning, file upload helpers.
"""
import json
import os
import uuid
from datetime import datetime
from typing import List, Set

from fastapi import UploadFile
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.modules.shared import models, schemas
from app.modules.shared.cv_template_utils import ensure_cv_template

from .template_loader import load_templates


def cv_versions_table_exists(db: Session) -> bool:
    """Check if cv_versions table exists."""
    try:
        r = db.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_name = 'cv_versions'
            )
        """))
        return bool(r.scalar())
    except Exception:
        return False


def enrich_cvs_with_verifier_names(db: Session, cvs_list: List) -> list:
    """Add verified_by_name to each CV for display."""
    verifier_ids = {cv.verified_by for cv in cvs_list if cv.verified_by}
    name_map = {}
    if verifier_ids:
        users = db.query(models.User).filter(models.User.id.in_(verifier_ids)).all()
        name_map = {u.id: u.name for u in users}
    result = []
    for cv in cvs_list:
        try:
            d = schemas.CVSchema.model_validate(cv).model_dump()
        except Exception:
            now = datetime.utcnow()
            d = {
                "id": cv.id,
                "candidate_id": cv.candidate_id,
                "template_id": cv.template_id,
                "data": cv.data if cv.data is not None else {},
                "pdf_url": cv.pdf_url,
                "status": cv.status or "DRAFT",
                "verified_by": cv.verified_by,
                "verified_at": cv.verified_at,
                "verification_notes": cv.verification_notes,
                "created_at": cv.created_at if cv.created_at is not None else now,
                "updated_at": cv.updated_at if cv.updated_at is not None else now,
            }
        d["verified_by_name"] = name_map.get(cv.verified_by) if cv.verified_by else None
        result.append(schemas.CVSchema(**d))
    return result


def snapshot_cv_version(cv_id: str, db: Session, current_data: dict) -> None:
    """Snapshot current CV data to cv_versions before an update."""
    if not cv_versions_table_exists(db):
        return
    max_v = db.execute(
        text("SELECT COALESCE(MAX(version), 0) FROM cv_versions WHERE cv_id = :cv_id"),
        {"cv_id": cv_id},
    ).scalar()
    next_version = (max_v or 0) + 1
    ver_id = f"ver_{uuid.uuid4().hex[:12]}"
    db.execute(
        text("""
            INSERT INTO cv_versions (id, cv_id, version, data)
            VALUES (:id, :cv_id, :version, CAST(:data AS jsonb))
        """),
        {"id": ver_id, "cv_id": cv_id, "version": next_version, "data": json.dumps(current_data or {})},
    )


def restore_cv_version(cv_id: str, version_id: str, db: Session):
    """Restore a CV to a previous version. Returns the updated CV model instance."""
    db_cv = db.query(models.CV).filter(models.CV.id == cv_id).first()
    if not db_cv:
        return None
    if not cv_versions_table_exists(db):
        return None
    r = db.execute(
        text("""
            SELECT id, data FROM cv_versions
            WHERE cv_id = :cv_id AND id = :version_id
        """),
        {"cv_id": cv_id, "version_id": version_id},
    )
    row = r.fetchone()
    if not row:
        return None
    restored_data = dict(row._mapping).get("data", {})
    db_cv.data = restored_data
    db.commit()
    db.refresh(db_cv)
    return db_cv


async def save_uploaded_file(
    file: UploadFile,
    allowed_extensions: Set[str],
    upload_dir: str,
    prefix: str,
    default_ext: str | None = None,
) -> str:
    """
    Save an uploaded file to disk. Returns the filename (for building /uploads/{filename} URL).
    Raises ValueError if file extension not in allowed_extensions.
    If ext is empty and default_ext is provided, uses default_ext.
    """
    ext = os.path.splitext(file.filename or "")[1].lower() or (default_ext or "")
    if ext not in allowed_extensions:
        raise ValueError(f"File type not allowed. Use: {', '.join(allowed_extensions)}")
    os.makedirs(upload_dir, exist_ok=True)
    filename = f"{prefix}{uuid.uuid4().hex[:12]}{ext}"
    path = os.path.join(upload_dir, filename)
    content = await file.read()
    if not content:
        raise ValueError("Uploaded file is empty")
    with open(path, "wb") as f:
        f.write(content)
    return filename


def ensure_template_in_db(db: Session, template_id: str) -> None:
    """Ensure template exists in cv_templates (for FK). Sync from JSON if missing."""
    template = next((t for t in load_templates() if t["id"] == template_id), None)
    if template:
        ensure_cv_template(
            db,
            template_id=template["id"],
            name=template.get("name", template_id),
            institution_id=template.get("institution_id"),
            config=json.dumps(template.get("config", {})),
            status=template.get("status", "PUBLISHED"),
        )
    else:
        ensure_cv_template(db, template_id=template_id)
    try:
        db.commit()
    except Exception:
        db.rollback()
