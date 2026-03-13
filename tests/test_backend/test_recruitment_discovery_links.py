import datetime
import importlib.util
from pathlib import Path

from sqlalchemy import text


_DISCOVERY_PATH = Path("products/recruitment-lateral/backend/app/modules/recruitment/routers/discovery.py")
_spec = importlib.util.spec_from_file_location("recruitment_discovery", _DISCOVERY_PATH)
_discovery = importlib.util.module_from_spec(_spec)
assert _spec is not None and _spec.loader is not None
_spec.loader.exec_module(_discovery)


def _ensure_ref_data(db_session):
    db_session.execute(text("INSERT INTO institutions (id, name) VALUES ('inst_a', 'Inst A') ON CONFLICT (id) DO NOTHING"))
    db_session.execute(text("INSERT INTO institutions (id, name) VALUES ('inst_b', 'Inst B') ON CONFLICT (id) DO NOTHING"))
    db_session.execute(
        text("INSERT INTO programs (id, institution_id, name) VALUES ('prog_a', 'inst_a', 'Prog A') ON CONFLICT (id) DO NOTHING")
    )
    db_session.execute(
        text("INSERT INTO programs (id, institution_id, name) VALUES ('prog_b', 'inst_b', 'Prog B') ON CONFLICT (id) DO NOTHING")
    )
    db_session.execute(text("INSERT INTO companies (id, name, status) VALUES ('comp_a', 'Comp A', 'VERIFIED') ON CONFLICT (id) DO NOTHING"))
    db_session.execute(text("INSERT INTO companies (id, name, status) VALUES ('comp_b', 'Comp B', 'VERIFIED') ON CONFLICT (id) DO NOTHING"))
    for role_id in ("CANDIDATE", "ALUMNI", "PROFESSIONAL", "RECRUITER", "SYSTEM_ADMIN"):
        db_session.execute(
            text(
                """
                INSERT INTO roles (id, name, type, is_system)
                VALUES (:id, :name, 'PREDEFINED', true)
                ON CONFLICT (id) DO NOTHING
                """
            ),
            {"id": role_id, "name": role_id.title()},
        )


def _insert_user(db_session, user_id: str, role: str = "CANDIDATE"):
    db_session.execute(
        text(
            """
            INSERT INTO users (id, email, name, role, is_active, is_verified, email_hidden)
            VALUES (:id, :email, :name, :role, true, true, false)
            """
        ),
        {"id": user_id, "email": f"{user_id}@test.local", "name": user_id, "role": role},
    )


def _run_candidate_query(db_session, profile: dict, role: str | None = None):
    conditions, params = _discovery._apply_criteria_to_query(db_session, None, profile)
    sql = f"SELECT u.id FROM users u WHERE {conditions}"
    if role:
        sql += """
            AND (
                EXISTS (
                    SELECT 1 FROM individual_institution_links iil_role_filter
                    WHERE iil_role_filter.user_id = u.id
                      AND (iil_role_filter.end_date IS NULL OR iil_role_filter.end_date >= CURRENT_TIMESTAMP)
                      AND iil_role_filter.role_id = :role
                ) OR EXISTS (
                    SELECT 1 FROM individual_organization_links iol_role_filter
                    WHERE iol_role_filter.user_id = u.id
                      AND (iol_role_filter.end_date IS NULL OR iol_role_filter.end_date >= CURRENT_TIMESTAMP)
                      AND iol_role_filter.role_id = :role
                )
            )
        """
        params["role"] = role
    rows = db_session.execute(text(sql), params).fetchall()
    return {r[0] for r in rows}


