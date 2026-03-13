"""
Centralized setup steps for idempotent seed data.
Schema migrations are handled at container startup.
"""
import json
from sqlalchemy import text

from app.config import settings
from app.constants import (
    DEFAULT_INSTITUTION_ID,
    DEFAULT_COMPANY_ID,
    DEFAULT_PROGRAM_ID,
    DEFAULT_BATCH_ID,
    DEFAULT_CYCLE_ID,
    DEMO_USERS,
    DEMO_USER_IDS,
    FOUNDER_EMAIL,
    FOUNDER_USER_ID,
    SHASHANK_USER_ID,
)
from app.modules.shared.password import hash_password


def _get_demo_password() -> str:
    """Use DEMO_PASSWORD from settings so setup and auth stay in sync."""
    return settings.DEMO_PASSWORD or "password"


def _step_seed_institutions(engine):
    def check(conn):
        r = conn.execute(text("SELECT 1 FROM institutions WHERE id = :id"), {"id": DEFAULT_INSTITUTION_ID})
        return r.fetchone() is not None

    def apply(conn):
        default_roles = '["CANDIDATE","PLACEMENT_TEAM","PLACEMENT_ADMIN","INSTITUTION_ADMIN","FACULTY_OBSERVER","ALUMNI"]'
        institutions = [
            {"id": "inst1", "name": "IIM Calcutta", "tier": "Tier 1", "location": "Kolkata"},
            {"id": "inst2", "name": "IIM Ahmedabad", "tier": "Tier 1", "location": "Ahmedabad"},
            {"id": "lateral", "name": "Lateral Hiring", "tier": "Lateral", "location": "Global"},
        ]
        dialect = getattr(conn.dialect, "name", "postgresql") if hasattr(conn, "dialect") else "postgresql"
        for inst in institutions:
            r = conn.execute(text("SELECT 1 FROM institutions WHERE id = :id"), {"id": inst["id"]})
            if r.fetchone() is None:
                if dialect == "postgresql":
                    conn.execute(text("""
                        INSERT INTO institutions (id, name, tier, location, allowed_roles, created_at, updated_at)
                        VALUES (:id, :name, :tier, :location, CAST(:allowed_roles AS jsonb), NOW(), NOW())
                    """), {**inst, "allowed_roles": default_roles})
                else:
                    conn.execute(text("""
                        INSERT INTO institutions (id, name, tier, location, allowed_roles, created_at, updated_at)
                        VALUES (:id, :name, :tier, :location, :allowed_roles, NOW(), NOW())
                    """), {**inst, "allowed_roles": default_roles})
        conn.commit()

    return check, apply


def _step_seed_subscription_metadata(engine):
    """Set onboarding_status and features on institutions, onboarding_status on companies (migration 039)."""

    def check(conn):
        try:
            r = conn.execute(text("SELECT 1 FROM institutions WHERE features IS NOT NULL AND features != '[]'::jsonb LIMIT 1"))
            return r.fetchone() is not None
        except Exception:
            return False

    def apply(conn):
        try:
            conn.execute(text("""
                UPDATE institutions
                SET onboarding_status = 'FULLY_ONBOARDED', features = '["placement","governance","institution_admin"]'::jsonb
                WHERE onboarding_status IS NULL OR features IS NULL OR features = '[]'::jsonb
            """))
        except Exception:
            pass
        try:
            conn.execute(text("UPDATE companies SET onboarding_status = 'ONBOARDED' WHERE onboarding_status IS NULL"))
        except Exception:
            pass
        conn.commit()

    return check, apply


