import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getNetworkFollowers,
  getNetworkFollowing,
  getNetworkConnections,
} from '/core/frontend/src/modules/shared/services/api.js';
import ProfileCard from '/core/frontend/src/modules/shared/components/ProfileCard.js';

const html = htm.bind(React.createElement);

const TAB_CONNECTIONS = 'connections';
const TAB_FOLLOWERS = 'followers';
const TAB_FOLLOWING = 'following';

const MyNetworkPage = ({ user, navigate }) => {
  const [tab, setTab] = useState(TAB_CONNECTIONS);
  const [connections, setConnections] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoadingTab(true);
    if (tab === TAB_CONNECTIONS) {
      getNetworkConnections({ limit: 100 })
        .then((res) => setConnections(res?.items || []))
        .catch(() => setConnections([]))
        .finally(() => { setLoading(false); setLoadingTab(false); });
    } else if (tab === TAB_FOLLOWERS) {
      getNetworkFollowers({ limit: 100 })
        .then((res) => setFollowers(res?.items || []))
        .catch(() => setFollowers([]))
        .finally(() => { setLoading(false); setLoadingTab(false); });
    } else {
      getNetworkFollowing({ limit: 100 })
        .then((res) => setFollowing(res?.items || []))
        .catch(() => setFollowing([]))
        .finally(() => { setLoading(false); setLoadingTab(false); });
    }
  }, [user?.id, tab]);

  const currentItems = tab === TAB_CONNECTIONS ? connections : tab === TAB_FOLLOWERS ? followers : following;

  const handleProfileClick = (p) => navigate(`profile/${p.id}`);

  const toProfile = (item) => ({
    id: item.id,
    name: item.name,
    email: item.email,
    profile_photo_url: item.profile_photo_url,
    headline: item.student_subtype || item.role || '',
  });

  if (!user) {
    return html`
      <div className="w-full max-w-3xl mx-auto px-4 py-8">
        <p className="text-[var(--app-text-muted)]">Please log in to view your network.</p>
      </div>
    `;
  }

  return html`
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex gap-2 border-b border-[var(--app-border-soft)] mb-6">
        <button
          onClick=${() => setTab(TAB_CONNECTIONS)}
          className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === TAB_CONNECTIONS ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] border-b-2 border-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}"
        >
          Connections
        </button>
        <button
          onClick=${() => setTab(TAB_FOLLOWERS)}
          className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === TAB_FOLLOWERS ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] border-b-2 border-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}"
        >
          Who added you
        </button>
        <button
          onClick=${() => setTab(TAB_FOLLOWING)}
          className="px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${tab === TAB_FOLLOWING ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)] border-b-2 border-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}"
        >
          Who you added
        </button>
      </div>

      ${loading || loadingTab
        ? html`
            <div className="space-y-3">
              ${[1, 2, 3, 4, 5].map((i) => html`
                <div key=${i} className="h-16 bg-[var(--app-surface-muted)] rounded-xl animate-pulse" />
              `)}
            </div>
          `
        : currentItems.length === 0
          ? html`
              <div className="py-16 text-center text-[var(--app-text-muted)]">
                ${tab === TAB_CONNECTIONS ? 'No mutual connections yet. Add people to your network and have them add you back.' : tab === TAB_FOLLOWERS ? 'No one has added you to their network yet.' : 'You haven\'t added anyone to your network yet.'}
              </div>
            `
          : html`
              <div className="space-y-3">
                ${currentItems.map((item) => {
                  const profile = toProfile(item);
                  return html`<${ProfileCard} key=${item.id} profile=${profile} viewer=${user} onClick=${() => handleProfileClick(item)} />`;
                })}
              </div>
            `}
    </div>
  `;
};

export default MyNetworkPage;
