/**
 * Right rail for public profile page — mirrors feed rail styling (FeedRailKit).
 */
import React from 'react';
import htm from 'htm';
import { Users, Sparkles, Compass } from 'lucide-react';
import { FeedRailPanel, FeedRailHeading, FeedRailEmpty } from '/shared/components/feed/FeedRailKit.js';

const html = htm.bind(React.createElement);

const go = (href) => {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

const initials = (name) =>
  (name || 'U')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/**
 * @param {{
 *   user: object | null,
 *   mutualConnections?: Array<{ id?: number, full_name?: string, profile_slug?: string, headline?: string }>,
 *   mutualCount?: number,
 *   overlapBadges?: Array<{ type?: string, label?: string }>,
 *   viewedProfileName?: string,
 * }}
 */
const ProfilePublicRightRail = ({
  user,
  mutualConnections = [],
  mutualCount = 0,
  overlapBadges = [],
  viewedProfileName = '',
}) => {
  if (!user) {
    return html`
      <div className="p-2.5 sm:p-3 space-y-0">
        <${FeedRailPanel}>
          <${FeedRailHeading}
            icon=${Sparkles}
            title="Join Ithras"
            kicker=${`Sign in to connect, follow the feed, and see how you overlap with ${viewedProfileName || 'this profile'}.`}
          />
          <div className="px-3.5 pb-3.5 flex flex-col gap-2">
            <a
              href="/"
              onClick=${(e) => {
                e.preventDefault();
                go('/');
              }}
              className="block w-full text-center rounded-xl py-2.5 text-sm font-medium text-white ith-focus-ring"
              style=${{ background: 'var(--app-accent)' }}
            >
              Sign in
            </a>
            <a
              href="/register"
              onClick=${(e) => {
                e.preventDefault();
                go('/register');
              }}
              className="block w-full text-center rounded-xl py-2.5 text-sm font-medium border ith-focus-ring"
              style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
            >
              Create an account
            </a>
          </div>
        </${FeedRailPanel}>
        <${FeedRailPanel}>
          <${FeedRailHeading}
            icon=${Compass}
            title="Explore"
            kicker="Browse the feed and communities once you are signed in."
          />
          <${FeedRailEmpty}
            icon=${Compass}
            line="Public profiles are visible to everyone"
            hint="Members get richer context—mutual connections, shared schools, and one-click connect."
          />
        </${FeedRailPanel}>
      </div>
    `;
  }

  const mutuals = mutualConnections || [];
  const badges = overlapBadges || [];

  return html`
    <div className="p-2.5 sm:p-3 space-y-0">
      <${FeedRailPanel}>
        <${FeedRailHeading}
          icon=${Users}
          title="Mutual connections"
          kicker=${mutualCount > 0
            ? `You and ${viewedProfileName || 'them'} share ${mutualCount} connection${mutualCount !== 1 ? 's' : ''}.`
            : 'No mutual connections surfaced yet.'}
        />
        <div className="px-3.5 pb-3.5">
          ${mutuals.length === 0
            ? html`
                <${FeedRailEmpty}
                  icon=${Users}
                  line="No overlap in your network yet"
                  hint="Grow your network to see mutual connections here."
                />
              `
            : html`
                <ul className="space-y-2">
                  ${mutuals.map(
                    (m) => html`
                      <li key=${m.id ?? m.profile_slug}>
                        <a
                          href=${m.profile_slug ? `/p/${m.profile_slug}` : '#'}
                          onClick=${(e) => {
                            if (!m.profile_slug) return;
                            e.preventDefault();
                            go(`/p/${m.profile_slug}`);
                          }}
                          className="flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors hover:bg-[var(--app-surface-hover)] ith-focus-ring"
                          style=${{ borderColor: 'var(--app-border-soft)' }}
                        >
                          <span
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                          >
                            ${initials(m.full_name)}
                          </span>
                          <div className="min-w-0 text-left">
                            <div className="text-sm font-medium truncate" style=${{ color: 'var(--app-text-primary)' }}>
                              ${m.full_name || 'Member'}
                            </div>
                            ${m.headline
                              ? html`<div className="text-xs truncate" style=${{ color: 'var(--app-text-muted)' }}>${m.headline}</div>`
                              : null}
                          </div>
                        </a>
                      </li>
                    `,
                  )}
                </ul>
              `}
        </div>
      </${FeedRailPanel}>

      <${FeedRailPanel}>
        <${FeedRailHeading}
          icon=${Sparkles}
          title="Shared context"
          kicker="Schools, employers, and communities you have in common."
        />
        <div className="px-3.5 pb-3.5">
          ${badges.length === 0
            ? html`
                <${FeedRailEmpty}
                  icon=${Sparkles}
                  line="Nothing flagged yet"
                  hint="Overlap badges appear when we find shared institutions, orgs, or communities."
                />
              `
            : html`
                <ul className="flex flex-wrap gap-2">
                  ${badges.map(
                    (b, i) => html`
                      <li key=${b.type || `b-${i}`}>
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                          style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                        >
                          ${b.label}
                        </span>
                      </li>
                    `,
                  )}
                </ul>
              `}
        </div>
      </${FeedRailPanel}>

      <${FeedRailPanel}>
        <${FeedRailHeading}
          icon=${Compass}
          title="Next steps"
          kicker="Keep browsing from your usual places."
        />
        <div className="px-3.5 pb-3.5 flex flex-col gap-2">
          <button
            type="button"
            onClick=${() => go('/feed')}
            className="w-full rounded-xl py-2.5 text-sm font-medium border ith-focus-ring"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
          >
            Back to Feed
          </button>
          <button
            type="button"
            onClick=${() => go('/network')}
            className="w-full rounded-xl py-2.5 text-sm font-medium border ith-focus-ring"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
          >
            My network
          </button>
        </div>
      </${FeedRailPanel}>
    </div>
  `;
};

export default ProfilePublicRightRail;
