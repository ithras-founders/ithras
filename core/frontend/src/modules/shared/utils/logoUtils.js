/**
 * Resolve logo URL for an entity (company or institution).
 * Handles local paths, external URLs, and legacy filename-only format.
 *
 * @param {Object} entity - Object with logo_url or logo
 * @param {string} assetsPrefix - e.g. '/assets/companies/' or '/assets/institutions/'
 * @returns {string|null} Resolved URL or null for placeholder/fallback
 */
const getLogoUrl = (entity, assetsPrefix) => {
  const url = entity?.logo_url ?? entity?.logo;
  if (!url) return null;
  if (url.startsWith('/assets/') || url.startsWith('/uploads/')) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${assetsPrefix}${url}`;
};

export const getCompanyLogoUrl = (company) => getLogoUrl(company, '/assets/companies/');

export const getInstitutionLogoUrl = (institution) => getLogoUrl(institution, '/assets/institutions/');

/**
 * Fallback URL for company logos when the asset 404s (e.g. assets/companies not synced).
 * Uses UI Avatars with company name for a deterministic placeholder.
 * @param {Object} company - Company with name
 * @returns {string} Placeholder image URL
 */
export const getCompanyLogoFallback = (company) => {
  const name = company?.name || 'Company';
  const encoded = encodeURIComponent(name.substring(0, 2).toUpperCase());
  return `https://ui-avatars.com/api/?name=${encoded}&background=6366f1&color=fff&size=128`;
};

export const getInstitutionLogoFallback = (institution) => {
  const name = institution?.name || 'Institution';
  const encoded = encodeURIComponent(name.substring(0, 2).toUpperCase());
  return `https://ui-avatars.com/api/?name=${encoded}&background=4f46e5&color=fff&size=128`;
};
