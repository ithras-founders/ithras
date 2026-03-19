"""User notifications for connection requests and other in-app alerts.

Revision ID: 016_user_notifications
Revises: 015_telemetry_backfill
Create Date: 2025-03-19

"""
from alembic import op

revision = "016_user_notifications"
down_revision = "015_telemetry_backfill"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS user_notifications (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            type VARCHAR(64) NOT NULL,
            payload_json TEXT,
            read_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_notifications_user ON user_notifications(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_user_notifications_read ON user_notifications(user_id, read_at)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS user_notifications CASCADE")
