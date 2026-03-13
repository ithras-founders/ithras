import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PRESENT_VALUES = ['present', 'current', 'ongoing', ''];

const isPresent = (v) => !v || PRESENT_VALUES.includes(String(v).toLowerCase().trim());

const DateField = ({ field, value, onChange, error }) => {
  const allowPresent = field.allowPresent === true || field.id === 'end_date';
  const presentChecked = allowPresent && isPresent(value);

  const handleChange = (newValue) => {
    onChange(newValue);
  };

  const handlePresentChange = (checked) => {
    if (checked) {
      onChange('');
    } else {
      onChange(value || '');
    }
  };

  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        ${field.label}
        ${field.required && !allowPresent ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      ${allowPresent ? html`
        <label className="flex items-center gap-2 mb-2 cursor-pointer">
          <input
            type="checkbox"
            checked=${presentChecked}
            onChange=${e => handlePresentChange(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--app-border-soft)] text-[var(--app-accent)] focus:ring-[var(--app-accent)]"
          />
          <span className="text-sm text-[var(--app-text-secondary)]">Present (currently working here)</span>
        </label>
      ` : null}
      <input
        type=${field.type === 'year' ? 'number' : 'date'}
        value=${presentChecked ? '' : (value || '')}
        onChange=${e => handleChange(e.target.value)}
        disabled=${presentChecked}
        className=${`w-full px-3 py-2 border rounded ${error ? 'border-[var(--app-danger)]' : ''} ${presentChecked ? 'opacity-50 bg-[var(--app-surface-muted)]' : ''}`}
        placeholder=${field.type === 'year' ? 'YYYY' : field.label}
        min=${field.type === 'year' ? '1900' : undefined}
        max=${field.type === 'year' ? new Date().getFullYear() : undefined}
      />
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default DateField;
