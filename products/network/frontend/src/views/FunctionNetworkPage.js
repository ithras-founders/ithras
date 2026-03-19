/**
 * FunctionNetworkPage - People grouped by function.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import { getFunctionNetwork } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const FunctionNetworkPage = () => {
  const [groups, setGroups] = useState([]);
  const [profileHasData, setProfileHasData] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFunctionNetwork()
      .then((r) => {
        setGroups(r.groups || []);
        setProfileHasData(r.profile_has_data !== false);
      })
      .catch(() => { setGroups([]); setProfileHasData(true); })
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
        <div className="mt-6 space-y-6">
          ${[1, 2].map((i) => html`
            <div key=${i} className="h-32 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />
          `)}
        </div>
      </div>
    `;
  }

  if (groups.length === 0) {
    return html`
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Function Network</h1>
        <${EmptyState}
          title=${profileHasData ? "No one in your functions yet" : "Add your experience with roles to see people in similar functions"}
          description=${profileHasData ? "No one in your functions in the network yet. Check back as more people join." : "When you add roles with functions (e.g. Software Development, Product Management), we'll show you people in the same area."}
          ctaLabel=${profileHasData ? null : "Complete profile"}
          onCta=${profileHasData ? null : goToProfile}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Function Network</h1>
      <div className="space-y-8">
        ${groups.map((g, idx) => html`
          <div key=${g.function || idx}>
            <h2 className="text-lg font-medium mb-3" style=${{ color: 'var(--app-text-secondary)' }}>
              ${g.function}
              <span className="ml-2 text-sm font-normal" style=${{ color: 'var(--app-text-muted)' }}>${g.count} people</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              ${(g.people || []).map((u) => html`<${UserCard} key=${u.id} user=${u} compact=${true} />`)}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default FunctionNetworkPage;
