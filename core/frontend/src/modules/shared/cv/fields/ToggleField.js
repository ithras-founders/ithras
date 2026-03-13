import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ToggleField = ({ field, value, onChange, error }) => {
  return html`
    <div className="mb-4">
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked=${value === true}
          onChange=${e => onChange(e.target.checked)}
          className="w-4 h-4"
        />
        <span className="text-sm font-medium">
          ${field.label}
          ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
        </span>
      </label>
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default ToggleField;
