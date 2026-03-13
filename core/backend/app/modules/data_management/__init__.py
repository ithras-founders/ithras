"""
Holistic data management for Ithras deployment.
Runs schema sync and migrations when DB_SETUP=TRUE.
"""
import logging

from app.config import settings

logger = logging.getLogger(__name__)


def is_db_setup_enabled() -> bool:
    """Return True if DB_SETUP env var is truthy (TRUE, true, 1, yes)."""
    return settings.DB_SETUP


def run_schema_sync() -> bool:
    """
    Run Alembic migrations to bring database schema in sync with models.
    Returns True if successful, False otherwise.
    """
    if not is_db_setup_enabled():
        logger.info("DB_SETUP not enabled; skipping schema sync")
        return False

    database_url = settings.DATABASE_URL.strip()
    if not database_url:
        logger.warning("DB_SETUP enabled but DATABASE_URL not set; skipping schema sync")
        return False

    try:
        from alembic import command
        from alembic.config import Config

        alembic_cfg = Config("alembic.ini")
        alembic_cfg.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
        command.upgrade(alembic_cfg, "head")
        logger.info("Schema sync completed (Alembic upgrade head)")
        return True
    except Exception as e:
        logger.exception("Schema sync failed: %s", e)
        return False


def run_db_setup() -> bool:
    """
    Run full DB setup when DB_SETUP=TRUE: schema sync (migrations).
    Returns True if setup ran successfully, False if skipped or failed.
    """
    if not is_db_setup_enabled():
        return False
    return run_schema_sync()
