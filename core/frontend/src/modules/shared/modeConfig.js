/**
 * Mode registry: defines available modes, their views, and nav items.
 * Single source of truth for ModeSwitcher and Layout.
 * Extensible for future modes (e.g. Admin mode, Analytics mode).
 */

export const RECRUITER_VIEWS = ['hr-outreach', 'hr-job-profiles', 'hr-discovery'];

/**
 * @param {string} viewId
 * @returns {string|null} Mode id if the view belongs to a mode, else null
 */
export function getModeForView(viewId) {
  if (!viewId) return null;
  if (RECRUITER_VIEWS.includes(viewId)) return 'recruiter';
  return null;
}

/**
 * Resolves the effective view, preferring URL when it indicates a mode view.
 * This ensures nav and mode switcher update even when React state lags behind.
 * @param {string} activeView - view from React state (may be stale)
 * @param {function} pathToView - to parse pathname
 * @returns {string|null} Resolved view id
 */
export function resolveEffectiveView(activeView, pathToView) {
  if (typeof window !== 'undefined' && pathToView) {
    const urlView = pathToView(window.location.pathname);
    if (urlView && RECRUITER_VIEWS.includes(urlView)) {
      return urlView;
    }
  }
  if (activeView && typeof activeView === 'string') {
    return activeView;
  }
  if (typeof window !== 'undefined' && pathToView) {
    return pathToView(window.location.pathname);
  }
  return activeView || null;
}

/**
 * @param {string} viewId
 * @param {object} roleInfo - { roleId, canAccessRecruiterMode }
 * @returns {boolean}
 */
export function isInRecruiterMode(viewId, roleInfo) {
  if (!roleInfo.canAccessRecruiterMode) return false;
  return viewId && RECRUITER_VIEWS.includes(viewId);
}

/**
 * Resolve role id from user or activeProfile, handling object or string form.
 * @param {object} user
 * @param {object} activeProfile
 * @returns {string}
 */
export function resolveRoleId(user, activeProfile) {
  const userRoleId = (user?.role && typeof user.role === 'object' && user.role.id)
    ? user.role.id
    : (user?.role || '');
  return activeProfile?.role?.id || activeProfile?.role_id || userRoleId || '';
}

/**
 * Resolves the full nav context for ModeSwitcher and Layout.
 * Single source of truth so both never disagree on mode.
 * canAccessRecruiterMode: true only when PROFESSIONAL has a recruiter profile with onboarded org.
 * @param {string} activeView - view from React state (may be stale)
 * @param {function} pathToView - to parse pathname
 * @param {object} user
 * @param {object} activeProfile
 * @param {object[]} [profiles] - All user profiles; used to check if recruiter profile exists with onboarded org
 * @returns {{ effectiveView: string|null, mode: string|null, inRecruiterMode: boolean, canAccessRecruiterMode: boolean, roleId: string }}
 */
export function resolveNavContext(activeView, pathToView, user, activeProfile, profiles = []) {
  const roleId = resolveRoleId(user, activeProfile);
  const hasRecruiterProfileWithOnboardedOrg = (profiles || []).some(
    (p) =>
      (p.role?.id || p.role_id) === 'RECRUITER' && (p.company_onboarding_status || 'ONBOARDED') === 'ONBOARDED'
  );
  const canAccessRecruiterMode =
    roleId === 'PROFESSIONAL' && (profiles || []).length > 0 ? hasRecruiterProfileWithOnboardedOrg : roleId === 'PROFESSIONAL';
  const effectiveView = resolveEffectiveView(activeView, pathToView);
  const inRecruiterMode = isInRecruiterMode(effectiveView, { canAccessRecruiterMode });
  const mode = getModeForView(effectiveView);

  return {
    effectiveView,
    mode,
    inRecruiterMode,
    canAccessRecruiterMode,
    roleId,
  };
}

/**
 * Recruiter-mode nav definition (ids and labels only).
 * Layout adds icons when building nav items.
 * @returns {{ id: string, label: string }[]}
 */
export function getRecruiterModeNavItems() {
  return [
    { id: 'feed', label: '← Home' },
    { id: 'hr-job-profiles', label: 'Job Profiles' },
    { id: 'hr-discovery', label: 'Discovery' },
    { id: 'hr-outreach', label: 'Outreach' },
    { id: 'calendar', label: 'Calendar' },
  ];
}
