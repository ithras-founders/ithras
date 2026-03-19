/**
 * Errors / Failures - Error tracking and clusters.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryKpiCard from '../components/TelemetryKpiCard.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryDetailDrawer from '../components/TelemetryDetailDrawer.js';
import CopyableId from '../components/CopyableId.js';
import TelemetryJsonBlock from '../components/TelemetryJsonBlock.js';
import TelemetryEmptyState from '../components/TelemetryEmptyState.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getErrors } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'message', label: 'Message' },
  { key: 'severity', label: 'Severity' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'count', label: 'Count', render: (r) => r.count ?? 1 },
];

const ErrorsPage = () => {
  const [data, setData] = useState({ items: [], total: 0, summary: {} });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getErrors({}).then(setData);
  }, []);

  const summary = data.summary || {};

  return html`
    <${TelemetryLayout} activeSection="errors" title="Errors / Failures" filterProps=${{ showSeverity: true }}>
      <div className="space-y-6">
        <section>
          <h2 className="text-base font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>Error summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <${TelemetryKpiCard} label="Total errors" value=${summary.total ?? 0} />
            <${TelemetryKpiCard} label="Critical" value=${summary.critical ?? 0} />
            <${TelemetryKpiCard} label="Clusters" value=${summary.clusters ?? 0} />
          </div>
        </section>

        <${SectionCard} title="Error table">
          <${TelemetryTable}
            columns=${COLUMNS}
            items=${data.items}
            emptyStateSection="errors"
            onRowClick=${setSelected}
          />
        </${SectionCard}>

        <${TelemetryDetailDrawer}
          title=${selected ? `Error: ${selected.message?.slice(0, 40) || selected.id}` : 'Details'}
          open=${!!selected}
          onClose=${() => setSelected(null)}
        >
          ${selected ? html`
            <div className="space-y-4">
              ${selected.id ? html`<${CopyableId} id=${selected.id} label="Error ID" />` : null}
              ${selected.stack ? html`
                <div>
                  <p className="text-sm font-medium mb-2" style=${{ color: 'var(--app-text-primary)' }}>Stack trace</p>
                  <pre className="text-xs p-3 rounded bg-[var(--app-surface-subtle)] overflow-x-auto" style=${{ color: 'var(--app-text-secondary)' }}>${selected.stack}</pre>
                </div>
              ` : null}
              <${TelemetryJsonBlock} data=${selected} title="Full payload" defaultCollapsed=${true} />
            </div>
          ` : null}
        </${TelemetryDetailDrawer}>

        <${SectionCard} title="Error clusters">
          <${TelemetryEmptyState} section="errors" filtersHint="Error clusters will appear here." />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default ErrorsPage;
