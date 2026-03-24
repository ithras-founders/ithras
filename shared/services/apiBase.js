/**
 * API base utilities - getApiBaseUrl and apiRequest
 * Shared by all domain API modules
 *
 * Default: same-origin `/api` (works with Docker/nginx, `frontend_server.py`, or any proxy).
 * On localhost with common dev-only ports (3000, 5173, …) without a proxy, defaults to
 * `http://127.0.0.1:8000/api`. Port 5000 keeps same-origin `/api` (integrated frontend_server).
 * Override anytime with:
 *   sessionStorage.setItem('ithras_api_base', 'http://127.0.0.1:8000/api')
 * or in the console before load:
 *   window.__ITHRAS_API_BASE__ = 'http://127.0.0.1:8000/api'
 * Backend enables CORS for local dev (see core/app/backend/main.py).
 */
const trimSlash = (s) => (s || '').replace(/\/$/, '');

const isAbsoluteApiUrl = (s) =>
  typeof s === 'string' && (s.startsWith('http://') || s.startsWith('https://'));

/**
 * When API base is `http://host:port/api`, relative redirect Location `/api/v1/...` must join to
 * `http://host:port` + Location — not `baseUrl + Location` (would duplicate `/api`).
 */
export function apiOriginFromBaseUrl(baseUrl) {
  const b = trimSlash(baseUrl || '');
  if (b.endsWith('/api')) {
    return trimSlash(b.slice(0, -4));
  }
  return b;
}

/** Absolute URL for paths served by the API host (e.g. `/media/profile/...`). */
export function resolveApiMediaUrl(relativePath) {
  if (!relativePath || typeof relativePath !== 'string') return null;
  if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) return relativePath;
  const origin = apiOriginFromBaseUrl(getApiBaseUrl());
  const p = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
  return `${origin}${p}`;
}

function resolveRedirectTarget(baseUrl, locationHeader) {
  const loc = locationHeader || '';
  if (!loc) return null;
  if (loc.startsWith('http://') || loc.startsWith('https://')) return loc;
  if (loc.startsWith('/')) {
    return `${apiOriginFromBaseUrl(baseUrl)}${loc}`;
  }
  return `${trimSlash(baseUrl)}/${loc}`;
}

/** Short error for `quiet` requests (e.g. search) so UI layers can show full dev hints without duplicating a paragraph in the thrown message. */
const QUIET_CONNECTIVITY_ERROR = 'Could not reach the API.';

const LONG_OPAQUE_ERROR =
  'Could not complete the request (network error, blocked redirect, or API not reachable at this origin). Fix: (1) Run `python frontend_server.py` and open http://localhost:5000 with the backend on :8000, or (2) Proxy /api to the backend, or (3) In the browser console: sessionStorage.setItem("ithras_api_base","http://127.0.0.1:8000/api") then reload.';

const LONG_NETWORK_ERROR =
  'Network error: could not reach the API. Is the backend running on :8000? If the UI is on another port, use `python frontend_server.py` (proxies /api) or set sessionStorage ithras_api_base to http://127.0.0.1:8000/api and reload.';

export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') return '/api';

  const fromWindow = window.__ITHRAS_API_BASE__;
  if (isAbsoluteApiUrl(fromWindow)) {
    return trimSlash(fromWindow);
  }

  try {
    const stored = sessionStorage.getItem('ithras_api_base');
    if (isAbsoluteApiUrl(stored)) return trimSlash(stored);
  } catch (_) { /* private mode */ }

  const w = window.API_URL;
  if (isAbsoluteApiUrl(w)) return trimSlash(w);

  try {
    const meta = document.querySelector('meta[name="api-url"]')?.getAttribute('content');
    if (isAbsoluteApiUrl(meta)) return trimSlash(meta);
  } catch (_) { /* document not ready in edge cases */ }

  const host = window.location?.hostname || '';
  const port = window.location?.port || '';
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  /** Dev servers that usually have no /api proxy; 5000 is excluded (frontend_server proxies /api). */
  const LOCAL_DEV_UI_PORTS = ['3000', '5173', '4173', '8080'];
  if (isLocalHost && LOCAL_DEV_UI_PORTS.includes(port)) {
    const fallback = 'http://127.0.0.1:8000/api';
    if (typeof console !== 'undefined' && console.debug) {
      console.debug('API Base URL:', fallback, `(dev UI port ${port}; override via sessionStorage ithras_api_base)`);
    }
    return fallback;
  }

  const baseUrl = `${window.location.origin}/api`;
  if (isLocalHost) {
    console.debug('API Base URL:', baseUrl, '(set sessionStorage ithras_api_base to an absolute URL if requests fail)');
  }
  return baseUrl;
};

