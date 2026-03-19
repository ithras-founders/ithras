/**
 * CommunityHero - Compact premium community header.
 */
import React from 'react';
import htm from 'htm';
import { joinCommunity } from '../../services/feedApi.js';

const html = htm.bind(React.createElement);

const typeLabel = (t) => (t || '').replace(/^./, (c) => c.toUpperCase());

const CommunityHero = ({ community, onRefresh }) => {
  const handleJoin = async () => {
    try {
      await joinCommunity(community.id);
      onRefresh?.();
    } catch (_) {}
  };

  const initials = (community.name || 'C').slice(0, 2).toUpperCase();

  return html`
    <div className="rounded-[32px] border overflow-hidden shadow-sm" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      <div
        className="h-32 relative"
        style=${{
          background: community.cover_image_url
            ? `url(${community.cover_image_url}) center/cover`
            : 'linear-gradient(to right, var(--app-accent-soft), var(--app-surface-subtle))',
        }}
      />
      <div className="relative px-7 pb-7">
        <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 items-end gap-4">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] border shadow-sm"
              style=${{ background: 'var(--app-surface)', borderColor: 'var(--app-border-soft)' }}
            >
              ${community.logo_url
                ? html`<img src=${community.logo_url} alt="" className="w-full h-full object-cover rounded-[24px]" />`
                : html`<span className="text-3xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${initials}</span>`}
            </div>
            <div className="min-w-0 pb-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl md:text-[34px] font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>${community.name}</h1>
                <span
                  className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                  style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}
                >
                  ${typeLabel(community.type)}
                </span>
              </div>
              ${community.description ? html`
                <p className="max-w-2xl text-[15px]" style=${{ color: 'var(--app-text-secondary)' }}>${community.description}</p>
              ` : null}
              <div className="mt-3 flex flex-wrap items-center gap-5 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                <span>${community.member_count ?? 0} members</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            ${community.is_member ? html`
              <button
                key="invite"
                type="button"
                className="rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--app-surface-hover)]"
                style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
              >
                Invite
              </button>
              <span
                key="joined"
                className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
                style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
              >
                Joined
              </span>
            ` : html`
              <button
                key="join"
                type="button"
                onClick=${handleJoin}
                className="rounded-2xl px-4 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90"
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

export default CommunityHero;
