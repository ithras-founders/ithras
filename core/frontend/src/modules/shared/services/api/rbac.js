/** RBAC API: roles, permissions, user profiles */
import { apiRequest } from './apiBase.js';

export const getRoles = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/v1/roles/${qs ? '?' + qs : ''}`);
};

/** Roles assignable for a given institution or company context */
export const getAssignableRoles = (params) => {
  const qs = new URLSearchParams(params).toString();
  return apiRequest(`/v1/roles/assignable${qs ? '?' + qs : ''}`);
};
export const getRole = (id) => apiRequest(`/v1/roles/${id}`);
export const createRole = (data) =>
  apiRequest('/v1/roles/', { method: 'POST', body: JSON.stringify(data) });
export const updateRole = (id, data) =>
  apiRequest(`/v1/roles/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteRole = (id) =>
  apiRequest(`/v1/roles/${id}`, { method: 'DELETE' });

export const getRolePermissions = (roleId) =>
  apiRequest(`/v1/roles/${roleId}/permissions`);
export const setRolePermissions = (roleId, permissionCodes) =>
  apiRequest(`/v1/roles/${roleId}/permissions`, { method: 'PUT', body: JSON.stringify(permissionCodes) });

export const getPermissions = () => apiRequest('/v1/permissions/');

export const getUserProfiles = (userId) => apiRequest(`/v1/users/${userId}/profiles`);
export const assignProfile = (userId, data, grantedBy) => {
  const qs = grantedBy ? `?granted_by=${grantedBy}` : '';
  return apiRequest(`/v1/users/${userId}/profiles${qs}`, { method: 'POST', body: JSON.stringify(data) });
};
export const updateProfile = (userId, assignmentId, data) =>
  apiRequest(`/v1/users/${userId}/profiles/${assignmentId}`, { method: 'PUT', body: JSON.stringify(data) });
export const revokeProfile = (userId, assignmentId) =>
  apiRequest(`/v1/users/${userId}/profiles/${assignmentId}`, { method: 'DELETE' });
export const batchRevokeProfiles = (userId, assignmentIds) =>
  apiRequest(`/v1/users/${userId}/profiles/batch-revoke`, {
    method: 'POST',
    body: JSON.stringify({ assignment_ids: assignmentIds }),
  });

export const switchProfile = (profileId) =>
  apiRequest('/v1/auth/switch-profile', { method: 'POST', body: JSON.stringify({ profile_id: profileId }) });
