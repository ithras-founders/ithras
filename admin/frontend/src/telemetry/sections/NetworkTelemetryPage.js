/**
 * Network Telemetry - Connections and network growth.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryKpiCard from '../components/TelemetryKpiCard.js';
import TelemetryChartPlaceholder from '../components/TelemetryChartPlaceholder.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getNetworkTelemetry } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const NetworkTelemetryPage = () => {
  const [data, setData] = useState({ items: [], total: 0, summary: {} });

  useEffect(() => {
    getNetworkTelemetry({}).then(setData);
  }, []);

  const summary = data.summary || {};

  return html`
    <${TelemetryLayout} activeSection="network" title="Network Telemetry">
      <div className="space-y-6">
        <section>
          <h2 className="text-base font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>Network metrics</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <${TelemetryKpiCard} label="Connections" value=${summary.connections ?? '—'} />
            <${TelemetryKpiCard} label="Follows" value=${summary.follows ?? '—'} />
            <${TelemetryKpiCard} label="Network growth" value=${summary.growth ?? '—'} />
          </div>
        </section>

        <${SectionCard} title="Connection trends">
          <${TelemetryChartPlaceholder} label="Connection / follow trends" height=${160} />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default NetworkTelemetryPage;
