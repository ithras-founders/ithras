/**
 * Unified Input primitive - enterprise design system.
 */
import React from 'react';
import htm from 'htm';
import { toDisplayString } from '../utils/displayUtils.js';

const html = htm.bind(React.createElement);

const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  className = '',
  id,
  label,
  ariaLabel,
  ...props
}) => {
  const baseClass = 'w-full px-4 py-2 app-input text-[var(--app-text-base)] text-[var(--app-text-primary)]';
  const errorClass = error ? 'border-[var(--color-red-500)] focus:border-[var(--color-red-500)] focus:shadow-[0_0_0_3px_var(--status-danger-bg)]' : '';
  const combined = `${baseClass} ${errorClass} ${className}`.trim();

  const inputEl = html`
    <input
      type=${type}
      id=${id}
      value=${value == null ? '' : String(value)}
      onChange=${onChange}
      placeholder=${placeholder}
      disabled=${disabled}
      className=${combined}
      aria-label=${ariaLabel || label}
      ...${props}
    />
  `;

  if (label) {
    return html`
      <div>
        <label htmlFor=${id} className="block text-[var(--app-text-sm)] font-medium text-[var(--app-text-primary)] mb-[var(--app-space-2)]">
          ${toDisplayString(label)}
        </label>
        ${inputEl}
      </div>
    `;
  }
  return inputEl;
};

export default Input;
