/** Reusable education entry form for add/edit */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { AutocompleteInput, EntitySearchInput, Input } from '/shared/primitives/index.js';
import MonthYearInput from '/shared/primitives/MonthYearInput.js';
import { searchInstitutions, getInstitutionAllowedFields } from '/shared/services/index.js';

const html = htm.bind(React.createElement);

const AutocompleteListField = ({ items, onItemsChange, suggestions = [], placeholder, addLabel, typeLabel, disabled }) => {
  const add = () => onItemsChange([...(items || []), '']);
  const remove = (i) => {
    const next = (items || []).filter((_, idx) => idx !== i);
    onItemsChange(next.length ? next : ['']);
  };
  const change = (i, v) => onItemsChange((items || []).map((it, idx) => (idx === i ? v : it)));
  const displayItems = (items && items.length) ? items : [''];
  return html`
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">${typeLabel}</label>
      ${displayItems.map((item, i) => html`
        <div key=${i} className="flex gap-2 mb-2">
          <div className="flex-1">
            <${AutocompleteInput}
              value=${item}
              onChange=${(v) => change(i, v)}
              suggestions=${suggestions}
              placeholder=${placeholder}
              disabled=${disabled}
            />
          </div>
          ${displayItems.length > 1 ? html`<button type="button" onClick=${() => remove(i)} disabled=${disabled} className="px-2 text-red-600 hover:bg-red-50 rounded self-center">✕</button>` : null}
        </div>
      `)}
      <button type="button" onClick=${add} disabled=${disabled} className="text-sm text-[var(--app-accent)] hover:underline">+ ${addLabel}</button>
    </div>
  `;
};

const EducationForm = ({ entry, onSubmit, onCancel, disabled = false }) => {
  const [institutionName, setInstitutionName] = useState(entry?.institution_name || '');
  const [institutionId, setInstitutionId] = useState(entry?.institution_id || null);
  const [degree, setDegree] = useState(entry?.degree || '');
  const [majors, setMajors] = useState((entry?.majors?.length ? entry.majors : ['']) || ['']);
  const [minors, setMinors] = useState((entry?.minors?.length ? entry.minors : ['']) || ['']);
  const [startMonth, setStartMonth] = useState(entry?.start_month || '');
  const [endMonth, setEndMonth] = useState(entry?.end_month || '');
  const [allowedFields, setAllowedFields] = useState({ degrees: [], majors: [], minors: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (institutionId) {
      getInstitutionAllowedFields(institutionId)
        .then((r) => setAllowedFields({ degrees: r?.degrees ?? [], majors: r?.majors ?? [], minors: r?.minors ?? [] }))
        .catch(() => setAllowedFields({ degrees: [], majors: [], minors: [] }));
    } else {
      setAllowedFields({ degrees: [], majors: [], minors: [] });
    }
  }, [institutionId]);

  const handleInstitutionSelect = (entity) => {
    if (entity) {
      setInstitutionId(entity.id);
      setInstitutionName(entity.name);
    } else {
      setInstitutionId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!institutionName.trim() || !degree.trim() || !startMonth) {
      setError('Institution, degree, and start date are required.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        institution_name: institutionName.trim(),
        institution_id: institutionId,
        degree: degree.trim(),
        majors: majors.filter(Boolean),
        minors: minors.filter(Boolean),
        start_month: startMonth,
        end_month: endMonth || null,
      });
      onCancel?.();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return html`
    <form onSubmit=${handleSubmit} className="rounded-2xl border p-5 space-y-4" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      ${error ? html`<div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">${error}</div>` : null}
      <${EntitySearchInput}
        label="Institution"
        value=${institutionName}
        onChange=${(v) => { setInstitutionName(v); setInstitutionId(null); }}
        onSelect=${handleInstitutionSelect}
        searchFn=${searchInstitutions}
        placeholder="Search or type institution name"
        disabled=${disabled || saving}
      />
      ${institutionName.trim() && !institutionId ? html`
        <p className="text-xs text-amber-600 -mt-2">Not in the list? Your entry will be submitted for verification.</p>
      ` : !institutionId ? html`
        <p className="text-xs text-gray-500">Select an institution to see degree and major suggestions from that institution.</p>
      ` : null}
      <${AutocompleteInput}
        label="Degree"
        value=${degree}
        onChange=${setDegree}
        suggestions=${allowedFields.degrees}
        placeholder="e.g. Bachelor of Science"
        disabled=${disabled || saving}
      />
      <${AutocompleteListField}
        typeLabel="Majors"
        items=${majors}
        onItemsChange=${setMajors}
        suggestions=${allowedFields.majors}
        placeholder="e.g. Computer Science"
        addLabel="Add major"
        disabled=${disabled || saving}
      />
      <${AutocompleteListField}
        typeLabel="Minors"
        items=${minors}
        onItemsChange=${setMinors}
        suggestions=${allowedFields.minors}
        placeholder="e.g. Economics"
        addLabel="Add minor"
        disabled=${disabled || saving}
      />
      <div className="grid grid-cols-2 gap-4">
        <${MonthYearInput} label="Start" value=${startMonth} onChange=${setStartMonth} disabled=${disabled || saving} />
        <${MonthYearInput} label="End" value=${endMonth} onChange=${setEndMonth} endDate=${true} disabled=${disabled || saving} />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick=${onCancel} disabled=${saving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled=${saving} className="px-4 py-2 rounded-lg text-white" style=${{ background: 'var(--app-accent)' }}>${saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  `;
};

export default EducationForm;
