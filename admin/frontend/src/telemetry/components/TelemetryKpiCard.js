/**
 * TelemetryKpiCard - Displays a KPI label and value.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TelemetryKpiCard = ({ label, value }) => html`
  <div className="rounded-lg border border-[var(--app-border-soft)] p-4 bg-white">
    <p className="text-sm font-medium mb-1" style=${{ color: 'var(--app-text-muted)' }}>${label}</p>
    <p className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${value ?? '—'}</p>
  </div>
`;

export default TelemetryKpiCard;
