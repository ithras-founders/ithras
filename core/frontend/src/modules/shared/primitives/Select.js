/**
 * Unified Select primitive - enterprise design system.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const Select = ({
  value,
  onChange,
  options = [],
  disabled = false,
  className = '',
  id,
  label,
  ariaLabel,
  placeholder,
  ...props
}) => {
  const baseClass = 'w-full px-4 py-2 app-input text-[var(--app-text-base)] text-[var(--app-text-primary)] cursor-pointer';
  const combined = `${baseClass} ${className}`.trim();

  const selectEl = html`
    <select
      id=${id}
      value=${value}
      onChange=${onChange}
      disabled=${disabled}
      className=${combined}
      aria-label=${ariaLabel || label}
      ...${props}
    >
      ${placeholder ? html`<option value="">${placeholder}</option>` : null}
      ${options.map((opt) =>
        typeof opt === 'object'
          ? html`<option key=${opt.value} value=${opt.value}>${opt.label}</option>`
          : html`<option key=${opt} value=${opt}>${opt}</option>`
      )}
    </select>
  `;

  if (label) {
    return html`
      <div>
        <label htmlFor=${id} className="block text-[var(--app-text-sm)] font-medium text-[var(--app-text-primary)] mb-[var(--app-space-2)]">
          ${label}
        </label>
        ${selectEl}
      </div>
    `;
  }
  return selectEl;
};

export default Select;
