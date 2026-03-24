/**
 * GlobalFeed - Feed from joined communities.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getGlobalFeed } from '../services/feedApi.js';
import PostComposer from '../components/PostComposer.js';
import PremiumPostCard from '../components/PremiumPostCard.js';
import EmptyState from '../components/EmptyState.js';
import Card from '/shared/components/ui/Card.js';
import Skeleton from '/shared/components/ui/Skeleton.js';

const html = htm.bind(React.createElement);

const FeedLoadingSkeleton = () => html`
  <${Card} padding="lg" elevated=${false} className="space-y-5">
    ${[1, 2, 3].map(
      (i) => html`
        <div key=${i} className="space-y-3">
          <div className="flex gap-3">
            <${Skeleton} height=${44} width=${44} rounded="var(--radius-lg)" />
            <div className="flex-1 space-y-2 pt-1">
              <${Skeleton} height=${14} width="45%" />
              <${Skeleton} height=${12} width="30%" />
            </div>
          </div>
          <${Skeleton} height=${72} width="100%" rounded="var(--radius-md)" />
          <${Skeleton} height=${12} width="85%" />
        </div>
      `,
    )}
  </${Card}>
`;

const GlobalFeed = ({ user }) => {
  const [items, setItems] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = () => {
    setLoading(true);
    getGlobalFeed({ limit: 30 })
      .then((r) => {
        const fetched = r.items || [];
        setItems(fetched);
        setSavedIds(new Set(fetched.filter((p) => p.is_saved).map((p) => p.id)));
      })
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
    <div className="min-h-[60vh]">
      <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
        <div className="px-1">
          <h1 className="text-lg font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>Updates</h1>
          <p className="text-sm mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>
            Posts from communities you’ve joined. Use Discover to browse or join new spaces.
          </p>
        </div>
        <${PostComposer} user=${user} onSuccess=${refresh} />
        ${loading ? html`<${FeedLoadingSkeleton} />` : items.length === 0 ? html`
          <${EmptyState}
            title="No posts yet"
            description="Join communities to build your feed. When you join, posts from those communities will appear here."
            ctaLabel="Discover communities"
            onCta=${() => { window.history.pushState(null, '', '/feed/discover'); window.dispatchEvent(new CustomEvent('ithras:path-changed')); }}
          />
        ` : html`
          <div className="space-y-4">
            ${items.map((post) => html`
              <${PremiumPostCard}
                key=${post.id}
                post=${post}
                onRefresh=${refresh}
                user=${user}
                isSaved=${savedIds.has(post.id)}
                onSaveChange=${(v) => setSavedIds((s) => { const n = new Set(s); v ? n.add(post.id) : n.delete(post.id); return n; })}
              />
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default GlobalFeed;
