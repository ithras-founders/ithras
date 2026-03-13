/**
 * Canonical: analytics/utils/cellDisplay.js
 * Safe display for query result cells - prevents React #31 when cells are objects (JSON/JSONB).
 */
export function safeCellDisplay(cell) {
  if (cell == null) return 'NULL';
  if (typeof cell === 'object') return JSON.stringify(cell);
  return String(cell);
}
