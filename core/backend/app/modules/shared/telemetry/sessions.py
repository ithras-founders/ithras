"""
Session aggregation - group telemetry events by session_id.
"""
import time

from .store import get_entries_since, get_client_events_range


def _parse_user_agent(ua: str) -> dict:
    """Extract rough browser/OS from user-agent string."""
    ua_lower = (ua or "").lower()
    browser = "Other"
    if "chrome" in ua_lower and "edg" not in ua_lower:
        browser = "Chrome"
    elif "firefox" in ua_lower:
        browser = "Firefox"
    elif "safari" in ua_lower and "chrome" not in ua_lower:
        browser = "Safari"
    elif "edg" in ua_lower:
        browser = "Edge"
    os_name = "Other"
    if "windows" in ua_lower:
        os_name = "Windows"
    elif "mac" in ua_lower:
        os_name = "macOS"
    elif "linux" in ua_lower:
        os_name = "Linux"
    elif "android" in ua_lower:
        os_name = "Android"
    elif "iphone" in ua_lower or "ipad" in ua_lower:
        os_name = "iOS"
    device = "Desktop"
    if any(k in ua_lower for k in ("mobile", "android", "iphone")):
        device = "Mobile"
    elif "ipad" in ua_lower or "tablet" in ua_lower:
        device = "Tablet"
    return {"browser": browser, "os": os_name, "device": device}


def get_sessions(from_ts: float, to_ts: float | None = None) -> list[dict]:
    """Aggregate all telemetry events into sessions grouped by session_id."""
    to_ts = to_ts or time.time()

    server_entries = get_entries_since(from_ts, to_ts)
    client_entries = get_client_events_range(from_ts, to_ts)

    sessions: dict[str, dict] = {}

    for e in server_entries:
        sid = e.get("session_id")
        if not sid:
            continue
        if sid not in sessions:
            sessions[sid] = {
                "session_id": sid,
                "user_id": None,
                "client_ip": None,
                "user_agent": None,
                "start_ts": float("inf"),
                "end_ts": 0,
                "server_events": 0,
                "client_events": 0,
                "pages": set(),
                "api_calls": 0,
                "errors": 0,
                "total_duration_ms": 0.0,
            }
        s = sessions[sid]
        ts = e.get("timestamp", 0)
        s["start_ts"] = min(s["start_ts"], ts)
        s["end_ts"] = max(s["end_ts"], ts)
        s["server_events"] += 1
        s["total_duration_ms"] += e.get("duration_ms", 0)
        if e.get("user_id") and not s["user_id"]:
            s["user_id"] = e["user_id"]
        if e.get("client_ip") and not s["client_ip"]:
            s["client_ip"] = e["client_ip"]
        if e.get("user_agent") and not s["user_agent"]:
            s["user_agent"] = e["user_agent"]
        if e.get("status_bucket") in ("4xx", "5xx"):
            s["errors"] += 1
        s["api_calls"] += 1

    for e in client_entries:
        sid = e.get("session_id")
        if not sid:
            continue
        if sid not in sessions:
            sessions[sid] = {
                "session_id": sid,
                "user_id": None,
                "client_ip": None,
                "user_agent": None,
                "start_ts": float("inf"),
                "end_ts": 0,
                "server_events": 0,
                "client_events": 0,
                "pages": set(),
                "api_calls": 0,
                "errors": 0,
                "total_duration_ms": 0.0,
            }
        s = sessions[sid]
        ts = e.get("timestamp", 0)
        s["start_ts"] = min(s["start_ts"], ts)
        s["end_ts"] = max(s["end_ts"], ts)
        s["client_events"] += 1
        if e.get("user_id") and not s["user_id"]:
            s["user_id"] = e["user_id"]
        if e.get("client_ip") and not s["client_ip"]:
            s["client_ip"] = e["client_ip"]
        if e.get("user_agent") and not s["user_agent"]:
            s["user_agent"] = e["user_agent"]
        if e.get("type") == "page_view" and e.get("view"):
            s["pages"].add(e["view"])

    result = []
    for sid, s in sessions.items():
        ua_info = _parse_user_agent(s["user_agent"])
        duration_sec = max(0, s["end_ts"] - s["start_ts"])
        result.append({
            "session_id": sid,
            "user_id": s["user_id"],
            "client_ip": s["client_ip"],
            "browser": ua_info["browser"],
            "os": ua_info["os"],
            "device": ua_info["device"],
            "start_ts": s["start_ts"] if s["start_ts"] != float("inf") else 0,
            "end_ts": s["end_ts"],
            "duration_seconds": round(duration_sec),
            "server_events": s["server_events"],
            "client_events": s["client_events"],
            "total_events": s["server_events"] + s["client_events"],
            "pages_visited": len(s["pages"]),
            "pages": list(s["pages"]),
            "api_calls": s["api_calls"],
            "errors": s["errors"],
            "avg_response_ms": round(s["total_duration_ms"] / s["api_calls"], 1) if s["api_calls"] else 0,
        })
    result.sort(key=lambda x: -x["end_ts"])
    return result
