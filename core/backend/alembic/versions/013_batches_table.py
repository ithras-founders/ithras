"""Add batches table for cohort management.

Revision ID: 013
Revises: 012
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "013"
down_revision = "012"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()
    if "batches" not in tables:
        op.create_table(
            "batches",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("program_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("year", sa.Integer(), nullable=True),
            sa.Column("start_date", sa.DateTime(), nullable=True),
            sa.Column("end_date", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["program_id"], ["programs.id"], ondelete="CASCADE"),
        )
        op.create_index("ix_batches_program_id", "batches", ["program_id"])


def downgrade():
    op.drop_index("ix_batches_program_id", table_name="batches")
    op.drop_table("batches")
