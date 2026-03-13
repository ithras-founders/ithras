"""
Shared allocation helpers for CV templates.
"""
from sqlalchemy.orm import Session
from sqlalchemy import text


def allocations_table_exists(db: Session) -> bool:
    """Check if cv_template_allocations table exists (for backward compatibility)."""
    try:
        r = db.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'cv_template_allocations'
            )
        """))
        return bool(r.scalar())
    except Exception:
        return False


def cv_versions_table_exists(db: Session) -> bool:
    """Check if cv_versions table exists (for version control feature)."""
    try:
        r = db.execute(text("""
            SELECT EXISTS(
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = 'cv_versions'
            )
        """))
        return bool(r.scalar())
    except Exception:
        return False
