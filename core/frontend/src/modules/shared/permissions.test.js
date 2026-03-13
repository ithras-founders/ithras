import { describe, it, expect } from 'vitest';
import { deriveRoleFlags, hasPermission, hasAnyPermission, hasAllPermissions } from './permissions.js';

describe('hasPermission', () => {
  it('returns false for null profile', () => {
    expect(hasPermission(null, 'system.admin')).toBe(false);
  });

  it('returns true for system.admin with any permission', () => {
    const profile = { permissions: ['system.admin'] };
    expect(hasPermission(profile, 'anything')).toBe(true);
  });

  it('returns true when permission matches', () => {
    const profile = { permissions: ['governance.workflows.view'] };
    expect(hasPermission(profile, 'governance.workflows.view')).toBe(true);
  });

  it('returns false when permission does not match', () => {
    const profile = { permissions: ['governance.workflows.view'] };
    expect(hasPermission(profile, 'system.admin')).toBe(false);
  });
});

describe('hasAnyPermission', () => {
  it('returns true if any permission matches', () => {
    const profile = { permissions: ['governance.workflows.manage'] };
    expect(hasAnyPermission(profile, ['governance.workflows.view', 'governance.workflows.manage'])).toBe(true);
  });

  it('returns false if none match', () => {
    const profile = { permissions: ['users.view'] };
    expect(hasAnyPermission(profile, ['governance.workflows.view', 'governance.workflows.manage'])).toBe(false);
  });
});

describe('hasAllPermissions', () => {
  it('returns true when all match', () => {
    const profile = { permissions: ['a', 'b'] };
    expect(hasAllPermissions(profile, ['a', 'b'])).toBe(true);
  });

  it('returns false when one is missing', () => {
    const profile = { permissions: ['a'] };
    expect(hasAllPermissions(profile, ['a', 'b'])).toBe(false);
  });
});

describe('deriveRoleFlags', () => {
  it('returns all-false for null profile', () => {
    const flags = deriveRoleFlags(null);
    expect(flags.isSystemAdmin).toBe(false);
    expect(flags.isCandidate).toBe(false);
    expect(flags.isRecruiter).toBe(false);
    expect(flags.isGovernanceUser).toBe(false);
    expect(flags.isInstitutionAdmin).toBe(false);
    expect(flags.isPlacementTeam).toBe(false);
  });

  it('identifies SYSTEM_ADMIN', () => {
    const flags = deriveRoleFlags({ role: { id: 'SYSTEM_ADMIN' }, permissions: [] });
    expect(flags.isSystemAdmin).toBe(true);
    expect(flags.isCandidate).toBe(false);
  });

  it('identifies system.admin via permission', () => {
    const flags = deriveRoleFlags({ role: { id: 'OTHER' }, permissions: ['system.admin'] });
    expect(flags.isSystemAdmin).toBe(true);
  });

  it('identifies CANDIDATE', () => {
    const flags = deriveRoleFlags({ role: { id: 'CANDIDATE' }, permissions: [] });
    expect(flags.isCandidate).toBe(true);
    expect(flags.isRecruiter).toBe(false);
  });

  it('identifies RECRUITER', () => {
    const flags = deriveRoleFlags({ role: { id: 'RECRUITER' }, permissions: [] });
    expect(flags.isRecruiter).toBe(true);
  });

  it('identifies governance user via permissions', () => {
    const flags = deriveRoleFlags({ role: { id: 'PLACEMENT_TEAM' }, permissions: ['governance.workflows.view'] });
    expect(flags.isGovernanceUser).toBe(true);
    expect(flags.isPlacementTeam).toBe(true);
  });

  it('identifies INSTITUTION_ADMIN', () => {
    const flags = deriveRoleFlags({ role: { id: 'INSTITUTION_ADMIN' }, permissions: [] });
    expect(flags.isInstitutionAdmin).toBe(true);
  });

  it('identifies PLACEMENT_ADMIN as placement team', () => {
    const flags = deriveRoleFlags({ role: { id: 'PLACEMENT_ADMIN' }, permissions: [] });
    expect(flags.isPlacementTeam).toBe(true);
  });
});
