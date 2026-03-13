"""DB-backed session store for authentication."""
import datetime
import secrets
from sqlalchemy.orm import Session
from sqlalchemy import text

SESSION_TTL_HOURS = 24 * 7  # 7 days


def create_session(db: Session, user_id: str) -> str:
    """Create a new session for the user. Returns session_id."""
    session_id = secrets.token_urlsafe(32)
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(hours=SESSION_TTL_HOURS)
    db.execute(
        text(
            "INSERT INTO auth_sessions (id, user_id, created_at, expires_at) VALUES (:id, :user_id, :created_at, :expires_at)"
        ),
        {"id": session_id, "user_id": user_id, "created_at": now, "expires_at": expires_at},
    )
    db.commit()
    return session_id


def get_session(db: Session, session_id: str) -> str | None:
    """Validate session and return user_id if valid, else None."""
    if not session_id or not session_id.strip():
        return None
    now = datetime.datetime.utcnow()
    row = db.execute(
        text(
            "SELECT user_id FROM auth_sessions "
            "WHERE id = :id AND expires_at > :now"
        ),
        {"id": session_id.strip(), "now": now},
    ).fetchone()
    return row[0] if row else None


def delete_session(db: Session, session_id: str) -> bool:
    """Invalidate a session. Returns True if a session was deleted."""
    if not session_id or not session_id.strip():
        return False
    r = db.execute(
        text("DELETE FROM auth_sessions WHERE id = :id"),
        {"id": session_id.strip()},
    )
    db.commit()
    return r.rowcount > 0


def delete_sessions_for_user(db: Session, user_id: str) -> int:
    """Invalidate all sessions for a user (e.g. on logout all devices)."""
    r = db.execute(
        text("DELETE FROM auth_sessions WHERE user_id = :user_id"),
        {"user_id": user_id},
    )
    db.commit()
    return r.rowcount
