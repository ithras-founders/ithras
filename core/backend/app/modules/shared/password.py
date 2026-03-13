"""Password hashing compatible with bcrypt 5.x (72-byte limit).

Uses SHA256 pre-hash so any password length works. Output is standard bcrypt format.
"""
import hashlib

import bcrypt


def _prehash(password: str) -> bytes:
    """SHA256 hexdigest of password - always 64 bytes, under bcrypt's 72-byte limit."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest().encode("utf-8")


def hash_password(password: str) -> str:
    """Hash password: SHA256 pre-hash + bcrypt. Returns standard bcrypt hash string."""
    prehashed = _prehash(password)
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(prehashed, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against stored hash. Supports our format (pre-hashed)."""
    try:
        hp_bytes = hashed_password.encode("utf-8")
        prehashed = _prehash(plain_password)
        return bcrypt.checkpw(prehashed, hp_bytes)
    except (ValueError, TypeError):
        return False
