/**
 * Coerce any value to a string suitable for rendering as a React child.
 * Prevents React #311 ("Objects are not valid as a React child").
 */
export function toDisplayString(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'object' && v !== null) return v.name ?? v.label ?? v.message ?? v.id ?? '';
  return String(v);
}
