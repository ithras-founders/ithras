"""Verify cv_versions table exists (migration verification)."""
import pytest


def test_cv_versions_table_exists(client):
    """
    Verify cv_versions table exists after alembic upgrade head.
    CVVersion model is in core/backend; 001_initial_schema creates all tables from Base.metadata.
    """
    from sqlalchemy import text
    from app.modules.shared.database import SessionLocal

    db = SessionLocal()
    try:
        result = db.execute(
            text(
                "SELECT 1 FROM information_schema.tables "
                "WHERE table_schema = 'public' AND table_name = 'cv_versions'"
            )
        )
        row = result.fetchone()
        assert row is not None, "cv_versions table should exist (run: alembic upgrade head)"
    finally:
        db.close()
