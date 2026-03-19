/**
 * OrgNetworkPage - People grouped by organization.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import { getOrgNetwork } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const OrgNetworkPage = () => {
  const [groups, setGroups] = useState([]);
  const [profileHasData, setProfileHasData] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrgNetwork()
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
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Organization Network</h1>
        <${EmptyState}
          title=${profileHasData ? "No one from your organisations yet" : "Add your work experience to see people from your organisations"}
          description=${profileHasData ? "No colleagues or alumni from your organisations in the network yet. Check back as more people join." : "When you add organisations to your profile, we'll show you colleagues and alumni."}
          ctaLabel=${profileHasData ? null : "Complete profile"}
          onCta=${profileHasData ? null : goToProfile}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Organization Network</h1>
      <div className="space-y-8">
        ${groups.map((g) => html`
          <div key=${g.organisation_id}>
            <h2 className="text-lg font-medium mb-3" style=${{ color: 'var(--app-text-secondary)' }}>
              ${g.organisation_name}
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

export default OrgNetworkPage;
