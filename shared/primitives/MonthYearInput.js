/**
 * Month-year input for education/experience dates.
 * Returns value as "YYYY-MM" (e.g. "2020-01") or "" if incomplete/Present.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 60 }, (_, i) => currentYear - 50 + i);

const MonthYearInput = ({ value, onChange, label, id, disabled = false, endDate = false }) => {
  const parseValue = (v) => {
    const parts = (v || '').split('-');
    const m = parts.length >= 2 ? parseInt(parts[1], 10) || 0 : 0;
    const y = parts.length >= 1 && parts[0] ? parseInt(parts[0], 10) : '';
    return { month: m, year: y };
  };

  const parsed = parseValue(value);
  const [month, setMonth] = useState(parsed.month);
  const [year, setYear] = useState(parsed.year);

  useEffect(() => {
    const p = parseValue(value);
    setMonth(p.month);
    setYear(p.year);
  }, [value]);

  const handleMonthChange = (e) => {
    const newMonth = parseInt(e.target.value, 10) || 0;
    setMonth(newMonth);
    if (endDate && newMonth === 0) {
      setYear('');
      onChange('');
      return;
    }
    if (newMonth && year) {
      onChange(`${year}-${String(newMonth).padStart(2, '0')}`);
    }
  };

  const handleYearChange = (e) => {
    const newYear = e.target.value ? parseInt(e.target.value, 10) : '';
    setYear(newYear);
    if (endDate && month === 0) {
      onChange('');
      return;
    }
    if (month && newYear) {
      onChange(`${newYear}-${String(month).padStart(2, '0')}`);
    }
  };

  return html`
    <div>
      ${label ? html`
        <label htmlFor=${id ? `${id}-month` : undefined} className="block text-[var(--app-text-sm)] font-medium text-[var(--app-text-primary)] mb-[var(--app-space-2)]">
          ${label}
        </label>
      ` : null}
      <div className="flex gap-2">
        <select
          id=${id ? `${id}-month` : undefined}
          value=${month}
          onChange=${handleMonthChange}
          disabled=${disabled}
          className="flex-1 px-4 py-2 app-input text-[var(--app-text-primary)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          ${MONTHS.map((m, i) => html`<option key=${i} value=${i}>${m || (endDate ? 'Present' : 'Select month')}</option>`)}
        </select>
        <select
          id=${id ? `${id}-year` : undefined}
          value=${year}
          onChange=${handleYearChange}
          disabled=${disabled}
          className="flex-1 px-4 py-2 app-input text-[var(--app-text-primary)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Year</option>
          ${YEAR_OPTIONS.map((y) => html`<option key=${y} value=${y}>${y}</option>`)}
        </select>
      </div>
    </div>
  `;
};

export default MonthYearInput;
