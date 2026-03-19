/**
 * OverviewPage - Network overview with stat cards.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import NetworkOverviewCards from '../components/NetworkOverviewCards.js';
import { getOverview } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const OverviewPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOverview()
      .then(setStats)
      .catch(() => setStats({
        connections_count: 0,
        following_count: 0,
        same_org_count: 0,
        same_institution_count: 0,
        same_function_count: 0,
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return html`
      <div className="p-8">
        <div className="h-8 w-48 rounded bg-[var(--app-surface-subtle)] animate-pulse" />
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          ${[1, 2, 3, 4, 5].map((i) => html`
            <div key=${i} className="h-24 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />
          `)}
        </div>
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Network Overview</h1>
      <${NetworkOverviewCards} stats=${stats} />
    </div>
  `;
};

export default OverviewPage;
