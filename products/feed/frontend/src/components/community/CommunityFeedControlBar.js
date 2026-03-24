/**
 * CommunityFeedControlBar - Feed header with sort filter.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest' },
  { key: 'trending', label: 'Trending' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'useful', label: 'Most useful' },
];

const FilterIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
`;

const CommunityFeedControlBar = ({ sort, onSortChange }) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = sort !== 'latest';

  return html`
    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>
          Community Feed
        </h1>
        <p className="mt-1 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
          Posts and conversations in this community
        </p>
      </div>
      <div className="relative shrink-0" ref=${popoverRef}>
        <button
          type="button"
          onClick=${() => setPopoverOpen(!popoverOpen)}
          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
          style=${{
            borderColor: hasActiveFilters ? 'var(--app-accent)' : 'var(--app-border-soft)',
            background: hasActiveFilters ? 'var(--app-accent-soft)' : 'var(--app-surface)',
            color: hasActiveFilters ? 'var(--app-accent)' : 'var(--app-text-secondary)',
          }}
        >
          <${FilterIcon} />
          Sort feed
          ${hasActiveFilters ? html`<span className="h-1.5 w-1.5 rounded-full" style=${{ background: 'var(--app-accent)' }} />` : null}
        </button>
        ${popoverOpen ? html`
          <div
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border py-3"
            style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)', boxShadow: 'var(--app-shadow-floating)' }}
          >
            <div className="px-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Sort by</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                ${SORT_OPTIONS.map((opt) => html`
                  <button
                    key=${opt.key}
                    type="button"
                    onClick=${() => { onSortChange?.(opt.key); }}
                    className="rounded-full px-3 py-1.5 text-sm font-medium transition border ith-focus-ring"
                    style=${sort === opt.key
                      ? { background: 'var(--app-accent)', color: '#ffffff', borderColor: 'transparent' }
                      : { background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)', borderColor: 'var(--app-border-soft)' }}
                  >
                    ${opt.label}
                  </button>
                `)}
              </div>
            </div>
            ${hasActiveFilters ? html`
              <div className="mt-2 border-t px-4 pt-2" style=${{ borderColor: 'var(--app-border-soft)' }}>
                <button
                  type="button"
                  onClick=${() => { onSortChange?.('latest'); setPopoverOpen(false); }}
                  className="text-sm font-medium ith-focus-ring rounded-lg"
                  style=${{ color: 'var(--app-text-muted)' }}
                >
                  Reset to latest
                </button>
              </div>
            ` : null}
          </div>
        ` : null}
      </div>
    </div>
  `;
};

export default CommunityFeedControlBar;
