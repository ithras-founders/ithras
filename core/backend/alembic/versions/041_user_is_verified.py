"""Add is_verified to users (placeholder for verification module).

Revision ID: 041
Revises: 040
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "041"
down_revision = "040"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "users" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("users")]
        if "is_verified" not in cols:
            op.add_column(
                "users",
                sa.Column("is_verified", sa.Boolean(), nullable=False, server_default="false"),
            )


def downgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    if "users" in inspector.get_table_names():
        cols = [c["name"] for c in inspector.get_columns("users")]
        if "is_verified" in cols:
            op.drop_column("users", "is_verified")
