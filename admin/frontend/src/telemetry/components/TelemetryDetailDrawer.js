/**
 * TelemetryDetailDrawer - Slide-out drawer for event details.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TelemetryDetailDrawer = ({ title, open, onClose, children }) => {
  if (!open) return null;

  return html`
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick=${onClose}
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto"
        style=${{ borderLeft: '1px solid var(--app-border-soft)' }}
      >
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b" style=${{ background: 'var(--app-surface-subtle)', borderColor: 'var(--app-border-soft)' }}>
          <h3 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${title || 'Details'}</h3>
          <button
            type="button"
            onClick=${onClose}
            className="text-lg leading-none p-1 rounded hover:bg-black/5"
            style=${{ color: 'var(--app-text-muted)' }}
          >
            ×
          </button>
        </div>
        <div className="p-5">
          ${children}
        </div>
      </div>
    </div>
  `;
};

export default TelemetryDetailDrawer;
