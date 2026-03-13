"""Add password_hash to users table.

Revision ID: 002
Revises: 001
Create Date: 2025-02-28

"""
from alembic import op
from sqlalchemy import Column, String, inspect

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "password_hash" not in cols:
        op.add_column("users", Column("password_hash", String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "password_hash")
