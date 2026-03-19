/**
 * DiscoverPage - Discover and join communities.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { listCommunities, joinCommunity } from '../services/feedApi.js';
import DiscoverCommunityCard from '../components/DiscoverCommunityCard.js';
import FeedFilterBar from '../components/FeedFilterBar.js';
import EmptyState from '../components/EmptyState.js';

const html = htm.bind(React.createElement);

const DiscoverPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({});

  const refresh = () => {
    setLoading(true);
    listCommunities({ type: filter.type, search: filter.search, limit: 50 })
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, [filter.type, filter.search]);

  const handleJoin = async (communityId) => {
    try {
      await joinCommunity(communityId);
      refresh();
    } catch (_) {}
  };

  if (error) {
    return html`
      <div className="p-8">
        <div className="p-4 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      </div>
    `;
  }

  return html`
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Discover communities</h1>
      <${FeedFilterBar} filter=${filter} onFilterChange=${setFilter} />
      ${loading ? html`
        <div className="py-12 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      ` : items.length === 0 ? html`
        <${EmptyState}
          title="No communities match your search"
          description="Try adjusting your filters or search."
        />
      ` : html`
        <div className="grid gap-4 sm:grid-cols-1">
          ${items.map((c) => html`
            <${DiscoverCommunityCard} key=${c.id} community=${c} onJoin=${() => handleJoin(c.id)} />
          `)}
        </div>
      `}
    </div>
  `;
};

export default DiscoverPage;
