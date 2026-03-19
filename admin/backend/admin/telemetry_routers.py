"""Admin telemetry APIs - read from telemetry_events, api_request_log, telemetry_errors."""
from fastapi import APIRouter, Depends, Query

from shared.database.database import get_db
from shared.auth.auth import require_admin
from shared.telemetry.schemas import TelemetryQueryFilters
from shared.telemetry.queries.query_service import telemetry_query_service

router = APIRouter(prefix="/telemetry", tags=["admin-telemetry"])


def _filters(
    from_iso: str | None = Query(None, alias="from"),
    to_iso: str | None = Query(None, alias="to"),
    domain: str | None = None,
    status: str | None = None,
    entity_type: str | None = Query(None, alias="entityType"),
    entity_id: str | None = Query(None, alias="entityId"),
    actor_id: int | None = Query(None, alias="actorId"),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
) -> TelemetryQueryFilters:
    return TelemetryQueryFilters(
        from_iso=from_iso,
        to_iso=to_iso,
        domain=domain,
        status=status,
        entity_type=entity_type,
        entity_id=entity_id,
        actor_id=actor_id,
        limit=limit,
        offset=offset,
    )


@router.get("/overview", summary="Telemetry overview KPIs and health")
def get_overview(
    user=Depends(require_admin),
    db=Depends(get_db),
    from_iso: str | None = Query(None, alias="from"),
    to_iso: str | None = Query(None, alias="to"),
):
    """Aggregate KPIs from telemetry tables."""
    return telemetry_query_service.get_overview_kpis(db, from_iso, to_iso)


@router.get("/api", summary="API telemetry list")
def get_api_telemetry(
    user=Depends(require_admin),
    db=Depends(get_db),
    from_iso: str | None = Query(None, alias="from"),
    to_iso: str | None = Query(None, alias="to"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    """Aggregate api_request_log by path+method."""
    items, total = telemetry_query_service.get_api_telemetry(db, from_iso, to_iso, limit, offset)
    return {"items": items, "total": total}


@router.get("/api/{endpoint_id:path}", summary="API telemetry detail for endpoint")
def get_api_telemetry_detail(
    endpoint_id: str,
    user=Depends(require_admin),
    db=Depends(get_db),
    from_iso: str | None = Query(None, alias="from"),
    to_iso: str | None = Query(None, alias="to"),
    limit: int = Query(50, ge=1, le=200),
):
    """List individual requests for a given path."""
    endpoint, requests = telemetry_query_service.get_api_telemetry_detail(db, endpoint_id, from_iso, to_iso, limit)
    return {"endpoint": endpoint, "requests": requests}


@router.get("/user-activity", summary="User activity events")
def get_user_activity(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Events from telemetry_events."""
    items, total = telemetry_query_service.get_user_activity(db, filters)
    return {"items": items, "total": total}


@router.get("/audit", summary="Audit logs")
def get_audit(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Audit domain events."""
    items, total = telemetry_query_service.get_audit_logs(db, filters)
    return {"items": items, "total": total}


@router.get("/security", summary="Security events")
def get_security(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Auth domain events."""
    items, total = telemetry_query_service.get_security_events(db, filters)
    return {"items": items, "total": total}


@router.get("/social", summary="Social telemetry")
def get_social(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Feed and community events."""
    items, total, summary = telemetry_query_service.get_social_telemetry(db, filters)
    return {"items": items, "total": total, "summary": summary}


@router.get("/network", summary="Network telemetry")
def get_network(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Network domain events."""
    items, total = telemetry_query_service.get_network_telemetry(db, filters)
    return {"items": items, "total": total}


@router.get("/entity-history", summary="Entity change history")
def get_entity_history(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Entity change history."""
    items, total = telemetry_query_service.get_entity_history(db, filters)
    return {"items": items, "total": total}


@router.get("/jobs", summary="Job runs")
def get_jobs(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Job domain events."""
    items, total = telemetry_query_service.get_jobs(db, filters)
    return {"items": items, "total": total}


@router.get("/webhooks", summary="Webhook deliveries")
def get_webhooks(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Webhook domain events."""
    items, total = telemetry_query_service.get_webhooks(db, filters)
    return {"items": items, "total": total}


@router.get("/errors", summary="Error events")
def get_errors(
    user=Depends(require_admin),
    db=Depends(get_db),
    from_iso: str | None = Query(None, alias="from"),
    to_iso: str | None = Query(None, alias="to"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """telemetry_errors table."""
    items, total, summary = telemetry_query_service.get_errors(db, from_iso, to_iso, limit, offset)
    return {"items": items, "total": total, "summary": summary}


@router.get("/search", summary="Search telemetry")
def get_search(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Search domain events."""
    items, total = telemetry_query_service.get_search_telemetry(db, filters)
    return {"items": items, "total": total}


@router.get("/moderation", summary="Moderation events")
def get_moderation(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Moderation domain events."""
    items, total = telemetry_query_service.get_moderation_events(db, filters)
    return {"items": items, "total": total}


@router.get("/compliance", summary="Compliance exports")
def get_compliance(
    user=Depends(require_admin),
    db=Depends(get_db),
    filters: TelemetryQueryFilters = Depends(_filters),
):
    """Compliance domain events."""
    items, total = telemetry_query_service.get_compliance_exports(db, filters)
    return {"items": items, "total": total}
