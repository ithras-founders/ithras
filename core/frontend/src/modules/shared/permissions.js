/**
 * Permission helpers for RBAC-based access control.
 * Works with the active_profile object returned by /auth/login.
 */

export const PermissionCode = {
  // Identity & Profile (scope-aware: self)
  PROFILE_SELF_VIEW: 'profile.self.view',
  PROFILE_SELF_EDIT: 'profile.self.edit',
  PROFILE_AFFILIATIONS_VIEW: 'profile.affiliations.view',
  AUTH_PROFILE_SWITCH: 'auth.profile.switch',
  // CV
  CV_SELF_VIEW: 'cv.self.view',
  CV_SELF_MANAGE: 'cv.self.manage',
  CV_REVIEW_APPROVE: 'cv.review.approve',
  CV_TEMPLATES_VIEW: 'cv.templates.view',
  CV_TEMPLATES_CREATE: 'cv.templates.create',
  CV_TEMPLATES_ASSIGN: 'cv.templates.assign',
  CV_TEMPLATES_PUBLISH: 'cv.templates.publish',
  // Placement
  PLACEMENT_CYCLES_VIEW: 'placement.cycles.view',
  PLACEMENT_CYCLES_MANAGE: 'placement.cycles.manage',
  PLACEMENT_CYCLES_CONFIGURE: 'placement.cycles.configure',
  PLACEMENT_STUDENTS_VIEW: 'placement.students.view',
  PLACEMENT_STUDENTS_MANAGE: 'placement.students.manage',
  PLACEMENT_ELIGIBILITY_VIEW: 'placement.eligibility.view',
  PLACEMENT_ELIGIBILITY_OVERRIDE: 'placement.eligibility.override',
  // Opportunities
  OPPORTUNITIES_VIEW: 'opportunities.view',
  OPPORTUNITIES_PERSONALIZED_VIEW: 'opportunities.personalized.view',
  // Applications
  APPLICATIONS_VIEW_OWN: 'applications.view_own',
  APPLICATIONS_SELF_VIEW: 'applications.self.view',
  APPLICATIONS_VIEW_ALL: 'applications.view_all',
  APPLICATIONS_CREATE: 'applications.create',
  APPLICATIONS_APPROVE: 'applications.approve',
  // Recruitment
  RECRUITMENT_DISCOVERY_SEARCH: 'recruitment.discovery.search',
  RECRUITMENT_SHORTLIST_MANAGE: 'recruitment.shortlist.manage',
  RECRUITMENT_OFFER_APPROVE: 'recruitment.offer.approve',
  RECRUITMENT_JOB_PROFILES_VIEW: 'recruitment.job_profiles.view',
  RECRUITMENT_JOB_PROFILES_CREATE: 'recruitment.job_profiles.create',
  RECRUITMENT_JOB_PROFILES_MANAGE: 'recruitment.job_profiles.manage',
  // Users & Admin
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_MANAGE: 'users.manage',
  USERS_MANAGE_ROLES: 'users.manage_roles',
  INSTITUTION_VIEW: 'institution.view',
  INSTITUTION_STRUCTURE_VIEW: 'institution.structure.view',
  INSTITUTION_STRUCTURE_MANAGE: 'institution.structure.manage',
  INSTITUTION_MANAGE: 'institution.manage',
  INSTITUTION_MANAGE_PROGRAMS: 'institution.manage_programs',
  COMPANY_VIEW: 'company.view',
  COMPANY_MANAGE: 'company.manage',
  COMPANY_MANAGE_JOBS: 'company.manage_jobs',
  COMPANY_BUSINESS_UNITS_MANAGE: 'company.business_units.manage',
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_VIEW_TELEMETRY: 'system.view_telemetry',
  SYSTEM_VIEW_ANALYTICS: 'system.view_analytics',
  SYSTEM_AUDIT_VIEW: 'system.audit.view',
  SYSTEM_PERMISSIONS_MANAGE: 'system.permissions.manage',
  // Governance
  GOVERNANCE_WORKFLOWS_VIEW: 'governance.workflows.view',
  GOVERNANCE_WORKFLOWS_MANAGE: 'governance.workflows.manage',
  GOVERNANCE_WORKFLOWS_APPROVE: 'governance.workflows.approve',
  GOVERNANCE_POLICIES_APPROVE: 'governance.policies.approve',
};

/**
 * Check if a profile has a specific permission.
 * @param {object|null} profile - The active profile (from login response)
 * @param {string} permissionCode - The permission code to check
 * @returns {boolean}
 */
export function hasPermission(profile, permissionCode) {
  if (!profile || !profile.permissions) return false;
  if (profile.permissions.includes('system.admin')) return true;
  return profile.permissions.includes(permissionCode);
}

/**
 * Check if a profile has any of the specified permissions.
 * @param {object|null} profile
 * @param {string[]} permissionCodes
 * @returns {boolean}
 */
