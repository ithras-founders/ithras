"""Institution Admin Board: extended profile, departments, degrees_v2, majors_v2, admins, activity log.

Revision ID: 005_institution_admin_board
Revises: 004_institutional_management
Create Date: 2025-03

"""
import json
from alembic import op
from sqlalchemy import text


revision = "005_institution_admin_board"
down_revision = "004_institutional_management"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Extend institutions table ───────────────────────────────────────────
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS short_name VARCHAR(128)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS institution_type VARCHAR(64)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS founded_year INTEGER")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS country VARCHAR(64)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS state VARCHAR(128)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS city VARCHAR(128)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS campus_type VARCHAR(64)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS cover_image_url VARCHAR(512)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS brand_colors_json TEXT")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(512)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(512)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(512)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS wikipedia_url VARCHAR(512)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS draft_json TEXT")

    # ─── institution_departments ─────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_departments (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            head_user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(institution_id, name)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_departments_inst ON institution_departments(institution_id)")

    # ─── institution_degrees_v2 (structured: level, duration, department) ─────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_degrees_v2 (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            level VARCHAR(64) DEFAULT 'Undergraduate',
            duration_years DECIMAL(3,1) DEFAULT 4,
            department_id INTEGER REFERENCES institution_departments(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_degrees_v2_inst ON institution_degrees_v2(institution_id)")

    # ─── institution_majors_v2 (structured: department, degree link, status) ──
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_majors_v2 (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            department_id INTEGER REFERENCES institution_departments(id) ON DELETE SET NULL,
            degree_id INTEGER REFERENCES institution_degrees_v2(id) ON DELETE SET NULL,
            status VARCHAR(32) NOT NULL DEFAULT 'active',
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_majors_v2_inst ON institution_majors_v2(institution_id)")

    # ─── institution_minors_v2 (department, linked_major) ──────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_minors_v2 (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            department_id INTEGER REFERENCES institution_departments(id) ON DELETE SET NULL,
            linked_major_id INTEGER REFERENCES institution_majors_v2(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_minors_v2_inst ON institution_minors_v2(institution_id)")

    # ─── institution_admins ──────────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_admins (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            user_id INTEGER NOT NULL REFERENCES users(user_numerical) ON DELETE CASCADE,
            role VARCHAR(32) NOT NULL DEFAULT 'admin',
            added_by_user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(institution_id, user_id)
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_admins_inst ON institution_admins(institution_id)")

    # ─── institution_activity_log ────────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_activity_log (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(user_numerical) ON DELETE SET NULL,
            action VARCHAR(128) NOT NULL,
            details_json TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        )
    """)
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_activity_log_inst ON institution_activity_log(institution_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_activity_log_created ON institution_activity_log(created_at DESC)")

    # ─── Bootstrap degrees_v2 from institution_degrees ─────────────────────────
    conn = op.get_bind()
    r = conn.execute(text("SELECT id, institution_id, degree FROM institution_degrees ORDER BY institution_id, degree"))
    for row in r.fetchall():
        conn.execute(
            text("""
                INSERT INTO institution_degrees_v2 (institution_id, name, level, duration_years)
                VALUES (:iid, :n, 'Undergraduate', 4)
            """),
            {"iid": row.institution_id, "n": (row.degree or "").strip()},
        )

    # ─── Bootstrap majors_v2 from institution_majors ──────────────────────────
    r2 = conn.execute(text("SELECT id, institution_id, major FROM institution_majors ORDER BY institution_id, major"))
    for row in r2.fetchall():
        conn.execute(
            text("""
                INSERT INTO institution_majors_v2 (institution_id, name, status)
                VALUES (:iid, :n, 'active')
            """),
            {"iid": row.institution_id, "n": (row.major or "").strip()},
        )

    # ─── Bootstrap minors_v2 from institution_minors ───────────────────────────
    r3 = conn.execute(text("SELECT id, institution_id, minor FROM institution_minors ORDER BY institution_id, minor"))
    for row in r3.fetchall():
        conn.execute(
            text("""
                INSERT INTO institution_minors_v2 (institution_id, name)
                VALUES (:iid, :n)
            """),
            {"iid": row.institution_id, "n": (row.minor or "").strip()},
        )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS institution_activity_log CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_admins CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_minors_v2 CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_majors_v2 CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_degrees_v2 CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_departments CASCADE")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS draft_json")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS is_public")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS wikipedia_url")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS facebook_url")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS twitter_url")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS linkedin_url")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS brand_colors_json")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS cover_image_url")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS campus_type")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS city")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS state")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS country")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS founded_year")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS institution_type")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS short_name")
