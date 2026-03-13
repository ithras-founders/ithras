"""Add application_timeline_events and application_attachments tables.

Revision ID: 034
Revises: 033
Create Date: 2026-03-11

"""
from alembic import op
import sqlalchemy as sa


revision = "034"
down_revision = "033"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "application_timeline_events" not in tables:
        op.create_table(
            "application_timeline_events",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("application_id", sa.String(), nullable=False, index=True),
            sa.Column("event_type", sa.String(), nullable=False),
            sa.Column("payload", sa.JSON(), nullable=True),
            sa.Column("actor_id", sa.String(), nullable=True, index=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
            sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        )
        op.create_index("ix_app_timeline_events_created", "application_timeline_events", ["created_at"])

    if "application_attachments" not in tables:
        op.create_table(
            "application_attachments",
            sa.Column("id", sa.String(), primary_key=True),
            sa.Column("application_id", sa.String(), nullable=False, index=True),
            sa.Column("name", sa.String(), nullable=False),
            sa.Column("asset_type", sa.String(), nullable=False, server_default="document"),
            sa.Column("url", sa.String(), nullable=True),
            sa.Column("file_path", sa.String(), nullable=True),
            sa.Column("created_at", sa.DateTime(), server_default=sa.text("NOW()"), nullable=False),
            sa.ForeignKeyConstraint(["application_id"], ["applications.id"], ondelete="CASCADE"),
        )


def downgrade():
    op.drop_table("application_attachments")
    op.drop_index("ix_app_timeline_events_created", table_name="application_timeline_events")
    op.drop_table("application_timeline_events")
