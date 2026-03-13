"""
Shared helper to load CV templates from JSON files on disk.
"""
import os
import json
import glob as _glob

_TEMPLATES_DIR = os.path.normpath(
    os.path.join(os.path.dirname(__file__), "../../../../../templates")
)


def load_templates() -> list[dict]:
    """Read every *.json file in the templates directory."""
    templates = []
    pattern = os.path.join(_TEMPLATES_DIR, "*.json")
    for path in sorted(_glob.glob(pattern)):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("id"):
                templates.append(data)
        except Exception:
            continue
    return templates
