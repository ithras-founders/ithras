/**
 * Entity Change History - Entity mutations and change tracking.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryDetailDrawer from '../components/TelemetryDetailDrawer.js';
import CopyableId from '../components/CopyableId.js';
import TelemetryJsonBlock from '../components/TelemetryJsonBlock.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getEntityChangeHistory } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'type', label: 'Change type' },
  { key: 'actorId', label: 'Actor' },
  { key: 'entityType', label: 'Entity type' },
  { key: 'entityId', label: 'Entity ID' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
];

const EntityChangeHistoryPage = () => {
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getEntityChangeHistory({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="entity-history" title="Entity Change History">
      <${SectionCard} title="Entity changes">
        <${TelemetryTable}
          columns=${COLUMNS}
          items=${data.items}
          emptyStateSection="entity-history"
          emptyStateHint="No entity changes found for this range."
          onRowClick=${setSelected}
        />
      </${SectionCard}>
      <${TelemetryDetailDrawer}
        title=${selected ? `Change: ${selected.type || selected.id}` : 'Details'}
        open=${!!selected}
        onClose=${() => setSelected(null)}
      >
        ${selected ? html`
          <div className="space-y-4">
            ${selected.entityId ? html`<${CopyableId} id=${selected.entityId} label="Entity ID" />` : null}
            <${TelemetryJsonBlock} data=${selected} title="Full payload" defaultCollapsed=${true} />
          </div>
        ` : null}
      </${TelemetryDetailDrawer}>
    </${TelemetryLayout}>
  `;
};

export default EntityChangeHistoryPage;
