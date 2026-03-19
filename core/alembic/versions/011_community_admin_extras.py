"""Community admin extras: visibility, posting_permission, rules, activity log, etc.

Revision ID: 011_community_admin_extras
Revises: 010_profile_extras
Create Date: 2025-03-13

"""
from alembic import op

revision = "011_community_admin_extras"
down_revision = "010_profile_extras"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE communities ADD COLUMN IF NOT EXISTS visibility VARCHAR(32) DEFAULT 'public'")
    op.execute("ALTER TABLE communities ADD COLUMN IF NOT EXISTS discoverable BOOLEAN DEFAULT true")
    op.execute("ALTER TABLE communities ADD COLUMN IF NOT EXISTS join_approval_required BOOLEAN DEFAULT false")
    op.execute("ALTER TABLE communities ADD COLUMN IF NOT EXISTS posting_permission VARCHAR(32) DEFAULT 'members'")
    op.execute("ALTER TABLE communities ADD COLUMN IF NOT EXISTS rules TEXT")
    op.execute("ALTER TABLE community_requests ADD COLUMN IF NOT EXISTS target_audience TEXT")
    op.execute("""
        CREATE TABLE IF NOT EXISTS community_admin_actions (
            id SERIAL PRIMARY KEY,
            community_id INTEGER REFERENCES communities(id) ON DELETE SET NULL,
            admin_user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            action VARCHAR(64) NOT NULL,
            details_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_community_admin_actions_community ON community_admin_actions(community_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_community_admin_actions_admin ON community_admin_actions(admin_user_id)")
    op.execute("""
        CREATE TABLE IF NOT EXISTS channel_institution_major (
            channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
            institution_degree_majors_id INTEGER NOT NULL REFERENCES institution_degree_majors(id) ON DELETE CASCADE,
            PRIMARY KEY (channel_id, institution_degree_majors_id)
        )
    """)
    op.execute("ALTER TABLE posts ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false")
    op.execute("""
        CREATE TABLE IF NOT EXISTS community_member_bans (
            id SERIAL PRIMARY KEY,
            community_id INTEGER NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            banned_by INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(community_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_community_member_bans_community ON community_member_bans(community_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS community_member_bans CASCADE")
    op.execute("ALTER TABLE posts DROP COLUMN IF EXISTS is_locked")
    op.execute("DROP TABLE IF EXISTS channel_institution_major CASCADE")
    op.execute("DROP TABLE IF EXISTS community_admin_actions CASCADE")
    op.execute("ALTER TABLE community_requests DROP COLUMN IF EXISTS target_audience")
    op.execute("ALTER TABLE communities DROP COLUMN IF EXISTS visibility")
    op.execute("ALTER TABLE communities DROP COLUMN IF EXISTS discoverable")
    op.execute("ALTER TABLE communities DROP COLUMN IF EXISTS join_approval_required")
    op.execute("ALTER TABLE communities DROP COLUMN IF EXISTS posting_permission")
    op.execute("ALTER TABLE communities DROP COLUMN IF EXISTS rules")
