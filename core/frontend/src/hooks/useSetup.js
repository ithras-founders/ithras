import { useState, useEffect } from 'react';
import { getSetupStatus } from '../modules/shared/services/api.js';

/**
 * Polls backend setup status until ready.
 * Returns { setupStatus, setupReady, showSetup }.
 */
export function useSetup() {
  const [setupStatus, setSetupStatus] = useState(null);

  useEffect(() => {
    let pollId = null;
    const checkSetup = async () => {
      try {
        const data = await getSetupStatus();
        setSetupStatus(data);
        if (data?.status === 'ready') return;
        pollId = setTimeout(checkSetup, 500);
      } catch {
        setSetupStatus({ status: 'ready', message: 'Backend unavailable' });
      }
    };
    checkSetup();
    return () => pollId != null && clearTimeout(pollId);
  }, []);

  const setupReady = setupStatus && setupStatus.status === 'ready';
  const setupPending = setupStatus && (setupStatus.status === 'in_progress' || setupStatus.status === 'pending');
  const setupError = setupStatus && (setupStatus.status === 'error' || setupStatus.db_unreachable === true);
  const showSetup = !setupReady && (setupPending || setupError || setupStatus === null);

  return { setupStatus, setupReady, showSetup, setupError };
}
