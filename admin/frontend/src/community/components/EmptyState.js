/**
 * Empty state component - icon, heading, description.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const MessageCircleIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto mb-4" style=${{ color: 'var(--app-text-muted)' }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
`;

const EmptyState = ({ icon, heading, description, action }) => html`
  <div className="p-12 text-center rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)]">
    ${icon || html`<${MessageCircleIcon} />`}
    <p className="text-base font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>${heading}</p>
    ${description ? html`<p className="text-sm mb-4" style=${{ color: 'var(--app-text-muted)' }}>${description}</p>` : null}
    ${action || null}
  </div>
`;

export default EmptyState;
