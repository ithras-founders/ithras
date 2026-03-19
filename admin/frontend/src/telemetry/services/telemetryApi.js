/**
 * Telemetry API client.
 * Calls /api/v1/admin/telemetry/* endpoints.
 */
import { apiRequest } from '/shared/services/apiBase.js';

const BASE = '/v1/admin/telemetry';

function buildQuery(params = {}) {
  const q = new URLSearchParams();
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.domain) q.set('domain', params.domain);
  if (params.status) q.set('status', params.status);
  if (params.severity) q.set('severity', params.severity);
  if (params.entityType) q.set('entity_type', params.entityType);
  if (params.entityId) q.set('entity_id', params.entityId);
  if (params.actorId != null) q.set('actor_id', String(params.actorId));
  if (params.search) q.set('search', params.search);
  if (params.limit != null) q.set('limit', String(params.limit));
  if (params.offset != null) q.set('offset', String(params.offset));
  const s = q.toString();
  return s ? `?${s}` : '';
}

export const getOverviewKpis = (params) =>
  apiRequest(`${BASE}/overview${buildQuery(params)}`).then((r) => ({
    kpis: r?.kpis ?? {},
    health: r?.health ?? {},
  })).catch(() => ({ kpis: {}, health: {} }));

export const getApiTelemetry = (params) =>
  apiRequest(`${BASE}/api${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getApiTelemetryDetail = (endpointId, params) =>
  apiRequest(`${BASE}/api/${encodeURIComponent(endpointId)}${buildQuery(params)}`).then((r) => ({
    endpoint: r?.endpoint ?? null,
    requests: r?.requests ?? [],
  })).catch(() => ({ endpoint: null, requests: [] }));

export const getUserActivity = (params) =>
  apiRequest(`${BASE}/user-activity${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getAuditLogs = (params) =>
  apiRequest(`${BASE}/audit${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getSecurityEvents = (params) =>
  apiRequest(`${BASE}/security${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getSocialTelemetry = (params) =>
  apiRequest(`${BASE}/social${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
    summary: r?.summary ?? {},
  })).catch(() => ({ items: [], total: 0, summary: {} }));

export const getNetworkTelemetry = (params) =>
  apiRequest(`${BASE}/network${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getEntityChangeHistory = (params) =>
  apiRequest(`${BASE}/entity-history${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getJobs = (params) =>
  apiRequest(`${BASE}/jobs${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getWebhookDeliveries = (params) =>
  apiRequest(`${BASE}/webhooks${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getErrors = (params) =>
  apiRequest(`${BASE}/errors${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
    summary: r?.summary ?? {},
  })).catch(() => ({ items: [], total: 0, summary: {} }));

export const getSearchTelemetry = (params) =>
  apiRequest(`${BASE}/search${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getModerationEvents = (params) =>
  apiRequest(`${BASE}/moderation${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));

export const getComplianceExports = (params) =>
  apiRequest(`${BASE}/compliance${buildQuery(params)}`).then((r) => ({
    items: r?.items ?? [],
    total: r?.total ?? 0,
  })).catch(() => ({ items: [], total: 0 }));
