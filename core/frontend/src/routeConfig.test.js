import { describe, it, expect } from 'vitest';
import { resolveProduct, PRODUCT_ROUTES } from './routeConfig.js';

const baseFlags = {
  isSystemAdmin: false,
  isCandidate: false,
  isRecruiter: false,
  isGovernanceUser: false,
  isInstitutionAdmin: false,
};

describe('resolveProduct', () => {
  it('returns calendar-management for calendar views', () => {
    expect(resolveProduct('calendar', baseFlags)).toBe('calendar-management');
    expect(resolveProduct('calendar/slots', baseFlags)).toBe('calendar-management');
    expect(resolveProduct('timetable', baseFlags)).toBe('calendar-management');
  });

  it('returns cv-templates-viewer for system admin on cv views', () => {
    expect(resolveProduct('cv', { ...baseFlags, isSystemAdmin: true })).toBe('cv-templates-viewer');
    expect(resolveProduct('cv-maker', { ...baseFlags, isSystemAdmin: true })).toBe('cv-templates-viewer');
  });

  it('returns profiles for candidate on cv views', () => {
    expect(resolveProduct('cv', { ...baseFlags, isCandidate: true })).toBe('profiles');
    expect(resolveProduct('cv-maker', { ...baseFlags, isCandidate: true })).toBe('profiles');
  });

  it('returns profiles for governance user on cv views', () => {
    expect(resolveProduct('cv', { ...baseFlags, isGovernanceUser: true })).toBe('profiles');
  });

  it('returns cv-verification for governance user', () => {
    expect(resolveProduct('cv-verification', { ...baseFlags, isGovernanceUser: true })).toBe('cv-verification');
  });

  it('returns system-admin for admin dashboard', () => {
    expect(resolveProduct('dashboard', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
  });

  it('returns candidates for candidate dashboard', () => {
    expect(resolveProduct('dashboard', { ...baseFlags, isCandidate: true })).toBe('candidates');
    expect(resolveProduct('applications', { ...baseFlags, isCandidate: true })).toBe('candidates');
    expect(resolveProduct('active_processes', { ...baseFlags, isCandidate: true })).toBe('candidates');
  });

  it('returns recruitment-lateral for recruiter', () => {
    expect(resolveProduct('workflows', { ...baseFlags, isRecruiter: true })).toBe('recruitment-lateral');
    expect(resolveProduct('jobs', { ...baseFlags, isRecruiter: true })).toBe('recruitment-lateral');
    expect(resolveProduct('dashboard', { ...baseFlags, isRecruiter: true })).toBe('recruitment-lateral');
  });

  it('returns recruitment-university for governance user', () => {
    expect(resolveProduct('recruitment_cycles', { ...baseFlags, isGovernanceUser: true })).toBe('recruitment-university');
    expect(resolveProduct('approval-queue', { ...baseFlags, isGovernanceUser: true })).toBe('recruitment-university');
    expect(resolveProduct('policy_approvals', { ...baseFlags, isGovernanceUser: true })).toBe('recruitment-university');
  });

  it('returns institution-management for institution admin', () => {
    expect(resolveProduct('institution/123', { ...baseFlags, isInstitutionAdmin: true })).toBe('institution-management');
  });

  it('returns company-management for system admin on company views', () => {
    expect(resolveProduct('company/abc', { ...baseFlags, isSystemAdmin: true })).toBe('company-management');
  });

  it('returns system-admin for system admin on admin views', () => {
    expect(resolveProduct('system-admin', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
    expect(resolveProduct('system-admin/people', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
    expect(resolveProduct('telemetry', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
    expect(resolveProduct('database', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
    expect(resolveProduct('analytics', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
    expect(resolveProduct('simulator', { ...baseFlags, isSystemAdmin: true })).toBe('system-admin');
  });

  it('returns null for unknown views with no role', () => {
    expect(resolveProduct('unknown', baseFlags)).toBe(null);
  });

  it('returns null for views when user lacks required role', () => {
    expect(resolveProduct('workflows', baseFlags)).toBe(null);
    expect(resolveProduct('dashboard', baseFlags)).toBe(null);
  });
});

describe('PRODUCT_ROUTES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(PRODUCT_ROUTES)).toBe(true);
    expect(PRODUCT_ROUTES.length).toBeGreaterThan(0);
  });

  it('every route has a product field', () => {
    for (const route of PRODUCT_ROUTES) {
      expect(typeof route.product).toBe('string');
      expect(route.product.length).toBeGreaterThan(0);
    }
  });
});
