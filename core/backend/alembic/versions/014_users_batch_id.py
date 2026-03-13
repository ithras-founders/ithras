"""Add batch_id to users for cohort linkage.

Revision ID: 014
Revises: 013
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "014"
down_revision = "013"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("users")]
    if "batch_id" not in cols:
        op.add_column("users", sa.Column("batch_id", sa.String(), nullable=True))
        op.create_foreign_key("fk_users_batch", "users", "batches", ["batch_id"], ["id"], ondelete="SET NULL")
        op.create_index("ix_users_batch_id", "users", ["batch_id"])


def downgrade():
    op.drop_index("ix_users_batch_id", table_name="users")
    op.drop_constraint("fk_users_batch", "users", type_="foreignkey")
    op.drop_column("users", "batch_id")
