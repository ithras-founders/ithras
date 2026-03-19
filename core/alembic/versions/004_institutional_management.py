"""Institutional management: logo, description, website, allowed lists, placeholder support.

Revision ID: 004_institutional_management
Revises: 003_add_minors
Create Date: 2025-03

"""
import json
from alembic import op
from sqlalchemy import text


revision = "004_institutional_management"
down_revision = "003_add_minors"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ─── Institutions: add logo, description, website ─────────────────────────
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512)")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS description TEXT")
    op.execute("ALTER TABLE institutions ADD COLUMN IF NOT EXISTS website VARCHAR(255)")

    # ─── Organisations: add logo, description, website ─────────────────────────
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS logo_url VARCHAR(512)")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS description TEXT")
    op.execute("ALTER TABLE organisations ADD COLUMN IF NOT EXISTS website VARCHAR(255)")

    # ─── Institution allowed lists ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_degrees (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            degree VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(institution_id, degree)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_majors (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            major VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(institution_id, major)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS institution_minors (
            id SERIAL PRIMARY KEY,
            institution_id INTEGER NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
            minor VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(institution_id, minor)
        )
    """)

    # ─── Organisation allowed lists ───────────────────────────────────────────
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_business_units (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(organisation_id, name)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_functions (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(organisation_id, name)
        )
    """)
    op.execute("""
        CREATE TABLE IF NOT EXISTS organisation_titles (
            id SERIAL PRIMARY KEY,
            organisation_id INTEGER NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
            title VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(organisation_id, title)
        )
    """)

    # Indexes for lookups
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_degrees_inst ON institution_degrees(institution_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_majors_inst ON institution_majors(institution_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_institution_minors_inst ON institution_minors(institution_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_org_business_units_org ON organisation_business_units(organisation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_org_functions_org ON organisation_functions(organisation_id)")
    op.execute("CREATE INDEX IF NOT EXISTS idx_org_titles_org ON organisation_titles(organisation_id)")

    # ─── Bootstrap allowed lists from existing data ────────────────────────────
    # Use raw connection for bootstrap logic
    conn = op.get_bind()

    # Institution degrees, majors from institution_degree_majors
    r = conn.execute(text("""
        SELECT institution_id, degree, majors_json
        FROM institution_degree_majors
        WHERE status = 'listed'
    """))
    for row in r.fetchall():
        inst_id = row.institution_id
        degree = (row.degree or "").strip()
        majors = []
        try:
            majors = json.loads(row.majors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        if degree:
            conn.execute(
                text("""
                    INSERT INTO institution_degrees (institution_id, degree)
                    VALUES (:iid, :deg)
                    ON CONFLICT (institution_id, degree) DO NOTHING
                """),
                {"iid": inst_id, "deg": degree},
            )
        for m in majors:
            m = (m or "").strip()
            if m:
                conn.execute(
                    text("""
                        INSERT INTO institution_majors (institution_id, major)
                        VALUES (:iid, :m)
                        ON CONFLICT (institution_id, major) DO NOTHING
                    """),
                    {"iid": inst_id, "m": m},
                )

    # Institution minors from education_entries
    r2 = conn.execute(text("""
        SELECT institution_id, minors_json
        FROM education_entries
        WHERE institution_id IS NOT NULL
    """))
    for row in r2.fetchall():
        inst_id = row.institution_id
        if not inst_id:
            continue
        minors = []
        try:
            minors = json.loads(row.minors_json or "[]")
        except (json.JSONDecodeError, TypeError):
            pass
        for m in minors:
            m = (m or "").strip()
            if m:
                conn.execute(
                    text("""
                        INSERT INTO institution_minors (institution_id, minor)
                        VALUES (:iid, :m)
                        ON CONFLICT (institution_id, minor) DO NOTHING
                    """),
                    {"iid": inst_id, "m": m},
                )

    # Organisation BU, function, title from organisation_combos
    r3 = conn.execute(text("""
        SELECT organisation_id, business_unit, function, title
        FROM organisation_combos
        WHERE status = 'listed'
    """))
    for row in r3.fetchall():
        org_id = row.organisation_id
        bu = (row.business_unit or "").strip()
        fn = (row.function or "").strip()
        ttl = (row.title or "").strip()
        if bu:
            conn.execute(
                text("""
                    INSERT INTO organisation_business_units (organisation_id, name)
                    VALUES (:oid, :n)
                    ON CONFLICT (organisation_id, name) DO NOTHING
                """),
                {"oid": org_id, "n": bu},
            )
        if fn:
            conn.execute(
                text("""
                    INSERT INTO organisation_functions (organisation_id, name)
                    VALUES (:oid, :n)
                    ON CONFLICT (organisation_id, name) DO NOTHING
                """),
                {"oid": org_id, "n": fn},
            )
        if ttl:
            conn.execute(
                text("""
                    INSERT INTO organisation_titles (organisation_id, title)
                    VALUES (:oid, :n)
                    ON CONFLICT (organisation_id, title) DO NOTHING
                """),
                {"oid": org_id, "n": ttl},
            )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS organisation_titles CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_functions CASCADE")
    op.execute("DROP TABLE IF EXISTS organisation_business_units CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_minors CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_majors CASCADE")
    op.execute("DROP TABLE IF EXISTS institution_degrees CASCADE")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS logo_url")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS description")
    op.execute("ALTER TABLE organisations DROP COLUMN IF EXISTS website")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS logo_url")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS description")
    op.execute("ALTER TABLE institutions DROP COLUMN IF EXISTS website")
