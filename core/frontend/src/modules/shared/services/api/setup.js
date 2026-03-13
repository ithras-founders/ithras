/**
 * Setup API - database schema setup status (no auth required)
 */
import { apiRequest } from './apiBase.js';

export async function getSetupStatus() {
  return apiRequest('/v1/setup/status');
}
