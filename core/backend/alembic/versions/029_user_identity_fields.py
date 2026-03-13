"""Add User identity fields: full_name, phone, is_active.

Revision ID: 029
Revises: 028
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "029"
down_revision = "028"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("users")]

    if "full_name" not in cols:
        op.add_column("users", sa.Column("full_name", sa.String(), nullable=True))
    if "phone" not in cols:
        op.add_column("users", sa.Column("phone", sa.String(), nullable=True))
    if "is_active" not in cols:
        op.add_column("users", sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"))


def downgrade():
    op.drop_column("users", "is_active")
    op.drop_column("users", "phone")
    op.drop_column("users", "full_name")
