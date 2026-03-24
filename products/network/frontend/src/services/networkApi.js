/**
 * Network API - connections, follows, overlap, suggestions.
 */
import { apiRequest } from '/shared/services/apiBase.js';

const BASE = '/v1/network';

export async function getConnections(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/connections${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function getPendingConnections() {
  const res = await apiRequest(`${BASE}/connections/pending`);
  return { items: res?.items ?? [] };
}

export async function sendConnectionRequest(recipientId) {
  return apiRequest(`${BASE}/connections`, {
    method: 'POST',
    body: JSON.stringify({ recipient_id: recipientId }),
  });
}

export async function acceptConnection(connectionId) {
  return apiRequest(`${BASE}/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'accepted' }),
  });
}

export async function rejectConnection(connectionId) {
  return apiRequest(`${BASE}/connections/${connectionId}`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'rejected' }),
  });
}

export async function getFollows(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/follows${suffix}`);
  return { items: res?.items ?? [], total: res?.total ?? 0 };
}

export async function followUser(followingId) {
  return apiRequest(`${BASE}/follows`, {
    method: 'POST',
    body: JSON.stringify({ following_id: followingId }),
  });
}

export async function unfollowUser(followId) {
  return apiRequest(`${BASE}/follows/${followId}`, { method: 'DELETE' });
}

export async function getOverview() {
  return apiRequest(`${BASE}/overview`);
}

export async function getOrgNetwork() {
  const res = await apiRequest(`${BASE}/org-network`);
  return { groups: res?.groups ?? [], profile_has_data: res?.profile_has_data };
}

export async function getInstitutionNetwork() {
  const res = await apiRequest(`${BASE}/institution-network`);
  return { groups: res?.groups ?? [], profile_has_data: res?.profile_has_data };
}

export async function getFunctionNetwork() {
  const res = await apiRequest(`${BASE}/function-network`);
  return { groups: res?.groups ?? [], profile_has_data: res?.profile_has_data };
}

export async function getSuggestions(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', params.limit);
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`${BASE}/suggestions${suffix}`);
  return { items: res?.items ?? [], profile_has_data: res?.profile_has_data };
}

export async function getProfileOverlap(profileSlug) {
  return apiRequest(`/v1/network/profiles/${encodeURIComponent(profileSlug)}/overlap`);
}

export async function getNotifications(params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', String(params.limit));
  const suffix = q.toString() ? `?${q}` : '';
  const res = await apiRequest(`/v1/network/notifications${suffix}`, { quiet: true });
  return {
    unread_count: res?.unread_count ?? 0,
    items: res?.items ?? [],
  };
}

export async function markNotificationRead(notificationId) {
  return apiRequest(`/v1/network/notifications/${notificationId}/read`, {
    method: 'PATCH',
    quiet: true,
  });
}

export async function markAllNotificationsRead() {
  return apiRequest('/v1/network/notifications/read-all', {
    method: 'PATCH',
    quiet: true,
  });
}