def _step_seed_programs(engine):
    def check(conn):
        r = conn.execute(text("SELECT 1 FROM programs LIMIT 1"))
        return r.fetchone() is not None

    def apply(conn):
        r = conn.execute(text("SELECT id, name FROM institutions"))
        for (inst_id, inst_name) in r.fetchall():
            default_prog_id = f"{inst_id}_default"
            exists = conn.execute(text("SELECT 1 FROM programs WHERE id = :id"), {"id": default_prog_id})
            if exists.fetchone() is None:
                conn.execute(
                    text("""
                        INSERT INTO programs (id, institution_id, name, normalized_name, code, created_at, updated_at)
                        VALUES (:id, :institution_id, :name, :normalized_name, :code, NOW(), NOW())
                    """),
                    {
                        "id": default_prog_id,
                        "institution_id": inst_id,
                        "name": f"{inst_name} (Default)",
                        "normalized_name": f"{inst_name} (default)".strip().lower(),
                        "code": "DEFAULT",
                    },
                )
        conn.commit()

    return check, apply


def _step_seed_companies(engine):
    """Seed companies (McKinsey etc.) for recruiter users."""

    def check(conn):
        r = conn.execute(text("SELECT 1 FROM companies WHERE id = :id"), {"id": DEFAULT_COMPANY_ID})
        return r.fetchone() is not None

    def apply(conn):
        default_roles = '["RECRUITER"]'
        companies = [
            {"id": "comp1", "name": "McKinsey & Company", "last_year_hires": 15, "cumulative_hires_3y": 45, "last_year_median_fixed": 28.5},
        ]
        dialect = getattr(conn.dialect, "name", "postgresql") if hasattr(conn, "dialect") else "postgresql"
        for c in companies:
            r = conn.execute(text("SELECT 1 FROM companies WHERE id = :id"), {"id": c["id"]})
            if r.fetchone() is None:
                if dialect == "postgresql":
                    conn.execute(text("""
                        INSERT INTO companies (id, name, last_year_hires, cumulative_hires_3y, last_year_median_fixed, allowed_roles, status)
                        VALUES (:id, :name, :last_year_hires, :cumulative_hires_3y, :last_year_median_fixed, CAST(:allowed_roles AS jsonb), 'PARTNER')
                    """), {**c, "allowed_roles": default_roles})
                else:
                    conn.execute(text("""
                        INSERT INTO companies (id, name, last_year_hires, cumulative_hires_3y, last_year_median_fixed, allowed_roles, status)
                        VALUES (:id, :name, :last_year_hires, :cumulative_hires_3y, :last_year_median_fixed, :allowed_roles, 'PARTNER')
                    """), {**c, "allowed_roles": default_roles})
        conn.commit()

    return check, apply


def _step_seed_subscription_metadata(engine):
    """Set onboarding_status and features on institutions, onboarding_status on companies (migration 039)."""

    def check(conn):
        try:
            r = conn.execute(text("SELECT 1 FROM institutions WHERE features IS NOT NULL AND features != '[]'::jsonb LIMIT 1"))
            return r.fetchone() is not None
        except Exception:
            return False

    def apply(conn):
        try:
            conn.execute(text("""
                UPDATE institutions
                SET onboarding_status = 'FULLY_ONBOARDED', features = '["placement","governance","institution_admin"]'::jsonb
                WHERE onboarding_status IS NULL OR features IS NULL OR features = '[]'::jsonb
            """))
        except Exception:
            pass
        try:
            conn.execute(text("UPDATE companies SET onboarding_status = 'ONBOARDED' WHERE onboarding_status IS NULL"))
        except Exception:
            pass
        conn.commit()

    return check, apply


def _links_table_exists(conn):
    """Check if individual_institution_links exists (migration 028 applied)."""
    dialect = getattr(conn.dialect, "name", "postgresql") if hasattr(conn, "dialect") else "postgresql"
    if dialect == "sqlite":
        r = conn.execute(text("SELECT 1 FROM sqlite_master WHERE type='table' AND name='individual_institution_links'"))
    else:
        r = conn.execute(
            text("SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='individual_institution_links'")
        )
    return r.fetchone() is not None


