/**
 * Unified StatusBadge / chip primitive - enterprise design system.
 * Variants: default, success, danger, warning, accent.
 * Soft tinted backgrounds, subtle borders.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const VARIANT_CLASSES = {
  default: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] border-[var(--app-border-soft)]',
  neutral: 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] border-[var(--app-border-soft)]',
  success: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)] border-[rgba(52,199,89,0.2)]',
  danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border-[rgba(255,59,48,0.2)]',
  warning: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)] border-[rgba(255,159,10,0.22)]',
  accent: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] border-[rgba(0,113,227,0.16)]',
  info: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)] border-[rgba(90,200,250,0.2)]',
};

/** Map common status strings to StatusBadge variants. */
export const statusToVariant = (status) => {
  if (!status) return 'default';
  const s = String(status).toUpperCase();
  if (['APPROVED', 'VERIFIED', 'ACTIVE', 'SUCCESS', 'COMPLETED', 'ACCEPTED'].includes(s)) return 'success';
  if (['REJECTED', 'FAILED', 'CANCELLED', 'INACTIVE', 'DANGER'].includes(s)) return 'danger';
  if (['PENDING', 'SUBMITTED', 'DRAFT', 'IN_PROGRESS', 'PROCESSING'].includes(s)) return 'warning';
  if (['SHORTLISTED', 'SELECTED'].includes(s)) return 'accent';
  return 'default';
};

const StatusBadge = ({ children, variant = 'default', className = '', status }) => {
  const resolvedVariant = status !== undefined ? statusToVariant(status) : variant;
  const baseClass = 'inline-flex items-center px-2.5 py-1 rounded-full border text-[12px] font-medium';
  const variantClass = VARIANT_CLASSES[resolvedVariant] || VARIANT_CLASSES.default;
  const combined = `${baseClass} ${variantClass} ${className}`.trim();

  return html`<span className=${combined}>${children ?? status}</span>`;
};

export default StatusBadge;
