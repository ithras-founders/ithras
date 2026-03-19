"""Messaging system: conversations, messages, message_requests.

Revision ID: 009_messaging_system
Revises: 008_network_system
Create Date: 2025-03-13

"""
from alembic import op

revision = "009_messaging_system"
down_revision = "008_network_system"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── conversations: direct (1:1) or group ─────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS conversations (
            id SERIAL PRIMARY KEY,
            type VARCHAR(16) NOT NULL DEFAULT 'direct',
            title VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            last_message_at TIMESTAMP,
            is_archived BOOLEAN DEFAULT false,
            is_muted BOOLEAN DEFAULT false,
            CHECK (type IN ('direct', 'group'))
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST)")

    # ─── conversation_participants ────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS conversation_participants (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            role VARCHAR(32) DEFAULT 'member',
            joined_at TIMESTAMP DEFAULT NOW(),
            last_read_at TIMESTAMP,
            UNIQUE(conversation_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id)")

    # ─── messages ────────────────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
            sender_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            content TEXT NOT NULL,
            content_type VARCHAR(32) DEFAULT 'richtext',
            status VARCHAR(32) DEFAULT 'sent',
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW(),
            is_edited BOOLEAN DEFAULT false,
            CHECK (content_type IN ('plain', 'richtext')),
            CHECK (status IN ('sent', 'delivered', 'read'))
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(conversation_id, created_at DESC)")

    # ─── message_attachments ──────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS message_attachments (
            id SERIAL PRIMARY KEY,
            message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
            file_url VARCHAR(512),
            file_name VARCHAR(255),
            file_type VARCHAR(64),
            file_size INTEGER,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id)")

    # ─── message_requests: pending inbound before active conversation ──────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS message_requests (
            id SERIAL PRIMARY KEY,
            sender_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            recipient_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,
            preview_content TEXT,
            status VARCHAR(32) NOT NULL DEFAULT 'pending',
            relationship_type VARCHAR(64),
            overlap_context JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            resolved_at TIMESTAMP,
            UNIQUE(sender_id, recipient_id),
            CHECK (sender_id != recipient_id),
            CHECK (status IN ('pending', 'accepted', 'ignored', 'archived', 'blocked'))
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_message_requests_recipient ON message_requests(recipient_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_message_requests_status ON message_requests(recipient_id, status)")

    # ─── message_drafts: optional persistence ──────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS message_drafts (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
            recipient_id INTEGER REFERENCES users(user_numerical) ON DELETE CASCADE,
            content TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_message_drafts_user ON message_drafts(user_id)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS message_drafts CASCADE")
    op.execute("DROP TABLE IF EXISTS message_requests CASCADE")
    op.execute("DROP TABLE IF EXISTS message_attachments CASCADE")
    op.execute("DROP TABLE IF EXISTS messages CASCADE")
    op.execute("DROP TABLE IF EXISTS conversation_participants CASCADE")
    op.execute("DROP TABLE IF EXISTS conversations CASCADE")
