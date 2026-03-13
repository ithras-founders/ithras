"""
Shared analytics table creation.

All analytics routers call ensure_analytics_tables() to create their required
tables idempotently.  This avoids duplicating CREATE TABLE statements across
dashboards, reports, and schedules routers.
"""
from sqlalchemy import text
from sqlalchemy.orm import Session


def ensure_analytics_tables(db: Session) -> None:
    """Create analytics_reports, analytics_dashboards, and analytics_schedules if missing."""
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS analytics_reports (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            query TEXT NOT NULL,
            params_json JSONB,
            chart_config_json JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS analytics_dashboards (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            layout_json JSONB NOT NULL DEFAULT '{"widgets":[]}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    db.execute(text("""
        CREATE TABLE IF NOT EXISTS analytics_schedules (
            id SERIAL PRIMARY KEY,
            report_id INTEGER REFERENCES analytics_reports(id) ON DELETE CASCADE,
            cron_expr VARCHAR(127),
            recipients_json JSONB,
            enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """))
    db.commit()
