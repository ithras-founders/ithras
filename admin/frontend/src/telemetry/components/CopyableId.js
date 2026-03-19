/**
 * CopyableId - ID display with copy-to-clipboard button.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const CopyableId = ({ id, label = 'ID' }) => {
  const copy = () => {
    if (id != null && navigator.clipboard) {
      navigator.clipboard.writeText(String(id));
    }
  };

  return html`
    <div>
      <p className="text-sm font-medium mb-1" style=${{ color: 'var(--app-text-muted)' }}>${label}</p>
      <div className="flex items-center gap-2">
        <code className="text-xs px-2 py-1 rounded" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-primary)' }}>
          ${id ?? '—'}
        </code>
        <button
          type="button"
          onClick=${copy}
          className="text-xs px-2 py-1 rounded border hover:bg-[var(--app-surface-subtle)]"
          style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
        >
          Copy
        </button>
      </div>
    </div>
  `;
};

export default CopyableId;
