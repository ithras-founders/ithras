"""Authentication API - Register, Login (DB-backed), me."""
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, field_validator
from sqlalchemy import text

from shared.database.database import get_db
from shared.auth.jwt_utils import create_token_for_db_user
from shared.auth.auth import get_current_user, get_current_user_optional
from shared.auth.password_utils import hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


# ─── Pydantic schemas ────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    full_name: str
    email: str
    username: str
    password: str
    date_of_birth: date
    headline: str | None = None
    summary: str | None = None

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v

    @field_validator("username", mode="before")
    @classmethod
    def normalize_username(cls, v):
        if not isinstance(v, str):
            return v
        s = v.strip().lower()
        if not s:
            raise ValueError("Username is required")
        allowed = set("abcdefghijklmnopqrstuvwxyz0123456789")
        if not all(c in allowed for c in s):
            raise ValueError("Username must be lowercase letters and numbers only, no spaces")
        return s

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        return v


class LoginRequest(BaseModel):
    identifier: str  # username or email
    password: str

    @field_validator("identifier", mode="before")
    @classmethod
    def normalize_identifier(cls, v):
        if isinstance(v, str):
            return v.strip().lower()
        return v


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _user_row_to_response(row) -> dict:
    """Convert DB row to API user object. id = user_numerical."""
    out = {
        "id": row.user_numerical,
        "user_numerical": row.user_numerical,
        "username": row.username,
        "email": row.email,
        "full_name": row.full_name,
        "date_of_birth": str(row.date_of_birth) if row.date_of_birth else None,
    }
    if hasattr(row, "user_type"):
        out["user_type"] = getattr(row, "user_type", "professional")
    if hasattr(row, "headline"):
        out["headline"] = getattr(row, "headline", None)
    if hasattr(row, "summary"):
        out["summary"] = getattr(row, "summary", None)
    if hasattr(row, "profile_slug"):
        out["profile_slug"] = getattr(row, "profile_slug", None)
    return out


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/register", summary="Register new user")
def register(req: RegisterRequest, db=Depends(get_db)):
    """Validate uniqueness (username, email), hash password, insert user. Returns JWT + user."""
    lower_email = req.email.lower()
    lower_username = req.username.lower()

    # Check username uniqueness
    r = db.execute(
        text("SELECT 1 FROM users WHERE LOWER(username) = :u"),
        {"u": lower_username}
    )
    if r.scalar():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Check email uniqueness
    r = db.execute(
        text("SELECT 1 FROM users WHERE LOWER(email) = :e"),
        {"e": lower_email}
    )
    if r.scalar():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    pw_hash = hash_password(req.password)
    headline = (req.headline or "").strip() or None
    summary = (req.summary or "").strip() or None
    r = db.execute(
        text("""
            INSERT INTO users (
                username, email, password_hash, full_name, date_of_birth, user_type, headline, summary, account_status
            )
            VALUES (
                :username, :email, :pw_hash, :full_name, :date_of_birth, 'professional', :headline, :summary, 'pending'
            )
            RETURNING user_numerical, username, email, full_name, date_of_birth
        """),
        {
            "username": req.username,
            "email": req.email,
            "pw_hash": pw_hash,
            "full_name": req.full_name,
            "date_of_birth": req.date_of_birth,
            "headline": headline,
            "summary": summary,
        },
    )
    row = r.fetchone()
    slug_base = (req.username or "").replace(" ", "-").lower()[:50] or "user"
    profile_slug = f"{slug_base}-{row.user_numerical}"
    db.execute(
        text("UPDATE users SET profile_slug = :slug WHERE user_numerical = :id"),
        {"slug": profile_slug, "id": row.user_numerical},
    )
    db.commit()

    user = _user_row_to_response(row)
    user["user_type"] = "professional"
    user["profile_slug"] = profile_slug
    user["account_status"] = "pending"
    access_token = create_token_for_db_user(
        user["user_numerical"],
        user["username"],
        user["email"],
        user["full_name"],
        "professional",
    )
    return {
        "access_token": access_token,
        "user": user,
    }


