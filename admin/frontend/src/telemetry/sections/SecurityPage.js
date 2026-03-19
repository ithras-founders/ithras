/**
 * Authentication & Security - Login, MFA, rate limits.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryKpiCard from '../components/TelemetryKpiCard.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryEventStream from '../components/TelemetryEventStream.js';
import TelemetryDetailDrawer from '../components/TelemetryDetailDrawer.js';
import CopyableId from '../components/CopyableId.js';
import TelemetryJsonBlock from '../components/TelemetryJsonBlock.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getSecurityEvents } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const SECURITY_COLUMNS = [
  { key: 'eventType', label: 'Event type' },
  { key: 'actorId', label: 'Actor' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'success', label: 'Success', render: (r) => r.success != null ? (r.success ? 'Yes' : 'No') : '—' },
];

const SecurityPage = () => {
  const [data, setData] = useState({ items: [], total: 0, kpis: {} });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getSecurityEvents({}).then(setData);
  }, []);

  const kpis = data.kpis || {};

  return html`
    <${TelemetryLayout} activeSection="security" title="Authentication & Security">
      <div className="space-y-6">
        <section>
          <h2 className="text-base font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>Security overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <${TelemetryKpiCard} label="Login success" value=${kpis.loginSuccess ?? '—'} />
            <${TelemetryKpiCard} label="Login failures" value=${kpis.loginFailures ?? '—'} />
            <${TelemetryKpiCard} label="MFA events" value=${kpis.mfaEvents ?? '—'} />
            <${TelemetryKpiCard} label="Rate limit hits" value=${kpis.rateLimitHits ?? '—'} />
          </div>
        </section>

        <${SectionCard} title="Security events">
          <${TelemetryTable}
            columns=${SECURITY_COLUMNS}
            items=${data.items}
            emptyStateSection="security"
            onRowClick=${setSelected}
          />
        </${SectionCard}>

        <${TelemetryDetailDrawer}
          title=${selected ? `Security: ${selected.eventType || selected.id}` : 'Details'}
          open=${!!selected}
          onClose=${() => setSelected(null)}
        >
          ${selected ? html`
            <div className="space-y-4">
              ${selected.id ? html`<${CopyableId} id=${selected.id} label="Event ID" />` : null}
              ${selected.actorId ? html`<${CopyableId} id=${selected.actorId} label="Actor ID" />` : null}
              <${TelemetryJsonBlock} data=${selected} title="Full payload" defaultCollapsed=${true} />
            </div>
          ` : null}
        </${TelemetryDetailDrawer}>

        <${SectionCard} title="Suspicious activity">
          <${TelemetryEventStream}
            items=${[]}
            emptyStateSection="security"
            emptyStateHint="Suspicious activity will appear here."
          />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default SecurityPage;
