"""
Funnel / journey computation - conversion funnels from client + server events.
"""
import time

from .store import get_client_events_range, get_entries_since

FUNNELS = [
    {
        "id": "candidate-apply",
        "name": "Candidate Application Flow",
        "description": "Login → Dashboard → View Role → Submit Application",
        "steps": [
            {"label": "Login", "match_type": "api", "path_contains": "/auth/login", "method": "POST"},
            {"label": "Dashboard", "match_type": "page_view", "view_contains": "dashboard"},
            {"label": "View Roles", "match_type": "page_view", "view_contains": "applications"},
            {"label": "Submit Application", "match_type": "api", "path_contains": "/applications", "method": "POST"},
        ],
    },
    {
        "id": "cv-builder",
        "name": "CV Builder Flow",
        "description": "Login → CV Maker → Select Template → Generate CV",
        "steps": [
            {"label": "Login", "match_type": "api", "path_contains": "/auth/login", "method": "POST"},
            {"label": "Open CV Maker", "match_type": "page_view", "view_contains": "cv"},
            {"label": "Select Template", "match_type": "api", "path_contains": "/cv/templates"},
            {"label": "Generate CV", "match_type": "api", "path_contains": "/cv", "method": "POST"},
        ],
    },
    {
        "id": "recruiter-workflow",
        "name": "Recruiter Hiring Flow",
        "description": "Login → Company Portal → Post Role → Review Shortlist",
        "steps": [
            {"label": "Login", "match_type": "api", "path_contains": "/auth/login", "method": "POST"},
            {"label": "Company Portal", "match_type": "page_view", "view_contains": "dashboard"},
            {"label": "Create Workflow", "match_type": "api", "path_contains": "/workflows", "method": "POST"},
            {"label": "Review Shortlist", "match_type": "api", "path_contains": "/shortlist"},
        ],
    },
    {
        "id": "calendar-schedule",
        "name": "Interview Scheduling Flow",
        "description": "Login → Calendar → Check Slots → Schedule",
        "steps": [
            {"label": "Login", "match_type": "api", "path_contains": "/auth/login", "method": "POST"},
            {"label": "Open Calendar", "match_type": "page_view", "view_contains": "calendar"},
            {"label": "Check Available Slots", "match_type": "api", "path_contains": "/calendar/slots"},
            {"label": "Schedule Interview", "match_type": "api", "path_contains": "/calendar", "method": "POST"},
        ],
    },
    {
        "id": "governance-policy",
        "name": "Policy Governance Flow",
        "description": "Dashboard → Create Policy → Submit for Approval → Approve",
        "steps": [
            {"label": "Governance Dashboard", "match_type": "page_view", "view_contains": "governance"},
            {"label": "Create Policy", "match_type": "api", "path_contains": "/policies", "method": "POST"},
            {"label": "Submit for Approval", "match_type": "api", "path_contains": "/approvals", "method": "POST"},
            {"label": "Approve Policy", "match_type": "api", "path_contains": "/approvals", "method": "PUT"},
        ],
    },
]


def _event_matches_step(event: dict, step: dict) -> bool:
    if step["match_type"] == "api":
        if event.get("type") == "api" or event.get("path"):
            path = event.get("path", "")
            if step.get("path_contains") and step["path_contains"] not in path:
                return False
            if step.get("method") and event.get("method", "GET") != step["method"]:
                return False
            return bool(path)
    elif step["match_type"] == "page_view":
        if event.get("type") == "page_view":
            view = event.get("view", "")
            if step.get("view_contains") and step["view_contains"] not in view:
                return False
            return bool(view)
    return False


def compute_funnels(from_ts: float, to_ts: float | None = None) -> list[dict]:
    """Compute conversion funnels from client + server events."""
    to_ts = to_ts or time.time()
    client_events = get_client_events_range(from_ts, to_ts)
    server_entries = get_entries_since(from_ts, to_ts)
    all_events = client_events + server_entries
    all_events.sort(key=lambda e: e.get("timestamp", 0))

    by_session: dict[str, list] = {}
    for e in all_events:
        sid = e.get("session_id") or e.get("user_id") or "anonymous"
        by_session.setdefault(sid, []).append(e)

    results = []
    for funnel_def in FUNNELS:
        steps = funnel_def["steps"]
        step_counts = [0] * len(steps)

        for sid, events in by_session.items():
            current_step = 0
            for ev in events:
                if current_step >= len(steps):
                    break
                if _event_matches_step(ev, steps[current_step]):
                    step_counts[current_step] += 1
                    current_step += 1

        total_entering = step_counts[0] if step_counts else 0
        step_data = []
        for i, step in enumerate(steps):
            count = step_counts[i]
            pct = round(count / total_entering * 100, 1) if total_entering else 0
            drop = 0
            if i > 0 and step_counts[i - 1] > 0:
                drop = round((1 - count / step_counts[i - 1]) * 100, 1)
            step_data.append({
                "label": step["label"],
                "count": count,
                "percentage": pct,
                "drop_off": drop,
            })

        overall_conversion = 0
        if total_entering > 0 and len(step_counts) > 1:
            overall_conversion = round(step_counts[-1] / total_entering * 100, 1)

        results.append({
            "id": funnel_def["id"],
            "name": funnel_def["name"],
            "description": funnel_def["description"],
            "total_sessions": total_entering,
            "conversion": overall_conversion,
            "steps": step_data,
        })

    return results
