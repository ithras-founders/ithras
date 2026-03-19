/**
 * Jobs / Integrations / Webhooks - Background jobs and webhook deliveries.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TelemetryLayout from '../TelemetryLayout.js';
import TelemetryKpiCard from '../components/TelemetryKpiCard.js';
import TelemetryTable from '../components/TelemetryTable.js';
import SectionCard from '/admin/frontend/src/institution/components/SectionCard.js';
import { getJobs, getWebhookDeliveries } from '../services/telemetryApi.js';

const html = htm.bind(React.createElement);

const JOB_COLUMNS = [
  { key: 'jobType', label: 'Job type' },
  { key: 'status', label: 'Status' },
  {
    key: 'timestamp',
    label: 'Run time',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
  { key: 'durationMs', label: 'Duration (ms)', render: (r) => r.durationMs ?? '—' },
];

const WEBHOOK_COLUMNS = [
  { key: 'url', label: 'URL' },
  { key: 'statusCode', label: 'Status' },
  {
    key: 'timestamp',
    label: 'Delivered',
    render: (r) => r.timestamp ? new Date(r.timestamp).toLocaleString() : '—',
  },
];

const JobsPage = () => {
  const [jobs, setJobs] = useState({ items: [], total: 0 });
  const [webhooks, setWebhooks] = useState({ items: [], total: 0 });

  useEffect(() => {
    getJobs({}).then(setJobs);
    getWebhookDeliveries({}).then(setWebhooks);
  }, []);

  return html`
    <${TelemetryLayout} activeSection="jobs" title="Jobs / Integrations / Webhooks" filterProps=${{ showStatus: true }}>
      <div className="space-y-6">
        <section>
          <h2 className="text-base font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <${TelemetryKpiCard} label="Job runs" value=${jobs.total ?? 0} />
            <${TelemetryKpiCard} label="Webhook deliveries" value=${webhooks.total ?? 0} />
          </div>
        </section>

        <${SectionCard} title="Job runs">
          <${TelemetryTable}
            columns=${JOB_COLUMNS}
            items=${jobs.items}
            emptyStateSection="jobs"
          />
        </${SectionCard}>

        <${SectionCard} title="Webhook deliveries">
          <${TelemetryTable}
            columns=${WEBHOOK_COLUMNS}
            items=${webhooks.items}
            emptyStateSection="jobs"
          />
        </${SectionCard}>
      </div>
    </${TelemetryLayout}>
  `;
};

export default JobsPage;
