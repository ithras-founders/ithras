#!/usr/bin/env python3
"""
Migration script to add college_slug column to cv_templates.
Enables filtering templates by college (e.g. GET /api/v1/cv-templates?college=iim-calcutta).

How to run (choose one):
  1. Via Docker (recommended if using docker-compose):
     docker compose exec backend python /products/profiles/cv/backend/scripts/add_college_slug_to_cv_templates.py

  2. With project venv (install deps first: pip install -r core/backend/requirements.txt):
     cd ithras && source venv/bin/activate  # or your venv
     python products/cv/backend/scripts/add_college_slug_to_cv_templates.py
"""

import sys
import os

# Add paths so app.database can be imported (core backend)
_script_dir = os.path.dirname(os.path.abspath(__file__))
_cv_backend = os.path.dirname(os.path.dirname(_script_dir))
_ithras_root = os.path.dirname(os.path.dirname(os.path.dirname(_script_dir)))
_core_backend = os.path.join(_ithras_root, "core", "backend")
for p in (_cv_backend, _core_backend, "/app"):
    if p and os.path.isdir(p) and p not in sys.path:
        sys.path.insert(0, p)

try:
    from sqlalchemy import create_engine, text
except ImportError:
    print(
        "ModuleNotFoundError: sqlalchemy not installed.\n"
        "Run with the project venv or Docker:\n"
        "  docker compose exec backend python /products/profiles/cv/backend/scripts/add_college_slug_to_cv_templates.py"
    )
    sys.exit(1)

try:
    from app.database import SQLALCHEMY_DATABASE_URL
except ImportError:
    SQLALCHEMY_DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://ithras_user:ithras_password@localhost:5432/placement_db",
    )


def run_migration():
    """Add college_slug column to cv_templates if it does not exist."""
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

    with engine.connect() as conn:
        trans = conn.begin()
        try:
            result = conn.execute(text("""
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = 'cv_templates' AND column_name = 'college_slug'
            """))
            if result.fetchone() is None:
                print("Adding college_slug column to cv_templates...")
                conn.execute(text("""
                    ALTER TABLE cv_templates
                    ADD COLUMN college_slug VARCHAR
                """))
                print("Created index on college_slug for faster lookups.")
                conn.execute(text("""
                    CREATE INDEX IF NOT EXISTS idx_cv_templates_college_slug
                    ON cv_templates (college_slug)
                """))
            else:
                print("college_slug column already exists in cv_templates")
            trans.commit()
            print("Migration completed successfully!")
        except Exception as e:
            trans.rollback()
            print(f"Migration failed: {e}")
            raise


if __name__ == "__main__":
    print("Starting college_slug migration...")
    run_migration()
    print("\nMigration script completed!")
