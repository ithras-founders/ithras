"""Profile extras: additional_responsibilities, other_achievements.

Revision ID: 010_profile_extras
Revises: 009_messaging_system
Create Date: 2025-03-13

"""
from alembic import op

revision = "010_profile_extras"
down_revision = "009_messaging_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        CREATE TABLE IF NOT EXISTS additional_responsibilities (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            organisation_name VARCHAR(255),
            description TEXT,
            start_month VARCHAR(7),
            end_month VARCHAR(7),
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_additional_responsibilities_user ON additional_responsibilities(user_id)")

    op.execute("""
        CREATE TABLE IF NOT EXISTS other_achievements (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            category VARCHAR(64) NOT NULL DEFAULT 'other',
            title VARCHAR(255) NOT NULL,
            description TEXT,
            sort_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            CHECK (category IN ('sports', 'dance', 'music', 'arts', 'other'))
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_other_achievements_user ON other_achievements(user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS other_achievements CASCADE")
    op.execute("DROP TABLE IF EXISTS additional_responsibilities CASCADE")
