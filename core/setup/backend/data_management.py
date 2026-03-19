"""
Holistic data management for Ithras deployment.
Runs schema sync and migrations when DB_SETUP=TRUE.
"""
import logging
import os

from shared.database.config import settings

logger = logging.getLogger(__name__)


def is_db_setup_enabled() -> bool:
    return settings.DB_SETUP


def _alembic_ini_path() -> str:
    """Path to alembic.ini - /core in Docker, else core/ relative to workspace."""
    if os.path.exists("/core/alembic.ini"):
        return "/core/alembic.ini"
    _core = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    return os.path.join(_core, "alembic.ini")


def run_schema_sync() -> bool:
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
        alembic_cfg = Config(_alembic_ini_path())
        alembic_cfg.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
        command.upgrade(alembic_cfg, "head")
        logger.info("Schema sync completed (Alembic upgrade head)")
        return True
    except Exception as e:
        logger.exception("Schema sync failed: %s", e)
        return False


def run_db_setup() -> bool:
    return run_schema_sync() if is_db_setup_enabled() else False
