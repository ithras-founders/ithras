/** Preparation API: prep intake, community, moderation */
import { apiRequest } from './apiBase.js';

// ─── Communities ─────────────────────────────────────────────────────────────
export const listPrepCommunities = (params = {}) => {
  const search = new URLSearchParams();
  if (params.joined) search.set('joined', 'true');
  const qs = search.toString();
  return apiRequest(`/v1/prep-community/communities${qs ? `?${qs}` : ''}`);
};

export const getPrepCommunity = (idOrCode) =>
  apiRequest(`/v1/prep-community/communities/${encodeURIComponent(idOrCode)}`);

export const joinPrepCommunity = (communityId) =>
  apiRequest(`/v1/prep-community/communities/${encodeURIComponent(communityId)}/join`, { method: 'POST' });

export const leavePrepCommunity = (communityId) =>
  apiRequest(`/v1/prep-community/communities/${encodeURIComponent(communityId)}/leave`, { method: 'DELETE' });

// ─── Channels ───────────────────────────────────────────────────────────────
export const listPrepCommunityChannels = (params = {}) => {
  const search = new URLSearchParams();
  if (params.community_id) search.set('community_id', params.community_id);
  const qs = search.toString();
  return apiRequest(`/v1/prep-community/channels${qs ? `?${qs}` : ''}`);
};

export const joinPrepChannel = (channelId) =>
  apiRequest(`/v1/prep-community/channels/${encodeURIComponent(channelId)}/join`, { method: 'POST' });

export const leavePrepChannel = (channelId) =>
  apiRequest(`/v1/prep-community/channels/${encodeURIComponent(channelId)}/leave`, { method: 'DELETE' });

// ─── Posts ───────────────────────────────────────────────────────────────────
export const listPrepCommunityPosts = (params = {}) => {
  const search = new URLSearchParams();
  if (params.channel) search.set('channel', params.channel);
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/prep-community/posts${qs ? `?${qs}` : ''}`);
};

export const getPrepCommunityPost = (postId) =>
  apiRequest(`/v1/prep-community/posts/${postId}`);

export const createPrepCommunityPost = (data) =>
  apiRequest('/v1/prep-community/posts', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// ─── Comments (replies) ──────────────────────────────────────────────────────
export const listPrepCommunityComments = (postId) =>
  apiRequest(`/v1/prep-community/posts/${postId}/comments`);

export const createPrepCommunityComment = (postId, body) =>
  apiRequest(`/v1/prep-community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

// ─── Moderation (community_admin) ────────────────────────────────────────────
export const listPrepAdminPosts = (params = {}) => {
  const search = new URLSearchParams();
  if (params.channel) search.set('channel', params.channel);
  if (params.status) search.set('status', params.status);
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/prep-community/admin/posts${qs ? `?${qs}` : ''}`);
};

export const hidePrepPost = (postId, reason) => {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiRequest(`/v1/prep-community/admin/posts/${postId}/hide${qs}`, { method: 'PATCH' });
};

export const unhidePrepPost = (postId) =>
  apiRequest(`/v1/prep-community/admin/posts/${postId}/unhide`, { method: 'PATCH' });

export const pinPrepPost = (postId) =>
  apiRequest(`/v1/prep-community/admin/posts/${postId}/pin`, { method: 'PATCH' });

export const unpinPrepPost = (postId) =>
  apiRequest(`/v1/prep-community/admin/posts/${postId}/unpin`, { method: 'PATCH' });

export const deletePrepPost = (postId, reason) => {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiRequest(`/v1/prep-community/admin/posts/${postId}${qs}`, { method: 'DELETE' });
};

export const hidePrepComment = (commentId, reason) => {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiRequest(`/v1/prep-community/admin/comments/${commentId}/hide${qs}`, { method: 'PATCH' });
};

export const unhidePrepComment = (commentId) =>
  apiRequest(`/v1/prep-community/admin/comments/${commentId}/unhide`, { method: 'PATCH' });

export const deletePrepComment = (commentId, reason) => {
  const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
  return apiRequest(`/v1/prep-community/admin/comments/${commentId}${qs}`, { method: 'DELETE' });
};

// ─── Community management (moderators) ───────────────────────────────────────
export const listPrepModerators = () =>
  apiRequest('/v1/admin/prep-community/moderators');

export const assignPrepModerator = (userId, roleId = 'PREP_COMMUNITY_MODERATOR') =>
  apiRequest('/v1/admin/prep-community/moderators', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role_id: roleId }),
  });

export const removePrepModerator = (userId, roleId = 'PREP_COMMUNITY_MODERATOR') =>
  apiRequest(`/v1/admin/prep-community/moderators/${userId}?role_id=${encodeURIComponent(roleId)}`, { method: 'DELETE' });

export const listPrepAdminChannels = () =>
  apiRequest('/v1/admin/prep-community/channels');

// ─── CAT Prep ──────────────────────────────────────────────────────────────
export const getCATTopicTaxonomy = () =>
  apiRequest('/v1/prep-cat/topics');

export const getCATAvailableMocks = () =>
  apiRequest('/v1/prep-cat/mocks/available');

export const startCATMock = (data) =>
  apiRequest('/v1/prep-cat/mocks/start', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const submitCATMock = (sessionId, responses) =>
  apiRequest(`/v1/prep-cat/mocks/${encodeURIComponent(sessionId)}/submit`, {
    method: 'POST',
    body: JSON.stringify({ responses }),
  });

export const getCATDashboard = () =>
  apiRequest('/v1/prep-cat/dashboard');

export const getCATInsights = () =>
  apiRequest('/v1/prep-cat/insights');

export const getCATMockHistory = (limit = 20) =>
  apiRequest(`/v1/prep-cat/history?limit=${limit}`);
