"""Add offers table for offer lifecycle management.

Revision ID: 011
Revises: 010
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "offers" not in tables:
        op.create_table(
            "offers",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("application_id", sa.String(), nullable=False, index=True),
            sa.Column("candidate_id", sa.String(), nullable=False, index=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("job_id", sa.String(), nullable=False, index=True),
            sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
            sa.Column("ctc", sa.Float(), nullable=True),
            sa.Column("deadline", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("responded_at", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["candidate_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        )
    indexes = [idx["name"] for idx in inspector.get_indexes("offers")] if "offers" in tables else []
    if "offers" in tables and "ix_offers_status" not in indexes:
        op.create_index("ix_offers_status", "offers", ["status"])


def downgrade():
    op.drop_index("ix_offers_candidate_id", table_name="offers")
    op.drop_index("ix_offers_status", table_name="offers")
    op.drop_table("offers")
