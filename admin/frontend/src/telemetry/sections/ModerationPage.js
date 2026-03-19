/**
 * Moderation - Moderation actions and flags.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryEmptyState from '../components/TelemetryEmptyState.js';
import TelemetryChartPlaceholder from '../components/TelemetryChartPlaceholder.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getModerationEvents } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'action', label: 'Action' },
  { key: 'actor', label: 'Actor' },
  { key: 'entityType', label: 'Entity' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'status', label: 'Status' },
];

const ModerationPage = () => {
  const [data, setData] = useState({ items: [], total: 0 });

  useEffect(() => {
    getModerationEvents({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="moderation" title="Moderation" filterProps=${{ showStatus: true }}>
      <div className="space-y-6">
        <section>
          <div className="grid grid-cols-2 gap-4">
            <${TelemetryChartPlaceholder} label="Volume over time" height=${96} />
            <${TelemetryChartPlaceholder} label="Unresolved flags" height=${96} />
          </div>
        </section>

        <${SectionCard} title="Moderation actions">
          <${TelemetryTable}
            columns=${COLUMNS}
            items=${data.items}
            emptyStateSection="moderation"
          />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default ModerationPage;
