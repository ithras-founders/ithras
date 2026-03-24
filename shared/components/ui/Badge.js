/**
 * Pill badge — semantic variants.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const VARIANTS = {
  neutral: { bg: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)', border: 'var(--app-border-soft)' },
  accent: { bg: 'var(--app-accent-soft)', color: 'var(--app-accent)', border: 'transparent' },
  success: { bg: 'var(--app-success-soft)', color: 'var(--status-success-text)', border: 'transparent' },
  warning: { bg: 'var(--app-warning-soft)', color: 'var(--status-warning-text)', border: 'transparent' },
  danger: { bg: 'var(--app-danger-soft)', color: 'var(--status-danger-text)', border: 'transparent' },
};

/**
 * @param {{ children: React.ReactNode, variant?: keyof typeof VARIANTS, className?: string }} props
 */
const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const v = VARIANTS[variant] || VARIANTS.neutral;
  return html`
    <span
      className=${`inline-flex items-center rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide border ${className}`}
      style=${{ background: v.bg, color: v.color, borderColor: v.border, borderWidth: '1px', borderStyle: 'solid' }}
    >
      ${children}
    </span>
  `;
};

export default Badge;
