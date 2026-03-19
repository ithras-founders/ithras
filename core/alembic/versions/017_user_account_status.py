"""Add account_status to users for admin approval flow.

Revision ID: 017_user_account_status
Revises: 016_user_notifications
Create Date: 2025-03-19

"""
from alembic import op

revision = "017_user_account_status"
down_revision = "016_user_notifications"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    """)
    op.execute("""
        UPDATE users
        SET account_status = 'approved'
        WHERE account_status = 'pending'
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS account_status")
