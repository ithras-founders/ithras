/** Reusable form for add/edit additional responsibility (clubs, boards, etc.) */
import React, { useState } from 'react';
import htm from 'htm';
import { Input } from '/shared/primitives/index.js';
import MonthYearInput from '/shared/primitives/MonthYearInput.js';

const html = htm.bind(React.createElement);

const AdditionalResponsibilityForm = ({ entry, onSubmit, onCancel, disabled = false }) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [organisationName, setOrganisationName] = useState(entry?.organisation_name || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [startMonth, setStartMonth] = useState(entry?.start_month || '');
  const [endMonth, setEndMonth] = useState(entry?.end_month || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        organisation_name: organisationName.trim() || null,
        description: description.trim() || null,
        start_month: startMonth || null,
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
      <${Input}
        label="Title *"
        value=${title}
        onChange=${(e) => setTitle(e.target.value)}
        placeholder="e.g. Board Member, Club President"
        disabled=${disabled || saving}
      />
      <${Input}
        label="Organisation"
        value=${organisationName}
        onChange=${(e) => setOrganisationName(e.target.value)}
        placeholder="e.g. Alumni Association"
        disabled=${disabled || saving}
      />
      <div>
        <label className="block text-sm font-medium text-[var(--app-text-primary)] mb-1">Description</label>
        <textarea
          value=${description}
          onChange=${(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          disabled=${disabled || saving}
          rows=${3}
          className="w-full px-4 py-2 app-input text-[var(--app-text-primary)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
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

export default AdditionalResponsibilityForm;
