/**
 * Unified Button primitive - enterprise design system.
 * Variants: primary, secondary, ghost, danger.
 * Sizes: sm, md, lg.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const SIZE_CLASSES = {
  sm: 'px-3 py-1.5 text-[var(--app-text-sm)]',
  md: 'px-4 py-2 text-[var(--app-text-base)]',
  lg: 'px-6 py-3 text-[var(--app-text-base)]',
};

const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  children,
  onClick,
  className = '',
  ariaLabel,
  ...props
}) => {
  const baseClass = 'inline-flex items-center justify-center font-medium transition-all duration-[var(--app-transition-fast)] app-focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClass = {
    primary: 'app-button-primary',
    secondary: 'app-button-secondary',
    ghost: 'app-button-ghost',
    danger: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)] border border-[rgba(255,59,48,0.2)] hover:bg-[rgba(255,59,48,0.12)]',
    subtle: 'bg-[var(--bg-surface-muted)] text-[var(--text-primary)] border border-[var(--border-soft)] hover:bg-[var(--bg-surface-hover)]',
  }[variant] || 'app-button-primary';
  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const combined = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

  return html`
    <button
      type=${type}
      disabled=${disabled}
      onClick=${onClick}
      className=${combined}
      aria-label=${ariaLabel}
      ...${props}
    >
      ${children}
    </button>
  `;
};

export default Button;
