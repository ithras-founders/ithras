/**
 * Unified FilterBar primitive - enterprise design system.
 * Horizontal flex of filter controls with consistent spacing.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const FilterBar = ({ children, className = '' }) => {
  return html`
    <div className=${`flex flex-wrap items-center gap-[var(--app-space-3)] ${className}`.trim()}>
      ${children}
    </div>
  `;
};

export default FilterBar;
