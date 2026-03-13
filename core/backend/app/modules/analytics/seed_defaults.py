"""
Seed default analytics reports and dashboards for Ithras placement platform.
Runs on first access when analytics tables are empty. Idempotent.
"""
import json
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)

DEFAULT_REPORTS = [
    {
        "name": "[Default] Users by Role",
        "query": "SELECT role, COUNT(*) AS count FROM users GROUP BY role ORDER BY count DESC",
        "chart_config": {"type": "bar", "xAxis": "role", "yAxis": "count"},
    },
    {
        "name": "[Default] Workflows by Status",
        "query": "SELECT status, COUNT(*) AS count FROM workflows GROUP BY status",
        "chart_config": {"type": "pie", "xAxis": "status", "yAxis": "count"},
    },
    {
        "name": "[Default] Applications by Workflow",
        "query": """SELECT w.name AS workflow, COUNT(a.id) AS count
            FROM applications a
            JOIN workflows w ON a.workflow_id = w.id
            GROUP BY w.id, w.name
            ORDER BY count DESC
            LIMIT 15""",
        "chart_config": {"type": "bar", "xAxis": "workflow", "yAxis": "count"},
    },
    {
        "name": "[Default] Applications by Institution",
        "query": """SELECT i.name AS institution, COUNT(a.id) AS count
            FROM applications a
            JOIN workflows w ON a.workflow_id = w.id
            JOIN institutions i ON w.institution_id = i.id
            GROUP BY i.id, i.name
            ORDER BY count DESC
            LIMIT 10""",
        "chart_config": {"type": "bar", "xAxis": "institution", "yAxis": "count"},
    },
    {
        "name": "[Default] Jobs by Company",
        "query": """SELECT c.name AS company, COUNT(j.id) AS count
            FROM jobs j
            JOIN companies c ON j.company_id = c.id
            GROUP BY c.id, c.name
            ORDER BY count DESC
            LIMIT 10""",
        "chart_config": {"type": "bar", "xAxis": "company", "yAxis": "count"},
    },
    {
        "name": "[Default] Platform Metrics",
        "query": """SELECT 'users' AS metric, (SELECT COUNT(*) FROM users) AS value
            UNION ALL SELECT 'institutions', (SELECT COUNT(*) FROM institutions)
            UNION ALL SELECT 'companies', (SELECT COUNT(*) FROM companies)
            UNION ALL SELECT 'applications', (SELECT COUNT(*) FROM applications)
            UNION ALL SELECT 'workflows', (SELECT COUNT(*) FROM workflows)""",
        "chart_config": {"type": "bar", "xAxis": "metric", "yAxis": "value"},
    },
]


def _table_exists(db: Session, table_name: str) -> bool:
    """Check if a table exists in the database."""
    try:
        r = db.execute(
            text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.tables
                WHERE table_schema = 'public' AND table_name = :t
            )
            """),
            {"t": table_name},
        )
        return bool(r.scalar())
    except Exception:
        return False


def _insert_report(db: Session, report: dict) -> int | None:
    """Insert a report and return its id, or None on failure."""
    try:
        db.execute(
            text("""
            INSERT INTO analytics_reports (name, query, params_json, chart_config_json)
            VALUES (:name, :query, :params_json, :chart_config_json)
            """),
            {
                "name": report["name"],
                "query": report["query"],
                "params_json": json.dumps(report.get("params") or []),
                "chart_config_json": json.dumps(report.get("chart_config") or {}),
            },
        )
        db.commit()
        row = db.execute(
            text("SELECT id FROM analytics_reports ORDER BY id DESC LIMIT 1")
        ).fetchone()
        return row[0] if row else None
    except Exception as e:
        db.rollback()
        logger.warning("Failed to seed report %s: %s", report.get("name"), e)
        return None


def seed_default_analytics(db: Session) -> bool:
    """
    Seed default reports and dashboards if none exist.
    Returns True if seeding ran, False if already seeded.
    """
    try:
        # Check idempotency: skip if default reports already exist
        r = db.execute(
            text("SELECT COUNT(*) FROM analytics_reports WHERE name LIKE '[Default] %'")
        ).scalar()
        if r and r > 0:
            return False

        report_ids = {}
        for report in DEFAULT_REPORTS:
            # Skip reports that depend on tables that may not exist
            query = report["query"].lower()
            if "workflows" in query and not _table_exists(db, "workflows"):
                continue
            if "applications" in query and not _table_exists(db, "applications"):
                continue
            if "jobs" in query and not _table_exists(db, "jobs"):
                continue

            rid = _insert_report(db, report)
            if rid:
                report_ids[report["name"]] = rid

        if not report_ids:
            return False

        # Build dashboard layouts
        users_role_id = report_ids.get("[Default] Users by Role")
        workflows_status_id = report_ids.get("[Default] Workflows by Status")
        apps_workflow_id = report_ids.get("[Default] Applications by Workflow")
        apps_inst_id = report_ids.get("[Default] Applications by Institution")
        jobs_company_id = report_ids.get("[Default] Jobs by Company")
        metrics_id = report_ids.get("[Default] Platform Metrics")

        # Platform Overview dashboard
        overview_widgets = []
        idx = 0
        for rid, name in [
            (users_role_id, "Users by Role"),
            (workflows_status_id, "Workflows by Status"),
            (metrics_id, "Platform Metrics"),
        ]:
            if rid:
                overview_widgets.append({
                    "id": f"w-{idx + 1}",
                    "reportId": rid,
                    "x": (idx % 2) * 6,
                    "y": (idx // 2) * 4,
                    "w": 6,
                    "h": 4,
                    "chartConfig": {},
                })
                idx += 1

        if overview_widgets:
            db.execute(
                text("""
                INSERT INTO analytics_dashboards (name, layout_json)
                VALUES (:name, :layout_json)
                """),
                {
                    "name": "Platform Overview",
                    "layout_json": json.dumps({"widgets": overview_widgets}),
                },
            )
            db.commit()

        # Placement Analytics dashboard
        placement_widgets = []
        idx = 0
        for rid in [apps_workflow_id, apps_inst_id, jobs_company_id]:
            if rid:
                placement_widgets.append({
                    "id": f"w-p{idx + 1}",
                    "reportId": rid,
                    "x": (idx % 2) * 6,
                    "y": (idx // 2) * 4,
                    "w": 6,
                    "h": 4,
                    "chartConfig": {},
                })
                idx += 1

        if placement_widgets:
            db.execute(
                text("""
                INSERT INTO analytics_dashboards (name, layout_json)
                VALUES (:name, :layout_json)
                """),
                {
                    "name": "Placement Analytics",
                    "layout_json": json.dumps({"widgets": placement_widgets}),
                },
            )
            db.commit()

        logger.info("Seeded %d default reports and 2 dashboards", len(report_ids))
        return True
    except Exception as e:
        db.rollback()
        logger.exception("Failed to seed default analytics: %s", e)
        return False
