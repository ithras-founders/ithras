/**
 * Shared empty state for lists - consistent UX when no data.
 * Enterprise design system: clean, actionable, premium.
 */
import React from 'react';
import htm from 'htm';
import Button from '../primitives/Button.js';

const html = htm.bind(React.createElement);

const EmptyState = ({ title, message, icon, action, actionLabel, ...props }) => html`
  <div
    className="flex flex-col items-center justify-center p-[var(--app-space-12)] rounded-[var(--app-radius-3xl)] border border-dashed border-[rgba(0,0,0,0.08)] bg-[var(--app-surface-muted)] text-center"
    role="status"
    aria-label=${title || 'No items'}
    ...${props}
  >
    ${icon ? html`<div className="rounded-2xl bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center w-14 h-14 mb-[var(--app-space-4)]">${icon}</div>` : null}
    <h3 className="text-[var(--app-text-base)] font-semibold text-[var(--app-text-primary)]">${title || 'No items yet'}</h3>
    ${message ? html`<p className="mt-[var(--app-space-2)] text-[var(--app-text-sm)] text-[var(--app-text-secondary)] max-w-sm">${message}</p>` : null}
    ${action && actionLabel ? html`
      <div className="mt-[var(--app-space-6)]">
        <${Button} variant="primary" size="lg" onClick=${action} ariaLabel=${actionLabel}>
          ${actionLabel}
        <//>
      </div>
    ` : null}
  </div>
`;

export default EmptyState;
