"""
Anomaly / alert detection - detect anomalies and generate alerts from telemetry data.
"""
import time

from .store import get_entries_since, get_error_signatures


def detect_alerts(from_ts: float, to_ts: float | None = None) -> list[dict]:
    """Detect anomalies and generate alerts from telemetry data."""
    to_ts = to_ts or time.time()
    entries = get_entries_since(from_ts, to_ts)
    alerts = []
    alert_id = 0

    if not entries:
        return alerts

    total = len(entries)
    errors_5xx = sum(1 for e in entries if e.get("status_bucket") == "5xx")
    errors_4xx = sum(1 for e in entries if e.get("status_bucket") == "4xx")
    durations = [e.get("duration_ms", 0) for e in entries]
    avg_latency = sum(durations) / len(durations) if durations else 0
    sorted_dur = sorted(durations)
    n = len(sorted_dur)
    p95 = sorted_dur[int(n * 0.95)] if n else 0
    p99 = sorted_dur[int(n * 0.99)] if n else 0

    error_rate_5xx = errors_5xx / total if total else 0
    if error_rate_5xx > 0.02:
        alert_id += 1
        alerts.append({
            "id": f"alert-{alert_id}",
            "type": "error_spike",
            "severity": "critical" if error_rate_5xx > 0.05 else "warning",
            "title": "5xx Error Rate Elevated",
            "message": f"{errors_5xx} server errors ({round(error_rate_5xx * 100, 1)}% of {total} requests)",
            "metric_value": round(error_rate_5xx * 100, 1),
            "threshold": 2.0,
            "unit": "%",
            "detected_at": to_ts,
            "hint": "Check server logs for stack traces. Common causes: database timeouts, memory exhaustion, unhandled exceptions.",
        })

    error_rate_4xx = errors_4xx / total if total else 0
    if error_rate_4xx > 0.10:
        alert_id += 1
        alerts.append({
            "id": f"alert-{alert_id}",
            "type": "client_error_spike",
            "severity": "warning",
            "title": "High Client Error Rate",
            "message": f"{errors_4xx} client errors ({round(error_rate_4xx * 100, 1)}% of {total} requests)",
            "metric_value": round(error_rate_4xx * 100, 1),
            "threshold": 10.0,
            "unit": "%",
            "detected_at": to_ts,
            "hint": "Review 4xx errors for broken API contracts, missing auth tokens, or stale client caches.",
        })

    if p95 > 500:
        alert_id += 1
        alerts.append({
            "id": f"alert-{alert_id}",
            "type": "latency_degradation",
            "severity": "critical" if p95 > 2000 else "warning",
            "title": "P95 Latency Elevated",
            "message": f"P95 latency at {round(p95)}ms (threshold: 500ms)",
            "metric_value": round(p95),
            "threshold": 500,
            "unit": "ms",
            "detected_at": to_ts,
            "hint": "Investigate slow database queries, N+1 patterns, or external API latency.",
        })

    if p99 > 2000:
        alert_id += 1
        alerts.append({
            "id": f"alert-{alert_id}",
            "type": "tail_latency",
            "severity": "warning",
            "title": "P99 Tail Latency Spike",
            "message": f"P99 latency at {round(p99)}ms — worst 1% of requests",
            "metric_value": round(p99),
            "threshold": 2000,
            "unit": "ms",
            "detected_at": to_ts,
            "hint": "Profile the slowest endpoints. Consider query optimization, connection pooling, or caching.",
        })

    error_sigs = get_error_signatures(from_ts, to_ts)
    for sig in error_sigs[:5]:
        if sig["count"] >= 3:
            alert_id += 1
            alerts.append({
                "id": f"alert-{alert_id}",
                "type": "recurring_error",
                "severity": "critical" if sig["count"] >= 10 else "warning",
                "title": f"Recurring Error: {sig['error_class']}",
                "message": f"{sig['count']} occurrences on {sig['route_name']}",
                "metric_value": sig["count"],
                "threshold": 3,
                "unit": "occurrences",
                "detected_at": sig["last_seen"],
                "route": sig["route_name"],
                "sample_error": sig.get("sample_message"),
                "hint": f"Repeated {sig['error_class']} on {sig['route_name']}. Check error logs and add safeguards.",
            })

    by_endpoint: dict[str, list] = {}
    for e in entries:
        key = e.get("path", "unknown")
        by_endpoint.setdefault(key, []).append(e)

    for path, ep_entries in by_endpoint.items():
        ep_total = len(ep_entries)
        ep_errors = sum(1 for x in ep_entries if x.get("status_bucket") in ("4xx", "5xx"))
        if ep_total >= 10 and ep_errors / ep_total > 0.20:
            alert_id += 1
            alerts.append({
                "id": f"alert-{alert_id}",
                "type": "endpoint_degradation",
                "severity": "warning",
                "title": f"Endpoint Degradation: {path}",
                "message": f"{round(ep_errors / ep_total * 100, 1)}% error rate ({ep_errors}/{ep_total})",
                "metric_value": round(ep_errors / ep_total * 100, 1),
                "threshold": 20.0,
                "unit": "%",
                "detected_at": to_ts,
                "route": path,
                "hint": "This endpoint has an unusually high error rate. Investigate handler logic and dependencies.",
            })

    window_dur = to_ts - from_ts
    if window_dur > 3600 and total > 0:
        half = from_ts + window_dur / 2
        first_half = sum(1 for e in entries if e.get("timestamp", 0) < half)
        second_half = total - first_half
        if first_half > 0 and second_half > 0:
            ratio = second_half / first_half
            if ratio < 0.3:
                alert_id += 1
                alerts.append({
                    "id": f"alert-{alert_id}",
                    "type": "traffic_drop",
                    "severity": "warning",
                    "title": "Sudden Traffic Drop",
                    "message": f"Traffic dropped {round((1 - ratio) * 100)}% in the second half of the window",
                    "metric_value": round((1 - ratio) * 100),
                    "threshold": 70,
                    "unit": "%",
                    "detected_at": to_ts,
                    "hint": "Possible causes: deployment issues, DNS problems, upstream failures, or maintenance window.",
                })

    alerts.sort(key=lambda a: {"critical": 0, "warning": 1, "info": 2}.get(a.get("severity", "info"), 2))
    return alerts
