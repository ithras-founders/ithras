/** Reusable experience form: organisation + roles */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { AutocompleteInput, EntitySearchInput } from '/shared/primitives/index.js';
import MonthYearInput from '/shared/primitives/MonthYearInput.js';
import { searchOrganisations, getOrganisationAllowedFields } from '/shared/services/index.js';

const html = htm.bind(React.createElement);

const ExperienceForm = ({ org, onSubmit, onCancel, disabled = false }) => {
  const [organisationName, setOrganisationName] = useState(org?.organisation_name || '');
  const [organisationId, setOrganisationId] = useState(org?.organisation_id || null);
  const [movements, setMovements] = useState(
    (org?.movements?.length ? org.movements : [{ business_unit: '', function: '', title: '', start_month: '', end_month: '' }]).map((m) => ({
      id: m.id,
      businessUnit: m.business_unit || '',
      function: m.function || '',
      title: m.title || '',
      startMonth: m.start_month || '',
      endMonth: m.end_month || '',
    }))
  );
  const [allowedFields, setAllowedFields] = useState({ business_units: [], functions: [], titles: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (organisationId) {
      getOrganisationAllowedFields(organisationId)
        .then((r) =>
          setAllowedFields({
            business_units: r?.business_units ?? [],
            functions: r?.functions ?? [],
            titles: r?.titles ?? [],
          })
        )
        .catch(() => setAllowedFields({ business_units: [], functions: [], titles: [] }));
    } else {
      setAllowedFields({ business_units: [], functions: [], titles: [] });
    }
  }, [organisationId]);

  const handleOrganisationSelect = (entity) => {
    if (entity) {
      setOrganisationId(entity.id);
      setOrganisationName(entity.name);
    } else {
      setOrganisationId(null);
    }
  };

  const updateMovement = (idx, field, value) => {
    setMovements((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const addMovement = () => setMovements((prev) => [...prev, { businessUnit: '', function: '', title: '', startMonth: '', endMonth: '' }]);
  const removeMovement = (idx) => {
    if (movements.length <= 1) return;
    setMovements((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const valid = movements.filter((m) => m.title?.trim() && m.startMonth);
    if (!organisationName.trim()) {
      setError('Organisation name is required.');
      return;
    }
    if (valid.length === 0) {
      setError('At least one role with title and start date is required.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        organisation_name: organisationName.trim(),
        organisation_id: organisationId,
        movements: movements.map((m) => ({
          id: m.id,
          business_unit: m.businessUnit || '',
          function: m.function || '',
          title: m.title || '',
          start_month: m.startMonth || '',
          end_month: m.endMonth || null,
        })),
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
        label="Organisation"
        value=${organisationName}
        onChange=${(v) => { setOrganisationName(v); setOrganisationId(null); }}
        onSelect=${handleOrganisationSelect}
        searchFn=${searchOrganisations}
        placeholder="Search or type organisation name"
        disabled=${disabled || saving}
      />
      ${organisationName.trim() && !organisationId ? html`
        <p className="text-xs text-amber-600 -mt-2">Not in the list? Your entry will be submitted for verification.</p>
      ` : !organisationId ? html`
        <p className="text-xs text-gray-500">Select an organisation to see suggested business units, functions and titles.</p>
      ` : null}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-2">Roles</h5>
        ${movements.map((mov, mi) => html`
          <div key=${mi} className="mb-4 p-3 bg-gray-50 rounded-lg border space-y-3">
            <div className="flex justify-between">
              <span className="text-xs text-gray-500">Role ${mi + 1}</span>
              ${movements.length > 1 ? html`<button type="button" onClick=${() => removeMovement(mi)} disabled=${saving} className="text-xs text-red-600 hover:underline">Remove</button>` : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <${AutocompleteInput}
                value=${mov.businessUnit}
                onChange=${(v) => updateMovement(mi, 'businessUnit', v)}
                suggestions=${allowedFields.business_units}
                placeholder="Business unit"
                disabled=${saving}
              />
              <${AutocompleteInput}
                value=${mov.function}
                onChange=${(v) => updateMovement(mi, 'function', v)}
                suggestions=${allowedFields.functions}
                placeholder="Function"
                disabled=${saving}
              />
            </div>
            <${AutocompleteInput}
              value=${mov.title}
              onChange=${(v) => updateMovement(mi, 'title', v)}
              suggestions=${allowedFields.titles}
              placeholder="Title *"
              disabled=${saving}
            />
            <div className="grid grid-cols-2 gap-2">
              <${MonthYearInput} label="Start" value=${mov.startMonth} onChange=${(v) => updateMovement(mi, 'startMonth', v)} disabled=${saving} />
              <${MonthYearInput} label="End" value=${mov.endMonth} onChange=${(v) => updateMovement(mi, 'endMonth', v)} endDate=${true} disabled=${saving} />
            </div>
          </div>
        `)}
        <button type="button" onClick=${addMovement} disabled=${saving} className="text-sm text-[var(--app-accent)] hover:underline">+ Add role</button>
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick=${onCancel} disabled=${saving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled=${saving} className="px-4 py-2 rounded-lg text-white" style=${{ background: 'var(--app-accent)' }}>${saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  `;
};

export default ExperienceForm;
