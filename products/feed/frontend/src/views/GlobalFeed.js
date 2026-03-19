/**
 * GlobalFeed - Feed from joined communities.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getGlobalFeed } from '../services/feedApi.js';
import PostComposer from '../components/PostComposer.js';
import PostCard from '../components/PostCard.js';
import EmptyState from '../components/EmptyState.js';

const html = htm.bind(React.createElement);

const GlobalFeed = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () => {
    setLoading(true);
    getGlobalFeed({ limit: 30 })
      .then((r) => setItems(r.items || []))
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(refresh, []);

  if (error) {
    return html`
      <div className="p-8">
        <div className="p-4 rounded-xl text-sm" style=${{ background: 'var(--app-danger-soft)', color: 'var(--app-danger)' }}>${error}</div>
      </div>
    `;
  }

  return html`
    <div className="min-h-screen px-4 py-10" style=${{ background: '#f8fafc' }}>
      <div className="mx-auto max-w-4xl space-y-6">
        <${PostComposer} onSuccess=${refresh} />
      ${loading ? html`
        <div className="py-12 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      ` : items.length === 0 ? html`
        <${EmptyState}
          title="No posts yet"
          description="Join communities to build your feed. When you join, posts from those communities will appear here."
          ctaLabel="Discover communities"
          onCta=${() => { window.history.pushState(null, '', '/feed/discover'); window.dispatchEvent(new CustomEvent('ithras:path-changed')); }}
        />
      ` : html`
        <div className="space-y-4">
          ${items.map((post) => html`
            <${PostCard} key=${post.id} post=${post} onRefresh=${refresh} />
          `)}
        </div>
      `}
      </div>
    </div>
  `;
};

export default GlobalFeed;
