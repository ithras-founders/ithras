"""Add logo_url to institutions.

Revision ID: 007
Revises: 006
Create Date: 2025-03-03

"""
from alembic import op
from sqlalchemy import inspect
import sqlalchemy as sa

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    insp = inspect(conn)
    cols = [c["name"] for c in insp.get_columns("institutions")]
    if "logo_url" not in cols:
        op.add_column("institutions", sa.Column("logo_url", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("institutions", "logo_url")
