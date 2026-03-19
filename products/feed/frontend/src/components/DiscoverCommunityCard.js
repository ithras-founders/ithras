/**
 * DiscoverCommunityCard - Community card for discover page.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const typeLabel = (t) => (t || '').replace(/^./, (c) => c.toUpperCase());

const DiscoverCommunityCard = ({ community, onJoin }) => {
  const initials = (community.name || 'C').slice(0, 2).toUpperCase();
  const isMember = community.is_member;

  return html`
    <div
      className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0 text-sm font-semibold"
        style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
      >
        ${community.logo_url
          ? html`<img src=${community.logo_url} alt="" className="w-full h-full object-cover rounded-xl" />`
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${community.name}</h3>
        <span
          className="inline-block mt-1 px-2 py-0.5 rounded text-xs"
          style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}
        >
          ${typeLabel(community.type)}
        </span>
        ${community.description ? html`
          <p className="mt-2 text-sm line-clamp-2" style=${{ color: 'var(--app-text-muted)' }}>${community.description}</p>
        ` : null}
        <p className="mt-1 text-xs" style=${{ color: 'var(--app-text-muted)' }}>${community.member_count ?? 0} members</p>
      </div>
      <div className="flex-shrink-0">
        ${isMember ? html`
          <span className="px-4 py-2 rounded-lg text-sm font-medium inline-block" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-muted)' }}>
            Joined
          </span>
        ` : html`
          <button
            type="button"
            onClick=${onJoin}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style=${{ background: 'var(--app-accent)' }}
          >
            Join
          </button>
        `}
      </div>
    </div>
  `;
};

export default DiscoverCommunityCard;