def _step_reset_to_demo_users(engine):
    """Clear all users and user-dependent data, ensure fixed set of demo users exists."""

    def check(conn):
        for role_key, u in DEMO_USERS.items():
            r = conn.execute(
                text("SELECT 1 FROM users WHERE id = :id AND email = :email AND password_hash IS NOT NULL"),
                {"id": u["id"], "email": u["email"]},
            )
            if r.fetchone() is None:
                return False
        return True

    def apply(conn):
        conn.execute(text("SELECT 1"))
        tables_phase1 = [
            "application_timeline_events",
            "application_attachments",
            "application_stage_progress",
            "offers",
            "applications",
            "messages",
            "conversation_participants",
            "conversations",
            "saved_opportunities",
            "company_follows",
            "talent_pool_members",
            "saved_searches",
            "talent_pools",
            "eligibility_override_requests",
            "placement_outcomes",
            "eligibility_rules",
            "analytics_schedules",
            "analytics_reports",
            "analytics_dashboards",
            "shortlists",
            "workflow_approvals",
            "application_requests",
            "jd_submissions",
            "workflow_stages",
            "workflows",
            "portfolio_assets",
            "cv_versions",
            "cvs",
            "slot_bookings",
            "student_slot_availability",
            "notifications",
            "notification_preferences",
            "audit_logs",
            "user_profile_change_requests",
            "individual_organization_links",
            "individual_institution_links",
            "user_role_assignments",
            "auth_sessions",
            "feed_comments",
            "feed_likes",
            "feed_posts",
            "policy_proposals",
            "policies",
            "historical_hires",
            "jobs",
            "workflow_template_stages",
            "workflow_templates",
        ]
        tables_phase2 = ["users"]
        tables_phase3 = ["batches", "cycles", "programs", "companies", "institutions"]
        tables_phase4 = ["timetable_blocks", "calendar_slots"]
        all_tables = tables_phase1 + tables_phase2 + tables_phase3 + tables_phase4
        for table in all_tables:
            savepoint = conn.begin_nested()
            try:
                conn.execute(text(f"DELETE FROM {table}"))
                savepoint.commit()
            except Exception as e:
                savepoint.rollback()
                if "does not exist" not in str(e).lower():
                    raise
        conn.commit()

    return check, apply


def _step_seed_demo_users(engine):
    """Ensure all demo users exist with password. Idempotent."""

    def check(conn):
        for u in DEMO_USERS.values():
            r = conn.execute(
                text("SELECT 1 FROM users WHERE id = :id AND password_hash IS NOT NULL"),
                {"id": u["id"]},
            )
            if r.fetchone() is None:
                return False
        return True

    def apply(conn):
        pw_hash = hash_password(_get_demo_password())
        for role_key, u in DEMO_USERS.items():
            r = conn.execute(text("SELECT 1 FROM users WHERE id = :id"), {"id": u["id"]})
            if r.fetchone():
                conn.execute(
                    text("""
                        UPDATE users SET email = :email, name = :name, full_name = :full_name, role = :role,
                        institution_id = :inst_id, company_id = :comp_id, program_id = :prog_id, password_hash = :pw_hash
                        WHERE id = :id
                    """),
                    {
                        "id": u["id"],
                        "email": u["email"],
                        "name": u["name"],
                        "full_name": u.get("full_name", u["name"]),
                        "role": u["role"],
                        "inst_id": u["institution_id"],
                        "comp_id": u["company_id"],
                        "prog_id": u["program_id"],
                        "pw_hash": pw_hash,
                    },
                )
            else:
                conn.execute(
                    text("""
                        INSERT INTO users (id, email, name, full_name, role, institution_id, company_id, program_id, batch_id, sector_preferences, password_hash)
                        VALUES (:id, :email, :name, :full_name, :role, :inst_id, :comp_id, :prog_id, NULL, '[]', :pw_hash)
                    """),
                    {
                        "id": u["id"],
                        "email": u["email"],
                        "name": u["name"],
                        "full_name": u.get("full_name", u["name"]),
                        "role": u["role"],
                        "inst_id": u["institution_id"],
                        "comp_id": u["company_id"],
                        "prog_id": u["program_id"],
                        "pw_hash": pw_hash,
                    },
                )
        conn.commit()

    return check, apply


