/**
 * EmptyState - Calm empty states for messaging.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const EmptyState = ({ icon, title, description, action }) => html`
  <div
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
    style=${{ color: 'var(--app-text-secondary)' }}
  >
    ${icon ? html`<div className="mb-4 opacity-60">${icon}</div>` : null}
    <h3 className="text-base font-semibold mb-1" style=${{ color: 'var(--app-text-primary)' }}>${title}</h3>
    ${description ? html`<p className="text-sm max-w-xs mb-4">${description}</p>` : null}
    ${action || null}
  </div>
`;

export default EmptyState;
