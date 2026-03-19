/**
 * Fixed bottom bar: Save Draft, Publish, Cancel, View Public Page
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ExternalLinkIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" x2="21" y1="14" y2="3"/>
  </svg>
`;

const StickyActionBar = ({
  onSaveDraft,
  onPublish,
  onCancel,
  onViewPublic,
  saving = false,
  slug,
  showDirty = false,
}) => html`
  <div
    className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 flex items-center justify-between gap-4"
    style=${{ background: 'var(--app-surface)', borderTop: '1px solid var(--app-border-soft)', boxShadow: '0 -4px 12px rgba(0,0,0,0.06)' }}
  >
    <div className="flex items-center gap-3">
      ${showDirty ? html`
        <span className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>Unsaved changes</span>
      ` : null}
    </div>
    <div className="flex items-center gap-3">
      ${onSaveDraft ? html`
        <button
          onClick=${onSaveDraft}
          disabled=${saving}
          className="px-4 py-2 rounded-xl font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)] disabled:opacity-60"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          ${saving ? 'Saving...' : 'Save Draft'}
        </button>
      ` : null}
      ${onPublish ? html`
        <button
          onClick=${onPublish}
          disabled=${saving}
          className="px-5 py-2 rounded-xl font-semibold text-white hover:opacity-90 disabled:opacity-70"
          style=${{ background: 'var(--app-accent)' }}
        >
          ${saving ? 'Publishing...' : 'Publish'}
        </button>
      ` : null}
      ${onCancel ? html`
        <button
          onClick=${onCancel}
          disabled=${saving}
          className="px-4 py-2 rounded-xl font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          Cancel
        </button>
      ` : null}
      ${onViewPublic && slug ? html`
        <button
          onClick=${onViewPublic}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          View public page
          <${ExternalLinkIcon} />
        </button>
      ` : null}
    </div>
  </div>
`;

export default StickyActionBar;
