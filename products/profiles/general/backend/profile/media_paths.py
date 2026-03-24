"""Resolved path for profile photo uploads (shared by API routes and app mount)."""
from __future__ import annotations

import os
from pathlib import Path


def get_profile_photo_media_root() -> Path:
    env = os.environ.get("PROFILE_PHOTO_MEDIA_DIR")
    if env:
        return Path(env).expanduser().resolve()
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "core").is_dir() and (parent / "products").is_dir():
            root = parent
            break
    else:
        root = here.parents[4]
    return (root / "data" / "profile_photos").resolve()
