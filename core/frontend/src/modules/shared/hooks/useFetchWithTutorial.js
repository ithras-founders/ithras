/**
 * Shared hook for API fetch with loading and error state.
 *
 * @param {object} options
 * @param {function} options.fetch - async () => data - API fetch
 * @param {array} [options.deps=[]] - Dependencies for the effect (e.g. [user?.institution_id])
 * @param {boolean} [options.enabled=true] - If false, skips fetch (e.g. when user not ready)
 * @returns {{ data, loading, error, refetch }}
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function useFetchWithTutorial({ fetch: fetchFn, deps = [], enabled = true }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRef.current();
      setData(result);
    } catch (err) {
      setError(err);
      console.error('Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refetch();
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
}
