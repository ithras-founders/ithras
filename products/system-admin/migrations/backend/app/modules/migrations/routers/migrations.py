"""
Database migrations API for System Admin.
Get current revision, migration history, and run migrations on demand.
Works alongside DB_SETUP=TRUE startup flow.
"""
import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/api/v1/admin/migrations", tags=["migrations"])


class MigrationVersion(BaseModel):
    revision: str
    down_revision: Optional[str]
    doc: Optional[str] = None


class MigrationStatusResponse(BaseModel):
    current_revision: Optional[str]
    head_revision: Optional[str]
    is_up_to_date: bool
    pending: List[MigrationVersion] = []
    history: List[MigrationVersion] = []


class RunMigrationsResponse(BaseModel):
    success: bool
    message: str
    previous_revision: Optional[str] = None
    new_revision: Optional[str] = None


def _get_backend_dir():
    """Return core/backend directory where alembic.ini lives."""
    env_dir = os.getenv("ITHRAS_BACKEND_DIR", "").strip()
    if env_dir and os.path.isfile(os.path.join(env_dir, "alembic.ini")):
        return env_dir
    import app.modules.shared.database as _db_module
    _app_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(_db_module.__file__))))
    return os.path.dirname(_app_dir)


def _get_alembic_config():
    """Build Alembic config with DATABASE_URL."""
    database_url = os.getenv("DATABASE_URL", "").strip()
    if not database_url:
        raise HTTPException(status_code=503, detail="DATABASE_URL not set")
    from alembic.config import Config
    backend_dir = _get_backend_dir()
    alembic_ini = os.path.join(backend_dir, "alembic.ini")
    if not os.path.isfile(alembic_ini):
        raise HTTPException(status_code=503, detail=f"alembic.ini not found at {alembic_ini}")
    alembic_cfg = Config(alembic_ini)
    alembic_cfg.set_main_option("sqlalchemy.url", database_url.replace("%", "%%"))
    return alembic_cfg, backend_dir


@router.get("/status", response_model=MigrationStatusResponse)
def get_migration_status():
    """
    Get current Alembic revision, head revision, and migration history.
    """
    try:
        from alembic.script import ScriptDirectory

        alembic_cfg, backend_dir = _get_alembic_config()
        original_cwd = os.getcwd()
        try:
            os.chdir(backend_dir)
            script = ScriptDirectory.from_config(alembic_cfg)
        finally:
            os.chdir(original_cwd)

        # Get current revision from database
        from alembic.runtime.migration import MigrationContext
        from app.modules.shared.database import engine

        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            current_revision = context.get_current_revision()
        # Normalize to single string (DB may have multiple heads)
        if isinstance(current_revision, (list, tuple)):
            current_revision = current_revision[0] if current_revision else None

        # get_current_head() can return str, Script object, or list (multiple heads)
        head = script.get_current_head()
        if head is None:
            head_revision = None
        elif isinstance(head, (list, tuple)):
            head_revision = head[0].revision if hasattr(head[0], "revision") else head[0]
        elif isinstance(head, str):
            head_revision = head
        else:
            head_revision = head.revision
        is_up_to_date = (current_revision == head_revision) if head_revision else (current_revision is None and head_revision is None)

        def _down_rev_str(dr):
            """Normalize down_revision to str for MigrationVersion (merge revs have tuple)."""
            if dr is None:
                return None
            return dr[0] if isinstance(dr, (list, tuple)) else dr

        def _next_rev(dr):
            """Get next revision for traversal; use first parent for merge revs."""
            if dr is None:
                return None
            target = dr[0] if isinstance(dr, (list, tuple)) else dr
            return script.get_revision(target)

        # Build history (all revisions from base to head, oldest first)
        history = []
        rev = script.get_revision(head_revision) if head_revision else None
        while rev and hasattr(rev, "revision"):
            history.insert(0, MigrationVersion(revision=rev.revision, down_revision=_down_rev_str(rev.down_revision), doc=rev.doc))
            rev = _next_rev(rev.down_revision)

        # Pending = revisions between current and head (not yet applied)
        pending = []
        if current_revision != head_revision and head_revision:
            rev = script.get_revision(head_revision)
            while rev and hasattr(rev, "revision") and rev.revision != current_revision:
                pending.insert(0, MigrationVersion(revision=rev.revision, down_revision=_down_rev_str(rev.down_revision), doc=rev.doc))
                rev = _next_rev(rev.down_revision)

        return MigrationStatusResponse(
            current_revision=current_revision,
            head_revision=head_revision,
            is_up_to_date=is_up_to_date,
            pending=pending,
            history=list(reversed(history)),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/run", response_model=RunMigrationsResponse)
def run_migrations():
    """
    Run alembic upgrade head. Requires DATABASE_URL.
    DB_SETUP=TRUE at startup also runs migrations; this allows on-demand runs from the UI.
    """
    try:
        from alembic import command
        from alembic.runtime.migration import MigrationContext
        from app.modules.shared.database import engine

        alembic_cfg, backend_dir = _get_alembic_config()

        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            previous_revision = context.get_current_revision()
        if isinstance(previous_revision, (list, tuple)):
            previous_revision = previous_revision[0] if previous_revision else None

        original_cwd = os.getcwd()
        try:
            os.chdir(backend_dir)
            command.upgrade(alembic_cfg, "head")
        finally:
            os.chdir(original_cwd)

        with engine.connect() as conn:
            context = MigrationContext.configure(conn)
            new_revision = context.get_current_revision()
        if isinstance(new_revision, (list, tuple)):
            new_revision = new_revision[0] if new_revision else None

        return RunMigrationsResponse(
            success=True,
            message="Migrations completed successfully",
            previous_revision=previous_revision,
            new_revision=new_revision,
        )
    except HTTPException:
        raise
    except Exception as e:
        return RunMigrationsResponse(success=False, message=str(e))