def _step_seed_demo_profiles(engine):
    """Ensure all demo users have correct institution/org links. Idempotent."""

    def check(conn):
        if not _links_table_exists(conn):
            r = conn.execute(
                text("SELECT 1 FROM user_role_assignments WHERE user_id = :uid AND role_id = 'SYSTEM_ADMIN'"),
                {"uid": FOUNDER_USER_ID},
            )
            return r.fetchone() is not None
        for u in DEMO_USERS.values():
            if u["role"] == "RECRUITER":
                r = conn.execute(
                    text("SELECT 1 FROM individual_organization_links WHERE user_id = :uid AND role_id = 'RECRUITER'"),
                    {"uid": u["id"]},
                )
            else:
                r = conn.execute(
                    text("SELECT 1 FROM individual_institution_links WHERE user_id = :uid AND role_id = :role"),
                    {"uid": u["id"], "role": u["role"]},
                )
            if r.fetchone() is None:
                return False
        return True

    def apply(conn):
        dialect = getattr(conn.dialect, "name", "postgresql") if hasattr(conn, "dialect") else "postgresql"
        now_expr = "datetime('now')" if dialect == "sqlite" else "NOW()"
        if _links_table_exists(conn):
            for u in DEMO_USERS.values():
                if u["role"] == "RECRUITER":
                    if u["company_id"]:
                        iol_id = f"iol_{u['id']}_RECRUITER"
                        existing = conn.execute(text("SELECT 1 FROM individual_organization_links WHERE id = :id"), {"id": iol_id})
                        if existing.fetchone() is None:
                            conn.execute(
                                text(f"""
                                    INSERT INTO individual_organization_links
                                    (id, user_id, company_id, business_unit_id, role_id, start_date, end_date, created_at)
                                    VALUES (:id, :uid, :comp_id, NULL, 'RECRUITER', {now_expr}, NULL, {now_expr})
                                """),
                                {"id": iol_id, "uid": u["id"], "comp_id": u["company_id"]},
                            )
                else:
                    link_id = f"iil_{u['id']}_{u['role']}"
                    existing = conn.execute(text("SELECT 1 FROM individual_institution_links WHERE id = :id"), {"id": link_id})
                    if existing.fetchone() is None:
                        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": u["role"]})
                        if role_exists.fetchone() is not None:
                            conn.execute(
                                text(f"""
                                    INSERT INTO individual_institution_links
                                    (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
                                    VALUES (:id, :uid, :inst_id, :prog_id, :role_id, {now_expr}, NULL, {now_expr})
                                """),
                                {
                                    "id": link_id,
                                    "uid": u["id"],
                                    "inst_id": u["institution_id"],
                                    "prog_id": u["program_id"],
                                    "role_id": u["role"],
                                },
                            )
        else:
            assignment_id = f"migrated_{FOUNDER_USER_ID}_SYSTEM_ADMIN"
            existing = conn.execute(
                text("SELECT 1 FROM user_role_assignments WHERE user_id = :uid AND role_id = 'SYSTEM_ADMIN'"),
                {"uid": FOUNDER_USER_ID},
            )
            if existing.fetchone() is None:
                role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": "SYSTEM_ADMIN"})
                if role_exists.fetchone() is not None:
                    conn.execute(
                        text("""
                            INSERT INTO user_role_assignments (id, user_id, role_id, institution_id, company_id, program_id, granted_at, is_active)
                            VALUES (:id, :uid, 'SYSTEM_ADMIN', NULL, NULL, NULL, NOW(), true)
                        """),
                        {"id": assignment_id, "uid": FOUNDER_USER_ID},
                    )
        conn.commit()

    return check, apply


