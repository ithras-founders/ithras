/**
 * API base utilities - getApiBaseUrl and apiRequest
 * Shared by all domain API modules
 */
export const getApiBaseUrl = () => {
  const apiPath = '/api';
  const baseUrl = `${window.location.origin}${apiPath}`;
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
    console.debug('API Base URL:', baseUrl);
  }
  return baseUrl;
};

export async function apiRequest(endpoint, options = {}) {
  let normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const [pathPart, queryPart] = normalizedEndpoint.split('?');
  const hasQueryParams = queryPart !== undefined;
  const pathSegments = pathPart.split('/').filter(s => s.length > 0);
  const isListEndpoint = pathSegments.length === 2;
  const hasTrailingSlash = pathPart.endsWith('/');

  if ((method === 'GET' || method === 'POST') && isListEndpoint && !hasTrailingSlash) {
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

  const startTime = performance.now();
  try {
    const response = await fetch(url, { ...config, redirect: 'manual' });

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (location) {
        let redirectUrl = location.startsWith('/') ? `${baseUrl}${location}` : location.startsWith('http') ? location : `${baseUrl}/${location}`;
        const redirectResponse = await fetch(redirectUrl, config);
        if (!redirectResponse.ok) {
          let errorMessage = `API Error: ${redirectResponse.status} ${redirectResponse.statusText}`;
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
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
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
    const duration_ms = performance.now() - startTime;
    try {
      import('../telemetry.js').then(({ recordApiEvent }) => {
        recordApiEvent({
          path: pathPart,
          method,
          duration_ms,
          status: response.status,
        });
      }).catch(() => { /* telemetry is best-effort */ });
    } catch (_) { /* telemetry is best-effort */ }
    if (!text || text.trim() === '') return null;
    try {
      return JSON.parse(text);
    } catch (e) {
      return text;
    }
  } catch (error) {
    const duration_ms = performance.now() - startTime;
    try {
      import('../telemetry.js').then(({ recordApiEvent }) => {
        recordApiEvent({
          path: pathPart,
          method,
          duration_ms,
          status: 0,
        });
      }).catch(() => { /* telemetry is best-effort */ });
    } catch (_) { /* telemetry is best-effort */ }
    if (!options.quiet) {
      const logPayload = {
        url: error.url || url,
        method: config.method || 'GET',
        status: error.status,
        message: error.message,
      };
      if (error.serverDetail) {
        logPayload.serverDetail = error.serverDetail;
        if (error.status === 422 && Array.isArray(error.serverDetail)) {
          logPayload.validationErrors = error.serverDetail.map((e) => ({
            field: e.loc?.join('.') || 'unknown',
            msg: e.msg,
            type: e.type,
          }));
        }
      }
      console.error('API Request failed:', logPayload);
    }
    throw error;
  }
}

export async function uploadFile(file, endpoint = '/v1/upload/logo') {
  const baseUrl = getApiBaseUrl();
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${baseUrl}${endpoint}`, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
  return res.json();
}
