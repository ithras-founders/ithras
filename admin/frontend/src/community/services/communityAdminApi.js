/** Community Admin API - no mock data, works with empty arrays */
import { apiRequest } from '/shared/services/apiBase.js';

const base = '/v1/admin';

export const listCommunities = (params = {}) => {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.status) q.set('status', params.status);
  if (params.institution_id != null) q.set('institution_id', params.institution_id);
  if (params.organisation_id != null) q.set('organisation_id', params.organisation_id);
  if (params.function_key != null) q.set('function_key', params.function_key);
  if (params.has_channels != null) q.set('has_channels', params.has_channels);
  if (params.search) q.set('search', params.search);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const query = q.toString();
  return apiRequest(`${base}/communities${query ? `?${query}` : ''}`).then((r) => ({ items: r?.items || [], total: r?.total ?? 0 }));
};

export const getCommunity = (id) => apiRequest(`${base}/communities/${id}`);

export const createCommunity = (data) =>
  apiRequest(`${base}/communities`, { method: 'POST', body: JSON.stringify(data) });

export const updateCommunity = (id, data) =>
  apiRequest(`${base}/communities/${id}`, { method: 'PATCH', body: JSON.stringify(data) });

export const archiveCommunity = (id) =>
  apiRequest(`${base}/communities/${id}/archive`, { method: 'POST' });

export const deleteCommunity = (id) =>
  apiRequest(`${base}/communities/${id}`, { method: 'DELETE' });

export const listChannels = (communityId) =>
  apiRequest(`${base}/communities/${communityId}/channels`).then((r) => ({ items: r?.items || [], total: r?.total ?? 0 }));

export const createChannel = (communityId, data) =>
  apiRequest(`${base}/communities/${communityId}/channels`, { method: 'POST', body: JSON.stringify(data) });

export const updateChannel = (channelId, data) =>
  apiRequest(`${base}/channels/${channelId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const deleteChannel = (channelId) =>
  apiRequest(`${base}/channels/${channelId}`, { method: 'DELETE' });

export const listMembers = (communityId) =>
  apiRequest(`${base}/communities/${communityId}/members`).then((r) => ({ items: r?.items || [], total: r?.total ?? 0 }));

export const updateMemberRole = (communityId, userId, role) =>
  apiRequest(`${base}/communities/${communityId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });

export const removeMember = (communityId, userId) =>
  apiRequest(`${base}/communities/${communityId}/members/${userId}`, { method: 'DELETE' });

export const banMember = (communityId, userId) =>
  apiRequest(`${base}/communities/${communityId}/members/${userId}/ban`, { method: 'POST' });

export const listPosts = (communityId, params = {}) =>
  apiRequest(`${base}/communities/${communityId}/posts?limit=${params.limit ?? 50}&offset=${params.offset ?? 0}`).then((r) => ({
    items: r?.items || [],
    total: r?.total ?? 0,
  }));

export const updatePostModeration = (postId, data) =>
  apiRequest(`${base}/posts/${postId}`, { method: 'PATCH', body: JSON.stringify(data) });

export const flagPost = (postId) =>
  apiRequest(`${base}/posts/${postId}/flag`, { method: 'POST' });

export const listCommunityRequests = (params = {}) => {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const query = q.toString();
  return apiRequest(`${base}/community-requests${query ? `?${query}` : ''}`).then((r) => ({
    items: r?.items || [],
    total: r?.total ?? 0,
  }));
};

export const approveCommunityRequest = (requestId) =>
  apiRequest(`${base}/community-requests/${requestId}/approve`, { method: 'POST' });

export const rejectCommunityRequest = (requestId, reason) =>
  apiRequest(`${base}/community-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason: reason || null }),
  });

export const requestChangesCommunityRequest = (requestId, message) =>
  apiRequest(`${base}/community-requests/${requestId}/request-changes`, {
    method: 'POST',
    body: JSON.stringify({ message: message || null }),
  });

export const getCommunityActivity = (communityId, params = {}) =>
  apiRequest(`${base}/communities/${communityId}/activity?limit=${params.limit ?? 50}&offset=${params.offset ?? 0}`).then((r) => ({
    items: r?.items || [],
    total: r?.total ?? 0,
  }));
