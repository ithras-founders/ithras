/**
 * Linked community block for public institution / organisation pages.
 * When the viewer is a member, shows a short post preview and link to the full feed.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { Hash, MessageSquare, ExternalLink } from 'lucide-react';
import { getCommunityFeedPreview } from '/shared/services/profile.js';

const html = htm.bind(React.createElement);

const stripHtml = (s) =>
  typeof s === 'string' ? s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim() : '';

const navigateToFeed = (href) => {
  if (!href) return;
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

/**
 * @param {{ linkedCommunity?: { id: number, slug: string, name: string, member_count?: number, feed_href: string, viewer_is_member: boolean } | null, user?: object | null }} props
 */
const EntityPageCommunitySection = ({ linkedCommunity, user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!linkedCommunity?.viewer_is_member || !linkedCommunity.id) {
      setPosts([]);
      return;
    }
    setLoading(true);
    setErr('');
    getCommunityFeedPreview(linkedCommunity.id, { limit: 5 })
      .then((res) => setPosts(res?.items || []))
      .catch(() => setErr('Could not load discussions.'))
      .finally(() => setLoading(false));
  }, [linkedCommunity?.id, linkedCommunity?.viewer_is_member]);

  if (!linkedCommunity) return null;

  const { name, member_count: memberCount, feed_href: feedHref, viewer_is_member: isMember } = linkedCommunity;

  return html`
    <section
      className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      aria-label="Community"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <${Hash} className="w-5 h-5 text-gray-500 flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">${name}</h2>
            <p className="text-xs text-gray-500">
              ${typeof memberCount === 'number' ? `${memberCount} members · ` : ''}Ithras community
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick=${() => navigateToFeed(feedHref)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 flex-shrink-0"
        >
          <${ExternalLink} className="w-4 h-4" />
          Open feed
        </button>
      </div>

      ${!user
        ? html`<p className="text-sm text-gray-600">
            <a href="/" className="text-blue-600 font-medium hover:underline">Sign in</a>
            to see whether you can access this community and join the conversation.
          </p>`
        : null}
      ${user && !isMember
        ? html`<p className="text-sm text-gray-600">
            Join this community from the feed to see discussions and post updates.
            <button
              type="button"
              className="ml-1 text-blue-600 font-medium hover:underline"
              onClick=${() => navigateToFeed(feedHref)}
            >
              Go to community
            </button>
          </p>`
        : null}
      ${user && isMember && loading
        ? html`<p className="text-sm text-gray-500">Loading recent posts…</p>`
        : null}
      ${user && isMember && err ? html`<p className="text-sm text-amber-700">${err}</p>` : null}
      ${user && isMember && !loading && !err && posts.length === 0
        ? html`<p className="text-sm text-gray-500">No posts yet. Start the conversation in the feed.</p>`
        : null}
      ${user && isMember && posts.length > 0
        ? html`
            <ul className="mt-3 space-y-2 divide-y divide-gray-100">
              ${posts.map(
                (p) => html`
                  <li key=${p.id} className="pt-2 first:pt-0">
                    <button
                      type="button"
                      className="w-full text-left"
                      onClick=${() => navigateToFeed(feedHref)}
                    >
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        ${p.title || stripHtml(p.content).slice(0, 120) || 'Post'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                        <${MessageSquare} className="w-3.5 h-3.5" />
                        ${p.comment_count ?? 0} comments
                        ${p.author_name ? ` · ${p.author_name}` : ''}
                      </p>
                    </button>
                  </li>
                `,
              )}
            </ul>
          `
        : null}
    </section>
  `;
};

export default EntityPageCommunitySection;
