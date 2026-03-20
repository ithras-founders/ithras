"""Seed admin account: founders@ithras.com / password. Idempotent."""
import os
import sys

_this = os.path.abspath(__file__)
_backend = os.path.dirname(_this)
_setup = os.path.dirname(_backend)
_core = os.path.dirname(_setup)
_ws = os.path.dirname(_core)
for p in (_core, _ws):
    if p not in sys.path:
        sys.path.insert(0, p)
if os.path.exists("/shared") and "/" not in sys.path:
    sys.path.insert(0, "/")


def seed_admin():
    """Insert admin user if not exists. Call after DB is ready."""
    from sqlalchemy import text
    from shared.database.database import SessionLocal
    from shared.auth.password_utils import hash_password

    admin_email = "founders@ithras.com"
    admin_password = "password"
    pw_hash = hash_password(admin_password)

    db = SessionLocal()
    try:
        r = db.execute(
            text("SELECT 1 FROM users WHERE LOWER(email) = :e"),
            {"e": admin_email.lower()}
        )
        if r.scalar():
            # Migration 017 defaults new rows to account_status='pending'. Older seed inserts omitted
            # this column, so founders could get 403 on login — always keep founder approved.
            try:
                db.execute(
                    text("""
                        UPDATE users SET account_status = 'approved'
                        WHERE LOWER(email) = :e
                    """),
                    {"e": admin_email.lower()},
                )
                db.commit()
            except Exception:
                db.rollback()
                # Pre-migration DB without account_status column — ignore
            return
        # Generate username from email
        username = "founders"
        r = db.execute(text("SELECT 1 FROM users WHERE LOWER(username) = :u"), {"u": username})
        if r.scalar():
            username = "founders_admin"  # fallback if founders taken
        db.execute(
            text("""
                INSERT INTO users (
                    username, email, password_hash, full_name, date_of_birth, user_type, account_status
                )
                VALUES (
                    :username, :email, :pw_hash, :full_name, :date_of_birth, 'admin', 'approved'
                )
            """),
            {
                "username": username,
                "email": admin_email,
                "pw_hash": pw_hash,
                "full_name": "Ithras Founders",
                "date_of_birth": "1990-01-01",
            },
        )
        db.commit()
    except Exception as e:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
    print("Admin seed complete")
