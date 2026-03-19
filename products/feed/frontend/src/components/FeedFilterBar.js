/**
 * FeedFilterBar - Filter by type, search.
 */
import React from 'react';
import htm from 'htm';
import { COMMUNITY_TYPES } from '../types.js';

const html = htm.bind(React.createElement);

const FeedFilterBar = ({ filter, onFilterChange }) => {
  const inputClass = 'px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent';
  const btnClass = (active) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'hover:bg-[var(--app-surface-hover)]'
    }`;
  const style = { borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' };

  return html`
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Search communities..."
          value=${filter.search || ''}
          onChange=${(e) => onFilterChange({ ...filter, search: e.target.value || undefined })}
          className=${inputClass}
          style=${style}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick=${() => onFilterChange({ ...filter, type: undefined })}
          className=${btnClass(!filter.type)}
          style=${{ color: !filter.type ? 'var(--app-accent)' : 'var(--app-text-secondary)' }}
        >
          All
        </button>
        ${COMMUNITY_TYPES.map((t) => html`
          <button
            key=${t.key}
            type="button"
            onClick=${() => onFilterChange({ ...filter, type: t.key })}
            className=${btnClass(filter.type === t.key)}
            style=${{ color: filter.type === t.key ? 'var(--app-accent)' : 'var(--app-text-secondary)' }}
          >
            ${t.label}
          </button>
        `)}
      </div>
    </div>
  `;
};

export default FeedFilterBar;
