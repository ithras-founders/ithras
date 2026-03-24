"""Resolved path for LongForm uploaded images (shared by API routes and app mount)."""
from __future__ import annotations

import os
from pathlib import Path


def get_longform_media_root() -> Path:
    env = os.environ.get("LONGFORM_MEDIA_DIR")
    if env:
        return Path(env).expanduser().resolve()
    here = Path(__file__).resolve()
    for parent in here.parents:
        if (parent / "core").is_dir() and (parent / "products").is_dir():
            root = parent
            break
    else:
        # Split Docker mounts (/products without a single repo parent): store under product tree
        root = here.parents[3]
    return (root / "data" / "longform_media").resolve()
