/** Core API: auth only */
import { apiRequest } from './apiBase.js';

export const validateSession = () =>
  apiRequest('/v1/auth/me', { quiet: true });

/** Login with identifier (username or email) + password */
export const login = (identifier, password) =>
  apiRequest('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
    quiet: true,
  });

/** Register new user */
export const register = (data) =>
  apiRequest('/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });
