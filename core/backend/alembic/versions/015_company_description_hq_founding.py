"""Add description, headquarters, founding_year to companies.

Revision ID: 015
Revises: 014
Create Date: 2026-03-03

"""
from alembic import op
import sqlalchemy as sa


revision = "015"
down_revision = "014"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    cols = [c["name"] for c in inspector.get_columns("companies")]
    if "description" not in cols:
        op.add_column("companies", sa.Column("description", sa.Text(), nullable=True))
    if "headquarters" not in cols:
        op.add_column("companies", sa.Column("headquarters", sa.String(), nullable=True))
    if "founding_year" not in cols:
        op.add_column("companies", sa.Column("founding_year", sa.Integer(), nullable=True))


def downgrade():
    op.drop_column("companies", "description")
    op.drop_column("companies", "headquarters")
    op.drop_column("companies", "founding_year")
