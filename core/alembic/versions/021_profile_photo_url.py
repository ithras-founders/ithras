"""Add users.profile_photo_url for avatar uploads.

Revision ID: 021_profile_photo_url
Revises: 020_channel_requests
Create Date: 2026-03-21

"""
import sqlalchemy as sa
from alembic import op

revision = "021_profile_photo_url"
down_revision = "020_channel_requests"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("profile_photo_url", sa.String(512), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "profile_photo_url")
