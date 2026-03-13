"""Add recruiter_outreach table for HR Mode outreach/InMail.

Revision ID: 027
Revises: 026
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa


revision = "027"
down_revision = "026"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "recruiter_outreach" not in tables:
        op.create_table(
            "recruiter_outreach",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("recruiter_id", sa.String(), nullable=False, index=True),
            sa.Column("candidate_id", sa.String(), nullable=False, index=True),
            sa.Column("job_profile_id", sa.String(), nullable=True, index=True),
            sa.Column("message", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["recruiter_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["candidate_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_profile_id"], ["job_profiles.id"], ondelete="SET NULL"),
        )


def downgrade():
    op.drop_table("recruiter_outreach")
