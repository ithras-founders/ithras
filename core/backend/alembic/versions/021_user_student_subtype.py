"""Add student_subtype to users.

Revision ID: 021
Revises: 020
Create Date: 2026-03-08

"""
from alembic import op
import sqlalchemy as sa

revision = "021"
down_revision = "020"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("student_subtype", sa.String(), nullable=True))


def downgrade():
    op.drop_column("users", "student_subtype")
