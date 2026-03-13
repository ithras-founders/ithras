/**
 * Date and duration formatting for CV entries
 */

import { safeString } from './variables.js';

const MONTH_NAMES = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

export function parseDurationToMonths(entry, groupLabel) {
  const startStr = safeString(entry.start_date);
  const endStr = safeString(entry.end_date);
  const durStr = safeString(entry.duration);
  let startDate = null;
  let endDate = null;
  if (startStr) {
    startDate = new Date(startStr);
    endDate = isPresentEndDate(entry.end_date) ? new Date() : (endStr ? new Date(endStr) : null);
  }
  if ((!startDate || !endDate) && durStr) {
    const m = durStr.match(/([a-z]+)'?\s*(\d{2,4})\s*[‑\-–]\s*([a-z]+)'?\s*(\d{2,4})/i);
    if (m) {
      const m1 = MONTH_NAMES[m[1].toLowerCase().slice(0, 3)];
      const y1 = m[2].length <= 2 ? 2000 + parseInt(m[2], 10) : parseInt(m[2], 10);
      const m2 = MONTH_NAMES[m[3].toLowerCase().slice(0, 3)];
      const y2 = m[4].length <= 2 ? 2000 + parseInt(m[4], 10) : parseInt(m[4], 10);
      if (m1 && m2) {
        startDate = new Date(y1, m1 - 1, 1);
        endDate = new Date(y2, m2 - 1, 1);
      }
    }
    const mm = durStr.match(/(\d{1,2})\/(\d{4})\s*[‑\-–]\s*(\d{1,2})\/(\d{4})/);
    if (!startDate && mm) {
      startDate = new Date(parseInt(mm[2], 10), parseInt(mm[1], 10) - 1, 1);
      endDate = new Date(parseInt(mm[4], 10), parseInt(mm[3], 10) - 1, 1);
    }
  }
  if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return null;
  if (endDate < startDate) return null;
  const months = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24 * 30.44)) || 1;
  return { months, label: groupLabel || 'FULL-TIME' };
}

export function isPresentEndDate(end) {
  if (end == null || end === '') return true;
  const s = String(end).toLowerCase().trim();
  return s === 'present' || s === 'current' || s === 'ongoing';
}

function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;
  if (typeof v === 'object' && v != null && (v.year != null || v.month != null)) {
    const y = v.year ?? new Date().getFullYear();
    const m = Math.max(0, Math.min(11, (v.month ?? 1) - 1));
    const d = new Date(y, m, 1);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDateRange(start, end) {
  if (!start) return '';
  const d1 = toDate(start);
  if (!d1) return '';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const startStr = `${months[d1.getMonth()]}'${String(d1.getFullYear()).slice(-2)}`;
  if (isPresentEndDate(end)) return `${startStr} - Present`;
  const d2 = toDate(end);
  if (isNaN(d2.getTime())) return startStr;
  return `${startStr} - ${months[d2.getMonth()]}'${String(d2.getFullYear()).slice(-2)}`;
}

export function calculateDurationMonths(start, end) {
  if (!start) return null;
  const d1 = toDate(start);
  if (!d1) return null;
  const d2 = isPresentEndDate(end) ? new Date() : toDate(end);
  if (!d2 || isNaN(d2.getTime())) return null;
  if (d2 < d1) return null;
  return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24 * 30.44)));
}

export function formatYearsMonths(totalMonths) {
  if (!totalMonths || totalMonths <= 0) return null;
  const years = Math.floor(totalMonths / 12);
  const mo = totalMonths % 12;
  if (years > 0 && mo > 0) return `${years} YEAR${years > 1 ? 'S' : ''} ${mo} MONTH${mo > 1 ? 'S' : ''}`;
  if (years > 0) return `${years} YEAR${years > 1 ? 'S' : ''}`;
  return `${mo} MONTH${mo > 1 ? 'S' : ''}`;
}

const trailingDateRe = /\s*[|\-,]\s*(\d{2,4}[\-,]\d{2,4})\s*$|\s*[|\-,]\s*(\d{4})\s*$|\s*\((\d{2,4}[\-,]\d{2,4})\)\s*$|\s*\((\d{4})\)\s*$|\s+(\d{2,4}[\-,]\d{2,4})\s*$|\s+(\d{4})\s*$/;
const trailingDateStripRe = /\s*[|\-,]\s*\d{2,4}[\-,]?\d{0,4}\s*$|\s*\(\d{2,4}[\-,]?\d{0,4}\)\s*$|\s+\d{2,4}[\-,]\d{2,4}\s*$|\s+\d{4}\s*$/;

export function extractTrailingYear(item) {
  const isObj = typeof item === 'object' && item !== null;
  const str = isObj && item.text != null ? safeString(item.text) : safeString(item);
  const match = str.match(trailingDateRe);
  if (match) {
    const year = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
    const text = str.replace(trailingDateStripRe, '').trim();
    return { text, year, proofUrl: isObj ? item.proofUrl : null };
  }
  return { text: str, year: '', proofUrl: isObj ? item.proofUrl : null };
}

export { trailingDateRe, trailingDateStripRe };
