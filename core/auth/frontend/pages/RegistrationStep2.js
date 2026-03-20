import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { addEducation, searchInstitutions, getDegreeMajors } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
import { Input } from '/shared/primitives/index.js';
import MonthYearInput from '/shared/primitives/MonthYearInput.js';
import StatusChip from '/shared/components/StatusChip.js';

const html = htm.bind(React.createElement);

const BLUE_PANEL = '#0C6DFD';
const ACCENT_GOLD = '#FFD700';

const ListField = ({ items, onItemsChange, placeholder, addLabel, typeLabel, disabled }) => {
  // When `items` is [] we still show one empty row; updates must use that row, not `items.map` on [].
  const displayItems = (items && items.length) ? items : [''];
  const add = () => onItemsChange([...displayItems, '']);
  const remove = (i) => {
    const next = displayItems.filter((_, idx) => idx !== i);
    onItemsChange(next.length ? next : ['']);
  };
  const change = (i, v) => onItemsChange(displayItems.map((it, idx) => (idx === i ? v : it)));

  return html`
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">${typeLabel}</label>
      ${displayItems.map((item, i) => html`
        <div key=${i} className="flex gap-2 mb-2">
          <input
            type="text"
            value=${item}
            onChange=${(e) => change(i, e.target.value)}
            placeholder=${placeholder}
            disabled=${disabled}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          ${displayItems.length > 1 ? html`
            <button type="button" onClick=${() => remove(i)} disabled=${disabled} className="px-2 text-red-600 hover:bg-red-50 rounded">✕</button>
          ` : null}
        </div>
      `)}
      <button type="button" onClick=${add} disabled=${disabled} className="text-sm text-[var(--app-accent)] hover:underline">
        + ${addLabel}
      </button>
    </div>
  `;
};

const EducationEntryCard = ({ entry, onChange, onRemove, onInstitutionSearch, institutions, onInstitutionSelect, disabled }) => {
  const [searchQuery, setSearchQuery] = useState(entry.institutionName || '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [degreeMajors, setDegreeMajors] = useState([]);
  const searchTimeout = React.useRef(null);

  useEffect(() => {
    setSearchQuery(entry.institutionName || '');
  }, [entry.institutionName]);

  useEffect(() => {
    if (entry.institutionId) {
      getDegreeMajors(entry.institutionId).then((res) => {
        setDegreeMajors(res?.combos || []);
      }).catch(() => setDegreeMajors([]));
    } else {
      setDegreeMajors([]);
    }
  }, [entry.institutionId]);

  const doSearch = useCallback((q) => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onInstitutionSearch(q);
    }, 200);
  }, [onInstitutionSearch]);

  return html`
    <div className="app-card p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] space-y-4">
      <div className="flex justify-between items-start">
        <h4 className="font-medium text-[var(--app-text-primary)]">Education</h4>
        ${onRemove ? html`
          <button type="button" onClick=${onRemove} className="text-sm text-[var(--app-danger)] hover:underline" disabled=${disabled}>
            Remove
          </button>
        ` : null}
      </div>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
        <input
          type="text"
          value=${searchQuery}
          onChange=${(e) => {
            const v = e.target.value;
            setSearchQuery(v);
            doSearch(v);
            setShowDropdown(true);
            onChange({ ...entry, institutionName: v, institutionId: null });
          }}
          onFocus=${() => setShowDropdown(true)}
          onBlur=${() => setTimeout(() => setShowDropdown(false), 200)}
          placeholder="Search or type institution name"
          disabled=${disabled}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        ${showDropdown && institutions?.length > 0 ? html`
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            ${institutions.map((inst) => html`
              <button
                key=${inst.id}
                type="button"
                className="block w-full text-left px-4 py-2 hover:bg-gray-50"
                onMouseDown=${(e) => { e.preventDefault(); onInstitutionSelect(inst); setSearchQuery(inst.name); setShowDropdown(false); }}
              >
                ${inst.name}
              </button>
            `)}
          </div>
        ` : null}
      </div>
      <div>
        <${Input}
          label="Degree"
          value=${entry.degree}
          onChange=${(e) => onChange({ ...entry, degree: e.target.value })}
          placeholder="e.g. Bachelor of Science"
          disabled=${disabled}
        />
      </div>
      <div>
        <${ListField}
          typeLabel="Majors"
          items=${entry.majors}
          onItemsChange=${(arr) => onChange({ ...entry, majors: arr })}
          placeholder="e.g. Computer Science"
          addLabel="Add major"
          disabled=${disabled}
        />
      </div>
      <div>
        <${ListField}
          typeLabel="Minors"
          items=${entry.minors}
          onItemsChange=${(arr) => onChange({ ...entry, minors: arr })}
          placeholder="e.g. Economics"
          addLabel="Add minor"
          disabled=${disabled}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <${MonthYearInput}
          label="Start"
          value=${entry.startMonth}
          onChange=${(v) => onChange({ ...entry, startMonth: v })}
          disabled=${disabled}
        />
        <${MonthYearInput}
          label="End"
          value=${entry.endMonth}
          onChange=${(v) => onChange({ ...entry, endMonth: v })}
          endDate=${true}
          disabled=${disabled}
        />
      </div>
      ${entry.status ? html`<div className="flex justify-end"><${StatusChip} status=${entry.status} /></div>` : null}
    </div>
  `;
};

