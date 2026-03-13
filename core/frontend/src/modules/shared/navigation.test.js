import { describe, it, expect } from 'vitest';
import { pathToView, viewToPath, VALID_VIEW_IDS } from './navigation.js';

describe('pathToView', () => {
  it('maps "/" to "dashboard"', () => {
    expect(pathToView('/')).toBe('dashboard');
  });

  it('maps "" to "dashboard"', () => {
    expect(pathToView('')).toBe('dashboard');
  });

  it('maps null/undefined to "dashboard"', () => {
    expect(pathToView(null)).toBe('dashboard');
    expect(pathToView(undefined)).toBe('dashboard');
  });

  it('maps known views correctly', () => {
    expect(pathToView('/applications')).toBe('applications');
    expect(pathToView('/workflows')).toBe('workflows');
    expect(pathToView('/simulator')).toBe('simulator');
    expect(pathToView('/cv-maker')).toBe('cv-maker');
    expect(pathToView('/recruitment_cycles')).toBe('recruitment_cycles');
    expect(pathToView('/approval-queue')).toBe('approval-queue');
  });

  it('strips trailing slashes', () => {
    expect(pathToView('/dashboard/')).toBe('dashboard');
    expect(pathToView('/applications///')).toBe('applications');
  });

  it('allows dynamic institution/company/system/telemetry prefixes', () => {
    expect(pathToView('/institution/123')).toBe('institution/123');
    expect(pathToView('/company/abc')).toBe('company/abc');
    expect(pathToView('/system-admin/people/user/x')).toBe('system-admin/people/user/x');
    expect(pathToView('/telemetry/api')).toBe('telemetry/api');
  });

  it('returns null for unknown paths', () => {
    expect(pathToView('/nonexistent')).toBe(null);
    expect(pathToView('/random-page')).toBe(null);
  });
});

describe('viewToPath', () => {
  it('maps "dashboard" to "/"', () => {
    expect(viewToPath('dashboard')).toBe('/');
  });

  it('maps null/undefined to "/"', () => {
    expect(viewToPath(null)).toBe('/');
    expect(viewToPath(undefined)).toBe('/');
    expect(viewToPath('')).toBe('/');
  });

  it('maps views to /<view>', () => {
    expect(viewToPath('applications')).toBe('/applications');
    expect(viewToPath('simulator')).toBe('/simulator');
    expect(viewToPath('system-admin/people')).toBe('/system-admin/people');
  });
});

describe('VALID_VIEW_IDS', () => {
  it('contains expected core views', () => {
    expect(VALID_VIEW_IDS.has('dashboard')).toBe(true);
    expect(VALID_VIEW_IDS.has('applications')).toBe(true);
    expect(VALID_VIEW_IDS.has('simulator')).toBe(true);
    expect(VALID_VIEW_IDS.has('cv-maker')).toBe(true);
  });

  it('does not contain invalid views', () => {
    expect(VALID_VIEW_IDS.has('nonexistent')).toBe(false);
  });
});
