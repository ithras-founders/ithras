"""
Setup engine - runs seed steps in background, tracks progress.
Schema is managed by Alembic (run at container startup).
Single in-memory state; concurrent callers get current progress.
"""
import re
import threading

from shared.database.config import settings
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
    msg = re.sub(r"password\s*=\s*[^\s,]+", "password=****", msg, flags=re.I)
    msg = re.sub(r"[\w\-]+@[\w\-.:]+", "****", msg)
    if "DATABASE_URL" in msg or "connection" in msg.lower():
        msg += " Check DATABASE_URL and CLOUDSQL_INSTANCE (for Unix socket)."
    return msg[:500]


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
    """No-op: all tables dropped, no seeds. Return ready immediately."""
    global _state
    with _status_lock:
        _state = SetupState(
            status="ready",
            phase="done",
            message="Minimal app - no database setup required",
            progress_percent=100,
        )


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
