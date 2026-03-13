/**
 * Variable interpolation and display helpers
 */

export function safeVar(v) {
  if (v == null || v === '') return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object' && v !== null && typeof v.name === 'string') return v.name;
  if (typeof v === 'object') return '';
  return String(v);
}

export function safeString(v) {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object') return '';
  return String(v);
}

export function getAutoVariable(varName, { user, cvData }) {
  const parts = varName.split('.');
  const key = parts.length > 1 ? parts[parts.length - 1] : varName;
  if (/^summary_item_\d+$/.test(key) && cvData) {
    const fromData = cvData[key] ?? cvData._summaryItems?.[parseInt(key.replace('summary_item_', ''), 10) - 1];
    if (fromData != null && fromData !== '') return safeVar(fromData);
  }
  switch (key) {
    case 'name': return safeVar(user?.name);
    case 'email': return safeVar(user?.email);
    case 'roll_number': return safeVar(user?.roll_number) || safeVar(user?.id);
    case 'college_name': return safeVar(user?.institution?.name);
    case 'program': return safeVar(user?.program);
    case 'profile_photo': return safeVar(user?.profile_photo);
    case 'phone': return safeVar(user?.phone);
    case 'linkedin_url': return safeVar(user?.linkedin_url);
    case 'portfolio_url': return safeVar(user?.portfolio_url);
    default: return '';
  }
}

export function interpolateVariables(text, getVarFn) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\{\{(\w+)\}\}/g, (_, varName) => getVarFn(varName));
}

export function displayString(v, sanitizeFn) {
  return sanitizeFn ? sanitizeFn(safeString(v)) : safeString(v);
}
