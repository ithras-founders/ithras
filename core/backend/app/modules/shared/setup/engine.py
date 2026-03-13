"""
Setup engine - runs seed steps in background, tracks progress.
Schema is managed by Alembic (run at container startup).
Single in-memory state; concurrent callers get current progress.
"""
import re
import threading

from app.config import settings
from dataclasses import dataclass, field
from typing import Optional

_status_lock = threading.Lock()
_state: Optional["SetupState"] = None


@dataclass
class SetupState:
    status: str = "pending"  # pending | in_progress | ready | error | db_unreachable
    phase: str = "schema"  # schema | seeds | done
    current_step: int = 0
    total_steps: int = 0
    steps: list = field(default_factory=list)
    message: str = ""
    progress_percent: int = 0


def _sanitize_db_error(msg: str) -> str:
    """Sanitize DB error for user display - avoid leaking credentials."""
    msg = str(msg)
    # Remove password=value (not password_hash column name)
    msg = re.sub(r"password\s*=\s*[^\s,]+", "password=****", msg, flags=re.I)
    msg = re.sub(r"[\w\-]+@[\w\-.:]+", "****", msg)
    if "DATABASE_URL" in msg or "connection" in msg.lower():
        msg += " Check DATABASE_URL and CLOUDSQL_INSTANCE (for Unix socket)."
    return msg[:500]  # Cap length


def get_status() -> dict:
    """Return current setup status. No DB connection required."""
    with _status_lock:
        if _state is None:
            return {
                "status": "pending",
                "phase": "schema",
                "current_step": 0,
                "total_steps": 0,
                "steps": [],
                "message": "",
                "progress_percent": 0,
                "db_unreachable": False,
            }
        return {
            "status": _state.status,
            "phase": _state.phase,
            "current_step": _state.current_step,
            "total_steps": _state.total_steps,
            "steps": _state.steps,
            "message": _state.message,
            "progress_percent": _state.progress_percent,
            "db_unreachable": _state.status == "db_unreachable",
        }


def _run_setup():
    """Run setup steps. Called from background thread."""
    global _state
    database_url = settings.DATABASE_URL.strip()
    require_database = settings.REQUIRE_DATABASE or settings.IS_CLOUD_RUN
    if not database_url:
        if require_database:
            with _status_lock:
                _state = SetupState(
                    status="db_unreachable",
                    phase="schema",
                    message="DATABASE_URL is required but not configured",
                    progress_percent=0,
                )
        else:
            with _status_lock:
                _state = SetupState(
                    status="ready",
                    phase="done",
                    message="Database not configured (DATABASE_URL not set)",
                    progress_percent=100,
                )
        return

    try:
        from app.modules.shared.database import engine
        from .registry import build_steps
    except Exception as e:
        with _status_lock:
            _state = SetupState(
                status="db_unreachable",
                phase="schema",
                message=_sanitize_db_error(str(e)),
            )
        return

    steps = build_steps(engine)
    total = len(steps)
    step_statuses = [{"id": s["id"], "name": s["name"], "status": "pending"} for s in steps]

    with _status_lock:
        _state = SetupState(
            status="in_progress",
            phase="seeds",
            current_step=0,
            total_steps=total,
            steps=step_statuses,
            message="Running seed steps...",
            progress_percent=0,
        )

    try:
        with engine.connect() as conn:
            for i, step in enumerate(steps):
                with _status_lock:
                    _state.current_step = i + 1
                    _state.message = step["name"] + "..."
                    _state.steps[i]["status"] = "in_progress"
                    _state.progress_percent = int((i / total) * 100) if total > 0 else 0

                try:
                    if step["check"](conn):
                        with _status_lock:
                            _state.steps[i]["status"] = "done"
                        continue
                    step["apply"](conn)
                    with _status_lock:
                        _state.steps[i]["status"] = "done"
                except Exception as e:
                    with _status_lock:
                        _state.status = "error"
                        _state.steps[i]["status"] = "error"
                        _state.message = f"Step '{step['name']}' failed: {_sanitize_db_error(str(e))}"
                    return

        with _status_lock:
            _state.status = "ready"
            _state.phase = "done"
            _state.message = "Setup complete"
            _state.progress_percent = 100
    except Exception as e:
        with _status_lock:
            _state.status = "db_unreachable"
            _state.message = _sanitize_db_error(str(e))
            _state.progress_percent = 0


def ensure_setup_started():
    """Start setup in background if not already running or done."""
    global _state
    with _status_lock:
        if _state is not None:
            if _state.status in ("ready", "error", "db_unreachable"):
                return
            if _state.status == "in_progress":
                return
        _state = SetupState(status="in_progress", phase="seeds", message="Starting...")
    t = threading.Thread(target=_run_setup, daemon=True)
    t.start()


def setup_engine() -> dict:
    """
    Get setup status. If DB not ready, start background setup and return current progress.
    Call this from the /setup/status endpoint.
    """
    if _state is None:
        ensure_setup_started()
    return get_status()


def reset_setup_state():
    """Reset state (for testing or retry)."""
    global _state
    with _status_lock:
        _state = None
