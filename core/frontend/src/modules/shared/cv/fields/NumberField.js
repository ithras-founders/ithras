import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const NumberField = ({ field, value, onChange, error }) => {
  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        ${field.label}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      <input
        type="number"
        value=${value || ''}
        onChange=${e => onChange(e.target.value ? parseFloat(e.target.value) : null)}
        className=${`w-full px-3 py-2 border rounded ${error ? 'border-[var(--app-danger)]' : ''}`}
        placeholder=${field.label}
      />
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default NumberField;