def _step_seed_shashank_institution_link(engine):
    """Ensure Shashank Gandham has IIM Calcutta alumni link (individual_institution_links).
    McKinsey current link is created by seed_demo_profiles (RECRUITER with company_id).
    """

    def check(conn):
        if not _links_table_exists(conn):
            return True  # Skip if links table doesn't exist
        r = conn.execute(
            text("SELECT 1 FROM individual_institution_links WHERE user_id = :uid AND institution_id = :inst_id"),
            {"uid": SHASHANK_USER_ID, "inst_id": DEFAULT_INSTITUTION_ID},
        )
        return r.fetchone() is not None

    def apply(conn):
        if not _links_table_exists(conn):
            conn.commit()
            return
        dialect = getattr(conn.dialect, "name", "postgresql") if hasattr(conn, "dialect") else "postgresql"
        link_id = f"iil_{SHASHANK_USER_ID}_ALUMNI_inst1"
        existing = conn.execute(text("SELECT 1 FROM individual_institution_links WHERE id = :id"), {"id": link_id})
        if existing.fetchone() is not None:
            conn.commit()
            return
        role_exists = conn.execute(text("SELECT 1 FROM roles WHERE id = :id"), {"id": "ALUMNI"})
        if role_exists.fetchone() is None:
            conn.commit()
            return
        params = {"id": link_id, "uid": SHASHANK_USER_ID, "inst_id": DEFAULT_INSTITUTION_ID, "prog_id": DEFAULT_PROGRAM_ID}
        if dialect == "sqlite":
            conn.execute(
                text("""
                    INSERT INTO individual_institution_links
                    (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
                    VALUES (:id, :uid, :inst_id, :prog_id, 'ALUMNI', datetime('2020-07-01'), datetime('2022-06-01'), datetime('now'))
                """),
                params,
            )
        else:
            conn.execute(
                text("""
                    INSERT INTO individual_institution_links
                    (id, user_id, institution_id, program_id, role_id, start_date, end_date, created_at)
                    VALUES (:id, :uid, :inst_id, :prog_id, 'ALUMNI', '2020-07-01'::timestamp, '2022-06-01'::timestamp, NOW())
                """),
                params,
            )
        conn.commit()

    return check, apply


def _step_sync_demo_passwords(engine):
    """Always update all demo users' password_hash to DEMO_PASSWORD."""

    def check(conn):
        return False  # Always run apply so password stays in sync

    def apply(conn):
        pw_hash = hash_password(_get_demo_password())
        for uid in DEMO_USER_IDS:
            conn.execute(
                text("UPDATE users SET password_hash = :pw_hash WHERE id = :id"),
                {"id": uid, "pw_hash": pw_hash},
            )
        conn.commit()

    return check, apply


def _step_seed_batches(engine):
    """Seed batch1 for inst1_default. Idempotent."""

    def check(conn):
        r = conn.execute(text("SELECT 1 FROM batches WHERE id = :id"), {"id": DEFAULT_BATCH_ID})
        return r.fetchone() is not None

    def apply(conn):
        conn.execute(
            text("""
                INSERT INTO batches (id, program_id, name, year, start_date, end_date, created_at)
                VALUES (:id, :prog_id, :name, :year, NOW(), NOW(), NOW())
            """),
            {
                "id": DEFAULT_BATCH_ID,
                "prog_id": DEFAULT_PROGRAM_ID,
                "name": "2025-26 MBA",
                "year": 2026,
            },
        )
        demo_student_id = DEMO_USERS["CANDIDATE"]["id"]
        conn.execute(
            text("UPDATE users SET batch_id = :batch_id WHERE id = :uid"),
            {"batch_id": DEFAULT_BATCH_ID, "uid": demo_student_id},
        )
        conn.commit()

    return check, apply


