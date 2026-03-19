/**
 * Card with heading, optional divider, consistent spacing.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const SectionCard = ({ title, children, className = '' }) => html`
  <div className=${`rounded-xl border border-[var(--app-border-soft)] bg-white overflow-hidden ${className}`}>
    ${title ? html`
      <div className="px-5 py-4 border-b border-[var(--app-border-soft)]" style=${{ background: 'var(--app-surface-subtle)' }}>
        <h3 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${title}</h3>
      </div>
    ` : null}
    <div className="p-5">
      ${children}
    </div>
  </div>
`;

export default SectionCard;
