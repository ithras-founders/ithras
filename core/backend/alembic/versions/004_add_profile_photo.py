"""Add profile_photo_url to users table.

Revision ID: 004
Revises: 003
Create Date: 2026-03-02
"""
from alembic import op
import sqlalchemy as sa


revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = [col['name'] for col in inspector.get_columns('users')]
    if 'profile_photo_url' not in columns:
        op.add_column('users', sa.Column('profile_photo_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'profile_photo_url')
