#!/usr/bin/env python3
"""
Sync CV templates from JSON files (products/cv/templates/*.json) into the cv_templates database table.
Required for CV creation - the cvs table has a foreign key to cv_templates(id).

Run from ithras root:
  docker compose exec backend python /products/profiles/cv/backend/scripts/seed_json_templates.py
  # or locally:
  cd core/backend && python -m scripts.run_from_path /products/profiles/cv/backend/scripts/seed_json_templates.py
"""
import sys
import os
import json
import glob

# Resolve paths for both docker and local
_script_dir = os.path.dirname(os.path.abspath(__file__))
_products_cv = os.path.normpath(os.path.join(_script_dir, "../.."))
_core_backend = os.path.normpath(os.path.join(_script_dir, "../../../../../../core/backend"))

if _core_backend not in sys.path:
    sys.path.insert(0, _core_backend)

from sqlalchemy import text
from app.modules.shared.database import engine
from app.modules.shared.cv_template_utils import upsert_cv_template

TEMPLATES_DIR = os.path.join(_products_cv, "templates")


def load_json_templates():
    """Load all *.json from products/cv/templates/"""
    templates = []
    pattern = os.path.join(TEMPLATES_DIR, "*.json")
    for path in sorted(glob.glob(pattern)):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, dict) and data.get("id"):
                templates.append(data)
        except Exception as e:
            print(f"Warning: Could not load {path}: {e}")
    return templates


def seed_templates():
    templates = load_json_templates()
    if not templates:
        print(f"No templates found in {TEMPLATES_DIR}")
        return 0

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            # Fallback institution if template has none (for NOT NULL constraint)
            fallback_inst = None
            try:
                r = conn.execute(text("SELECT id FROM institutions LIMIT 1"))
                row = r.fetchone()
                fallback_inst = row[0] if row else None
            except Exception:
                pass

            count = 0
            for t in templates:
                t_id = t["id"]
                t_name = t.get("name", t_id)
                t_institution = t.get("institution_id") or fallback_inst
                t_status = t.get("status", "PUBLISHED")
                t_config = json.dumps(t.get("config", {})) if isinstance(t.get("config"), dict) else "{}"

                if upsert_cv_template(conn, t_id, t_name, t_institution, t_status, t_config):
                    count += 1
                    print(f"Synced template: {t_name} ({t_id})")
                else:
                    print(f"Template already exists: {t_id}")
            trans.commit()
            return count
        except Exception as e:
            trans.rollback()
            print(f"Error: {e}")
            raise


if __name__ == "__main__":
    n = seed_templates()
    print(f"Done. Synced {n} template(s).")
