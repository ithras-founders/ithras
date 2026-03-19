/**
 * CommunityHeader - Logo, name, description, member count, join button.
 */
import React from 'react';
import htm from 'htm';
import { joinCommunity, leaveCommunity } from '../services/feedApi.js';

const html = htm.bind(React.createElement);

const typeLabel = (t) => (t || '').replace(/^./, (c) => c.toUpperCase());

const CommunityHeader = ({ community, onRefresh }) => {
  const handleJoin = async () => {
    try {
      await joinCommunity(community.id);
      onRefresh?.();
    } catch (_) {}
  };

  const handleLeave = async () => {
    try {
      await leaveCommunity(community.id);
      onRefresh?.();
    } catch (_) {}
  };

  const initials = (community.name || 'C').slice(0, 2).toUpperCase();

  return html`
    <div className="rounded-xl border overflow-hidden" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      <div className="h-24" style=${{ background: 'var(--app-accent-soft)' }} />
      <div className="relative px-6 pb-6 pt-0">
        <div
          className="-mt-10 flex h-16 w-16 items-center justify-center rounded-xl border-2 border-white text-xl font-semibold flex-shrink-0"
          style=${{ background: 'var(--app-surface)', color: 'var(--app-text-primary)' }}
        >
          ${community.logo_url
            ? html`<img src=${community.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />`
            : initials}
        </div>
        <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${community.name}</h1>
            <span
              className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
              style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}
            >
              ${typeLabel(community.type)}
            </span>
            ${community.description ? html`
              <p className="mt-2 text-sm" style=${{ color: 'var(--app-text-secondary)' }}>${community.description}</p>
            ` : null}
            <p className="mt-1 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${community.member_count ?? 0} members</p>
          </div>
          <div className="flex-shrink-0">
            ${community.is_member
              ? html`
                  <button
                    type="button"
                    onClick=${handleLeave}
                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                    style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
                  >
                    Leave
                  </button>
                `
              : html`
                  <button
                    type="button"
                    onClick=${handleJoin}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style=${{ background: 'var(--app-accent)' }}
                  >
                    Join
                  </button>
                `}
          </div>
        </div>
      </div>
    </div>
  `;
};

export default CommunityHeader;
