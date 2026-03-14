/**
 * Declarative product route configuration.
 * Each entry maps a set of views (exact match) and/or prefixes (startsWith) to a product,
 * gated by role flags. First match wins.
 */
export const PRODUCT_ROUTES = [
  { prefixes: ['calendar'], views: ['timetable'], product: 'calendar-management' },
  { views: ['cv', 'cv-maker'], flags: ['isSystemAdmin'], product: 'cv-templates-viewer' },
  { views: ['cv', 'cv-maker'], flags: ['isCandidate'], product: 'profiles' },
  { views: ['cv', 'cv-maker'], flags: ['isGovernanceUser'], product: 'profiles' },
  { views: ['cv', 'cv-maker'], flags: ['isRestrictedUser'], product: 'profiles' },
  { views: ['cv-verification'], flags: ['isGovernanceUser'], product: 'cv-verification' },
  { views: ['cv-templates'], flags: ['isGovernanceUser'], product: 'cv-templates-viewer' },
  { views: ['account-settings', 'account-settings-contact', 'account-settings-messaging'], product: 'profiles' },
  { views: ['messages'], flags: ['isGeneralUser'], product: 'feed' },
  { views: ['messages'], flags: ['isCandidate', 'isRecruiter'], product: 'feed' },
  { views: ['messages'], flags: ['isRestrictedUser'], product: 'feed' },
  { views: ['dashboard'], flags: ['isSystemAdmin'], product: 'system-admin' },
  { prefixes: ['feed'], views: ['dashboard', 'general_feed', 'feed', 'my-network'], flags: ['isGeneralUser'], product: 'feed' },
  { prefixes: ['feed'], views: ['feed', 'my-network'], flags: ['isCandidate', 'isRecruiter'], product: 'feed' },
  { prefixes: ['feed'], views: ['feed', 'general_feed', 'my-network'], flags: ['isRestrictedUser'], product: 'feed' },
  { prefixes: ['profile'], flags: ['isGeneralUser'], product: 'profiles' },
  { prefixes: ['profile'], flags: ['isCandidate', 'isRecruiter'], product: 'profiles' },
  { prefixes: ['profile'], flags: ['isRestrictedUser'], product: 'profiles' },
  { prefixes: ['profile'], flags: ['isGovernanceUser'], product: 'profiles' },
  { prefixes: ['profile'], flags: ['isInstitutionAdmin'], product: 'profiles' },
  { prefixes: ['preparation'], flags: ['isCandidate'], product: 'preparation' },
  { prefixes: ['preparation'], flags: ['isRestrictedUser'], product: 'preparation' },
  { prefixes: ['preparation'], flags: ['isSystemAdmin'], product: 'preparation' },
  { views: ['dashboard', 'applications', 'active_processes', 'intelligence', 'calendar'], flags: ['isInstitutionallyRestrictedCandidate'], product: 'feed' },
  { views: ['dashboard', 'applications', 'active_processes', 'intelligence'], flags: ['isCandidate'], product: 'candidates' },
  { prefixes: ['candidate'], flags: ['isRecruiter', 'isGovernanceUser', 'isSystemAdmin', 'isInstitutionAdmin', 'isCandidate'], product: 'candidates' },
  { views: ['hr-outreach', 'hr-job-profiles', 'hr-discovery'], flags: ['isProfessional'], product: 'recruitment-lateral' },
  { views: ['workflows', 'jobs', 'applications', 'institutions', 'dashboard', 'request-approvals', 'ai-shortlist', 'hr-job-profiles', 'hr-discovery', 'hr-outreach'], flags: ['isRecruiter'], product: 'recruitment-lateral' },
  { views: ['recruitment_cycles', 'approval-queue', 'policy_approvals', 'dashboard', 'master_calendar', 'placement_templates', 'request_applications', 'students', 'cv-templates'], flags: ['isGovernanceUser'], product: 'recruitment-university' },
  { prefixes: ['institution'], flags: ['isInstitutionAdmin'], product: 'institution-management' },
  { prefixes: ['institution'], product: 'entity-about' },
  { prefixes: ['company'], flags: ['isSystemAdmin'], product: 'company-management' },
  { prefixes: ['company'], product: 'entity-about' },
  { prefixes: ['system', 'telemetry'], views: ['database', 'analytics', 'simulator', 'workflows', 'recruitment_cycles', 'approval-queue', 'applications', 'policy_approvals', 'master_calendar', 'placement_templates'], flags: ['isSystemAdmin'], product: 'system-admin' },
];

/**
 * Resolve which product module to load for a given view + role flags.
 * @param {string} view - current view id (e.g. 'dashboard', 'workflows')
 * @param {object} roleFlags - { isSystemAdmin, isCandidate, isRecruiter, isGovernanceUser, isInstitutionAdmin }
 * @returns {string|null} product key or null
 */
export function resolveProduct(view, roleFlags) {
  for (const route of PRODUCT_ROUTES) {
    const flagsMatch = !route.flags || route.flags.some((f) => roleFlags[f]);
    if (!flagsMatch) continue;

    const viewMatch = route.views && route.views.includes(view);
    const prefixMatch = route.prefixes && route.prefixes.some((p) => view.startsWith(p));

    if (viewMatch || prefixMatch) return route.product;
  }
  return null;
}
