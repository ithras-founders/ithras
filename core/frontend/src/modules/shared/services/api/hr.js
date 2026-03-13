/** Recruiter Mode API: Job Profiles, Discovery, Match Stats, Outreach */
import { apiRequest } from './apiBase.js';

export const createJobProfile = (data) =>
  apiRequest('/v1/hr/job-profiles', { method: 'POST', body: JSON.stringify(data) });

export const getJobProfiles = () =>
  apiRequest('/v1/hr/job-profiles');

export const getJobProfile = (id) =>
  apiRequest(`/v1/hr/job-profiles/${id}`);

export const updateJobProfile = (id, data) =>
  apiRequest(`/v1/hr/job-profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) });

export const publishJobProfile = (id) =>
  apiRequest(`/v1/hr/job-profiles/${id}/publish`, { method: 'POST' });

export const extractJDFromText = (jdText) =>
  apiRequest('/v1/hr/job-profiles/extract-jd', { method: 'POST', body: JSON.stringify({ jd_text: jdText }) });

export const createWorkflowFromProfile = (profileId, data) =>
  apiRequest(`/v1/hr/job-profiles/${profileId}/create-workflow`, { method: 'POST', body: JSON.stringify(data) });

export const getDiscoveryCandidates = (params = {}) => {
  const search = new URLSearchParams();
  if (params.job_profile_id) search.set('job_profile_id', params.job_profile_id);
  if (params.institution_id) search.set('institution_id', params.institution_id);
  if (params.program_id) search.set('program_id', params.program_id);
  if (params.sector) search.set('sector', params.sector);
  if (params.min_cgpa != null) search.set('min_cgpa', params.min_cgpa);
  if (params.max_backlogs != null) search.set('max_backlogs', params.max_backlogs);
  if (params.role) search.set('role', params.role);
  if (params.q) search.set('q', params.q);
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/hr/discovery/candidates${qs ? `?${qs}` : ''}`);
};

export const getMatchStats = (jobProfileId) =>
  apiRequest('/v1/hr/discovery/match-stats', { method: 'POST', body: JSON.stringify({ job_profile_id: jobProfileId }) });

export const aiRankCandidates = (jobProfileId, candidateIds, maxCandidates = 20) =>
  apiRequest('/v1/hr/discovery/ai-rank', {
    method: 'POST',
    body: JSON.stringify({ job_profile_id: jobProfileId, candidate_ids: candidateIds, max_candidates: maxCandidates }),
  });

export const sendOutreach = (data) =>
  apiRequest('/v1/hr/outreach', { method: 'POST', body: JSON.stringify(data) });

export const getOutreachList = (role) =>
  apiRequest(`/v1/hr/outreach?role=${role}`);

export const respondOutreach = (outreachId, status) =>
  apiRequest(`/v1/hr/outreach/${outreachId}/respond`, { method: 'PUT', body: JSON.stringify({ status }) });
