/**
 * Channel filter bar - All / Public / Private / Restricted toggle.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const FILTERS = [
  { value: null, label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
  { value: 'restricted', label: 'Restricted' },
];

const ChannelFilters = ({ visibilityFilter, onVisibilityFilter }) => html`
  <div className="flex flex-wrap gap-2 mb-4">
    <span className="text-sm font-medium text-[var(--slate-600)] self-center mr-1">Visibility:</span>
    ${FILTERS.map((f) => html`
      <button
        key=${f.value || 'all'}
        onClick=${() => onVisibilityFilter(f.value)}
        className=${`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
          visibilityFilter === f.value
            ? 'bg-[var(--cobalt-600)] text-white'
            : 'bg-[var(--slate-100)] text-[var(--slate-600)] hover:bg-[var(--slate-200)]'
        }`}
      >
        ${f.label}
      </button>
    `)}
  </div>
`;

export default ChannelFilters;
