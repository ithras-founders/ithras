/**
 * CommunityFeedPage - Clean, premium community discussion surface.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCommunityBySlug, getCommunityFeed, getChannelFeed } from '../services/feedApi.js';
import CommunityHero from '../components/community/CommunityHero.js';
import CommunityChannelNav from '../components/community/CommunityChannelNav.js';
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
  const [typeFilter, setTypeFilter] = useState(null);

  const effectiveChannelId = channel?.id ?? null;

  const refresh = () => {
    if (!community) return;
    setLoading(true);
    const fetchFn = channel
      ? () => getChannelFeed(channel.id, { sort, type: typeFilter, limit: 30 })
      : () => getCommunityFeed(community.id, { channel_id: effectiveChannelId, sort, type: typeFilter, limit: 30 });
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
      ? () => getChannelFeed(channel.id, { sort, type: typeFilter, limit: 30 })
      : () => getCommunityFeed(community.id, { channel_id: effectiveChannelId, sort, type: typeFilter, limit: 30 });
    fetchFn()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [community?.id, channel?.id, effectiveChannelId, sort, typeFilter]);

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

  return html`
    <div
      className="min-h-screen px-4 py-10"
      style=${{ background: '#f8fafc' }}
    >
      <div className="mx-auto max-w-4xl">
        <div className="space-y-8">
          <${CommunityHero} community=${community} onRefresh=${refresh} />
          ${community.has_channels && (community.channels || []).length > 0 ? html`
            <${CommunityChannelNav}
              channels=${community.channels}
              activeChannelId=${effectiveChannelId}
              onSelectChannel=${(id) => setChannel(community.channels?.find((c) => c.id === id) || null)}
              communitySlug=${communitySlug}
            />
          ` : null}
          <div className="space-y-5">
            ${community.is_member ? html`<${CommunityComposer} onSuccess=${refresh} communityId=${community.id} channelId=${effectiveChannelId} community=${community} user=${user} defaultExpanded=${true} />` : null}
            <${CommunityFeedControlBar}
              sort=${sort}
              onSortChange=${setSort}
              typeFilter=${typeFilter}
              onTypeFilterChange=${setTypeFilter}
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
