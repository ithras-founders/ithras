/**
 * Elevated surface card using design tokens.
 */
import React from 'react';

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

/**
 * @param {{
 *   children: React.ReactNode,
 *   className?: string,
 *   elevated?: boolean,
 *   padding?: keyof typeof PADDING,
 *   as?: keyof JSX.IntrinsicElements,
 * }} props
 */
const Card = ({
  children,
  className = '',
  elevated = false,
  padding = 'md',
  as: Tag = 'div',
}) => {
  const pad = PADDING[padding] ?? PADDING.md;
  return React.createElement(
    Tag,
    {
      className: `rounded-[var(--app-radius-card)] border bg-[var(--app-surface)] ${pad} ${className}`.trim(),
      style: {
        borderColor: 'var(--app-border-soft)',
        boxShadow: elevated ? 'var(--app-shadow-elevated)' : 'var(--app-shadow-card)',
      },
    },
    children,
  );
};

export default Card;
