/**
 * Unified PageWrapper primitive - enterprise design system.
 * Wraps page content with consistent spacing for page rhythm.
 * Use with PageHeader and SectionCard for consistent page layout.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PageWrapper = ({ children, className = '' }) => {
  return html`
    <div className=${`space-y-[var(--app-space-8)] ${className}`.trim()}>
      ${children}
    </div>
  `;
};

export default PageWrapper;
