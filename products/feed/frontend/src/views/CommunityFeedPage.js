/**
 * CommunityFeedPage - Clean, premium community discussion surface.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCommunityBySlug, getCommunityFeed, getChannelFeed } from '../services/feedApi.js';
import CommunityHero from '../components/community/CommunityHero.js';
import { navigateToCommunityAll, navigateToCommunityChannel } from '../utils/communityNav.js';
import CommunityFeedControlBar from '../components/community/CommunityFeedControlBar.js';
import CommunityComposer from '../components/community/CommunityComposer.js';
import PremiumPostCard from '../components/PremiumPostCard.js';
import PinnedPostsSection from '../components/community/PinnedPostsSection.js';
import CommunityEmptyState from '../components/community/CommunityEmptyState.js';
import FeedSkeleton from '../components/community/FeedSkeleton.js';

const html = htm.bind(React.createElement);

const CommunityFeedPage = ({ communitySlug, channelSlug, user }) => {
  const [community, setCommunity] = useState(null);
  const [channel, setChannel] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('latest');

  const effectiveChannelId = channel?.id ?? null;

  const refresh = () => {
    if (!community) return;
    setLoading(true);
    const fetchFn = channel
      ? () => getChannelFeed(channel.id, { sort, limit: 30 })
      : () => getCommunityFeed(community.id, { channel_id: effectiveChannelId, sort, limit: 30 });
    fetchFn()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!communitySlug) return;
    getCommunityBySlug(communitySlug)
      .then((comm) => {
        setCommunity(comm);
        if (channelSlug) {
          const ch = (comm.channels || []).find((c) => c.slug === channelSlug);
          setChannel(ch || null);
        } else {
          setChannel(null);
        }
      })
      .catch((e) => {
        setError(e.message || 'Not found');
        setCommunity(null);
        setChannel(null);
      });
  }, [communitySlug, channelSlug]);

  useEffect(() => {
    if (!community) return;
    setLoading(true);
    const fetchFn = channel
      ? () => getChannelFeed(channel.id, { sort, limit: 30 })
      : () => getCommunityFeed(community.id, { channel_id: effectiveChannelId, sort, limit: 30 });
    fetchFn()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [community?.id, channel?.id, effectiveChannelId, sort]);

  if (error && !community) {
    return html`
      <div className="p-8">
        <div className="p-4 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      </div>
    `;
  }

  if (!community) {
    return html`
      <div className="p-8 space-y-4">
        <${FeedSkeleton} />
        <${FeedSkeleton} />
      </div>
    `;
  }

  const pinnedItems = items.filter((p) => p.is_pinned);
  const regularItems = items.filter((p) => !p.is_pinned);

  const chList = community.channels || [];
  const showChannelNav = community.has_channels && chList.length > 0;

  const goFeed = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/feed');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <div
      className="min-h-screen px-4 py-10"
      style=${{ background: 'var(--app-bg)' }}
    >
      <div className="mx-auto max-w-4xl">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs mb-6" aria-label="Breadcrumb">
          <a
            href="/feed"
            onClick=${goFeed}
            className="font-medium hover:underline ith-focus-ring rounded-sm"
            style=${{ color: 'var(--app-accent)' }}
          >
            Feed
          </a>
          <span style=${{ color: 'var(--app-text-faint)' }} aria-hidden="true">/</span>
          <span className="font-medium truncate max-w-[40vw]" style=${{ color: 'var(--app-text-primary)' }}>${community.name}</span>
          ${channel
            ? html`
                <span style=${{ color: 'var(--app-text-faint)' }} aria-hidden="true">/</span>
                <span className="truncate max-w-[36vw]" style=${{ color: 'var(--app-text-secondary)' }}>#${channel.name}</span>
              `
            : null}
        </nav>
        ${channel?.description
          ? html`
              <p className="text-sm leading-relaxed mb-4 -mt-2 max-w-2xl" style=${{ color: 'var(--app-text-muted)' }}>
                ${channel.description}
              </p>
            `
          : null}
        ${showChannelNav
          ? html`
              <div className="lg:hidden mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style=${{ color: 'var(--app-text-muted)' }}>
                  Channels
                </p>
                <p className="text-[11px] mb-2 leading-snug" style=${{ color: 'var(--app-text-muted)' }}>
                  Use the list on large screens. Swipe sideways to switch on mobile.
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style=${{ WebkitOverflowScrolling: 'touch' }}>
                  <button
                    type="button"
                    onClick=${() => navigateToCommunityAll(communitySlug)}
                    className="shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ith-focus-ring"
                    style=${{
                      background: effectiveChannelId == null ? 'var(--app-accent-soft)' : 'var(--app-surface-subtle)',
                      color: effectiveChannelId == null ? 'var(--app-accent)' : 'var(--app-text-secondary)',
                      boxShadow: effectiveChannelId == null ? 'inset 0 0 0 1px var(--app-accent-soft)' : 'none',
                    }}
                  >
                    All
                  </button>
                  ${chList.map(
                    (ch) => html`
                      <button
                        key=${ch.id}
                        type="button"
                        title=${ch.name}
                        onClick=${() => navigateToCommunityChannel(communitySlug, ch.slug)}
                        className="shrink-0 max-w-[200px] truncate rounded-full px-3 py-1.5 text-sm font-medium transition-colors ith-focus-ring"
                        style=${{
                          background: effectiveChannelId === ch.id ? 'var(--app-accent-soft)' : 'var(--app-surface-subtle)',
                          color: effectiveChannelId === ch.id ? 'var(--app-accent)' : 'var(--app-text-secondary)',
                          boxShadow: effectiveChannelId === ch.id ? 'inset 0 0 0 1px var(--app-accent-soft)' : 'none',
                        }}
                      >
                        ${ch.name}
                      </button>
                    `,
                  )}
                </div>
              </div>
            `
          : null}
        <div className="space-y-8">
          <${CommunityHero} community=${community} onRefresh=${refresh} />
          <div className="space-y-5">
            ${community.is_member ? html`<${CommunityComposer} onSuccess=${refresh} communityId=${community.id} channelId=${effectiveChannelId} community=${community} user=${user} />` : null}
            <${CommunityFeedControlBar}
              sort=${sort}
              onSortChange=${setSort}
            />
          </div>
          ${loading ? html`
            <div className="space-y-6">
              <${FeedSkeleton} />
              <${FeedSkeleton} />
            </div>
          ` : items.length === 0 ? html`
            <${CommunityEmptyState} variant=${channel ? 'channel' : 'community'} isMember=${community.is_member} />
          ` : html`
            <div className="space-y-6">
              ${pinnedItems.length > 0 ? html`
                <${PinnedPostsSection} items=${pinnedItems} onRefresh=${refresh} user=${user} />
              ` : null}
              <div className="space-y-5">
                ${regularItems.map((post) => html`
                  <${PremiumPostCard} key=${post.id} post=${post} onRefresh=${refresh} user=${user} />
                `)}
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

export default CommunityFeedPage;
