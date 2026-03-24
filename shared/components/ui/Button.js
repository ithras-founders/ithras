/**
 * Primary UI button — token-driven variants for design system v2.
 */
import React from 'react';

const VARIANT_STYLES = {
  primary: {
    background: 'var(--app-accent)',
    color: '#fff',
    border: '1px solid transparent',
    hoverBg: 'var(--app-accent-hover)',
  },
  secondary: {
    background: 'var(--app-surface-subtle)',
    color: 'var(--app-text-primary)',
    border: '1px solid var(--app-border-soft)',
    hoverBg: 'var(--app-surface-hover)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--app-text-secondary)',
    border: '1px solid transparent',
    hoverBg: 'var(--app-surface-hover)',
  },
  danger: {
    background: 'var(--app-danger-soft)',
    color: 'var(--app-danger)',
    border: '1px solid transparent',
    hoverBg: 'rgba(255, 59, 48, 0.15)',
  },
};

const SIZE_CLASSES = {
  sm: 'ith-focus-ring inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 text-xs rounded-[var(--radius-md)]',
  md: 'ith-focus-ring inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2.5 text-sm rounded-[var(--radius-md)]',
  lg: 'ith-focus-ring inline-flex items-center justify-center gap-2 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-base rounded-[var(--radius-lg)]',
};

/**
 * @param {{
 *   children: React.ReactNode,
 *   variant?: keyof typeof VARIANT_STYLES,
 *   size?: keyof typeof SIZE_CLASSES,
 *   className?: string,
 *   disabled?: boolean,
 *   type?: 'button' | 'submit' | 'reset',
 *   onClick?: (e: React.MouseEvent) => void,
 * }} props
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  onClick,
  ...rest
}) => {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;
  const baseClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const style = {
    background: v.background,
    color: v.color,
    border: v.border,
    boxShadow: variant === 'primary' ? 'var(--app-shadow-primary)' : undefined,
  };
  return React.createElement(
    'button',
    {
      type,
      disabled,
      onClick,
      className: `${baseClass} ${className}`.trim(),
      style,
      onMouseEnter: (e) => {
        if (!disabled) e.currentTarget.style.background = v.hoverBg;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.background = v.background;
      },
      ...rest,
    },
    children,
  );
};

export default Button;
