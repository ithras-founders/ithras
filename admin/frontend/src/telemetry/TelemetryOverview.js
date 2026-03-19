/**
 * Telemetry Overview - Dashboard with KPIs, health, anomalies, and activity.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from './TelemetryLayout.js';
import TelemetryKpiCard from './components/TelemetryKpiCard.js';
import TelemetryDateRangePicker from './components/TelemetryDateRangePicker.js';
import TelemetryEventStream from './components/TelemetryEventStream.js';
import TelemetryEmptyState from './components/TelemetryEmptyState.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getOverviewKpis } from './services/telemetryApi.js';

const html = htm.bind(React.createElement);

const KPI_LABELS = [
  { key: 'apiRequests', label: 'API Requests' },
  { key: 'errorRate', label: 'Error Rate' },
  { key: 'activeUsers', label: 'Active Users' },
  { key: 'adminActions', label: 'Admin Actions' },
  { key: 'authFailures', label: 'Auth Failures' },
  { key: 'messages', label: 'Messages' },
  { key: 'posts', label: 'Posts' },
  { key: 'communityJoins', label: 'Community Joins' },
  { key: 'connections', label: 'Connections' },
  { key: 'search', label: 'Search' },
  { key: 'moderation', label: 'Moderation' },
];

const HEALTH_ITEMS = [
  { key: 'api', label: 'API Health' },
  { key: 'jobs', label: 'Jobs' },
  { key: 'webhooks', label: 'Webhooks' },
  { key: 'auth', label: 'Auth' },
  { key: 'messaging', label: 'Messaging' },
];

const TelemetryOverview = () => {
  const [data, setData] = useState({ kpis: {}, health: {} });
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ preset: '24h' });

  useEffect(() => {
    const params = {};
    if (range.from) params.from = range.from;
    if (range.to) params.to = range.to;
    getOverviewKpis(params).then((res) => {
      setData(res);
      setLoading(false);
    });
  }, [range.from, range.to]);

  const handleRangeChange = (newRange) => {
    setLoading(true);
    setRange(newRange);
  };

  const kpis = data.kpis || {};
  const health = data.health || {};

  return html`
    <${TelemetryLayout} activeSection="overview" title="Technology Overview">
      <div className="space-y-6">
        <section className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Key metrics</h2>
          <${TelemetryDateRangePicker} range=${range} onChange=${handleRangeChange} />
        </section>
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            ${KPI_LABELS.map(({ key, label }) => html`
              <${TelemetryKpiCard}
                key=${key}
                label=${label}
                value=${kpis[key] ?? '—'}
              />
            `)}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>Health</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            ${HEALTH_ITEMS.map(({ key, label }) => html`
              <${TelemetryKpiCard}
                key=${key}
                label=${label}
                value=${health[key] ?? '—'}
              />
            `)}
          </div>
        </section>

        <${SectionCard} title="Recent anomalies">
          <${TelemetryEmptyState} section="overview" filtersHint="Anomalies will appear when detected." />
        </${SectionCard}>

        <${SectionCard} title="Recent activity stream">
          <${TelemetryEventStream}
            items=${[]}
            emptyStateSection="activity"
            emptyStateHint="Try adjusting your time range or filters."
          />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default TelemetryOverview;
