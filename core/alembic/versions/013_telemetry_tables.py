"""Telemetry tables: events, API request log, errors.

Revision ID: 013_telemetry_tables
Revises: 012_community_gen_channel_sync
Create Date: 2025-03-13

"""
from alembic import op

revision = "013_telemetry_tables"
down_revision = "012_community_gen_channel_sync"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # telemetry_events: unified event store for audit, user activity, auth, etc.
    op.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_events (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            domain VARCHAR(32) NOT NULL,
            subdomain VARCHAR(32),
            event_type VARCHAR(64) NOT NULL,
            action VARCHAR(64),
            actor_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            actor_type VARCHAR(32),
            entity_type VARCHAR(64),
            entity_id VARCHAR(128),
            status VARCHAR(16),
            severity VARCHAR(16),
            request_id VARCHAR(64),
            trace_id VARCHAR(64),
            session_id VARCHAR(64),
            correlation_id VARCHAR(64),
            metadata_json JSONB,
            error_code VARCHAR(64),
            error_message TEXT,
            duration_ms INTEGER,
            summary TEXT
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_events_domain ON telemetry_events(domain)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_events_created ON telemetry_events(created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_events_actor ON telemetry_events(actor_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_events_entity ON telemetry_events(entity_type, entity_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_events_request_id ON telemetry_events(request_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_events_trace_id ON telemetry_events(trace_id)")

    # api_request_log: middleware-captured API requests
    op.execute("""
        CREATE TABLE IF NOT EXISTS api_request_log (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            method VARCHAR(8) NOT NULL,
            path VARCHAR(512) NOT NULL,
            status_code INTEGER,
            latency_ms INTEGER,
            user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            request_id VARCHAR(64)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_api_request_log_created ON api_request_log(created_at DESC)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_api_request_log_path_method ON api_request_log(path, method)")

    # telemetry_errors: 5xx and uncaught exceptions
    op.execute("""
        CREATE TABLE IF NOT EXISTS telemetry_errors (
            id SERIAL PRIMARY KEY,
            created_at TIMESTAMP DEFAULT NOW(),
            message TEXT,
            stack_trace TEXT,
            path VARCHAR(512),
            request_id VARCHAR(64),
            metadata_json JSONB
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_errors_created ON telemetry_errors(created_at DESC)")


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS telemetry_errors CASCADE")
    op.execute("DROP TABLE IF EXISTS api_request_log CASCADE")
    op.execute("DROP TABLE IF EXISTS telemetry_events CASCADE")
