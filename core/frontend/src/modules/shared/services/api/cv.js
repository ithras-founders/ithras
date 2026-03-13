/** CV API: templates (read-only) and CVs */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

export const getCVTemplates = (institutionId, allocatedFor, options = {}) => {
  const p = new URLSearchParams();
  if (institutionId) p.set('institution_id', institutionId);
  if (allocatedFor) p.set('allocated_for', allocatedFor);
  const limit = options.limit ?? 100;
  const offset = options.offset ?? 0;
  p.set('limit', String(limit));
  p.set('offset', String(offset));
  if (options.include_visibility === true) p.set('include_visibility', 'true');
  const q = p.toString();
  return apiRequest(`/v1/cv-templates${q ? `?${q}` : ''}`);
};

export const getTemplateAllocations = (institutionId) =>
  apiRequest(`/v1/cv-templates/allocations/${institutionId}`);

export const getTemplateAllocationsForUser = (userId) =>
  apiRequest(`/v1/cv-templates/allocations/for-user/${userId}`);

export const getCVTemplate = (id) => apiRequest(`/v1/cv-templates/${id}`);

export const getTemplateVisibility = (templateId) =>
  apiRequest(`/v1/cv-templates/${templateId}/visibility`);

export const updateTemplateVisibility = (templateId, payload) =>
  apiRequest(`/v1/cv-templates/${templateId}/visibility`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getActiveTemplate = async (institutionId, programId = null, department = null, batchId = null) => {
  const params = new URLSearchParams({ institution_id: institutionId });
  if (programId) params.append('program_id', programId);
  if (department) params.append('department', department);
  if (batchId) params.append('batch_id', batchId);
  try {
    return await apiRequest(`/v1/cv-templates/active?${params.toString()}`);
  } catch (error) {
    if (error.message && (error.message.includes('404') || error.message.includes('CV template not found'))) return null;
    throw error;
  }
};

export const getCVs = (filters = {}) => {
  const params = new URLSearchParams(filters).toString();
  return apiRequest(`/v1/cvs${params ? `?${params}` : ''}`);
};
export const getCV = (id) => apiRequest(`/v1/cvs/${id}`);
export const getCVVersions = (cvId) => apiRequest(`/v1/cvs/${cvId}/versions`);
export const restoreCVVersion = (cvId, versionId) =>
  apiRequest(`/v1/cvs/${cvId}/restore`, { method: 'POST', body: JSON.stringify({ version_id: versionId }) });
export const createCV = (cvData) =>
  apiRequest('/v1/cvs', { method: 'POST', body: JSON.stringify(cvData) });
export const updateCV = (id, cvData) =>
  apiRequest(`/v1/cvs/${id}`, { method: 'PUT', body: JSON.stringify(cvData) });
export const verifyCV = (id, verificationData) =>
  apiRequest(`/v1/cvs/${id}/verify`, { method: 'POST', body: JSON.stringify(verificationData) });

export const verifyCVEntry = (cvId, { section_id, entry_index, bullet_index, status, notes, verified_by }) =>
  apiRequest(`/v1/cvs/${cvId}/verify-entry`, {
    method: 'POST',
    body: JSON.stringify({
      section_id,
      entry_index: entry_index ?? 0,
      ...(bullet_index != null && { bullet_index }),
      status,
      notes: notes ?? '',
      verified_by,
    }),
  });

export const uploadProof = async (file) => {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('file', file);
  const r = await fetch(`${base}/v1/cvs/proof-upload`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });
  if (!r.ok) throw new Error(await r.text() || 'Proof upload failed');
  const data = await r.json();
  return data.url;
};

export const saveCVPdf = async (cvId, file) => {
  if (!cvId) throw new Error('cvId is required');
  if (!file) throw new Error('PDF file is required');

  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('file', file);

  const r = await fetch(`${base}/v1/cvs/${cvId}/pdf`, {
    method: 'POST',
    body: form,
    credentials: 'include',
  });

  if (!r.ok) {
    const errorText = await r.text().catch(() => '');
    throw new Error(errorText || 'Failed to save CV PDF');
  }

  return r.json();
};
