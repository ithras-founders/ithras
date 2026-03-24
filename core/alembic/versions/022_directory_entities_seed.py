"""Data migration: seed public directory (Fortune 500, India companies, institutions).

Revision ID: 022_directory_entities_seed
Revises: 021_profile_photo_url
Create Date: 2026-03-21

"""
import logging

revision = "022_directory_entities_seed"
down_revision = "021_profile_photo_url"
branch_labels = None
depends_on = None

logger = logging.getLogger("alembic.runtime.migration")


def upgrade() -> None:
    try:
        from core.setup.backend.seed_directory_entities import seed_directory

        counts = seed_directory()
        logger.info(
            "022_directory_entities_seed: institutions=%s organisations=%s degree_rows=%s combo_rows=%s",
            counts.get("institutions"),
            counts.get("organisations"),
            counts.get("degree_rows"),
            counts.get("combo_rows"),
        )
    except Exception:
        logger.exception("022_directory_entities_seed failed")
        raise


def downgrade() -> None:
    # Seeded rows are not removed: education_entries / experience_groups may reference them.
    pass
