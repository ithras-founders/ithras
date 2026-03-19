/**
 * API Telemetry - Endpoint metrics and request logs.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryDetailDrawer from '../components/TelemetryDetailDrawer.js';
import CopyableId from '../components/CopyableId.js';
import TelemetryJsonBlock from '../components/TelemetryJsonBlock.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getApiTelemetry } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'endpoint', label: 'Endpoint' },
  { key: 'method', label: 'Method' },
  { key: 'requestCount', label: 'Requests' },
  { key: 'successRate', label: 'Success %' },
  { key: 'errorRate', label: 'Error %' },
  { key: 'avgLatencyMs', label: 'Avg latency' },
  { key: 'p95LatencyMs', label: 'p95' },
  {
    key: 'lastSeen',
    label: 'Last seen',
    render: (r) => r.lastSeen ? new Date(r.lastSeen).toLocaleString() : '—',
  },
];

const ApiTelemetryPage = () => {
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getApiTelemetry({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="api" title="API Telemetry" filterProps=${{ showDomain: false }}>
      <${SectionCard} title="API endpoints">
        <${TelemetryTable}
          columns=${COLUMNS}
          items=${data.items}
          emptyStateSection="api"
          emptyStateHint="No API requests found for this range."
          onRowClick=${setSelected}
        />
      </${SectionCard}>
      <${TelemetryDetailDrawer}
        title=${selected ? `Endpoint: ${selected.endpoint || selected.id}` : 'Details'}
        open=${!!selected}
        onClose=${() => setSelected(null)}
      >
        ${selected ? html`
          <div className="space-y-4">
            ${selected.requestId ? html`<${CopyableId} id=${selected.requestId} label="Request ID" />` : null}
            ${selected.traceId ? html`<${CopyableId} id=${selected.traceId} label="Trace ID" />` : null}
            <${TelemetryJsonBlock} data=${selected} title="Full payload" defaultCollapsed=${true} />
          </div>
        ` : null}
      </${TelemetryDetailDrawer}>
    </${TelemetryLayout}>
  `;
};

export default ApiTelemetryPage;
