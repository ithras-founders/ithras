/**
 * Shared hook for follow/unfollow network status.
 * Fetches status, provides toggle and label for network button.
 * @param {string} profileId - ID of the profile being viewed
 * @param {object} viewer - Current user (viewer)
 * @param {object} [initialStatus] - Optional pre-fetched status (e.g. from parent)
 * @param {function} [onStatusChange] - Callback when status changes after toggle
 * @returns {{ status, loading, toggle, label }}
 */
import { useState, useEffect, useCallback } from 'react';
import { followUser, unfollowUser, getNetworkStatus } from '/core/frontend/src/modules/shared/services/api.js';

export function useNetworkStatus(profileId, viewer, initialStatus = null, onStatusChange = null) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [fetchedStatus, setFetchedStatus] = useState(null);

  const effectiveStatus = status ?? initialStatus ?? fetchedStatus;
  const isOwnProfile = viewer?.id && profileId && viewer.id === profileId;
  const shouldFetch = viewer?.id && profileId && !isOwnProfile && initialStatus === undefined;

  useEffect(() => {
    if (!shouldFetch) return;
    getNetworkStatus(profileId)
      .then((s) => setFetchedStatus(s))
      .catch(() => {});
  }, [profileId, shouldFetch]);

  const toggle = useCallback(async () => {
    if (!profileId || loading || !viewer) return;
    setLoading(true);
    try {
      if (effectiveStatus?.in_network || effectiveStatus?.following) {
        await unfollowUser(profileId);
        const next = { following: false, in_network: false };
        setStatus(next);
        setFetchedStatus(next);
        onStatusChange?.(next);
      } else {
        await followUser(profileId);
        const fresh = await getNetworkStatus(profileId);
        const next = { following: fresh?.following ?? true, in_network: fresh?.in_network ?? false };
        setStatus(next);
        setFetchedStatus(next);
        onStatusChange?.(next);
      }
    } catch (err) {
      console.error('Network action failed:', err);
    } finally {
      setLoading(false);
    }
  }, [profileId, viewer, loading, effectiveStatus, onStatusChange]);

  const label = loading
    ? 'Loading...'
    : effectiveStatus?.in_network
      ? 'In network'
      : effectiveStatus?.following
        ? 'Following'
        : 'Add to my network';

  return { status: effectiveStatus, loading, toggle, label };
}
