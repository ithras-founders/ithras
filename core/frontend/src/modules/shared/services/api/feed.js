/** Feed API: posts, likes, comments, views, engagement */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

export const createFeedPost = (text, imageUrls = []) =>
  apiRequest('/v1/feed/posts', {
    method: 'POST',
    body: JSON.stringify({ text: text || '', image_urls: imageUrls || [] }),
  });

export const getFeedPosts = (params = {}) => {
  const search = new URLSearchParams();
  if (params.authorId) search.set('author_id', params.authorId);
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/feed/posts${qs ? `?${qs}` : ''}`);
};

export const getFeedPost = (postId) =>
  apiRequest(`/v1/feed/posts/${postId}`);

export const likeFeedPost = (postId) =>
  apiRequest(`/v1/feed/posts/${postId}/like`, { method: 'POST' });

export const addFeedComment = (postId, text) =>
  apiRequest(`/v1/feed/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ text: text || '' }),
  });

export const getFeedComments = (postId, params = {}) => {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/feed/posts/${postId}/comments${qs ? `?${qs}` : ''}`);
};

export const recordFeedPostView = (postId) =>
  apiRequest(`/v1/feed/posts/${postId}/view`, { method: 'POST' });

export const getFeedEngagement = (userId) =>
  apiRequest(`/v1/feed/engagement/${userId}`);

// Network (follow, connections)
export const followUser = (userId) =>
  apiRequest(`/v1/feed/network/follow/${userId}`, { method: 'POST' });

export const unfollowUser = (userId) =>
  apiRequest(`/v1/feed/network/follow/${userId}`, { method: 'DELETE' });

export const getNetworkStatus = (userId) =>
  apiRequest(`/v1/feed/network/status/${userId}`);

export const getNetworkFollowers = (params = {}) => {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/feed/network/followers${qs ? `?${qs}` : ''}`);
};

export const getNetworkFollowing = (params = {}) => {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/feed/network/following${qs ? `?${qs}` : ''}`);
};

export const getNetworkConnections = (params = {}) => {
  const search = new URLSearchParams();
  if (params.limit != null) search.set('limit', params.limit);
  if (params.offset != null) search.set('offset', params.offset);
  const qs = search.toString();
  return apiRequest(`/v1/feed/network/connections${qs ? `?${qs}` : ''}`);
};

export const uploadFeedImage = async (file) => {
  const base = getApiBaseUrl();
  const form = new FormData();
  form.append('file', file);
  let sessionId;
  let authToken;
  try {
    sessionId = sessionStorage.getItem('ithras_session_id');
    const saved = localStorage.getItem('ithras_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      authToken = parsed?.access_token || parsed?.session_id || parsed?.sessionId;
    }
  } catch (_) {}
  const headers = {
    ...(sessionId ? { 'x-session-id': sessionId } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
  const r = await fetch(`${base}/v1/upload/feed-image`, {
    method: 'POST',
    body: form,
    credentials: 'include',
    headers,
  });
  if (!r.ok) throw new Error(await r.text() || 'Feed image upload failed');
  const data = await r.json();
  return data;
};
