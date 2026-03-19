/**
 * TelemetryFilterBar - Reusable filter row for telemetry views.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const DOMAIN_OPTIONS = [
  { value: '', label: 'All domains' },
  { value: 'api', label: 'API' },
  { value: 'user_activity', label: 'User Activity' },
  { value: 'audit', label: 'Audit' },
  { value: 'auth', label: 'Auth' },
  { value: 'community', label: 'Community' },
  { value: 'feed', label: 'Feed' },
  { value: 'messaging', label: 'Messaging' },
  { value: 'network', label: 'Network' },
  { value: 'entity', label: 'Entity' },
  { value: 'job', label: 'Job' },
  { value: 'error', label: 'Error' },
  { value: 'search', label: 'Search' },
  { value: 'moderation', label: 'Moderation' },
  { value: 'compliance', label: 'Compliance' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'pending', label: 'Pending' },
  { value: 'unknown', label: 'Unknown' },
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
];

const TelemetryFilterBar = ({
  filters = {},
  onChange,
  showDomain = true,
  showStatus = true,
  showSeverity = true,
  showActor = false,
  showEntity = false,
  showSearch = true,
  filterConfig = {},
}) => {
  const show = { showDomain, showStatus, showSeverity, showActor, showEntity, showSearch, ...filterConfig };
  const setFilter = (key, value) => onChange({ ...filters, [key]: value || null });

  return html`
    <div className="flex flex-wrap items-center gap-3">
      ${show.showDomain ? html`
        <select
          value=${filters.domain || ''}
          onChange=${(e) => setFilter('domain', e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        >
          ${DOMAIN_OPTIONS.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
        </select>
      ` : null}
      ${show.showStatus ? html`
        <select
          value=${filters.status || ''}
          onChange=${(e) => setFilter('status', e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        >
          ${STATUS_OPTIONS.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
        </select>
      ` : null}
      ${show.showSeverity ? html`
        <select
          value=${filters.severity || ''}
          onChange=${(e) => setFilter('severity', e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        >
          ${SEVERITY_OPTIONS.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
        </select>
      ` : null}
      ${show.showActor ? html`
        <input
          type="text"
          placeholder="Actor type..."
          value=${filters.actorType || ''}
          onChange=${(e) => setFilter('actorType', e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg min-w-[120px]"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        />
      ` : null}
      ${show.showEntity ? html`
        <input
          type="text"
          placeholder="Entity type..."
          value=${filters.entityType || ''}
          onChange=${(e) => setFilter('entityType', e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg min-w-[120px]"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        />
      ` : null}
      ${show.showSearch ? html`
        <input
          type="text"
          placeholder="Search..."
          value=${filters.search || ''}
          onChange=${(e) => setFilter('search', e.target.value)}
          className="px-3 py-2 text-sm border rounded-lg min-w-[180px]"
          style=${{ borderColor: 'var(--app-border-soft)' }}
        />
      ` : null}
    </div>
  `;
};

export default TelemetryFilterBar;
