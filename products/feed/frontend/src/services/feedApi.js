/**
 * Feed API - apiRequest wrappers for feed endpoints.
 */
import { apiRequest } from '/shared/services/apiBase.js';

const BASE = '/v1/feed';

export async function listCommunities(params = {}) {
  const q = new URLSearchParams();
  if (params.type) q.set('type', params.type);
  if (params.search) q.set('search', params.search);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/communities${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function getMyCommunities() {
  const res = await apiRequest(`${BASE}/communities/me`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function getCommunity(communityId) {
  return apiRequest(`${BASE}/communities/${communityId}`);
}

export async function getCommunityBySlug(slug) {
  return apiRequest(`${BASE}/communities/by-slug/${encodeURIComponent(slug)}`);
}

export async function listChannels(communityId) {
  const res = await apiRequest(`${BASE}/communities/${communityId}/channels`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function joinCommunity(communityId) {
  return apiRequest(`${BASE}/communities/${communityId}/join`, { method: 'POST' });
}

export async function leaveCommunity(communityId) {
  return apiRequest(`${BASE}/communities/${communityId}/leave`, { method: 'POST' });
}

export async function requestCommunity(data) {
  return apiRequest(`${BASE}/communities/requests`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getGlobalFeed(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/feed${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function getSavedFeed(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/feed/saved${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function getCommunityFeed(communityId, params = {}) {
  const q = new URLSearchParams();
  if (params.channel_id != null) q.set('channel_id', params.channel_id);
  if (params.sort) q.set('sort', params.sort);
  if (params.type) q.set('type', params.type);
  if (params.tags) q.set('tags', params.tags);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/communities/${communityId}/feed${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function getChannelFeed(channelId, params = {}) {
  const q = new URLSearchParams();
  if (params.sort) q.set('sort', params.sort);
  if (params.type) q.set('type', params.type);
  if (params.tags) q.set('tags', params.tags);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/channels/${channelId}/feed${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function createPost(data) {
  return apiRequest(`${BASE}/posts`, {
    method: 'POST',
    body: JSON.stringify({
      community_id: data.communityId,
      channel_id: data.channelId || null,
      type: data.type || 'discussion',
      title: data.title || '',
      content: data.content || '',
      tags: data.tags || [],
    }),
  });
}

export async function getPost(postId) {
  return apiRequest(`${BASE}/posts/${postId}`);
}

export async function updatePost(postId, data) {
  return apiRequest(`${BASE}/posts/${postId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      title: data.title,
      content: data.content,
      tags: data.tags,
    }),
  });
}

export async function deletePost(postId) {
  return apiRequest(`${BASE}/posts/${postId}`, { method: 'DELETE' });
}

export async function listComments(postId) {
  const res = await apiRequest(`${BASE}/posts/${postId}/comments`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function addComment(postId, content) {
  return apiRequest(`${BASE}/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
}

export async function acceptAnswer(postId, commentId) {
  return apiRequest(`${BASE}/posts/${postId}/comments/${commentId}/accept`, { method: 'POST' });
}

export async function addReaction(postId, type = 'upvote') {
  return apiRequest(`${BASE}/posts/${postId}/reactions?type=${encodeURIComponent(type)}`, { method: 'POST' });
}

export async function removeReaction(postId, type = 'upvote') {
  return apiRequest(`${BASE}/posts/${postId}/reactions?type=${encodeURIComponent(type)}`, { method: 'DELETE' });
}

export async function savePost(postId) {
  return apiRequest(`${BASE}/posts/${postId}/save`, { method: 'POST' });
}

export async function unsavePost(postId) {
  return apiRequest(`${BASE}/posts/${postId}/save`, { method: 'DELETE' });
}

export async function markUseful(postId) {
  return apiRequest(`${BASE}/posts/${postId}/useful`, { method: 'POST' });
}