def _step_seed_cycles(engine):
    """Seed cycle1 for inst1. Idempotent."""

    def check(conn):
        r = conn.execute(text("SELECT 1 FROM cycles WHERE id = :id"), {"id": DEFAULT_CYCLE_ID})
        return r.fetchone() is not None

    def apply(conn):
        conn.execute(
            text("""
                INSERT INTO cycles (id, name, type, category, status, institution_id, start_date, end_date, created_at)
                VALUES (:id, :name, :type, :category, :status, :inst_id, NOW(), NOW(), NOW())
            """),
            {
                "id": DEFAULT_CYCLE_ID,
                "name": "2025-26 Final Placements",
                "type": "FINAL",
                "category": "CURRENT",
                "status": "APPLICATIONS_OPEN",
                "inst_id": DEFAULT_INSTITUTION_ID,
            },
        )
        conn.commit()

    return check, apply


def _step_seed_cv_template(engine):
    """Seed default CV template for inst1. Idempotent."""

    def check(conn):
        r = conn.execute(text("SELECT 1 FROM cv_templates WHERE id = :id"), {"id": "inst1_default"})
        return r.fetchone() is not None

    def apply(conn):
        conn.execute(
            text("""
                INSERT INTO cv_templates (id, name, institution_id, status, created_at, updated_at)
                VALUES ('inst1_default', 'Default IIM Calcutta', :inst_id, 'PUBLISHED', NOW(), NOW())
            """),
            {"inst_id": DEFAULT_INSTITUTION_ID},
        )
        conn.commit()

    return check, apply


def _step_seed_jobs(engine):
    """Seed 2-3 jobs for comp1 in cycle1. Idempotent."""

    def check(conn):
        r = conn.execute(text("SELECT COUNT(*) FROM jobs WHERE cycle_id = :cid"), {"cid": DEFAULT_CYCLE_ID})
        return (r.scalar() or 0) >= 2

    def apply(conn):
        jobs = [
            {"id": "job1", "title": "Consultant", "sector": "Consulting", "slot": "Day 0", "fixed": 28.0, "variable": 5.0},
            {"id": "job2", "title": "Business Analyst", "sector": "Consulting", "slot": "Day 0", "fixed": 24.0, "variable": 4.0},
            {"id": "job3", "title": "Associate", "sector": "Consulting", "slot": "Day 1", "fixed": 22.0, "variable": 3.0},
        ]
        for j in jobs:
            conn.execute(
                text("""
                    INSERT INTO jobs (id, company_id, cycle_id, institution_id, title, sector, slot, slot_rank,
                    fixed_comp, variable_comp, esops_vested, joining_bonus, performance_bonus, is_top_decile, opening_date, jd_status)
                    VALUES (:id, :comp_id, :cycle_id, :inst_id, :title, :sector, :slot, 0, :fixed, :variable, 0, 0, 0, false, NOW(), 'Approved')
                """),
                {
                    "id": j["id"],
                    "comp_id": DEFAULT_COMPANY_ID,
                    "cycle_id": DEFAULT_CYCLE_ID,
                    "inst_id": DEFAULT_INSTITUTION_ID,
                    "title": j["title"],
                    "sector": j["sector"],
                    "slot": j["slot"],
                    "fixed": j["fixed"],
                    "variable": j["variable"],
                },
            )
        conn.commit()

    return check, apply


def _step_seed_workflows(engine):
    """Seed workflow + stages for each job. Idempotent."""

    def check(conn):
        r = conn.execute(text("SELECT COUNT(*) FROM workflows WHERE institution_id = :inst_id"), {"inst_id": DEFAULT_INSTITUTION_ID})
        return (r.scalar() or 0) >= 2

    def apply(conn):
        demo_pt_id = DEMO_USERS["PLACEMENT_TEAM"]["id"]
        jobs = ["job1", "job2", "job3"]
        stages = ["Applied", "Shortlist", "Interview", "Offer"]
        for job_id in jobs:
            wf_id = f"wf_{job_id}"
            conn.execute(
                text("""
                    INSERT INTO workflows (id, company_id, job_id, institution_id, name, description, created_by, status, created_at, updated_at)
                    VALUES (:id, :comp_id, :job_id, :inst_id, :name, NULL, :created_by, 'ACTIVE', NOW(), NOW())
                """),
                {
                    "id": wf_id,
                    "comp_id": DEFAULT_COMPANY_ID,
                    "job_id": job_id,
                    "inst_id": DEFAULT_INSTITUTION_ID,
                    "name": f"Workflow for {job_id}",
                    "created_by": demo_pt_id,
                },
            )
            for i, stage_name in enumerate(stages):
                stage_id = f"ws_{job_id}_{i}"
                conn.execute(
                    text("""
                        INSERT INTO workflow_stages (id, workflow_id, stage_number, name, description, stage_type, is_approval_required, created_at)
                        VALUES (:id, :wf_id, :num, :name, NULL, 'APPLICATION', true, NOW())
                    """),
                    {"id": stage_id, "wf_id": wf_id, "num": i + 1, "name": stage_name},
                )
        conn.commit()

    return check, apply


