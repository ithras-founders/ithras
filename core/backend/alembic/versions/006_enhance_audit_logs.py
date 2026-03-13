"""Enhance audit_logs table with entity tracking, scoping, and metadata columns.

Revision ID: 006
Revises: 005
Create Date: 2026-03-03
"""
from alembic import op
import sqlalchemy as sa


revision = "006"
down_revision = "005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    tables = inspector.get_table_names()

    if "audit_logs" not in tables:
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("timestamp", sa.DateTime(), server_default=sa.text("NOW()")),
            sa.Column("user_id", sa.String(), nullable=True),
            sa.Column("action", sa.String(), nullable=True),
            sa.Column("entity_type", sa.String(), nullable=True),
            sa.Column("entity_id", sa.String(), nullable=True),
            sa.Column("institution_id", sa.String(), nullable=True),
            sa.Column("company_id", sa.String(), nullable=True),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("metadata", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(), nullable=True),
        )
        op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
        op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
        op.create_index("ix_audit_logs_entity_type", "audit_logs", ["entity_type"])
        op.create_index("ix_audit_logs_institution_id", "audit_logs", ["institution_id"])
        op.create_index("ix_audit_logs_company_id", "audit_logs", ["company_id"])
        return

    existing_cols = [col["name"] for col in inspector.get_columns("audit_logs")]

    new_columns = [
        ("entity_type", sa.String(), True),
        ("entity_id", sa.String(), True),
        ("institution_id", sa.String(), True),
        ("company_id", sa.String(), True),
        ("metadata", sa.Text(), True),
        ("ip_address", sa.String(), True),
    ]

    for col_name, col_type, nullable in new_columns:
        if col_name not in existing_cols:
            op.add_column("audit_logs", sa.Column(col_name, col_type, nullable=nullable))

    if "details" in existing_cols:
        try:
            op.alter_column("audit_logs", "details", type_=sa.Text(), existing_type=sa.String())
        except Exception:
            pass

    existing_indexes = {idx["name"] for idx in inspector.get_indexes("audit_logs")}
    for idx_name, col_name in [
        ("ix_audit_logs_user_id", "user_id"),
        ("ix_audit_logs_action", "action"),
        ("ix_audit_logs_entity_type", "entity_type"),
        ("ix_audit_logs_institution_id", "institution_id"),
        ("ix_audit_logs_company_id", "company_id"),
    ]:
        if idx_name not in existing_indexes:
            op.create_index(idx_name, "audit_logs", [col_name])


def downgrade() -> None:
    for idx_name in [
        "ix_audit_logs_company_id",
        "ix_audit_logs_institution_id",
        "ix_audit_logs_entity_type",
        "ix_audit_logs_action",
        "ix_audit_logs_user_id",
    ]:
        try:
            op.drop_index(idx_name, table_name="audit_logs")
        except Exception:
            pass

    for col_name in ["entity_type", "entity_id", "institution_id", "company_id", "metadata", "ip_address"]:
        try:
            op.drop_column("audit_logs", col_name)
        except Exception:
            pass