export function hasAnyPermission(profile, permissionCodes) {
  if (!profile || !profile.permissions) return false;
  if (profile.permissions.includes('system.admin')) return true;
  return permissionCodes.some(code => profile.permissions.includes(code));
}

/**
 * Check if a profile has all of the specified permissions.
 * @param {object|null} profile
 * @param {string[]} permissionCodes
 * @returns {boolean}
 */
export function hasAllPermissions(profile, permissionCodes) {
  if (!profile || !profile.permissions) return false;
  if (profile.permissions.includes('system.admin')) return true;
  return permissionCodes.every(code => profile.permissions.includes(code));
}

/**
 * Derive legacy role flags from a profile (backward compat bridge).
 * This allows existing code to check isCandidate, isRecruiter, etc.
 * Also includes scope context (institution_id, company_id, business_unit_id) for scope-aware RBAC.
 * Subscription/onboarding flags: isInstitutionallyRestrictedCandidate, isLimitedRecruiter, canAccessRecruiterMode.
 * @param {object|null} profile - Active profile from login
 * @param {object} [options] - Optional: { profiles } for canAccessRecruiterMode (requires recruiter profile with onboarded org)
 */
export function deriveRoleFlags(profile, options = {}) {
  const empty = {
    isSystemAdmin: false,
    isCandidate: false,
    isRecruiter: false,
    isProfessional: false,
    isGovernanceUser: false,
    isInstitutionAdmin: false,
    isPlacementTeam: false,
    isRestrictedUser: false,
    isInstitutionallyRestrictedCandidate: false,
    isLimitedRecruiter: false,
    canAccessRecruiterMode: false,
    institutionId: null,
    companyId: null,
    businessUnitId: null,
  };
  if (!profile) return empty;

  const roleId = profile.role?.id || profile.role_id || '';
  const isCandidateOrProfessional = roleId === 'CANDIDATE' || roleId === 'PROFESSIONAL';
  const institutionId = profile.institution_id ?? profile.institution?.id;
  const companyId = profile.company_id ?? profile.company?.id;
  const businessUnitId = profile.business_unit_id ?? profile.business_unit?.id;
  const institutionFeatures = profile.institution_features || [];
  const institutionOnboardingStatus = profile.institution_onboarding_status;
  const companyOnboardingStatus = profile.company_onboarding_status;

  const isSystemAdmin = roleId === 'SYSTEM_ADMIN' || hasPermission(profile, 'system.admin');
  const isGovernanceUser = hasAnyPermission(profile, ['governance.workflows.view', 'governance.workflows.manage']);
  const isPlacementTeam = roleId === 'PLACEMENT_TEAM' || roleId === 'PLACEMENT_ADMIN';

  const isInstitutionallyRestrictedCandidate =
    roleId === 'CANDIDATE' &&
    institutionId &&
    (!institutionFeatures.includes('placement') || institutionOnboardingStatus === 'PRESENT_ONLY');

  const isLimitedRecruiter = roleId === 'RECRUITER' && companyOnboardingStatus !== 'ONBOARDED';

  const hasRecruiterProfileWithOnboardedOrg = (options.profiles || []).some(
    (p) =>
      (p.role?.id || p.role_id) === 'RECRUITER' && (p.company_onboarding_status || 'ONBOARDED') === 'ONBOARDED'
  );
  const canAccessRecruiterMode =
    roleId === 'PROFESSIONAL' && (options.profiles || []).length > 0
      ? hasRecruiterProfileWithOnboardedOrg
      : roleId === 'PROFESSIONAL';

  const isRestrictedUser =
    (!isSystemAdmin && !isGovernanceUser && !isPlacementTeam && !isCandidateOrProfessional && roleId !== 'RECRUITER') ||
    isInstitutionallyRestrictedCandidate;

  return {
    isSystemAdmin,
    isCandidate: isCandidateOrProfessional,
    isRecruiter: roleId === 'RECRUITER',
    isProfessional: roleId === 'PROFESSIONAL',
    isGovernanceUser,
    isInstitutionAdmin: roleId === 'INSTITUTION_ADMIN',
    isPlacementTeam,
    isGeneralUser: isCandidateOrProfessional && !institutionId,
    isRestrictedUser,
    isInstitutionallyRestrictedCandidate,
    isLimitedRecruiter,
    canAccessRecruiterMode,
    institutionId,
    companyId,
    businessUnitId,
  };
}

/**
 * Check if profile can edit own profile (profile.self.edit).
 */
export function canEditOwnProfile(profile) {
  return hasPermission(profile, PermissionCode.PROFILE_SELF_EDIT) || hasPermission(profile, 'system.admin');
}

/**
 * Check if profile can switch context (auth.profile.switch).
 */
export function canSwitchProfile(profile) {
  return hasPermission(profile, PermissionCode.AUTH_PROFILE_SWITCH) || hasPermission(profile, 'system.admin');
}
