/**
 * SuggestionsPage - Suggested connections with overlap reasons.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import ConnectionButton from '../components/ConnectionButton.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import { getSuggestions } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const SuggestionsPage = () => {
  const [items, setItems] = useState([]);
  const [profileHasData, setProfileHasData] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    getSuggestions().then((r) => {
      setItems(r.items || []);
      setProfileHasData(r.profile_has_data !== false);
    });
  };

  useEffect(() => {
    getSuggestions()
      .then((r) => {
        setItems(r.items || []);
        setProfileHasData(r.profile_has_data !== false);
      })
      .catch(() => { setItems([]); setProfileHasData(true); })
      .finally(() => setLoading(false));
  }, []);

  const goToProfile = () => {
    window.history.pushState(null, '', '/p/');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  if (loading) {
    return html`
      <div className="p-8">
        <div className="h-8 w-48 rounded bg-[var(--app-surface-subtle)] animate-pulse" />
        <div className="mt-6 space-y-4">
          ${[1, 2, 3].map((i) => html`
            <div key=${i} className="h-32 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />
          `)}
        </div>
      </div>
    `;
  }

  if (items.length === 0) {
    return html`
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Suggested Connections</h1>
        <${EmptyState}
          title=${profileHasData ? "No suggestions right now" : "Add your institution and experience to discover people"}
          description=${profileHasData ? "You're all caught up. We'll suggest new connections as more people join with similar education or experience." : "We use your education and work history to suggest relevant connections."}
          ctaLabel=${profileHasData ? null : "Complete profile"}
          onCta=${profileHasData ? null : goToProfile}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Suggested Connections</h1>
      <div className="space-y-4">
        ${items.map((item, idx) => html`
          <${UserCard}
            key=${item?.user?.id ?? idx}
            user=${item.user}
            overlapBadges=${item.user?.overlap_reasons}
            mutualCount=${item.user?.mutual_connections_count}
            actions=${html`
              <${ConnectionButton}
                userId=${item.user?.id}
                connectionStatus=${null}
                isFollowing=${false}
                onConnectionSent=${refresh}
              />
            `}
          />
        `)}
      </div>
    </div>
  `;
};

export default SuggestionsPage;
