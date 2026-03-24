/**
 * EmptyState - Reusable empty state with icon, title, description, optional CTA.
 */
import React from 'react';
import htm from 'htm';
import Button from '/shared/components/ui/Button.js';

const html = htm.bind(React.createElement);

const DefaultIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style=${{ color: 'var(--app-text-muted)' }}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
`;

const EmptyState = ({ title, description, icon, ctaLabel, onCta, className = '' }) => html`
  <div
    className=${`flex flex-col items-center justify-center py-14 px-6 text-center rounded-[var(--app-radius-card)] border ${className}`}
    style=${{
      borderColor: 'var(--app-border-soft)',
      background: 'var(--app-surface)',
      boxShadow: 'var(--app-shadow-card)',
    }}
  >
    <div
      className="mb-5 flex items-center justify-center w-16 h-16 rounded-2xl"
      style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
    >
      ${icon || html`<${DefaultIcon} />`}
    </div>
    <h3 className="text-lg font-semibold mb-2 tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>${title}</h3>
    ${description ? html`
      <p className="text-sm max-w-md mb-6 leading-relaxed" style=${{ color: 'var(--app-text-muted)' }}>${description}</p>
    ` : null}
    ${ctaLabel && onCta ? html`<${Button} variant="primary" size="md" onClick=${onCta}>${ctaLabel}</${Button}>` : null}
  </div>
`;

export default EmptyState;
