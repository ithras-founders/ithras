/**
 * Communities / Feed / Messaging - Social telemetry.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryKpiCard from '../components/TelemetryKpiCard.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryEmptyState from '../components/TelemetryEmptyState.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getSocialTelemetry } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const SocialTelemetryPage = () => {
  const [data, setData] = useState({ items: [], total: 0, summary: {} });

  useEffect(() => {
    getSocialTelemetry({}).then(setData);
  }, []);

  const summary = data.summary || {};

  return html`
    <${TelemetryLayout} activeSection="social" title="Communities / Feed / Messaging" filterProps=${{ showDomain: true }}>
      <div className="space-y-6">
        <section>
          <h2 className="text-base font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <${TelemetryKpiCard} label="Communities" value=${summary.communities ?? '—'} />
            <${TelemetryKpiCard} label="Feed posts" value=${summary.feedPosts ?? '—'} />
            <${TelemetryKpiCard} label="Messages" value=${summary.messages ?? '—'} />
          </div>
        </section>

        <${SectionCard} title="Communities">
          <${TelemetryEmptyState} section="social" />
        </${SectionCard}>

        <${SectionCard} title="Feed">
          <${TelemetryEmptyState} section="social" />
        </${SectionCard}>

        <${SectionCard} title="Messaging">
          <${TelemetryEmptyState} section="social" />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default SocialTelemetryPage;