const RegistrationStep2 = ({ onContinue, onBack }) => {
  const [entries, setEntries] = useState([{ institutionName: '', institutionId: null, degree: '', majors: [], minors: [], startMonth: '', endMonth: '' }]);
  const [institutions, setInstitutions] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInstitutionSearch = useCallback((q) => {
    if (!q || q.length < 2) { setInstitutions([]); return; }
    searchInstitutions(q).then((res) => setInstitutions(res?.institutions || [])).catch(() => setInstitutions([]));
  }, []);

  const updateEntry = (idx, data) => {
    setEntries((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...data };
      return next;
    });
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { institutionName: '', institutionId: null, degree: '', majors: [], minors: [], startMonth: '', endMonth: '' }]);
  };

  const removeEntry = (idx) => {
    if (entries.length <= 1) return;
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const valid = entries.filter((e) => (e.institutionName || e.institutionId) && e.degree && e.startMonth);
    if (valid.length === 0) {
      setError('Add at least one education entry with institution, degree, and start date.');
      return;
    }
    setLoading(true);
    try {
      for (const ent of valid) {
        await addEducation({
          institution_name: ent.institutionName || '',
          institution_id: ent.institutionId || null,
          degree: ent.degree,
          majors: (ent.majors || []).filter(Boolean),
          minors: (ent.minors || []).filter(Boolean),
          start_month: ent.startMonth,
          end_month: ent.endMonth || null,
        });
      }
      onContinue();
    } catch (err) {
      setError(err.message || 'Failed to save education.');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen flex bg-[var(--app-bg)]">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16" style=${{ background: BLUE_PANEL }}>
        <div className="max-w-md text-center">
          <div className="mb-12">
            <${IthrasLogo} size="lg" theme="light" />
          </div>
          <p className="text-[10px] md:text-xs font-semibold tracking-[0.12em] uppercase mb-6" style=${{ color: ACCENT_GOLD }}>
            Step 2 of 3
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Add your education</h1>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-white overflow-y-auto">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <${IthrasLogo} size="md" theme="dark" />
        </div>

        <div className="max-w-lg w-full mx-auto">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-[var(--app-text-muted)]">Step 2 of 3</span>
            <span className="text-gray-400">Education</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Add your education</h2>

          <form onSubmit=${handleSubmit} className="space-y-6">
            ${error ? html`
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600 border border-red-100">${error}</div>
            ` : null}
            ${entries.map((ent, idx) => html`
              <${EducationEntryCard}
                key=${idx}
                entry=${ent}
                onChange=${(data) => updateEntry(idx, data)}
                onRemove=${entries.length > 1 ? () => removeEntry(idx) : null}
                onInstitutionSearch=${handleInstitutionSearch}
                institutions=${institutions}
                onInstitutionSelect=${(inst) => updateEntry(idx, { institutionName: inst.name, institutionId: inst.id })}
                disabled=${loading}
              />
            `)}
            <button
              type="button"
              onClick=${addEntry}
              className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] transition-colors"
            >
              + Add another education
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick=${onBack}
                className="flex-1 py-3 px-6 rounded-xl font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled=${loading}
                className="flex-1 py-3 px-6 rounded-xl font-semibold text-white bg-[#0C6DFD] hover:bg-[#0A5AD4] disabled:opacity-50"
              >
                ${loading ? 'Saving...' : 'Continue to experience'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
};

export default RegistrationStep2;
