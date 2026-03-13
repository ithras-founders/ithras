import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TextField = ({ field, value, onChange, error }) => {
  const maxChars = field.validation?.maxChars;
  const charCount = value ? value.length : 0;
  const exceedsLimit = maxChars && charCount > maxChars;

  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        ${field.label}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      <input
        type="text"
        value=${value || ''}
        onChange=${e => {
          const newValue = e.target.value;
          if (!maxChars || newValue.length <= maxChars) {
            onChange(newValue);
          }
        }}
        className=${`w-full px-3 py-2 border rounded ${exceedsLimit ? 'border-[var(--app-danger)]' : ''} ${error ? 'border-[var(--app-danger)]' : ''}`}
        placeholder=${field.label}
      />
      ${maxChars ? html`
        <div className="text-xs mt-1 ${exceedsLimit ? 'text-[var(--app-danger)]' : 'text-[var(--app-text-muted)]'}">
          ${charCount} / ${maxChars} characters
        </div>
      ` : ''}
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default TextField;
