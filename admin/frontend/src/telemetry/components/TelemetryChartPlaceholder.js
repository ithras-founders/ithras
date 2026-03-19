/**
 * TelemetryChartPlaceholder - Placeholder for future chart.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TelemetryChartPlaceholder = ({ label = 'Chart', height = 160 }) => html`
  <div
    className="flex items-center justify-center rounded border border-dashed"
    style=${{ height: `${height}px`, borderColor: 'var(--app-border-soft)', color: 'var(--app-text-muted)', background: 'var(--app-surface-subtle)' }}
  >
    ${label}
  </div>
`;

export default TelemetryChartPlaceholder;
