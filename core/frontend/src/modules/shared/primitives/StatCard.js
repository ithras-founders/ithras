/**
 * StatCard primitive - enterprise design system.
 * Props: label, value, delta, color (accent|success|warning|default)
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const COLOR_CLASSES = {
  accent: 'text-[var(--accent)]',
  success: 'text-[var(--status-success-text)]',
  warning: 'text-[var(--status-warning-text)]',
  danger: 'text-[var(--status-danger-text)]',
  default: 'text-[var(--text-primary)]',
};

const StatCard = ({ label, value, delta, color = 'default', className = '' }) => {
  const valueClass = COLOR_CLASSES[color] || COLOR_CLASSES.default;
  return html`
    <div className=${`rounded-[var(--app-radius-3xl)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-4 shadow-[var(--app-shadow-card)] ${className}`.trim()}>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-faint)]">${label}</p>
      <p className=${`text-[var(--app-text-xl)] font-bold mt-1 ${valueClass}`}>${value}</p>
      ${delta != null && delta !== '' ? html`
        <p className="text-[var(--app-text-sm)] text-[var(--app-text-secondary)] mt-0.5">${delta}</p>
      ` : null}
    </div>
  `;
};

export default StatCard;
