/**
 * CommunityFeedControlBar - Feed header with working filter popover.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const SORT_OPTIONS = [
  { key: 'latest', label: 'Latest' },
  { key: 'trending', label: 'Trending' },
  { key: 'unanswered', label: 'Unanswered' },
  { key: 'pinned', label: 'Pinned' },
  { key: 'useful', label: 'Most useful' },
];

const TYPE_OPTIONS = [
  { key: null, label: 'All types' },
  { key: 'discussion', label: 'Discussion' },
  { key: 'question', label: 'Question' },
  { key: 'announcement', label: 'Announcement' },
  { key: 'resource', label: 'Resource' },
];

const FilterIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
`;

const CommunityFeedControlBar = ({ sort, onSortChange, typeFilter, onTypeFilterChange }) => {
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

  const hasActiveFilters = sort !== 'latest' || typeFilter;

  return html`
    <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>
          Community Feed
        </h1>
        <p className="mt-1 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
          Latest discussions, questions, and updates
        </p>
      </div>
      <div className="relative shrink-0" ref=${popoverRef}>
        <button
          type="button"
          onClick=${() => setPopoverOpen(!popoverOpen)}
          className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-medium shadow-sm transition hover:opacity-90"
          style=${{
            borderColor: hasActiveFilters ? '#0f172a' : 'var(--app-border-soft)',
            background: hasActiveFilters ? '#f1f5f9' : 'var(--app-surface)',
            color: hasActiveFilters ? '#0f172a' : 'var(--app-text-secondary)',
          }}
        >
          <${FilterIcon} />
          Filter posts
          ${hasActiveFilters ? html`<span className="h-1.5 w-1.5 rounded-full" style=${{ background: '#0f172a' }} />` : null}
        </button>
        ${popoverOpen ? html`
          <div
            className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border bg-white py-3 shadow-lg"
            style=${{ borderColor: '#e2e8f0' }}
          >
            <div className="px-4 pb-2">
              <p className="text-xs font-medium uppercase tracking-wider" style=${{ color: '#94a3b8' }}>Sort by</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                ${SORT_OPTIONS.map((opt) => html`
                  <button
                    key=${opt.key}
                    type="button"
                    onClick=${() => { onSortChange?.(opt.key); }}
                    className="rounded-full px-3 py-1.5 text-sm font-medium transition"
                    style=${{
                      background: sort === opt.key ? '#0f172a' : '#f1f5f9',
                      color: sort === opt.key ? '#ffffff' : '#475569',
                    }}
                  >
                    ${opt.label}
                  </button>
                `)}
              </div>
            </div>
            <div className="border-t px-4 pt-3" style=${{ borderColor: '#e2e8f0' }}>
              <p className="text-xs font-medium uppercase tracking-wider" style=${{ color: '#94a3b8' }}>Post type</p>
              <div className="mt-2 space-y-1">
                ${TYPE_OPTIONS.map((opt) => html`
                  <button
                    key=${opt.key || 'all'}
                    type="button"
                    onClick=${() => { onTypeFilterChange?.(opt.key); }}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition hover:bg-[#f1f5f9]"
                    style=${{ color: (typeFilter || null) === opt.key ? '#0f172a' : '#475569' }}
                  >
                    ${opt.label}
                    ${(typeFilter || null) === opt.key ? html`
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ` : null}
                  </button>
                `)}
              </div>
            </div>
            ${hasActiveFilters ? html`
              <div className="mt-2 border-t px-4 pt-2" style=${{ borderColor: '#e2e8f0' }}>
                <button
                  type="button"
                  onClick=${() => { onSortChange?.('latest'); onTypeFilterChange?.(null); setPopoverOpen(false); }}
                  className="text-sm font-medium"
                  style=${{ color: '#64748b' }}
                >
                  Clear filters
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
