/** Placement API: jobs, cycles, shortlists, workflows, applications */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

export const getJobs = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await apiRequest(`/v1/jobs${params ? `?${params}` : ''}`);
  if (filters.limit != null || filters.offset != null) return res;
  return res?.items ?? res ?? [];
};
export const getJob = (id) => apiRequest(`/v1/jobs/${id}`);
export const createJob = (jobData) =>
  apiRequest('/v1/jobs', { method: 'POST', body: JSON.stringify(jobData) });
export const updateJob = (id, jobData) =>
  apiRequest(`/v1/jobs/${id}`, { method: 'PUT', body: JSON.stringify(jobData) });

export const getCycles = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await apiRequest(`/v1/cycles${params ? `?${params}` : ''}`);
  if (filters.limit != null || filters.offset != null) return res;
  return res?.items ?? res ?? [];
};
export const getCycle = (id) => apiRequest(`/v1/cycles/${id}`);
export const getCycleStats = (id) => apiRequest(`/v1/cycles/${id}/stats`);
export const getCycleAnalytics = (id) => apiRequest(`/v1/cycles/${id}/analytics`);
export const createCycle = (cycleData) =>
  apiRequest('/v1/cycles', { method: 'POST', body: JSON.stringify(cycleData) });
export const updateCycle = (id, cycleData) =>
  apiRequest(`/v1/cycles/${id}`, { method: 'PUT', body: JSON.stringify(cycleData) });

export const getShortlists = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await apiRequest(`/v1/shortlists${params ? `?${params}` : ''}`);
  if (filters.limit != null || filters.offset != null) return res;
  return res?.items ?? res ?? [];
};
export const getShortlist = (id) => apiRequest(`/v1/shortlists/${id}`);
export const getUserShortlists = (userId) => apiRequest(`/v1/shortlists/user/${userId}`);
export const createShortlist = (data) =>
  apiRequest('/v1/shortlists', { method: 'POST', body: JSON.stringify(data) });
export const respondToShortlist = (id, status) =>
  apiRequest(`/v1/shortlists/${id}/respond`, { method: 'POST', body: JSON.stringify({ status }) });

export const getOffers = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/offers${params ? `?${params}` : ''}`);
};
export const getOffer = (id) => apiRequest(`/v1/offers/${id}`);
export const createOffer = (data) =>
  apiRequest('/v1/offers', { method: 'POST', body: JSON.stringify(data) });
export const acceptOffer = (id) =>
  apiRequest(`/v1/offers/${id}/accept`, { method: 'POST' });
export const rejectOffer = (id) =>
  apiRequest(`/v1/offers/${id}/reject`, { method: 'POST' });
export const withdrawOffer = (id) =>
  apiRequest(`/v1/offers/${id}/withdraw`, { method: 'POST' });

export const getWorkflows = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await apiRequest(`/v1/workflows${params ? `?${params}` : ''}`);
  if (filters.limit != null || filters.offset != null) return res;
  return res?.items ?? res ?? [];
};
export const getWorkflow = (id) => apiRequest(`/v1/workflows/${id}`);
export const createWorkflow = (workflowData) =>
  apiRequest('/v1/workflows', { method: 'POST', body: JSON.stringify(workflowData) });
export const updateWorkflow = (id, workflowData) =>
  apiRequest(`/v1/workflows/${id}`, { method: 'PUT', body: JSON.stringify(workflowData) });
export const getWorkflowStages = (workflowId) => apiRequest(`/v1/workflows/${workflowId}/stages`);
export const addWorkflowStage = (workflowId, stageData) =>
  apiRequest(`/v1/workflows/${workflowId}/stages`, { method: 'POST', body: JSON.stringify(stageData) });
export const updateWorkflowStage = (workflowId, stageId, stageData) =>
  apiRequest(`/v1/workflows/${workflowId}/stages/${stageId}`, { method: 'PUT', body: JSON.stringify(stageData) });
export const deleteWorkflowStage = (workflowId, stageId) =>
  apiRequest(`/v1/workflows/${workflowId}/stages/${stageId}`, { method: 'DELETE' });

export const getWorkflowTemplates = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/workflow-templates${params ? `?${params}` : ''}`);
};
export const getWorkflowTemplate = (id) => apiRequest(`/v1/workflow-templates/${id}`);
export const createWorkflowTemplate = (data) =>
  apiRequest('/v1/workflow-templates', { method: 'POST', body: JSON.stringify(data) });
export const updateWorkflowTemplate = (id, data) =>
  apiRequest(`/v1/workflow-templates/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteWorkflowTemplate = (id) =>
  apiRequest(`/v1/workflow-templates/${id}`, { method: 'DELETE' });
export const getWorkflowTemplateStages = (templateId) =>
  apiRequest(`/v1/workflow-templates/${templateId}/stages`);
export const addWorkflowTemplateStage = (templateId, stageData) =>
  apiRequest(`/v1/workflow-templates/${templateId}/stages`, { method: 'POST', body: JSON.stringify(stageData) });
export const applyWorkflowTemplate = (templateId, applyData) =>
  apiRequest(`/v1/workflow-templates/${templateId}/apply`, { method: 'POST', body: JSON.stringify(applyData) });

export const getApplications = async (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  const res = await apiRequest(`/v1/applications${params ? `?${params}` : ''}`);
  if (filters.limit != null || filters.offset != null) return res;
  return res?.items ?? res ?? [];
};
export const getApplication = (id) => apiRequest(`/v1/applications/${id}`);
export const getApplicationStageProgress = (applicationId) =>
  apiRequest(`/v1/applications/${applicationId}/stages`);
export const createApplication = (applicationData) =>
  apiRequest('/v1/applications', { method: 'POST', body: JSON.stringify(applicationData) });
export const downloadApplicationCV = (applicationId) => {
  const url = `${getApiBaseUrl()}/v1/applications/${applicationId}/cv`;
  return fetch(url).then(res => {
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return res.blob();
  });
};
