/**
 * Demo/tutorial mode utilities.
 * Used to guard against API calls with mock IDs.
 */
export const isDemoUser = (user) =>
  !!user && (user.id === 'demo' || user.company_id === 'demo-company' || user.companyId === 'demo-company');

export const isDemoId = (id) => id === 'demo-company' || id === 'demo';