def _step_seed_demo_cv(engine):
    """Seed CV for demo_student. Idempotent."""

    def check(conn):
        demo_student_id = DEMO_USERS["CANDIDATE"]["id"]
        r = conn.execute(text("SELECT 1 FROM cvs WHERE candidate_id = :uid"), {"uid": demo_student_id})
        return r.fetchone() is not None

    def apply(conn):
        demo_student_id = DEMO_USERS["CANDIDATE"]["id"]
        cv_id = "cv_demo_student"
        cv_data = json.dumps({"education": [{"degree": "MBA", "institution": "IIM Calcutta"}], "experience": []})
        conn.execute(
            text("""
                INSERT INTO cvs (id, candidate_id, template_id, data, pdf_url, status, created_at, updated_at)
                VALUES (:id, :uid, 'inst1_default', CAST(:data AS json), '/pdf/demo.pdf', 'VERIFIED', NOW(), NOW())
            """),
            {"id": cv_id, "uid": demo_student_id, "data": cv_data},
        )
        conn.execute(
            text("""
                INSERT INTO cv_versions (id, cv_id, version, data, created_at)
                VALUES (:id, :cv_id, 1, CAST(:data AS json), NOW())
            """),
            {"id": f"{cv_id}_v1", "cv_id": cv_id, "data": cv_data},
        )
        conn.commit()

    return check, apply


def _step_seed_demo_applications(engine):
    """Seed applications for demo_student to job1 and job2. Idempotent."""

    def check(conn):
        demo_student_id = DEMO_USERS["CANDIDATE"]["id"]
        r = conn.execute(
            text("SELECT COUNT(*) FROM applications WHERE student_id = :uid"),
            {"uid": demo_student_id},
        )
        return (r.scalar() or 0) >= 2

    def apply(conn):
        demo_student_id = DEMO_USERS["CANDIDATE"]["id"]
        cv_id = "cv_demo_student"
        first_stage_ids = ["ws_job1_0", "ws_job2_0"]
        for i, (job_id, stage_id) in enumerate([("job1", "ws_job1_0"), ("job2", "ws_job2_0")]):
            wf_id = f"wf_{job_id}"
            app_id = f"app_demo_{job_id}"
            conn.execute(
                text("""
                    INSERT INTO applications (id, student_id, job_id, workflow_id, cv_id, current_stage_id, status, submitted_at, updated_at)
                    VALUES (:id, :uid, :job_id, :wf_id, :cv_id, :stage_id, 'IN_PROGRESS', NOW(), NOW())
                """),
                {
                    "id": app_id,
                    "uid": demo_student_id,
                    "job_id": job_id,
                    "wf_id": wf_id,
                    "cv_id": cv_id,
                    "stage_id": stage_id,
                },
            )
            conn.execute(
                text("""
                    INSERT INTO application_stage_progress (id, application_id, stage_id, status, moved_at, moved_by)
                    VALUES (:id, :app_id, :stage_id, 'PASSED', NOW(), :uid)
                """),
                {
                    "id": f"asp_{app_id}_0",
                    "app_id": app_id,
                    "stage_id": stage_id,
                    "uid": demo_student_id,
                },
            )
        conn.commit()

    return check, apply


