/**
 * Parse key:value operators from search query (aligned with backend parse_search_query).
 */
export const OPERATOR_RE =
  /\b(company|institution|function|year|community|degree|major|industry|location|type):(?:"([^"]+)"|(\S+))/gi;

export function parseQueryOperators(q) {
  const operators = {};
  const cleaned = (q || '').replace(OPERATOR_RE, (m, key, qv, sq) => {
    const val = (qv || sq || '').trim();
    if (val) operators[String(key).toLowerCase()] = val;
    return ' ';
  });
  return { freeText: cleaned.replace(/\s+/g, ' ').trim(), operators };
}

export function removeOperatorFromQuery(q, key) {
  const re = new RegExp(`\\b${key}:(?:"[^"]+"|\\S+)`, 'gi');
  return q.replace(re, '').replace(/\s+/g, ' ').trim();
}
