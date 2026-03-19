/** Profile API: education, experience, institutions, organisations */
import { apiRequest } from './apiBase.js';

export const updateProfile = (data) =>
  apiRequest('/v1/profile/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
    quiet: true,
  });

export const getEducation = () =>
  apiRequest('/v1/profile/education', { quiet: true });

export const addEducation = (data) =>
  apiRequest('/v1/profile/education', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });

export const updateEducation = (entryId, data) =>
  apiRequest(`/v1/profile/education/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    quiet: true,
  });

export const deleteEducation = (entryId) =>
  apiRequest(`/v1/profile/education/${entryId}`, {
    method: 'DELETE',
    quiet: true,
  });

export const getExperience = () =>
  apiRequest('/v1/profile/experience', { quiet: true });

export const addExperience = (data) =>
  apiRequest('/v1/profile/experience', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });

export const updateExperience = (egId, data) =>
  apiRequest(`/v1/profile/experience/${egId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    quiet: true,
  });

export const deleteExperience = (egId) =>
  apiRequest(`/v1/profile/experience/${egId}`, {
    method: 'DELETE',
    quiet: true,
  });

export const addMovement = (data) =>
  apiRequest('/v1/profile/experience/movement', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });

export const updateMovement = (movementId, data) =>
  apiRequest(`/v1/profile/experience/movement/${movementId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    quiet: true,
  });

export const deleteMovement = (movementId) =>
  apiRequest(`/v1/profile/experience/movement/${movementId}`, {
    method: 'DELETE',
    quiet: true,
  });

export const getAdditionalResponsibilities = () =>
  apiRequest('/v1/profile/additional-responsibilities', { quiet: true });

export const addAdditionalResponsibility = (data) =>
  apiRequest('/v1/profile/additional-responsibilities', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });

export const updateAdditionalResponsibility = (id, data) =>
  apiRequest(`/v1/profile/additional-responsibilities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    quiet: true,
  });

export const deleteAdditionalResponsibility = (id) =>
  apiRequest(`/v1/profile/additional-responsibilities/${id}`, {
    method: 'DELETE',
    quiet: true,
  });

export const getOtherAchievements = () =>
  apiRequest('/v1/profile/other-achievements', { quiet: true });

export const addOtherAchievement = (data) =>
  apiRequest('/v1/profile/other-achievements', {
    method: 'POST',
    body: JSON.stringify(data),
    quiet: true,
  });

export const updateOtherAchievement = (id, data) =>
  apiRequest(`/v1/profile/other-achievements/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
    quiet: true,
  });

export const deleteOtherAchievement = (id) =>
  apiRequest(`/v1/profile/other-achievements/${id}`, {
    method: 'DELETE',
    quiet: true,
  });

export const searchInstitutions = (q) =>
  apiRequest(`/v1/institutions/search?q=${encodeURIComponent(q || '')}`, { quiet: true });

export const getDegreeMajors = (institutionId) =>
  apiRequest(`/v1/institutions/${institutionId}/degree-majors`, { quiet: true });

export const getInstitutionAllowedFields = (institutionId) =>
  apiRequest(`/v1/institutions/${institutionId}/allowed-fields`, { quiet: true });

export const searchOrganisations = (q) =>
  apiRequest(`/v1/organisations/search?q=${encodeURIComponent(q || '')}`, { quiet: true });

export const getOrgCombos = (orgId) =>
  apiRequest(`/v1/organisations/${orgId}/combos`, { quiet: true });

export const getOrganisationAllowedFields = (orgId) =>
  apiRequest(`/v1/organisations/${orgId}/allowed-fields`, { quiet: true });

export const getPublicProfile = (slug) =>
  apiRequest(`/v1/public/profiles/${encodeURIComponent(slug)}`, { quiet: true });

export const getPublicInstitution = (slug) =>
  apiRequest(`/v1/public/institutions/${encodeURIComponent(slug)}`, { quiet: true });

export const getPublicOrganisation = (slug) =>
  apiRequest(`/v1/public/organisations/${encodeURIComponent(slug)}`, { quiet: true });

export const getInstitutionPeople = (slug) =>
  apiRequest(`/v1/public/institutions/${encodeURIComponent(slug)}/people`, { quiet: true });

export const getOrganisationPeople = (slug) =>
  apiRequest(`/v1/public/organisations/${encodeURIComponent(slug)}/people`, { quiet: true });
