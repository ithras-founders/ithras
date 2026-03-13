/**
 * Unified Textarea primitive - enterprise design system.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const Textarea = ({
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  rows = 4,
  className = '',
  id,
  label,
  ariaLabel,
  ...props
}) => {
  const baseClass = 'w-full px-4 py-2 app-input text-[var(--app-text-base)] text-[var(--app-text-primary)] resize-y min-h-[80px]';
  const errorClass = error ? 'border-[var(--app-danger)] focus:border-[var(--app-danger)]' : '';
  const combined = `${baseClass} ${errorClass} ${className}`.trim();

  const textareaEl = html`
    <textarea
      id=${id}
      value=${value}
      onChange=${onChange}
      placeholder=${placeholder}
      disabled=${disabled}
      rows=${rows}
      className=${combined}
      aria-label=${ariaLabel || label}
      ...${props}
    />
  `;

  if (label) {
    return html`
      <div>
        <label htmlFor=${id} className="block text-[var(--app-text-sm)] font-medium text-[var(--app-text-primary)] mb-[var(--app-space-2)]">
          ${label}
        </label>
        ${textareaEl}
      </div>
    `;
  }
  return textareaEl;
};

export default Textarea;