def build_steps(engine):
    """Build the ordered list of setup seed steps."""
    steps = []
    check, apply = _step_reset_to_demo_users(engine)
    steps.append({"id": "reset_users", "name": "Resetting to demo users", "check": check, "apply": apply})
    check, apply = _step_seed_institutions(engine)
    steps.append({"id": "seed_institutions", "name": "Seeding institutions", "check": check, "apply": apply})
    check, apply = _step_seed_programs(engine)
    steps.append({"id": "seed_programs", "name": "Seeding programs", "check": check, "apply": apply})
    check, apply = _step_seed_companies(engine)
    steps.append({"id": "seed_companies", "name": "Seeding companies", "check": check, "apply": apply})
    check, apply = _step_seed_subscription_metadata(engine)
    steps.append({"id": "seed_subscription_metadata", "name": "Seeding subscription metadata", "check": check, "apply": apply})
    check, apply = _step_seed_demo_users(engine)
    steps.append({"id": "seed_demo_users", "name": "Seeding demo users", "check": check, "apply": apply})
    check, apply = _step_sync_demo_passwords(engine)
    steps.append({"id": "sync_demo_passwords", "name": "Syncing demo passwords", "check": check, "apply": apply})
    check, apply = _step_seed_demo_profiles(engine)
    steps.append({"id": "seed_demo_profiles", "name": "Seeding demo profiles", "check": check, "apply": apply})
    check, apply = _step_seed_shashank_institution_link(engine)
    steps.append({"id": "seed_shashank_institution_link", "name": "Seeding Shashank Gandham IIM Calcutta alumni link", "check": check, "apply": apply})
    check, apply = _step_seed_batches(engine)
    steps.append({"id": "seed_batches", "name": "Seeding batches", "check": check, "apply": apply})
    check, apply = _step_seed_cycles(engine)
    steps.append({"id": "seed_cycles", "name": "Seeding cycles", "check": check, "apply": apply})
    check, apply = _step_seed_cv_template(engine)
    steps.append({"id": "seed_cv_template", "name": "Seeding CV template", "check": check, "apply": apply})
    check, apply = _step_seed_jobs(engine)
    steps.append({"id": "seed_jobs", "name": "Seeding jobs", "check": check, "apply": apply})
    check, apply = _step_seed_workflows(engine)
    steps.append({"id": "seed_workflows", "name": "Seeding workflows", "check": check, "apply": apply})
    check, apply = _step_seed_demo_cv(engine)
    steps.append({"id": "seed_demo_cv", "name": "Seeding demo CV", "check": check, "apply": apply})
    check, apply = _step_seed_demo_applications(engine)
    steps.append({"id": "seed_demo_applications", "name": "Seeding demo applications", "check": check, "apply": apply})
    return steps


SETUP_STEPS = [
    {"id": "reset_users", "name": "Resetting to demo users"},
    {"id": "seed_institutions", "name": "Seeding institutions"},
    {"id": "seed_programs", "name": "Seeding programs"},
    {"id": "seed_companies", "name": "Seeding companies"},
    {"id": "seed_demo_users", "name": "Seeding demo users"},
    {"id": "sync_demo_passwords", "name": "Syncing demo passwords"},
    {"id": "seed_demo_profiles", "name": "Seeding demo profiles"},
    {"id": "seed_shashank_institution_link", "name": "Seeding Shashank Gandham IIM Calcutta alumni link"},
    {"id": "seed_batches", "name": "Seeding batches"},
    {"id": "seed_cycles", "name": "Seeding cycles"},
    {"id": "seed_cv_template", "name": "Seeding CV template"},
    {"id": "seed_jobs", "name": "Seeding jobs"},
    {"id": "seed_workflows", "name": "Seeding workflows"},
    {"id": "seed_demo_cv", "name": "Seeding demo CV"},
    {"id": "seed_demo_applications", "name": "Seeding demo applications"},
]
