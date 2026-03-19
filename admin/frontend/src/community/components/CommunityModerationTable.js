/**
 * Moderation table - recent posts with actions: Hide, Remove, Lock, Flag.
 */
import React from 'react';
import htm from 'htm';
import EmptyState from './EmptyState.js';

const html = htm.bind(React.createElement);

const CommunityModerationTable = ({
  posts = [],
  onHide,
  onRemove,
  onLock,
  onFlag,
}) => {
  if (!posts.length) {
    return html`
      <${EmptyState}
        heading="No posts to moderate"
        description="Posts from this community will appear here for moderation."
      />
    `;
  }
  return html`
    <div className="overflow-x-auto rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)' }}>
      <table className="w-full text-sm">
        <thead style=${{ background: 'var(--app-surface-subtle)' }}>
          <tr>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Post</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Author</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Channel</th>
            <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Engagement</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Status</th>
            <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Created</th>
            <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${posts.map((p) => html`
            <tr key=${p.id} className="border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
              <td className="px-4 py-3 max-w-[200px] truncate font-medium" style=${{ color: 'var(--app-text-primary)' }}>${p.title || '(No title)'}</td>
              <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${p.authorName || '—'}</td>
              <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${p.channelName || '—'}</td>
              <td className="px-4 py-3 text-right" style=${{ color: 'var(--app-text-secondary)' }}>${p.engagement ?? 0}</td>
              <td className="px-4 py-3">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium ${p.moderationStatus === 'hidden' ? 'bg-amber-100 text-amber-800' : p.moderationStatus === 'removed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}">
                  ${p.moderationStatus || 'active'}
                </span>
                ${p.isLocked ? html`<span className="ml-1 px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700">Locked</span>` : null}
              </td>
              <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
              <td className="px-4 py-3 text-right">
                <div className="flex gap-1 justify-end flex-wrap">
                  ${onHide && p.moderationStatus !== 'hidden' ? html`<button onClick=${() => onHide(p)} className="px-2 py-1 rounded text-xs font-medium hover:bg-amber-50">Hide</button>` : null}
                  ${onRemove && p.moderationStatus !== 'removed' ? html`<button onClick=${() => onRemove(p)} className="px-2 py-1 rounded text-xs font-medium hover:bg-red-50" style=${{ color: 'var(--app-danger)' }}>Remove</button>` : null}
                  ${onLock ? html`<button onClick=${() => onLock(p)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]">${p.isLocked ? 'Unlock' : 'Lock'}</button>` : null}
                  ${onFlag ? html`<button onClick=${() => onFlag(p)} className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]">Flag</button>` : null}
                </div>
              </td>
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
};

export default CommunityModerationTable;
