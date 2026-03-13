"""Add application_requests table.

Revision ID: 009
Revises: 008
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa


revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "application_requests" not in tables:
        op.create_table(
            "application_requests",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("workflow_id", sa.String(), nullable=False),
            sa.Column("company_id", sa.String(), nullable=False),
            sa.Column("institution_id", sa.String(), nullable=False),
            sa.Column("requested_by", sa.String(), nullable=False),
            sa.Column("request_type", sa.String(), nullable=False, server_default="OPEN_APPLICATIONS"),
            sa.Column("status", sa.String(), nullable=False, server_default="PENDING"),
            sa.Column("approved_by", sa.String(), nullable=True),
            sa.Column("approved_at", sa.DateTime(), nullable=True),
            sa.Column("rejection_reason", sa.String(), nullable=True),
            sa.Column("scheduled_open_at", sa.DateTime(), nullable=True),
            sa.Column("scheduled_close_at", sa.DateTime(), nullable=True),
            sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("NOW()")),
            sa.ForeignKeyConstraint(["workflow_id"], ["workflows.id"]),
            sa.ForeignKeyConstraint(["company_id"], ["companies.id"]),
            sa.ForeignKeyConstraint(["institution_id"], ["institutions.id"]),
            sa.ForeignKeyConstraint(["requested_by"], ["users.id"]),
            sa.ForeignKeyConstraint(["approved_by"], ["users.id"]),
        )
        op.create_index("ix_app_req_institution_id", "application_requests", ["institution_id"])
        op.create_index("ix_app_req_status", "application_requests", ["status"])
        op.create_index("ix_app_req_company_id", "application_requests", ["company_id"])


def downgrade():
    op.drop_index("ix_app_req_company_id", table_name="application_requests")
    op.drop_index("ix_app_req_status", table_name="application_requests")
    op.drop_index("ix_app_req_institution_id", table_name="application_requests")
    op.drop_table("application_requests")
