/** Telemetry API - metrics, summary, time-series, user activity, database health */
import { apiRequest } from './apiBase.js';

export const getTelemetryClientPages = (last = '1h') =>
  apiRequest(`/v1/telemetry/client/pages?last=${last}`);

export const getTelemetryClientApi = (last = '1h') =>
  apiRequest(`/v1/telemetry/client/api?last=${last}`);

export const getTelemetryMetrics = (params = {}) => {
  const q = new URLSearchParams();
  if (params.last) q.set('last', params.last);
  if (params.from != null) q.set('from', params.from);
  if (params.to != null) q.set('to', params.to);
  const query = q.toString();
  return apiRequest(`/v1/telemetry/metrics${query ? `?${query}` : ''}`);
};

export const getTelemetrySummary = (last = '1h') =>
  apiRequest(`/v1/telemetry/summary?last=${last}`);

export const getTelemetryTimeseries = (last = '1h', bucket = 60) =>
  apiRequest(`/v1/telemetry/timeseries?last=${last}&bucket=${bucket}`);

export const getTelemetryActiveUsers = (last = '1h') =>
  apiRequest(`/v1/telemetry/users/active?last=${last}`);

export const getTelemetryDatabase = () =>
  apiRequest(`/v1/telemetry/database`);

export const getTelemetryAuditLogs = (params = {}) => {
  const q = new URLSearchParams();
  if (params.limit) q.set('limit', params.limit);
  if (params.offset) q.set('offset', params.offset);
  if (params.action) q.set('action', params.action);
  if (params.user_id) q.set('user_id', params.user_id);
  const query = q.toString();
  return apiRequest(`/v1/telemetry/audit${query ? `?${query}` : ''}`);
};

export const getTelemetryFunnels = (last = '24h') =>
  apiRequest(`/v1/telemetry/funnels?last=${last}`).catch(() => ({ funnels: [] }));

export const getTelemetrySessions = (last = '24h') =>
  apiRequest(`/v1/telemetry/sessions?last=${last}`).catch(() => ({ sessions: [], total_sessions: 0 }));

export const getTelemetryAlerts = (last = '1h') =>
  apiRequest(`/v1/telemetry/alerts?last=${last}`).catch(() => ({ alerts: [], total: 0 }));
