/**
 * Shared debounced unified search + suggestions for overlay and full page.
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { unifiedSearch, searchSuggest } from '/shared/services/searchApi.js';
import { parseQueryOperators } from './searchQueryUtils.js';
import { formatSearchApiError } from '/shared/utils/searchApiErrors.js';

/**
 * @param {{
 *   active: boolean,
 *   debounceMs?: number,
 *   limitAll?: number,
 *   limitSingle?: number,
 *   offset?: number,
 *   initialQuery?: string,
 *   initialMode?: string,
 * }} opts
 */
export function useUnifiedSearch({
  active,
  debounceMs = 280,
  limitAll = 6,
  limitSingle = 24,
  offset = 0,
  initialQuery = '',
  initialMode = 'all',
}) {
  const [query, setQuery] = useState(initialQuery);
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [data, setData] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [errorFormatted, setErrorFormatted] = useState(null);
  const [extraFilters, setExtraFilters] = useState({});
  const [filterDraft, setFilterDraft] = useState({ key: '', value: '' });

  const abortRef = useRef(null);
  const suggestAbortRef = useRef(null);

  const { operators } = useMemo(() => parseQueryOperators(query), [query]);
  const mergedFilters = useMemo(() => ({ ...operators, ...extraFilters }), [operators, extraFilters]);

  const limit = mode === 'all' ? limitAll : limitSingle;

  const runSearch = useCallback(async () => {
    if (!active) return;
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    setErrorFormatted(null);
    try {
      const res = await unifiedSearch({
        q: query,
        mode,
        limit,
        offset,
        filters: Object.keys(mergedFilters).length ? mergedFilters : undefined,
        signal: abortRef.current.signal,
      });
      setData(res);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setErrorFormatted(formatSearchApiError(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [active, query, mode, mergedFilters, limit, offset]);

  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => {
      runSearch();
    }, debounceMs);
    return () => clearTimeout(t);
  }, [active, runSearch, debounceMs]);

  useEffect(() => {
    if (!active || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    if (suggestAbortRef.current) suggestAbortRef.current.abort();
    suggestAbortRef.current = new AbortController();
    setSuggestLoading(true);
    searchSuggest({ q: query.trim(), limit: 12, signal: suggestAbortRef.current.signal })
      .then((r) => setSuggestions(r?.suggestions || []))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestLoading(false));
    return () => suggestAbortRef.current?.abort();
  }, [active, query]);

  return {
    query,
    setQuery,
    mode,
    setMode,
    loading,
    suggestLoading,
    data,
    setData,
    suggestions,
    errorFormatted,
    setErrorFormatted,
    extraFilters,
    setExtraFilters,
    filterDraft,
    setFilterDraft,
    operators,
    mergedFilters,
    runSearch,
    limit,
  };
}
