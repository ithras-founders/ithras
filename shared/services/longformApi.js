/**
 * LongForm API — publications, posts, subscribe, star.
 */
import { apiRequest, getApiBaseUrl } from './apiBase.js';

const q = (params) => {
  const s = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    s.set(k, String(v));
  });
  const str = s.toString();
  return str ? `?${str}` : '';
};

export function listPublications({ limit = 30, offset = 0, subscribed, mine, sort } = {}) {
  return apiRequest(`/v1/longform/publications/${q({ limit, offset, subscribed, mine, sort })}`);
}

export function listRecentPosts({ limit = 20, sort } = {}) {
  return apiRequest(`/v1/longform/posts/recent/${q({ limit, sort })}`);
}

export function getPublication(pubSlug) {
  return apiRequest(`/v1/longform/publications/${encodeURIComponent(pubSlug)}/`);
}

export function getPost(pubSlug, postSlug) {
  return apiRequest(
    `/v1/longform/publications/${encodeURIComponent(pubSlug)}/posts/${encodeURIComponent(postSlug)}/`,
  );
}

export function createPublication(body) {
  return apiRequest('/v1/longform/publications/', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createPost(publicationId, body) {
  return apiRequest(`/v1/longform/publications/${publicationId}/posts/`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function patchPost(postId, body) {
  return apiRequest(`/v1/longform/posts/${postId}/`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export function subscribeToPublication(publicationId) {
  return apiRequest(`/v1/longform/publications/${publicationId}/subscribe/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function unsubscribeFromPublication(publicationId) {
  return apiRequest(`/v1/longform/publications/${publicationId}/subscribe/`, {
    method: 'DELETE',
  });
}

export function starPost(postId) {
  return apiRequest(`/v1/longform/posts/${postId}/star/`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export function unstarPost(postId) {
  return apiRequest(`/v1/longform/posts/${postId}/star/`, {
    method: 'DELETE',
  });
}

/** ~200 wpm; words ≈ chars/5 */
export function estimateReadMinutesFromLength(charLength) {
  const n = Math.max(0, Number(charLength) || 0);
  const words = n / 5;
  return Math.max(1, Math.round(words / 200) || 1);
}

/** Plain-text length for read-time (strips HTML when present). */
export function bodyPlainTextLength(body) {
  if (!body) return 0;
  const t = String(body).trim();
  if (!t) return 0;
  if (typeof DOMParser === 'undefined') {
    return t.replace(/<[^>]*>/g, '').length;
  }
  try {
    const doc = new DOMParser().parseFromString(t, 'text/html');
    return (doc.body?.textContent || '').length;
  } catch {
    return t.replace(/<[^>]*>/g, '').length;
  }
}

/** True if stored body should be rendered as HTML (vs legacy plain text). */
export function bodyLooksLikeStoredHtml(body) {
  const t = (body || '').trim();
  if (!t) return false;
  if (!t.startsWith('<')) return false;
  return /<\/[a-z][a-z0-9]*>/i.test(t) || /^<[a-z][a-z0-9]*[\s>\/]/i.test(t);
}

function _authHeadersForUpload() {
  let sessionId;
  let authToken;
  try {
    sessionId = sessionStorage.getItem('ithras_session_id');
    const saved = localStorage.getItem('ithras_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      authToken = parsed?.access_token || parsed?.session_id || parsed?.sessionId;
    }
  } catch (_) { /* ignore */ }
  return {
    ...(sessionId ? { 'x-session-id': sessionId } : {}),
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };
}

export async function uploadLongformImage(publicationId, file) {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/v1/longform/publications/${Number(publicationId)}/images/`;
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(url, {
    method: 'POST',
    headers: _authHeadersForUpload(),
    body: form,
    redirect: 'manual',
  });
  if (res.status === 401) {
    try {
      localStorage.removeItem('ithras_session');
      sessionStorage.removeItem('ithras_session_id');
      sessionStorage.removeItem('ithras_hr_view');
    } catch (_) { /* ignore */ }
    window.dispatchEvent(new CustomEvent('ithras:auth:expired'));
  }
  if (!res.ok) {
    let msg = `API Error: ${res.status}`;
    try {
      const err = await res.json();
      if (err.detail) msg = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
    } catch (_) { /* ignore */ }
    throw new Error(msg);
  }
  return res.json();
}
