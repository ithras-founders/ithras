/**
 * Audit Logs - Admin and audit actions.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryDetailDrawer from '../components/TelemetryDetailDrawer.js';
import CopyableId from '../components/CopyableId.js';
import TelemetryJsonBlock from '../components/TelemetryJsonBlock.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getAuditLogs } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'type', label: 'Action' },
  { key: 'actorId', label: 'Actor' },
  { key: 'entityType', label: 'Entity type' },
  { key: 'entityId', label: 'Entity ID' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'status', label: 'Status' },
];

const AuditLogsPage = () => {
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getAuditLogs({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="audit" title="Audit Logs">
      <${SectionCard} title="Audit events">
        <${TelemetryTable}
          columns=${COLUMNS}
          items=${data.items}
          emptyStateSection="audit"
          emptyStateHint="No audit logs found for this range."
          onRowClick=${setSelected}
        />
      </${SectionCard}>
      <${TelemetryDetailDrawer}
        title=${selected ? `Audit: ${selected.type || selected.id}` : 'Details'}
        open=${!!selected}
        onClose=${() => setSelected(null)}
      >
        ${selected ? html`
          <div className="space-y-4">
            ${selected.actorId ? html`<${CopyableId} id=${selected.actorId} label="Actor ID" />` : null}
            ${selected.entityId ? html`<${CopyableId} id=${selected.entityId} label="Entity ID" />` : null}
            <${TelemetryJsonBlock} data=${selected} title="Full payload" defaultCollapsed=${true} />
          </div>
        ` : null}
      </${TelemetryDetailDrawer}>
    </${TelemetryLayout}>
  `;
};

export default AuditLogsPage;
