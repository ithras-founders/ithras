/**
 * Shared hook for fetch + tutorial/demo mode handling.
 * When isTutorialMode or isDemoUser, returns mock data; otherwise fetches from API.
 *
 * @param {object} options
 * @param {string} options.role - Tutorial role key (e.g. 'PLACEMENT_TEAM', 'CANDIDATE', 'RECRUITER')
 * @param {function} options.getMockData - (mock) => data - extract data from mock object
 * @param {function} options.fetch - async () => data - API fetch when not in tutorial mode
 * @param {array} [options.deps=[]] - Dependencies for the effect (e.g. [user?.institution_id])
 * @param {object} [options.user] - User object for isDemoUser check
 * @param {boolean} [options.useDemoUser=true] - If true, treat demo user as tutorial mode
 * @param {boolean} [options.enabled=true] - If false, skips fetch (e.g. when user not ready)
 * @returns {{ data, loading, error, refetch }}
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';

export function useFetchWithTutorial({ role, getMockData, fetch: fetchFn, deps = [], user, useDemoUser: checkDemoUser = true, enabled = true }) {
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const shouldUseMock = isTutorialMode || (checkDemoUser && user && isDemoUser(user));

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
    if (shouldUseMock) {
      const mock = getTutorialData?.(role) ?? getTutorialMockData(role);
      setData(getMockData(mock));
      setLoading(false);
      setError(null);
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
  }, [enabled, shouldUseMock, role, getMockData, getTutorialData]);

  useEffect(() => {
    refetch();
  }, [refetch, ...deps]);

  return { data, loading, error, refetch };
}