def test_discovery_uses_active_link_context_for_alumni_and_current_profiles(db_session):
    _ensure_ref_data(db_session)
    _insert_user(db_session, "u_active_and_alumni")

    now = datetime.datetime.utcnow()
    db_session.execute(
        text(
            """
            INSERT INTO individual_institution_links
            (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
            VALUES
            ('link_alumni', 'u_active_and_alumni', 'inst_b', 'prog_b', 'ALUMNI', :past_start, :past_end, :past_start),
            ('link_current', 'u_active_and_alumni', 'inst_a', 'prog_a', 'CANDIDATE', :current_start, NULL, :current_start)
            """
        ),
        {
            "past_start": now - datetime.timedelta(days=700),
            "past_end": now - datetime.timedelta(days=365),
            "current_start": now - datetime.timedelta(days=120),
        },
    )

    ids = _run_candidate_query(db_session, {"institution_ids": ["inst_a"], "program_ids": ["prog_a"]}, role="CANDIDATE")
    assert "u_active_and_alumni" in ids

    alumni_ids = _run_candidate_query(db_session, {"institution_ids": ["inst_b"]}, role="ALUMNI")
    assert "u_active_and_alumni" not in alumni_ids


def test_discovery_supports_multiple_active_institution_and_company_links(db_session):
    _ensure_ref_data(db_session)
    _insert_user(db_session, "u_multi_links")

    now = datetime.datetime.utcnow()
    db_session.execute(
        text(
            """
            INSERT INTO individual_institution_links
            (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
            VALUES
            ('link_inst_a', 'u_multi_links', 'inst_a', 'prog_a', 'CANDIDATE', :start_a, NULL, :start_a),
            ('link_inst_b', 'u_multi_links', 'inst_b', 'prog_b', 'CANDIDATE', :start_b, NULL, :start_b)
            """
        ),
        {"start_a": now - datetime.timedelta(days=100), "start_b": now - datetime.timedelta(days=60)},
    )
    db_session.execute(
        text(
            """
            INSERT INTO individual_organization_links
            (id, user_id, company_id, business_unit_id, role_id, start_date, end_date, created_at)
            VALUES
            ('link_comp_a', 'u_multi_links', 'comp_a', NULL, 'PROFESSIONAL', :org_start_a, NULL, :org_start_a),
            ('link_comp_b', 'u_multi_links', 'comp_b', NULL, 'PROFESSIONAL', :org_start_b, NULL, :org_start_b)
            """
        ),
        {"org_start_a": now - datetime.timedelta(days=150), "org_start_b": now - datetime.timedelta(days=90)},
    )

    inst_a_ids = _run_candidate_query(db_session, {"institution_ids": ["inst_a"]})
    inst_b_ids = _run_candidate_query(db_session, {"institution_ids": ["inst_b"]})
    experienced_ids = _run_candidate_query(db_session, {"experience_years_min": 2}, role="PROFESSIONAL")

    assert "u_multi_links" in inst_a_ids
    assert "u_multi_links" in inst_b_ids
    assert "u_multi_links" in experienced_ids


def test_discovery_results_change_when_active_links_expire(db_session):
    _ensure_ref_data(db_session)
    _insert_user(db_session, "u_expiring_link")

    now = datetime.datetime.utcnow()
    db_session.execute(
        text(
            """
            INSERT INTO individual_institution_links
            (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
            VALUES ('link_expiring', 'u_expiring_link', 'inst_a', 'prog_a', 'CANDIDATE', :start, :active_end, :start)
            """
        ),
        {"start": now - datetime.timedelta(days=30), "active_end": now + datetime.timedelta(days=1)},
    )

    before_expiry = _run_candidate_query(db_session, {"institution_ids": ["inst_a"]}, role="CANDIDATE")
    assert "u_expiring_link" in before_expiry

    db_session.execute(
        text("UPDATE individual_institution_links SET end_date = :expired_end WHERE id = 'link_expiring'"),
        {"expired_end": now - datetime.timedelta(days=1)},
    )

    after_expiry = _run_candidate_query(db_session, {"institution_ids": ["inst_a"]}, role="CANDIDATE")
    assert "u_expiring_link" not in after_expiry
