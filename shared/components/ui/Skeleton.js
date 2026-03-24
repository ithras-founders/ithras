/**
 * Loading placeholder with optional shimmer.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   className?: string,
 *   height?: string | number,
 *   width?: string | number,
 *   rounded?: string,
 *   shimmer?: boolean,
 * }} props
 */
const Skeleton = ({
  className = '',
  height = '1rem',
  width = '100%',
  rounded = 'var(--radius-md)',
  shimmer = true,
}) =>
  html`
    <div
      className=${`${shimmer ? 'ith-skeleton-shimmer' : ''} ${className}`}
      style=${{
        height: typeof height === 'number' ? `${height}px` : height,
        width: typeof width === 'number' ? `${width}px` : width,
        borderRadius: rounded,
        background: shimmer ? undefined : 'var(--app-surface-subtle)',
      }}
      aria-hidden="true"
    />
  `;

export default Skeleton;
