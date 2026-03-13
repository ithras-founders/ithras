"""Helpers to verify Alembic schema revision state."""
from __future__ import annotations

import os
from typing import Dict, List

from alembic.config import Config
from alembic.runtime.migration import MigrationContext
from alembic.script import ScriptDirectory

from app.config import settings
from app.modules.shared.database import engine


def _backend_root() -> str:
    return os.path.dirname(
        os.path.dirname(
            os.path.dirname(
                os.path.dirname(
                    os.path.dirname(os.path.abspath(__file__))
                )
            )
        )
    )


def _alembic_config() -> Config:
    cfg = Config(os.path.join(_backend_root(), "alembic.ini"))
    database_url = settings.DATABASE_URL.strip()
    if database_url:
        cfg.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return cfg


def get_schema_state() -> Dict[str, object]:
    """Return current/head revision state and readiness."""
    try:
        cfg = _alembic_config()
        script = ScriptDirectory.from_config(cfg)
        head_revisions: List[str] = list(script.get_heads())

        with engine.connect() as conn:
            ctx = MigrationContext.configure(conn)
            current_revisions: List[str] = list(ctx.get_current_heads() or [])

        ready = bool(head_revisions) and set(current_revisions) == set(head_revisions)
        return {
            "ready": ready,
            "current_revisions": current_revisions,
            "head_revisions": head_revisions,
        }
    except Exception as exc:
        return {
            "ready": False,
            "current_revisions": [],
            "head_revisions": [],
            "error": str(exc),
        }
