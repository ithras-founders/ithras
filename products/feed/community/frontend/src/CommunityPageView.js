import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getPrepCommunity,
  joinPrepCommunity,
  leavePrepCommunity,
} from '/core/frontend/src/modules/shared/services/api/preparation.js';
import FeedCommunitiesView from './FeedCommunitiesView.js';

const html = htm.bind(React.createElement);

const CommunityPageView = ({ user, communityCode, navigate, onJoinLeave }) => {
  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCommunity = useCallback(async () => {
    if (!communityCode) return;
    setLoading(true);
    try {
      const data = await getPrepCommunity(communityCode);
      setCommunity(data);
      setError(null);
    } catch (e) {
      setError(e.message || 'Failed to load community');
      setCommunity(null);
    } finally {
      setLoading(false);
    }
  }, [communityCode]);

  useEffect(() => {
    loadCommunity();
  }, [loadCommunity]);

  const handleJoin = async () => {
    try {
      await joinPrepCommunity(community.id || community.code);
      loadCommunity();
      onJoinLeave?.();
    } catch (_) {}
  };

  const handleLeave = async () => {
    try {
      await leavePrepCommunity(community.id || community.code);
      loadCommunity();
      onJoinLeave?.();
    } catch (_) {}
  };

  if (loading) return html`<div className="py-12"><div className="h-8 bg-[var(--app-surface-muted)] rounded animate-pulse w-48" /><div className="mt-4 h-4 bg-[var(--app-surface-muted)] rounded animate-pulse w-96" /></div>`;
  if (error || !community) return html`<p className="text-[var(--app-text-muted)] py-8">${error || 'Community not found.'}</p>`;

  const cover = community.cover_image_url;

  return html`
    <div className="space-y-6">
      <div className="relative -mx-4 sm:-mx-6 -mt-2 rounded-2xl overflow-hidden">
        <div
          className="h-40 sm:h-48 w-full bg-gradient-to-br from-[var(--app-accent-soft)] via-[var(--app-accent)]/20 to-[var(--app-accent-soft)] flex items-end"
          style=${cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="relative w-full p-6 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold">${community.name}</h1>
            ${community.description ? html`<p className="mt-1 text-white/90 text-sm max-w-2xl">${community.description}</p>` : null}
            <div className="mt-3 flex items-center gap-4">
              ${community.member_count != null ? html`<span className="text-sm text-white/80">${community.member_count} members</span>` : null}
              ${user ? html`
                ${community.is_joined
                  ? html`<button onClick=${handleLeave} className="text-sm font-medium px-4 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Leave</button>`
                  : html`<button onClick=${handleJoin} className="text-sm font-medium px-4 py-1.5 rounded-lg bg-white text-[var(--app-accent)] hover:bg-white/90 transition-colors">Join</button>`}
              ` : null}
            </div>
          </div>
        </div>
      </div>

      <${FeedCommunitiesView}
        user=${user}
        view=${`feed/community/${communityCode || ''}`}
        navigate=${navigate}
      />
    </div>
  `;
};

export default CommunityPageView;
