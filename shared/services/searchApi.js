/**
 * Unified platform search API (command palette / discovery).
 */
import { apiRequest } from './apiBase.js';

/**
 * @param {{ q: string, mode?: string, limit?: number, offset?: number, filters?: Record<string, string>, signal?: AbortSignal }} opts
 */
export function unifiedSearch({ q, mode = 'all', limit = 10, offset = 0, filters, signal }) {
  const params = new URLSearchParams();
  params.set('q', q || '');
  params.set('mode', mode);
  params.set('limit', String(limit));
  if (offset > 0) params.set('offset', String(offset));
  if (filters && Object.keys(filters).length > 0) {
    params.set('filters', JSON.stringify(filters));
  }
  return apiRequest(`/v1/search?${params.toString()}`, { signal, quiet: true });
}

/**
 * @param {{ q: string, limit?: number, signal?: AbortSignal }} opts
 */
export function searchSuggest({ q, limit = 12, signal }) {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiRequest(`/v1/search/suggest?${params.toString()}`, { signal, quiet: true });
}
