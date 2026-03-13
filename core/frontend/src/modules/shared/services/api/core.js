/** Core API: institutions, users, companies */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

export const getInstitutions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.limit != null) params.set('limit', filters.limit);
  if (filters.offset != null) params.set('offset', filters.offset);
  if (filters.q != null && String(filters.q).trim()) params.set('q', filters.q.trim());
  if (filters.institution_id != null) params.set('institution_id', filters.institution_id);
  if (filters.include_counts === true) params.set('include_counts', 'true');
  const res = await apiRequest(`/v1/institutions${params.toString() ? `?${params}` : ''}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
};
export const getInstitution = (id) => apiRequest(`/v1/institutions/${id}`);
export const createInstitution = (institutionData) =>
  apiRequest('/v1/institutions', { method: 'POST', body: JSON.stringify(institutionData) });
export const updateInstitution = (id, institutionData) =>
  apiRequest(`/v1/institutions/${id}`, { method: 'PUT', body: JSON.stringify(institutionData) });
export const deleteInstitution = (id) =>
  apiRequest(`/v1/institutions/${id}`, { method: 'DELETE' });

export const getPrograms = (institutionId) =>
  apiRequest(`/v1/institutions/${institutionId}/programs`);
export const getInstitutionAbout = (institutionId) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/about`);
export const getInstitutionStructure = (institutionId) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/structure`);
export const getProgram = (id) => apiRequest(`/v1/programs/${id}`);
export const createProgram = (institutionId, programData) =>
  apiRequest(`/v1/institutions/${institutionId}/programs`, {
    method: 'POST',
    body: JSON.stringify({ ...programData, institution_id: institutionId })
  });
export const updateProgram = (id, programData) =>
  apiRequest(`/v1/programs/${id}`, { method: 'PUT', body: JSON.stringify(programData) });
export const deleteProgram = (id) =>
  apiRequest(`/v1/programs/${id}`, { method: 'DELETE' });

export const getBatches = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/batches${params ? `?${params}` : ''}`);
};
export const getBatch = (id) => apiRequest(`/v1/batches/${id}`);
export const createBatch = (data) =>
  apiRequest('/v1/batches', { method: 'POST', body: JSON.stringify(data) });
export const updateBatch = (id, data) =>
  apiRequest(`/v1/batches/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteBatch = (id) =>
  apiRequest(`/v1/batches/${id}`, { method: 'DELETE' });

export const seedSystemAdmin = () =>
  apiRequest('/v1/admin/seed-system-admin', { method: 'POST' });

export const getPendingInstitutions = () =>
  apiRequest('/v1/admin/institutions/pending');
export const getPendingCompanies = () =>
  apiRequest('/v1/admin/companies/pending');
export const approveInstitution = (id, data) =>
  apiRequest(`/v1/admin/institutions/${id}/approve`, { method: 'POST', body: JSON.stringify(data) });
export const rejectInstitution = (id, data) =>
  apiRequest(`/v1/admin/institutions/${id}/reject`, { method: 'POST', body: JSON.stringify(data || {}) });
export const approveCompany = (id, data) =>
  apiRequest(`/v1/admin/companies/${id}/approve`, { method: 'POST', body: JSON.stringify(data) });
export const rejectCompany = (id, data) =>
  apiRequest(`/v1/admin/companies/${id}/reject`, { method: 'POST', body: JSON.stringify(data || {}) });

/** Validate current session. Returns { user } or throws on 401. Use before restoring from localStorage. */
export const validateSession = () =>
  apiRequest('/v1/auth/me', { quiet: true });

/** Update current user's display name or email. Returns { user }. */
export const updateMe = (data) =>
  apiRequest('/v1/auth/me', { method: 'PATCH', body: JSON.stringify(data) });

/** Login with email and password. Returns user object or throws on 401. */
export const login = (email, password) =>
  apiRequest('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    quiet: true,
  });

/** Self-register for general users (no institution). Returns same shape as login. */
export const register = (data) =>
  apiRequest('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });

export const getUsers = async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => {
    if (v != null && v !== '') params.set(k, v);
  });
  const res = await apiRequest(`/v1/users${params.toString() ? `?${params}` : ''}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
};
export const getUser = (id) => apiRequest(`/v1/users/${id}`);
export const getUserProfile = (id) => apiRequest(`/v1/users/${id}/profile`);
export const createUser = (userData) =>
  apiRequest('/v1/users', { method: 'POST', body: JSON.stringify(userData) });
export const updateUser = (id, userData) =>
  apiRequest(`/v1/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) });
export const deleteUser = (id) =>
  apiRequest(`/v1/users/${id}`, { method: 'DELETE' });
export const createUserProfileChangeRequest = (userId, payload) =>
  apiRequest(`/v1/users/${userId}/profile-change-requests`, { method: 'POST', body: JSON.stringify(payload) });
export const getUserProfileChangeRequests = (userId) =>
  apiRequest(`/v1/users/${userId}/profile-change-requests`);
export const getProfileChangeRequests = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/users/requests/profile-change${params ? `?${params}` : ''}`);
};
export const approveProfileChangeRequest = (requestId, reviewedBy) =>
  apiRequest(`/v1/users/profile-change-requests/${requestId}/approve`, {
    method: 'PUT',
    body: JSON.stringify({ reviewed_by: reviewedBy }),
  });
