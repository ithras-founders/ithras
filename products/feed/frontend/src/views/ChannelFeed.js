/**
 * ChannelFeed - Feed for a specific channel within a community.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCommunityBySlug, getChannelFeed } from '../services/feedApi.js';
import PostComposer from '../components/PostComposer.js';
import PostCard from '../components/PostCard.js';
import CommunityHeader from '../components/CommunityHeader.js';
import ChannelTabs from '../components/ChannelTabs.js';
import EmptyState from '../components/EmptyState.js';

const html = htm.bind(React.createElement);

const ChannelFeed = ({ communitySlug, channelSlug }) => {
  const [community, setCommunity] = useState(null);
  const [channel, setChannel] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!communitySlug) return;
    getCommunityBySlug(communitySlug)
      .then((comm) => {
        setCommunity(comm);
        const ch = (comm.channels || []).find((c) => c.slug === channelSlug);
        setChannel(ch || null);
        return ch ? getChannelFeed(ch.id, { limit: 30 }) : { items: [] };
      })
      .then((r) => setItems(r?.items || []))
      .catch((e) => { setError(e.message || 'Not found'); setCommunity(null); setChannel(null); })
      .finally(() => setLoading(false));
  }, [communitySlug, channelSlug]);

  const refresh = () => {
    if (!channel) return;
    setLoading(true);
    getChannelFeed(channel.id, { limit: 30 })
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

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

  if (!channel) {
    return html`
      <div className="p-8">
        <${EmptyState} title="Channel not found" description="This channel does not exist." />
      </div>
    `;
  }

  return html`
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <${CommunityHeader} community=${community} onRefresh=${refresh} />
      <${ChannelTabs}
        channels=${community.channels || []}
        activeChannelId=${channel.id}
        onSelectChannel=${() => {}}
        communitySlug=${communitySlug}
      />
      <div className="flex items-center gap-2 py-2">
        <h2 className="text-lg font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${channel.name}</h2>
        <span className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>· ${community.name}</span>
      </div>
      ${community.is_member ? html`<${PostComposer} onSuccess=${refresh} communityId=${community.id} channelId=${channel.id} />` : null}
      ${loading ? html`
        <div className="py-12 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      ` : items.length === 0 ? html`
        <${EmptyState}
          title="No posts in this channel yet"
          description="Be the first to start the discussion."
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

export default ChannelFeed;