@router.post("/login", summary="Login with identifier (username or email) + password")
def login(req: LoginRequest, db=Depends(get_db)):
    """Resolve user by LOWER(identifier) matching username or email. Verify password. Return JWT + user."""
    r = db.execute(
        text("""
            SELECT user_numerical, username, email, password_hash, full_name, date_of_birth, user_type, headline, summary, profile_slug, account_status
            FROM users
            WHERE LOWER(username) = :ident OR LOWER(email) = :ident
            LIMIT 1
        """),
        {"ident": req.identifier},
    )
    row = r.fetchone()
    if not row:
        try:
            from shared.telemetry.emitters.auth_emitter import track_login_failure
            track_login_failure(db)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid identifier or password",
        )
    if not verify_password(req.password, row.password_hash):
        try:
            from shared.telemetry.emitters.auth_emitter import track_login_failure
            masked = (req.identifier[:3] + "***") if len(req.identifier) > 3 else "***"
            track_login_failure(db, identifier_masked=masked)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid identifier or password",
        )

    account_status = getattr(row, "account_status", "approved")
    email_lower = (getattr(row, "email", None) or "").lower()
    # Founder / admin bootstrap account must never be blocked by the professional approval flow.
    # (Seed used to omit account_status; DB default after migration 017 is 'pending' → 403 on login.)
    is_founder_account = email_lower == "founders@ithras.com"
    is_admin_user = getattr(row, "user_type", None) == "admin"
    if account_status == "pending" and not (is_founder_account or is_admin_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting admin approval. You will be able to sign in once approved.",
        )
    if account_status == "rejected" and not (is_founder_account or is_admin_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account application was not approved. Please contact support for more information.",
        )

    user = _user_row_to_response(row)
    try:
        from shared.telemetry.emitters.auth_emitter import track_login_success
        track_login_success(db, actor_id=row.user_numerical)
    except Exception:
        pass
    access_token = create_token_for_db_user(
        user["user_numerical"],
        user["username"],
        user["email"],
        user["full_name"],
        user.get("user_type", "professional"),
    )
    return {
        "access_token": access_token,
        "user": user,
    }


@router.get("/me", summary="Validate token and return current user")
def me(user=Depends(get_current_user), db=Depends(get_db)):
    """Returns user from JWT payload, with profile_slug and account_status from DB for routing."""
    user_type = getattr(user, "user_type", "professional")
    profile_slug = None
    account_status = "approved"
    try:
        uid = int(user.id) if user.id else None
        if uid:
            r = db.execute(
                text("SELECT profile_slug, COALESCE(account_status, 'approved') as account_status FROM users WHERE user_numerical = :uid"),
                {"uid": uid},
            )
            row = r.fetchone()
            if row:
                if hasattr(row, "profile_slug"):
                    profile_slug = row.profile_slug
                if hasattr(row, "account_status"):
                    account_status = row.account_status
    except (ValueError, TypeError):
        pass
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "full_name": user.name,
            "user_type": user_type,
            "profile_slug": profile_slug,
            "account_status": account_status,
            "phone": None,
            "is_active": True,
            "role": "CANDIDATE",
            "company_id": None,
            "institution_id": None,
            "program_id": None,
            "sector_preferences": [],
            "student_subtype": None,
            "profile_photo_url": None,
            "email_hidden": False,
        },
    }


@router.post("/logout", summary="Logout (no-op, client clears token)")
def logout(user=Depends(get_current_user_optional), db=Depends(get_db)):
    """No-op. Client should clear localStorage. Tracks logout if user is authenticated."""
    try:
        if user:
            uid = int(getattr(user, "user_numerical", None) or getattr(user, "id", 0) or 0)
            if uid:
                from shared.telemetry.emitters.auth_emitter import track_logout
                track_logout(db, uid)
    except Exception:
        pass
    return {"message": "Logged out"}
