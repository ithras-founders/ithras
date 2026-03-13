import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiBaseUrl, apiRequest } from './apiBase.js';

describe('getApiBaseUrl', () => {
  it('returns origin + /api', () => {
    const url = getApiBaseUrl();
    expect(url).toContain('/api');
    expect(url).toMatch(/^https?:\/\/.+\/api$/);
  });
});

describe('apiRequest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('makes a GET request and returns JSON on success', async () => {
    const mockData = { items: [], total: 0 };
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockData),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    const result = await apiRequest('/v1/test-endpoint');
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Server error' }),
      text: () => Promise.resolve('Server error'),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    await expect(apiRequest('/v1/fail')).rejects.toThrow();
  });

  it('adds trailing slash for list endpoints', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    await apiRequest('/v1/cycles');
    const calledUrl = fetch.mock.calls[0][0];
    expect(calledUrl).toContain('/v1/cycles/');
  });

  it('includes auth token from localStorage', async () => {
    localStorage.setItem('ithras_session', JSON.stringify({ access_token: 'test-jwt-token' }));
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    await apiRequest('/v1/cycles');
    const calledConfig = fetch.mock.calls[0][1];
    expect(calledConfig.headers.Authorization).toBe('Bearer test-jwt-token');
  });

  it('includes session-id header from sessionStorage', async () => {
    sessionStorage.setItem('ithras_session_id', 'sess-123');
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    await apiRequest('/v1/test');
    const calledConfig = fetch.mock.calls[0][1];
    expect(calledConfig.headers['x-session-id']).toBe('sess-123');
  });

  it('sends POST body as JSON string', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ id: 'new' }),
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    await apiRequest('/v1/workflows', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test' }),
    });
    const calledConfig = fetch.mock.calls[0][1];
    expect(calledConfig.body).toBe('{"name":"Test"}');
    expect(calledConfig.headers['Content-Type']).toBe('application/json');
  });
});
