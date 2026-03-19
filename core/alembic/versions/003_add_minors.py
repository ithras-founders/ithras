"""Add minors_json to education_entries.

Revision ID: 003_add_minors
Revises: 002_professional_network
Create Date: 2025-03

"""
from alembic import op

revision = "003_add_minors"
down_revision = "002_professional_network"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE education_entries ADD COLUMN IF NOT EXISTS minors_json TEXT DEFAULT '[]'")


def downgrade() -> None:
    op.execute("ALTER TABLE education_entries DROP COLUMN IF EXISTS minors_json")
