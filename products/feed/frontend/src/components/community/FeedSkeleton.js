/**
 * FeedSkeleton - Skeleton loader for feed cards.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const FeedSkeleton = () => html`
  <div className="rounded-2xl border p-5 animate-pulse" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
    <div className="flex items-start gap-3 mb-4">
      <div className="w-10 h-10 rounded-full flex-shrink-0" style=${{ background: 'var(--app-surface-subtle)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 rounded" style=${{ background: 'var(--app-surface-subtle)' }} />
        <div className="h-3 w-1/4 rounded" style=${{ background: 'var(--app-surface-subtle)' }} />
      </div>
    </div>
    <div className="h-5 w-2/3 rounded mb-3" style=${{ background: 'var(--app-surface-subtle)' }} />
    <div className="space-y-2 mb-4">
      <div className="h-4 w-full rounded" style=${{ background: 'var(--app-surface-subtle)' }} />
      <div className="h-4 w-4/5 rounded" style=${{ background: 'var(--app-surface-subtle)' }} />
    </div>
    <div className="h-4 w-1/4 rounded" style=${{ background: 'var(--app-surface-subtle)' }} />
  </div>
`;

export default FeedSkeleton;