export const rejectProfileChangeRequest = (requestId, reviewedBy, rejectionReason) =>
  apiRequest(`/v1/users/profile-change-requests/${requestId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ reviewed_by: reviewedBy, rejection_reason: rejectionReason }),
  });

export const uploadProfilePhoto = async (userId, file) => {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('file', file);
  const r = await fetch(`${base}/v1/users/${userId}/profile-photo`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!r.ok) throw new Error(await r.text() || 'Profile photo upload failed');
  const data = await r.json();
  return data;
};

const DEMO_COMPANY = { id: 'demo-company', name: 'TechCorp India', logo: null };

export const getCompanies = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.limit != null) params.set('limit', filters.limit);
  if (filters.offset != null) params.set('offset', filters.offset);
  if (filters.q != null && String(filters.q).trim()) params.set('q', filters.q.trim());
  if (filters.include_counts === true) params.set('include_counts', 'true');
  const res = await apiRequest(`/v1/companies${params.toString() ? `?${params}` : ''}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
};
export const getCompany = (id) => id === 'demo-company' ? Promise.resolve(DEMO_COMPANY) : apiRequest(`/v1/companies/${id}`);
export const getCompanyAbout = (id) => id === 'demo-company' ? Promise.resolve(null) : apiRequest(`/v1/organizations/companies/${id}/about`);
export const getCompanyJobs = (id) => apiRequest(`/v1/companies/${id}/jobs`);

/** Entity About admin - Business Units */
export const getCompanyBusinessUnits = (companyId) =>
  apiRequest(`/v1/organizations/companies/${companyId}/business-units`);
export const createBusinessUnit = (companyId, data) =>
  apiRequest(`/v1/organizations/companies/${companyId}/business-units`, { method: 'POST', body: JSON.stringify(data) });
export const deleteBusinessUnit = (companyId, buId) =>
  apiRequest(`/v1/organizations/companies/${companyId}/business-units/${buId}`, { method: 'DELETE' });

/** Entity About admin - Company Functions */
export const getCompanyFunctions = (companyId) =>
  apiRequest(`/v1/organizations/companies/${companyId}/functions`);
export const createCompanyFunction = (companyId, data) =>
  apiRequest(`/v1/organizations/companies/${companyId}/functions`, { method: 'POST', body: JSON.stringify(data) });
export const deleteCompanyFunction = (companyId, fnId) =>
  apiRequest(`/v1/organizations/companies/${companyId}/functions/${fnId}`, { method: 'DELETE' });

/** Entity About admin - Company Designations */
export const getCompanyDesignations = (companyId) =>
  apiRequest(`/v1/organizations/companies/${companyId}/designations`);
export const createCompanyDesignation = (companyId, data) =>
  apiRequest(`/v1/organizations/companies/${companyId}/designations`, { method: 'POST', body: JSON.stringify(data) });
export const deleteCompanyDesignation = (companyId, desId) =>
  apiRequest(`/v1/organizations/companies/${companyId}/designations/${desId}`, { method: 'DELETE' });

/** Entity About admin - Institution Degrees */
export const getInstitutionDegrees = (institutionId) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/degrees`);
export const createInstitutionDegree = (institutionId, data) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/degrees`, { method: 'POST', body: JSON.stringify(data) });
export const deleteInstitutionDegree = (institutionId, degId) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/degrees/${degId}`, { method: 'DELETE' });

/** Entity About admin - Institution Certifications */
export const getInstitutionCertifications = (institutionId) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/certifications`);
export const createInstitutionCertification = (institutionId, data) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/certifications`, { method: 'POST', body: JSON.stringify(data) });
export const deleteInstitutionCertification = (institutionId, certId) =>
  apiRequest(`/v1/organizations/institutions/${institutionId}/certifications/${certId}`, { method: 'DELETE' });
export const getCompanyHires = (id) => apiRequest(`/v1/companies/${id}/hires`);
export const createCompany = (companyData) =>
  apiRequest('/v1/companies', { method: 'POST', body: JSON.stringify(companyData) });
export const updateCompany = (id, companyData) =>
  apiRequest(`/v1/companies/${id}`, { method: 'PUT', body: JSON.stringify(companyData) });
export const deleteCompany = (id) =>
  apiRequest(`/v1/companies/${id}`, { method: 'DELETE' });

/** Database introspection (System Admin) */
export const getDatabaseTables = ({ page = 1, page_size = 20, search, sort_by = 'table_name', order = 'asc' } = {}) => {
  const params = new URLSearchParams({ page, page_size, sort_by, order });
  if (search && search.trim()) params.set('search', search.trim());
  return apiRequest(`/v1/admin/database/tables?${params.toString()}`);
};
export const getTableDetails = (tableName) =>
  apiRequest(`/v1/admin/database/tables/${encodeURIComponent(tableName)}`);
export const refreshDatabaseStats = () =>
  apiRequest('/v1/admin/database/refresh-stats', { method: 'POST' });

/** Migrations (System Admin) */
export const getMigrationsStatus = () =>
  apiRequest('/v1/admin/migrations/status');
export const runMigrations = () =>
  apiRequest('/v1/admin/migrations/run', { method: 'POST' });

/** Tests (System Admin) */
export const getTestEnvironment = () =>
  apiRequest('/v1/admin/tests/environment');
export const getTestSuites = () =>
  apiRequest('/v1/admin/tests/suites');
export const getTestRuns = (limit = 20) =>
  apiRequest(`/v1/admin/tests/runs?limit=${limit}`);
export const getTestRun = (runId) =>
  apiRequest(`/v1/admin/tests/runs/${encodeURIComponent(runId)}`);
export const runTests = (suite) =>
  apiRequest('/v1/admin/tests/run', { method: 'POST', body: JSON.stringify({ suite }) });
