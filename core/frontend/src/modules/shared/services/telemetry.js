/**
 * Client-side telemetry - batches API and page view events, sends to backend.
 * Generates a persistent session_id per browser tab for session-level analytics.
 */
import { getApiBaseUrl } from './api/apiBase.js';

const BATCH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 20;

let _queue = [];
let _flushTimer = null;
let _userId = null;

function _generateSessionId() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 10);
  return `ses_${ts}_${rand}`;
}

const _sessionId = (() => {
  try {
    let sid = sessionStorage.getItem('ithras_session_id');
    if (!sid) {
      sid = _generateSessionId();
      sessionStorage.setItem('ithras_session_id', sid);
    }
    return sid;
  } catch {
    return _generateSessionId();
  }
})();

export function getSessionId() { return _sessionId; }

/**
 * Set the current user ID so it's attached to every telemetry event.
 * Call with null on logout.
 */
export function setTelemetryUser(userId) {
  _userId = userId || null;
}

function _getAuthToken() {
  try {
    const saved = localStorage.getItem('ithras_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed?.session_id || parsed?.sessionId || null;
    }
  } catch (_) { /* localStorage may be unavailable */ }
  return null;
}

async function _sendBatch() {
  if (_queue.length === 0) return;
  const authToken = _getAuthToken();
  if (!authToken) {
    _queue.length = 0;
    return;
  }
  const batch = _queue.splice(0, MAX_BATCH_SIZE);
  try {
    const baseUrl = getApiBaseUrl();
    const url = `${baseUrl}/v1/telemetry/client`;
    await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ events: batch }),
    });
  } catch (err) {
    console.debug('Telemetry batch send failed:', err);
    _queue.unshift(...batch);
  }
}

function _sendBeaconBatch() {
  if (_queue.length === 0) return;
  const authToken = _getAuthToken();
  if (!authToken) {
    _queue.length = 0;
    return;
  }
  const batch = _queue.splice(0, _queue.length);
  const url = `${getApiBaseUrl()}/v1/telemetry/client`;
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ events: batch }),
    keepalive: true,
  }).catch(() => {}); // telemetry is best-effort
}

function _scheduleFlush() {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    _sendBatch();
    if (_queue.length > 0) _scheduleFlush();
  }, BATCH_INTERVAL_MS);
}

function _enqueue(evt) {
  if (_userId === 'demo' || !_getAuthToken()) return;
  evt.session_id = _sessionId;
  if (_userId) evt.user_id = _userId;
  _queue.push(evt);
  if (_queue.length >= MAX_BATCH_SIZE) {
    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = null;
    _sendBatch();
  } else {
    _scheduleFlush();
  }
}

/**
 * Record an API request event (called from apiBase after completion).
 */
export function recordApiEvent({ path, method, duration_ms, status }) {
  _enqueue({
    type: 'api',
    path: path || '',
    method: method || 'GET',
    duration_ms: duration_ms || 0,
    status: status ?? 0,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Record a page view (view + product + duration).
 */
export function recordPageView({ view, product, duration_ms }) {
  _enqueue({
    type: 'page_view',
    view: view || '',
    product: product || '',
    duration_ms: duration_ms || 0,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Flush queued events to the backend immediately.
 * Use before navigation or on app unmount.
 */
export function flushTelemetry() {
  if (_flushTimer) {
    clearTimeout(_flushTimer);
    _flushTimer = null;
  }
  _sendBatch();
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = null;
    _sendBeaconBatch();
  });
  window.addEventListener('pagehide', () => {
    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = null;
    _sendBeaconBatch();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && _queue.length > 0) {
      flushTelemetry();
    }
  });
}
