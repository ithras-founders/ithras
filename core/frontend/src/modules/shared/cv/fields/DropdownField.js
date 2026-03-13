import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const safeOptionValue = (opt) =>
  typeof opt === 'object' && opt !== null ? (opt?.value ?? opt?.label ?? '') : String(opt ?? '');
const safeOptionLabel = (opt) =>
  typeof opt === 'object' && opt !== null ? (opt?.label ?? opt?.value ?? '') : String(opt ?? '');

const DropdownField = ({ field, value, onChange, error }) => {
  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        ${typeof field?.label === 'string' ? field.label : (field?.label?.label ?? field?.id ?? '')}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      <select
        value=${value || ''}
        onChange=${e => onChange(e.target.value)}
        className=${`w-full px-3 py-2 border rounded ${error ? 'border-[var(--app-danger)]' : ''}`}
      >
        <option value="">Select ${typeof field?.label === 'string' ? field.label : (field?.label?.label ?? field?.id ?? '')}</option>
        ${field.options && field.options.map((option, idx) => html`
          <option key=${idx} value=${safeOptionValue(option)}>${safeOptionLabel(option)}</option>
        `)}
      </select>
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default DropdownField;
