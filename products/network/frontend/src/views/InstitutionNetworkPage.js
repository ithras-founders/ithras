/**
 * InstitutionNetworkPage - People grouped by institution + major + year.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import { getInstitutionNetwork } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const InstitutionNetworkPage = () => {
  const [groups, setGroups] = useState([]);
  const [profileHasData, setProfileHasData] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInstitutionNetwork()
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
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Institution Network</h1>
        <${EmptyState}
          title=${profileHasData ? "No one from your institutions yet" : "Add your education to see people from your institutions"}
          description=${profileHasData ? "No classmates or alumni from your institutions in the network yet. Check back as more people join." : "When you add your institution and major, we'll show you classmates and alumni."}
          ctaLabel=${profileHasData ? null : "Complete profile"}
          onCta=${profileHasData ? null : goToProfile}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Institution Network</h1>
      <div className="space-y-8">
        ${groups.map((g, idx) => html`
          <div key=${g.institution_id || idx}>
            <h2 className="text-lg font-medium mb-3" style=${{ color: 'var(--app-text-secondary)' }}>
              ${g.institution_name}
              ${g.major ? html`<span className="ml-2" style=${{ color: 'var(--app-text-muted)' }}>· ${g.major}</span>` : null}
              ${g.graduation_year ? html`<span className="ml-2" style=${{ color: 'var(--app-text-muted)' }}>· Class of ${g.graduation_year}</span>` : null}
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

export default InstitutionNetworkPage;
