"""
Shared helper for ensuring cv_templates rows exist.
Replaces duplicated INSERT logic across 6+ files.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional


def ensure_cv_template(
    db: Session,
    template_id: str = "iim_calcutta",
    name: str = "IIM Calcutta - Standard CV",
    institution_id: Optional[str] = None,
    config: str = "{}",
    status: str = "PUBLISHED",
) -> None:
    """Insert cv_template row if missing. Handles schema variants (with/without config column)."""
    r = db.execute(text("SELECT 1 FROM cv_templates WHERE id = :id"), {"id": template_id})
    if r.fetchone() is not None:
        return

    if not institution_id:
        fallback = db.execute(text("SELECT id FROM institutions LIMIT 1")).fetchone()
        institution_id = fallback[0] if fallback else None

    try:
        db.execute(
            text(
                "INSERT INTO cv_templates (id, name, institution_id, status, config) "
                "VALUES (:id, :name, :iid, :status, CAST(:config AS json)) "
                "ON CONFLICT (id) DO NOTHING"
            ),
            {"id": template_id, "name": name, "iid": institution_id, "status": status, "config": config},
        )
    except Exception:
        db.execute(
            text(
                "INSERT INTO cv_templates (id, name, institution_id) "
                "VALUES (:id, :name, :iid) ON CONFLICT (id) DO NOTHING"
            ),
            {"id": template_id, "name": name, "iid": institution_id},
        )


def upsert_cv_template(
    db,
    template_id: str,
    name: str,
    institution_id: Optional[str],
    status: str = "PUBLISHED",
    config: str = "{}",
) -> bool:
    """Insert or update a cv_template row. Returns True on success. Uses raw connection (not ORM Session)."""
    try:
        db.execute(
            text(
                "INSERT INTO cv_templates (id, name, institution_id, status, config) "
                "VALUES (:id, :name, :iid, :status, CAST(:config AS json)) "
                "ON CONFLICT (id) DO UPDATE SET "
                "name = EXCLUDED.name, institution_id = EXCLUDED.institution_id, "
                "status = EXCLUDED.status, config = EXCLUDED.config, "
                "updated_at = CURRENT_TIMESTAMP"
            ),
            {"id": template_id, "name": name, "iid": institution_id, "status": status, "config": config},
        )
        return True
    except Exception:
        r = db.execute(text("SELECT 1 FROM cv_templates WHERE id = :id"), {"id": template_id})
        if r.fetchone() is None:
            db.execute(
                text(
                    "INSERT INTO cv_templates (id, name, institution_id, status, config) "
                    "VALUES (:id, :name, :iid, :status, CAST(:config AS json))"
                ),
                {"id": template_id, "name": name, "iid": institution_id, "status": status, "config": config},
            )
            return True
        return False
