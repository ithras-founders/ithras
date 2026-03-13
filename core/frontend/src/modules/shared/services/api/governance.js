/** Governance API: policies, workflow approvals, notifications, JD submissions, bulk ops */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

export const getPolicies = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/policies${params ? `?${params}` : ''}`);
};
export const getActivePolicy = () => apiRequest('/v1/policies/active');
export const getPendingProposals = () => apiRequest('/v1/policies/pending');
export const getPolicy = (id) => apiRequest(`/v1/policies/${id}`);
export const getPolicyTemplates = (institutionId) => {
  const params = institutionId ? `?institution_id=${institutionId}&is_template=true` : '?is_template=true';
  return apiRequest(`/v1/policies/templates${params}`);
};
export const applyPolicyTemplate = (templateId, cycleId, name) =>
  apiRequest(`/v1/policies/templates/${templateId}/apply`, {
    method: 'POST',
    body: JSON.stringify({ template_id: templateId, cycle_id: cycleId, name }),
  });
export const assignTemplateToInstitution = (templateId, { institution_id, program_id, name }) =>
  apiRequest(`/v1/policies/templates/${templateId}/assign-institution`, {
    method: 'POST',
    body: JSON.stringify({ institution_id, program_id: program_id || null, name: name || null }),
  });
export const createPolicy = (policyData) =>
  apiRequest('/v1/policies', { method: 'POST', body: JSON.stringify(policyData) });
export const updatePolicy = (id, policyData) =>
  apiRequest(`/v1/policies/${id}`, { method: 'PUT', body: JSON.stringify(policyData) });

export const getWorkflowApprovals = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/workflow-approvals${params ? `?${params}` : ''}`);
};
export const getWorkflowApproval = (id) => apiRequest(`/v1/workflow-approvals/${id}`);
export const createWorkflowApproval = (approvalData) =>
  apiRequest('/v1/workflow-approvals', { method: 'POST', body: JSON.stringify(approvalData) });
export const approveWorkflowRequest = (approvalId, approverId) =>
  apiRequest(`/v1/workflow-approvals/${approvalId}/approve?approver_id=${approverId}`, { method: 'PUT' });
export const rejectWorkflowRequest = (approvalId, approverId, rejectionReason) =>
  apiRequest(`/v1/workflow-approvals/${approvalId}/reject?approver_id=${approverId}&rejection_reason=${encodeURIComponent(rejectionReason)}`, { method: 'PUT' });

export const getApplicationRequests = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/application-requests${params ? `?${params}` : ''}`);
};
export const getApplicationRequest = (id) => apiRequest(`/v1/application-requests/${id}`);
export const createApplicationRequest = (data) =>
  apiRequest('/v1/application-requests', { method: 'POST', body: JSON.stringify(data) });
export const approveApplicationRequest = (requestId, approverId) =>
  apiRequest(`/v1/application-requests/${requestId}/approve?approver_id=${approverId}`, { method: 'PUT' });
export const rejectApplicationRequest = (requestId, approverId, rejectionReason) =>
  apiRequest(`/v1/application-requests/${requestId}/reject?approver_id=${approverId}&rejection_reason=${encodeURIComponent(rejectionReason)}`, { method: 'PUT' });

export const getJDSubmissions = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/jd-submissions${params ? `?${params}` : ''}`);
};
export const createJDSubmission = (submissionData) =>
  apiRequest('/v1/jd-submissions', { method: 'POST', body: JSON.stringify(submissionData) });
export const getJDSubmission = (id) => apiRequest(`/v1/jd-submissions/${id}`);
export const approveJDSubmission = (submissionId) =>
  apiRequest(`/v1/jd-submissions/${submissionId}/approve`, { method: 'PUT' });
export const rejectJDSubmission = (submissionId, reason = '') =>
  apiRequest(`/v1/jd-submissions/${submissionId}/reject?rejection_reason=${encodeURIComponent(reason)}`, { method: 'PUT' });

export const getNotifications = (userId, isRead = null) => {
  const params = new URLSearchParams({ user_id: userId });
  if (isRead !== null) params.append('is_read', isRead);
  return apiRequest(`/v1/notifications?${params}`);
};
export const getUnreadNotificationCount = (userId) =>
  apiRequest(`/v1/notifications/unread-count?user_id=${userId}`);
export const markNotificationRead = (notificationId) =>
  apiRequest(`/v1/notifications/${notificationId}/read`, { method: 'PUT' });
export const markAllNotificationsRead = (userId) =>
  apiRequest(`/v1/notifications/read-all?user_id=${userId}`, { method: 'PUT' });
export const getNotificationPreferences = () =>
  apiRequest('/v1/notifications/preferences');
export const updateNotificationPreferences = (data) =>
  apiRequest('/v1/notifications/preferences', { method: 'PUT', body: JSON.stringify(data) });

export const downloadCVsBulk = (workflowId = null, jobId = null) => {
  const params = new URLSearchParams();
  if (workflowId) params.append('workflow_id', workflowId);
  if (jobId) params.append('job_id', jobId);
  const url = `${getApiBaseUrl()}/v1/bulk/download-cvs?${params}`;
  return fetch(url, { method: 'POST' }).then(res => {
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText}`);
    return res.blob();
  });
};
export const progressStudentsBulk = (workflowId, stageId, studentIds, requestedBy) =>
  apiRequest('/v1/bulk/progress-students', {
    method: 'POST',
    body: JSON.stringify({
      workflow_id: workflowId,
      stage_id: stageId,
      student_ids: studentIds,
      requested_by: requestedBy,
    }),
  });
