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

const UserCard = ({ user, overlapBadges, mutualCount, actions, compact = false, variant = 'card' }) => {
  const slug = user?.profile_slug;
  const href = slug ? `/p/${slug}` : null;
  const isList = variant === 'list';

  const handleClick = (e) => {
    if (href) {
      e.preventDefault();
      window.history.pushState(null, '', href);
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
  };

  const listWrap = isList ? 'px-4 py-3 border-b last:border-b-0 flex items-start gap-3' : 'p-4 rounded-xl border flex items-start gap-4';
  const listStyle = isList
    ? { borderColor: 'var(--app-border-soft)' }
    : { borderColor: 'var(--app-border-soft)' };
  const avatarSize = isList ? 'h-10 w-10 text-sm rounded-lg' : 'h-12 w-12 text-base rounded-xl';

  return html`
    <div
      className=${`${listWrap}`}
      style=${listStyle}
    >
      <div className="flex-shrink-0">
        ${href ? html`
          <a href=${href} onClick=${handleClick} className="block">
            <span
              className=${`flex ${avatarSize} items-center justify-center font-semibold`}
              style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
            >
              ${getInitials(user?.full_name)}
            </span>
          </a>
        ` : html`
          <span
            className=${`flex ${avatarSize} items-center justify-center font-semibold`}
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
        ${!(compact || isList) ? html`
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
            ${user?.current_org ? html`<span>${user.current_org}</span>` : null}
            ${user?.institution_name ? html`<span>${user.institution_name}</span>` : null}
            ${user?.major ? html`<span>${user.major}</span>` : null}
            ${user?.function ? html`<span>${user.function}</span>` : null}
          </div>
        ` : isList ? html`
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs" style=${{ color: 'var(--app-text-muted)' }}>
            ${user?.current_org ? html`<span className="truncate max-w-[200px]">${user.current_org}</span>` : null}
            ${user?.institution_name ? html`<span className="truncate max-w-[200px]">${user.institution_name}</span>` : null}
            ${user?.major ? html`<span>${user.major}</span>` : null}
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
