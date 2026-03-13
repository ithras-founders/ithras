/** Analytics API - database, reports, schedules, export */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

const base = '/v1/analytics';

export const getAnalyticsTables = ({ page = 1, page_size = 20, search, sort_by = 'table_name', order = 'asc' } = {}) => {
  const params = new URLSearchParams({ page, page_size, sort_by, order });
  if (search && search.trim()) params.set('search', search.trim());
  return apiRequest(`${base}/database/tables?${params.toString()}`);
};

export const getAnalyticsTableDetails = (tableName) =>
  apiRequest(`${base}/database/tables/${encodeURIComponent(tableName)}`);

export const refreshAnalyticsStats = () =>
  apiRequest(`${base}/database/refresh-stats`, { method: 'POST' });

export const executeAnalyticsQuery = ({ query, params = [], read_only = true }) =>
  apiRequest(`${base}/database/execute`, {
    method: 'POST',
    body: JSON.stringify({ query, params, read_only }),
  });

export const getReports = () => apiRequest(`${base}/reports`);
export const getReport = (id) => apiRequest(`${base}/reports/${id}`);
export const createReport = (data) =>
  apiRequest(`${base}/reports`, { method: 'POST', body: JSON.stringify(data) });
export const updateReport = (id, data) =>
  apiRequest(`${base}/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteReport = (id) =>
  apiRequest(`${base}/reports/${id}`, { method: 'DELETE' });

export const getSchedules = () => apiRequest(`${base}/schedules`);
export const getSchedule = (id) => apiRequest(`${base}/schedules/${id}`);
export const createSchedule = (data) =>
  apiRequest(`${base}/schedules`, { method: 'POST', body: JSON.stringify(data) });
export const updateSchedule = (id, data) =>
  apiRequest(`${base}/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteSchedule = (id) =>
  apiRequest(`${base}/schedules/${id}`, { method: 'DELETE' });

export const getDashboards = () => apiRequest(`${base}/dashboards`);
export const getDashboard = (id) => apiRequest(`${base}/dashboards/${id}`);
export const createDashboard = (data) =>
  apiRequest(`${base}/dashboards`, { method: 'POST', body: JSON.stringify(data) });
export const updateDashboard = (id, data) =>
  apiRequest(`${base}/dashboards/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteDashboard = (id) =>
  apiRequest(`${base}/dashboards/${id}`, { method: 'DELETE' });

export const exportAnalytics = async (params) => {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/v1/analytics/export`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(await res.text());
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `export_${Date.now()}.${params.format === 'xlsx' ? 'xlsx' : 'pdf'}`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
};
