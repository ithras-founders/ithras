import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const MultilineField = ({ field, value, onChange, error }) => {
  const maxChars = field.validation?.maxChars;
  const maxLines = field.validation?.maxLines;
  const charCount = value ? value.length : 0;
  const lineCount = value ? value.split('\n').length : 0;
  const exceedsCharLimit = maxChars && charCount > maxChars;
  const exceedsLineLimit = maxLines && lineCount > maxLines;

  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-1">
        ${field.label}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      <textarea
        value=${value || ''}
        onChange=${e => {
          const newValue = e.target.value;
          const newLineCount = newValue.split('\n').length;
          if ((!maxChars || newValue.length <= maxChars) && (!maxLines || newLineCount <= maxLines)) {
            onChange(newValue);
          }
        }}
        rows=${4}
        className=${`w-full px-3 py-2 border rounded ${exceedsCharLimit || exceedsLineLimit ? 'border-[var(--app-danger)]' : ''} ${error ? 'border-[var(--app-danger)]' : ''}`}
        placeholder=${field.label}
      />
      <div className="text-xs mt-1 ${exceedsCharLimit || exceedsLineLimit ? 'text-[var(--app-danger)]' : 'text-[var(--app-text-muted)]'}">
        ${maxChars ? html`<span>${charCount} / ${maxChars} characters</span>` : ''}
        ${maxChars && maxLines ? html`<span> • </span>` : ''}
        ${maxLines ? html`<span>${lineCount} / ${maxLines} lines</span>` : ''}
      </div>
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default MultilineField;
