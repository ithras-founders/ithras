/** Audit log API functions */
import { apiRequest } from './apiBase.js';

export const getAuditLogs = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.append(k, v);
  });
  const qs = params.toString();
  return apiRequest(`/v1/audit-logs/${qs ? '?' + qs : ''}`);
};

export const getEntityAuditTrail = (entityType, entityId, filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.append(k, v);
  });
  const qs = params.toString();
  return apiRequest(`/v1/audit-logs/${entityType}/${entityId}${qs ? '?' + qs : ''}`);
};

export const getAuditSummary = (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.append(k, v);
  });
  const qs = params.toString();
  return apiRequest(`/v1/audit-logs/summary${qs ? '?' + qs : ''}`);
};
