import { pathToView } from '../navigation.js';
import { resolveNavContext } from '../modeConfig.js';

/**
 * Hook that resolves effective mode for ModeSwitcher and Layout.
 * Single source of truth so both never disagree on mode.
 * @param {string} activeView - view from useViewRouter
 * @param {object} user
 * @param {object} activeProfile
 * @returns {{ effectiveView: string|null, mode: string|null, inRecruiterMode: boolean, canAccessRecruiterMode: boolean, roleId: string }}
 */
export function useEffectiveMode(activeView, user, activeProfile) {
  return resolveNavContext(activeView, pathToView, user, activeProfile);
}
