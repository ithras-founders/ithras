/**
 * User Activity - User actions and events.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryDetailDrawer from '../components/TelemetryDetailDrawer.js';
import TelemetryJsonBlock from '../components/TelemetryJsonBlock.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getUserActivity } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'type', label: 'Event type' },
  { key: 'actorId', label: 'Actor' },
  { key: 'entityType', label: 'Entity' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'status', label: 'Status' },
];

const UserActivityPage = () => {
  const [data, setData] = useState({ items: [], total: 0 });
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    getUserActivity({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="user-activity" title="User Activity">
      <${SectionCard} title="Activity events">
        <${TelemetryTable}
          columns=${COLUMNS}
          items=${data.items}
          emptyStateSection="user-activity"
          emptyStateHint="No user activity found for this range."
          onRowClick=${setSelected}
        />
      </${SectionCard}>
      <${TelemetryDetailDrawer}
        title=${selected ? `Event: ${selected.type || selected.id}` : 'Details'}
        open=${!!selected}
        onClose=${() => setSelected(null)}
      >
        ${selected ? html`
          <div className="space-y-4">
            <${TelemetryJsonBlock} data=${selected} title="Full payload" defaultCollapsed=${true} />
          </div>
        ` : null}
      </${TelemetryDetailDrawer}>
    </${TelemetryLayout}>
  `;
};

export default UserActivityPage;
