/**
 * Messaging API - inbox, conversations, messages, requests.
 */
import { apiRequest } from '/shared/services/apiBase.js';

const BASE = '/v1/messages';

export async function getInbox(params = {}) {
  const q = new URLSearchParams();
  if (params.section != null) q.set('section', params.section);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  const suffix = q.toString() ? `?${q}` : '';
  return apiRequest(`${BASE}/inbox${suffix}`);
}

export async function getConversation(convId, params = {}) {
  const q = new URLSearchParams();
  if (params.limit != null) q.set('limit', params.limit);
  if (params.before_id != null) q.set('before_id', params.before_id);
  const suffix = q.toString() ? `?${q}` : '';
  return apiRequest(`${BASE}/conversations/${convId}${suffix}`);
}

export async function createConversation(participantIds, title = null) {
  return apiRequest(`${BASE}/conversations`, {
    method: 'POST',
    body: JSON.stringify({ participant_ids: participantIds, title }),
  });
}

export async function sendMessage(convId, content, contentType = 'richtext') {
  return apiRequest(`${BASE}/conversations/${convId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, content_type: contentType }),
  });
}

export async function getMessageRequests(status = 'pending', params = {}) {
  const q = new URLSearchParams();
  q.set('status_filter', status);
  if (params.limit != null) q.set('limit', params.limit);
  if (params.offset != null) q.set('offset', params.offset);
  return apiRequest(`${BASE}/requests?${q}`);
}

export async function createMessageRequest(recipientId, content) {
  return apiRequest(`${BASE}/requests`, {
    method: 'POST',
    body: JSON.stringify({ recipient_id: recipientId, content }),
  });
}

export async function messageRequestAction(reqId, action) {
  return apiRequest(`${BASE}/requests/${reqId}/action`, {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
}

export async function searchUsers(query, limit = 20) {
  const q = new URLSearchParams();
  q.set('q', query);
  q.set('limit', limit);
  const res = await apiRequest(`${BASE}/search/users?${q}`);
  return { items: res?.items ?? [] };
}
