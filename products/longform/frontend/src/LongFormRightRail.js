/**
 * LongForm right rail — trending posts and popular publications.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { TrendingUp, Sparkles } from 'lucide-react';
import { FeedRailPanel, FeedRailHeading, FeedRailEmpty } from '/shared/components/feed/FeedRailKit.js';
import { listRecentPosts, listPublications } from '/shared/services/longformApi.js';

const html = htm.bind(React.createElement);

const goPost = (publicationSlug, postSlug) => {
  const href = `/longform/p/${publicationSlug}/${postSlug}`;
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

const goPub = (slug) => {
  const href = `/longform/p/${slug}`;
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

const LongFormRightRail = () => {
  const [trending, setTrending] = useState([]);
  const [popular, setPopular] = useState([]);
  const [loadingT, setLoadingT] = useState(true);
  const [loadingP, setLoadingP] = useState(true);

  useEffect(() => {
    setLoadingT(true);
    listRecentPosts({ limit: 8, sort: 'trending' })
      .then((r) => setTrending(r.items || []))
      .catch(() => setTrending([]))
      .finally(() => setLoadingT(false));
    setLoadingP(true);
    listPublications({ limit: 6, sort: 'popular' })
      .then((r) => setPopular(r.items || []))
      .catch(() => setPopular([]))
      .finally(() => setLoadingP(false));
  }, []);

  return html`
    <div className="p-2.5 sm:p-3 space-y-0">
      <${FeedRailPanel}>
        <${FeedRailHeading}
          icon=${TrendingUp}
          title="Trending"
          kicker="Published posts with the most stars right now."
        />
        ${loadingT
          ? html`<div className="px-3.5 pb-3.5 text-xs" style=${{ color: 'var(--app-text-muted)' }}>Loading…</div>`
          : trending.length === 0
            ? html`
                <${FeedRailEmpty}
                  icon=${TrendingUp}
                  line="No trending posts yet"
                  hint="Star posts you love—popular writing surfaces here for readers exploring LongForm."
                />
              `
            : html`
                <ul className="px-3 pb-3.5 space-y-0.5 list-none">
                  ${trending.map(
                    (po) => html`
                      <li key=${po.id}>
                        <button
                          type="button"
                          onClick=${() => goPost(po.publication_slug, po.slug)}
                          className="w-full text-left rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--app-surface-hover)]"
                          style=${{ color: 'var(--app-text-primary)' }}
                        >
                          <span className="font-medium line-clamp-2">${po.title}</span>
                          <span className="block text-[11px] mt-0.5 truncate" style=${{ color: 'var(--app-text-muted)' }}>
                            ${po.publication_title}${po.star_count != null ? ` · ${po.star_count} ${po.star_count === 1 ? 'star' : 'stars'}` : ''}
                          </span>
                        </button>
                      </li>
                    `,
                  )}
                </ul>
              `}
      </${FeedRailPanel}>
      <${FeedRailPanel}>
        <${FeedRailHeading}
          icon=${Sparkles}
          title="Popular publications"
          kicker="Spaces readers subscribe to most."
        />
        ${loadingP
          ? html`<div className="px-3.5 pb-3.5 text-xs" style=${{ color: 'var(--app-text-muted)' }}>Loading…</div>`
          : popular.length === 0
            ? html`
                <${FeedRailEmpty}
                  icon=${Sparkles}
                  line="No publications yet"
                  hint="Create or discover a publication—subscriber growth will show up here."
                />
              `
            : html`
                <ul className="px-3 pb-3.5 space-y-0.5 list-none">
                  ${popular.map(
                    (p) => html`
                      <li key=${p.id}>
                        <button
                          type="button"
                          onClick=${() => goPub(p.slug)}
                          className="w-full text-left rounded-lg px-2 py-2 text-sm transition-colors hover:bg-[var(--app-surface-hover)]"
                          style=${{ color: 'var(--app-text-primary)' }}
                        >
                          <span className="font-medium truncate block">${p.title}</span>
                          <span className="block text-[11px] mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>
                            ${p.subscriber_count != null ? `${p.subscriber_count} subscribers` : ''}
                          </span>
                        </button>
                      </li>
                    `,
                  )}
                </ul>
              `}
      </${FeedRailPanel}>
    </div>
  `;
};

export default LongFormRightRail;
