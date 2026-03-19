/**
 * SavedFeed - User's saved posts.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getSavedFeed } from '../services/feedApi.js';
import PostCard from '../components/PostCard.js';
import EmptyState from '../components/EmptyState.js';

const html = htm.bind(React.createElement);

const SavedFeed = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () => {
    setLoading(true);
    getSavedFeed({ limit: 30 })
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
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Saved</h1>
      ${loading ? html`
        <div className="py-12 text-center text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      ` : items.length === 0 ? html`
        <${EmptyState}
          title="No saved posts"
          description="Posts you save will appear here."
        />
      ` : html`
        <div className="space-y-4">
          ${items.map((post) => html`
            <${PostCard} key=${post.id} post=${post} onRefresh=${refresh} isSaved=${true} />
          `)}
        </div>
      `}
    </div>
  `;
};

export default SavedFeed;
