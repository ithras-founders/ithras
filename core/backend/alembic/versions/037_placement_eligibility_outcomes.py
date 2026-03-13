"""Add eligibility_rules, eligibility_override_requests, placement_outcomes tables.

Revision ID: 037
Revises: 036
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "037"
down_revision = "036"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "eligibility_rules" not in tables:
        op.create_table(
            "eligibility_rules",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("cycle_id", sa.String(), nullable=True, index=True),
            sa.Column("job_id", sa.String(), nullable=True, index=True),
            sa.Column("rule_type", sa.String(), nullable=False),
            sa.Column("value", sa.JSON(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["cycle_id"], ["cycles.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
        )

    if "eligibility_override_requests" not in tables:
        op.create_table(
            "eligibility_override_requests",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("student_id", sa.String(), nullable=False, index=True),
            sa.Column("job_id", sa.String(), nullable=True, index=True),
            sa.Column("cycle_id", sa.String(), nullable=True, index=True),
            sa.Column("requested_by", sa.String(), nullable=False),
            sa.Column("reason", sa.Text(), nullable=True),
            sa.Column("status", sa.String(), server_default="PENDING", nullable=False),
            sa.Column("decided_by", sa.String(), nullable=True),
            sa.Column("decided_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["cycle_id"], ["cycles.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["requested_by"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["decided_by"], ["users.id"], ondelete="SET NULL"),
        )

    if "placement_outcomes" not in tables:
        op.create_table(
            "placement_outcomes",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("student_id", sa.String(), nullable=False, index=True),
            sa.Column("offer_id", sa.String(), nullable=True, index=True),
            sa.Column("company_id", sa.String(), nullable=False, index=True),
            sa.Column("job_id", sa.String(), nullable=True, index=True),
            sa.Column("cycle_id", sa.String(), nullable=True, index=True),
            sa.Column("outcome_type", sa.String(), nullable=False),
            sa.Column("ctc", sa.Float(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=True),
            sa.ForeignKeyConstraint(["student_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["offer_id"], ["offers.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["job_id"], ["jobs.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["cycle_id"], ["cycles.id"], ondelete="SET NULL"),
        )


def downgrade():
    op.drop_table("placement_outcomes")
    op.drop_table("eligibility_override_requests")
    op.drop_table("eligibility_rules")
