/**
 * Product registry - lazy import paths for each product.
 * Reduces initial bundle by loading product UIs on demand.
 */
export const productRegistry = {
  'calendar-management': () => import('/products/calendar-management/frontend/src/modules/scheduling/index.js'),
  'cv-maker': () => import('/products/profiles/cv/frontend/src/modules/cv-maker/index.js'),
  'cv-templates-viewer': () => import('/products/profiles/cv/frontend/src/modules/cv-templates-viewer/index.js'),
  'cv-verification': () => import('/products/profiles/cv/frontend/src/modules/cv-verification/index.js'),
  'recruitment-university': () => import('/products/recruitment-university/frontend/src/modules/governance/index.js'),
  'institution-management': () => import('/products/profiles/institution/frontend/src/InstitutionAdminPortal.js'),
  'company-management': () => import('/products/profiles/company/frontend/src/index.js'),
  'recruitment-lateral': () => import('/products/recruitment-lateral/frontend/src/index.js'),
  'system-admin': () => import('/products/system-admin/core/frontend/src/index.js'),
  'candidates': () => import('/products/profiles/candidate/frontend/src/index.js'),
  'profiles': () => import('/products/profiles/core/frontend/src/index.js'),
  'general-feed': () => import('/products/general-feed/frontend/src/index.js'),
  'preparation': () => import('/products/preparation/frontend/src/index.js'),
  'entity-about': () => import('/core/frontend/src/modules/entity-about/index.js'),
};
