/**
 * FollowingPage - List of users the current user follows.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import ConnectionButton from '../components/ConnectionButton.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import { getFollows, unfollowUser } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const FollowingPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    getFollows()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]));
  };

  useEffect(() => {
    getFollows()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const handleUnfollow = (followId) => {
    unfollowUser(followId).then(refresh);
  };

  const goToSuggestions = () => {
    window.history.pushState(null, '', '/network/suggestions');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  if (loading) {
    return html`
      <div className="p-8">
        <div className="h-8 w-48 rounded bg-[var(--app-surface-subtle)] animate-pulse" />
        <div className="mt-6 space-y-4">
          ${[1, 2, 3].map((i) => html`
            <div key=${i} className="h-24 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />
          `)}
        </div>
      </div>
    `;
  }

  if (items.length === 0) {
    return html`
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Following</h1>
        <${EmptyState}
          title="Follow people to start building your network"
          description="Following lets you stay updated with people you're interested in."
          ctaLabel="Discover people"
          onCta=${goToSuggestions}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Following</h1>
      <div className="space-y-4">
        ${items.map((f) => html`
          <${UserCard}
            key=${f.id}
            user=${f.following}
            actions=${html`
              <button
                type="button"
                onClick=${() => handleUnfollow(f.id)}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border"
                style=${{ borderColor: 'var(--app-border-strong)', color: 'var(--app-text-secondary)' }}
              >
                Unfollow
              </button>
              <a
                href="/network/suggestions"
                onClick=${(e) => { e.preventDefault(); window.history.pushState(null, '', '/network/suggestions'); window.dispatchEvent(new CustomEvent('ithras:path-changed')); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium"
                style=${{ background: 'var(--app-accent)', color: 'white' }}
              >
                Connect
              </a>
            `}
          />
        `)}
      </div>
    </div>
  `;
};

export default FollowingPage;
