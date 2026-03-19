/**
 * Data Export / Compliance - Export history and retention.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryTable from '../components/TelemetryTable.js';
import TelemetryEmptyState from '../components/TelemetryEmptyState.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getComplianceExports } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const COLUMNS = [
  { key: 'exportType', label: 'Export type' },
  { key: 'actor', label: 'Requested by' },
  {
    key: 'timestamp',
    label: 'Timestamp',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'status', label: 'Status' },
];

const CompliancePage = () => {
  const [data, setData] = useState({ items: [], total: 0 });

  useEffect(() => {
    getComplianceExports({}).then(setData);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="compliance" title="Data Export / Compliance">
      <div className="space-y-6">
        <${SectionCard} title="Export history">
          <${TelemetryTable}
            columns=${COLUMNS}
            items=${data.items}
            emptyStateSection="compliance"
          />
        </${SectionCard}>

        <${SectionCard} title="Retention actions">
          <${TelemetryEmptyState} section="compliance" filtersHint="Retention actions will appear here." />
        </${SectionCard}>

        <${SectionCard} title="Sensitive action audit">
          <${TelemetryEmptyState} section="compliance" />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default CompliancePage;
