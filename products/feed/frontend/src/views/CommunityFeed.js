/**
 * CommunityFeed - Feed for a single community.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCommunityBySlug, getCommunityFeed } from '../services/feedApi.js';
import PostComposer from '../components/PostComposer.js';
import PostCard from '../components/PostCard.js';
import CommunityHeader from '../components/CommunityHeader.js';
import ChannelTabs from '../components/ChannelTabs.js';
import EmptyState from '../components/EmptyState.js';

const html = htm.bind(React.createElement);

const CommunityFeed = ({ communitySlug }) => {
  const [community, setCommunity] = useState(null);
  const [items, setItems] = useState([]);
  const [channelId, setChannelId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () => {
    if (!community) return;
    setLoading(true);
    getCommunityFeed(community.id, { channel_id: channelId, limit: 30 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!communitySlug) return;
    getCommunityBySlug(communitySlug)
      .then(setCommunity)
      .catch((e) => { setError(e.message || 'Not found'); setCommunity(null); });
  }, [communitySlug]);

  useEffect(() => {
    if (!community) return;
    setLoading(true);
    getCommunityFeed(community.id, { channel_id: channelId, limit: 30 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [community?.id, channelId]);

  if (error && !community) {
    return html`
      <div className="p-8">
        <div className="p-4 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      </div>
    `;
  }

  if (!community) {
    return html`<div className="p-8"><div className="animate-pulse" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div></div>`;
  }

  return html`
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <${CommunityHeader} community=${community} onRefresh=${refresh} />
      ${community.has_channels && (community.channels || []).length > 0 ? html`
        <${ChannelTabs}
          channels=${community.channels}
          activeChannelId=${channelId}
          onSelectChannel=${(id) => setChannelId(id)}
          communitySlug=${communitySlug}
        />
      ` : null}
      ${community.is_member ? html`<${PostComposer} onSuccess=${refresh} communityId=${community.id} channelId=${channelId} />` : null}
      ${loading ? html`
        <div className="py-12 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      ` : items.length === 0 ? html`
        <${EmptyState}
          title="No posts yet in this community"
          description=${community.is_member ? 'Be the first to start the discussion.' : 'Join the community to post.'}
        />
      ` : html`
        <div className="space-y-4">
          ${items.map((post) => html`
            <${PostCard} key=${post.id} post=${post} onRefresh=${refresh} />
          `)}
        </div>
      `}
    </div>
  `;
};

export default CommunityFeed;
