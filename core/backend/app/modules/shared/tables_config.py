"""
Centralized table configuration - reference only.
Schema is managed by Alembic; ORM models define the canonical structure.
"""
# Table names (for reference / health checks)
TABLES_CONFIG = {
    "core": ["institutions", "programs", "companies", "users", "audit_logs"],
    "placement": ["cycles", "jobs", "shortlists", "workflow_templates", "workflow_template_stages", "workflows", "workflow_stages", "applications", "application_stage_progress", "historical_hires"],
    "cv": ["cvs", "cv_versions"],
    "calendar": ["calendar_slots", "timetable_blocks", "slot_bookings", "student_slot_availability"],
    "governance": ["policies", "policy_proposals", "workflow_approvals", "application_requests", "notifications", "jd_submissions"],
    "analytics": ["analytics_reports", "analytics_dashboards", "analytics_schedules"],
}

# Creation order for FK dependencies (Alembic migrations handle this)
TABLE_CREATION_ORDER = [
    "institutions", "programs", "companies", "users", "audit_logs",
    "cycles", "jobs", "workflows", "workflow_stages",
    "shortlists", "applications", "application_stage_progress", "historical_hires",
    "cvs", "cv_versions",
    "calendar_slots", "timetable_blocks", "slot_bookings", "student_slot_availability",
    "policies", "policy_proposals", "workflow_approvals", "notifications", "jd_submissions",
    "analytics_reports", "analytics_dashboards", "analytics_schedules",
]
