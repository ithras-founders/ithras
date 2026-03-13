/**
 * Re-export all API functions from domain modules.
 * Products can import from this or from specific domains (e.g. api/cv.js).
 */
export { getApiBaseUrl, apiRequest, uploadFile } from './apiBase.js';
export * from './core.js';
export * from './placement.js';
export * from './cv.js';
export * from './calendar.js';
export * from './governance.js';
export * from './analytics.js';
export * from './telemetry.js';
export * from './setup.js';
export * from './simulator.js';
export * from './rbac.js';
export * from './audit.js';
export * from './recruitment.js';
export * from './hr.js';
export * from './feed.js';
export * from './messaging.js';
