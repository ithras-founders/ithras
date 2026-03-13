/**
 * FilterPill / SegmentedControl primitive - enterprise design system.
 * Props: options [{value, label}], value, onChange
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const FilterPill = ({ options = [], value, onChange, className = '' }) => {
  return html`
    <div className=${`inline-flex rounded-full bg-[var(--app-surface-muted)] p-0.5 gap-0.5 ${className}`.trim()}>
      ${options.map((opt) => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        const optLabel = typeof opt === 'object' ? opt.label : opt;
        const isActive = value === optValue;
        return html`
          <button
            key=${optValue}
            onClick=${() => onChange?.(optValue)}
            className=${`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors app-focus-ring ${
              isActive
                ? 'bg-[rgba(0,113,227,0.08)] text-[var(--app-accent)]'
                : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)]'
            }`}
          >
            ${optLabel}
          </button>
        `;
      })}
    </div>
  `;
};

export default FilterPill;
