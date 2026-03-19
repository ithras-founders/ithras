/**
 * UserCard - Name, org, institution, major, function, mutual count, overlap badges.
 */
import React from 'react';
import htm from 'htm';
import OverlapBadge from './OverlapBadge.js';

const html = htm.bind(React.createElement);

function getInitials(name) {
  return (name || 'U').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
}

const UserCard = ({ user, overlapBadges, mutualCount, actions, compact = false }) => {
  const slug = user?.profile_slug;
  const href = slug ? `/p/${slug}` : null;

  const handleClick = (e) => {
    if (href) {
      e.preventDefault();
      window.history.pushState(null, '', href);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  return html`
    <div
      className="p-4 rounded-xl border flex items-start gap-4"
      style=${{ borderColor: 'var(--app-border-soft)' }}
    >
      <div className="flex-shrink-0">
        ${href ? html`
          <a href=${href} onClick=${handleClick} className="block">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold"
              style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
            >
              ${getInitials(user?.full_name)}
            </span>
          </a>
        ` : html`
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl text-base font-semibold"
            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
          >
            ${getInitials(user?.full_name)}
          </span>
        `}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          ${href ? html`
            <a
              href=${href}
              onClick=${handleClick}
              className="font-semibold hover:underline"
              style=${{ color: 'var(--app-text-primary)' }}
            >
              ${user?.full_name || 'Unknown'}
            </a>
          ` : html`
            <span className="font-semibold" style=${{ color: 'var(--app-text-primary)' }}>
              ${user?.full_name || 'Unknown'}
            </span>
          `}
          ${mutualCount != null && mutualCount > 0 ? html`
            <span className="text-xs" style=${{ color: 'var(--app-text-muted)' }}>
              ${mutualCount} mutual connection${mutualCount !== 1 ? 's' : ''}
            </span>
          ` : null}
        </div>
        ${user?.headline ? html`
          <p className="text-sm mt-0.5 truncate" style=${{ color: 'var(--app-text-secondary)' }}>${user.headline}</p>
        ` : null}
        ${!compact ? html`
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
            ${user?.current_org ? html`<span>${user.current_org}</span>` : null}
            ${user?.institution_name ? html`<span>${user.institution_name}</span>` : null}
            ${user?.major ? html`<span>${user.major}</span>` : null}
            ${user?.function ? html`<span>${user.function}</span>` : null}
          </div>
        ` : null}
        ${overlapBadges && overlapBadges.length > 0 ? html`
          <div className="flex flex-wrap gap-1.5 mt-2">
            ${overlapBadges.slice(0, 3).map((b) => html`<${OverlapBadge} key=${b.type} label=${b.label} />`)}
          </div>
        ` : null}
        ${actions ? html`
          <div className="mt-3 flex flex-wrap gap-2">
            ${actions}
          </div>
        ` : null}
      </div>
    </div>
  `;
};

export default UserCard;
