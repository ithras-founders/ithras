/**
 * URL-view synchronization for browser history.
 * Maps pathnames to view IDs and vice versa.
 */

export { RECRUITER_VIEWS } from './modeConfig.js';

export const VALID_VIEW_IDS = new Set([
  'dashboard',
  'feed',
  'general_feed',
  'my-network',
  'hr-job-profiles',
  'hr-discovery',
  'hr-outreach',
  'profile',
  'preparation',
  'preparation/community',
  'preparation/community/post',
  'active_processes',
  'applications',
  'cv',
  'cv-maker',
  'calendar',
  'intelligence',
  'workflows',
  'request-approvals',
  'institutions',
  'jobs',
  'system-admin',
  'telemetry',
  'analytics',
  'recruitment_cycles',
  'policy_approvals',
  'master_calendar',
  'placement_templates',
  'request_applications',
  'approval-queue',
  'timetable',
  'database',
  'system-admin/testing',
  'system-admin/migrations',
  'system-admin/community',
  'system-admin/prep-management',
  'pitch-deck',
  'investor-deck',
  'cv-verification',
  'cv-templates',
  'simulator',
  'investor-pitch-university',
  'investor-pitch-recruitment',
  'about-us',
  'account-settings',
  'account-settings-contact',
  'account-settings-messaging',
  'messages',
  'feed/communities',
]);

/**
 * Maps pathname to view ID. Returns null for invalid/unknown paths.
 * Allows dynamic views for institution-, company-, system- prefixes.
 * @param {string} pathname - e.g. "/dashboard", "/cv-maker", "/"
 * @returns {string|null} view ID or null
 */
export function pathToView(pathname) {
  const normalized = (pathname || '/').replace(/\/+$/, '') || '/';
  if (normalized === '/' || normalized === '') return 'dashboard';
  const view = normalized.slice(1); // strip leading slash
  if (VALID_VIEW_IDS.has(view)) return view;
  // Allow dynamic views: institution, company, system-admin, telemetry, profile, preparation
  if (view.startsWith('institution') || view.startsWith('company') || view.startsWith('system') || view.startsWith('telemetry') || view.startsWith('profile') || view.startsWith('preparation') || view.startsWith('feed')) return view;
  return null;
}

/**
 * Maps view ID to path.
 * @param {string} view - e.g. "dashboard", "cv-maker"
 * @returns {string} path e.g. "/dashboard", "/cv-maker"
 */
export function viewToPath(view) {
  if (!view || view === 'dashboard') return '/';
  if (view === 'feed') return '/feed';
  return `/${view}`;
}