export async function apiRequest(endpoint, options = {}) {
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const qSplit = normalizedEndpoint.split('?');
  let pathPart = qSplit[0];
  const queryPart = qSplit[1];
  if (pathPart === '/v1/search/suggest/') {
    pathPart = '/v1/search/suggest';
    normalizedEndpoint = queryPart !== undefined ? `${pathPart}?${queryPart}` : pathPart;
  }
  const hasQueryParams = queryPart !== undefined;
  const pathSegments = pathPart.split('/').filter(s => s.length > 0);
  const isListEndpoint = pathSegments.length === 2;
  const hasTrailingSlash = pathPart.endsWith('/');
  /** FastAPI `GET ""` on router prefix `/api/v1/search` is `/api/v1/search` without trailing slash. */
  const skipListSlash =
    pathSegments.length === 2 && pathSegments[0] === 'v1' && pathSegments[1] === 'search';

  if ((method === 'GET' || method === 'POST') && isListEndpoint && !hasTrailingSlash && !skipListSlash) {
    normalizedEndpoint = hasQueryParams ? `${pathPart}/?${queryPart}` : `${pathPart}/`;
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${normalizedEndpoint}`;
  let sessionId;
  let authToken;
  try {
    sessionId = sessionStorage.getItem('ithras_session_id');
    const saved = localStorage.getItem('ithras_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      authToken = parsed?.access_token || parsed?.session_id || parsed?.sessionId;
    }
  } catch (_) { /* session/localStorage may be unavailable */ }
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(sessionId ? { 'x-session-id': sessionId } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  if (options.signal) config.signal = options.signal;

  try {
    const response = await fetch(url, { ...config, redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        const redirectUrl = resolveRedirectTarget(baseUrl, location);
        const redirectResponse = await fetch(redirectUrl, config);
        if (!redirectResponse.ok) {
          let errorMessage = `API Error: ${redirectResponse.status} ${redirectResponse.statusText || ''}`.trim();
          try {
            const errorText = await redirectResponse.text();
            if (errorText) {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.detail || errorData.message || errorMessage;
            }
          } catch (_) { /* ignore parse errors */ }
          throw new Error(errorMessage);
        }
        const contentType = redirectResponse.headers.get('content-type');
        const contentLength = redirectResponse.headers.get('content-length');
        if (contentLength === '0' || (contentType && !contentType.includes('application/json'))) return null;
        return await redirectResponse.json();
      }
    }

    if (!response.ok) {
      if (response.status === 401 && !options.quiet) {
        localStorage.removeItem('ithras_session');
        try {
          sessionStorage.removeItem('ithras_session_id');
          sessionStorage.removeItem('ithras_hr_view');
        } catch (_) { /* sessionStorage may be unavailable */ }
        window.dispatchEvent(new CustomEvent('ithras:auth:expired'));
      }
      const isOpaqueOrZero =
        response.status === 0 ||
        response.type === 'opaqueredirect' ||
        response.type === 'opaque';
      let errorMessage = isOpaqueOrZero
        ? options.quiet
          ? QUIET_CONNECTIVITY_ERROR
          : LONG_OPAQUE_ERROR
        : `API Error: ${response.status} ${response.statusText || ''}`.trim();
      let serverDetail = null;
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          serverDetail = errorData.detail || errorData.message || null;
          if (serverDetail) errorMessage = typeof serverDetail === 'string' ? serverDetail : JSON.stringify(serverDetail);
        }
      } catch (_) { /* ignore parse errors */ }
      const err = new Error(errorMessage);
      err.status = response.status;
      err.url = url;
      err.serverDetail = serverDetail;
      throw err;
    }

    const contentType = response.headers.get('content-type');
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0' || (contentType && !contentType.includes('application/json'))) {
      if (contentType && contentType.includes('text/')) return await response.text();
      return null;
    }

    const text = await response.text();
    if (!text || text.trim() === '') return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (error) {
    const isNetworkFailure =
      error instanceof TypeError &&
      (error.message === 'Failed to fetch' ||
        error.message.includes('fetch') ||
        error.message.includes('NetworkError'));
    const wrapped = isNetworkFailure
      ? Object.assign(new Error(options.quiet ? QUIET_CONNECTIVITY_ERROR : LONG_NETWORK_ERROR), { cause: error, url })
      : error;
    if (!options.quiet) {
      const logPayload = {
        url: wrapped.url || url,
        method: config.method || 'GET',
        status: wrapped.status,
        message: wrapped.message,
      };
      if (wrapped.serverDetail) {
        logPayload.serverDetail = wrapped.serverDetail;
        if (wrapped.status === 422 && Array.isArray(wrapped.serverDetail)) {
          logPayload.validationErrors = wrapped.serverDetail.map((e) => ({
            field: e.loc?.join('.') || 'unknown',
            msg: e.msg,
            type: e.type,
          }));
        }
      }
      console.error('API Request failed:', logPayload);
    }
    throw wrapped;
  }
}
