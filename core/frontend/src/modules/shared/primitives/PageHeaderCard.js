/**
 * PageHeaderCard primitive - enterprise design system.
 * Renders only actions (page headers/subheaders removed per design).
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PageHeaderCard = ({ title, subtitle, contextBadge, actions, className = '' }) => {
  if (!actions) return null;
  return html`
    <div className=${`flex flex-wrap items-center gap-[var(--app-space-2)] shrink-0 ${className}`.trim()}>
      ${actions}
    </div>
  `;
};

export default PageHeaderCard;
