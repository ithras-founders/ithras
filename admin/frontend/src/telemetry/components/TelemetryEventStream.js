/**
 * TelemetryEventStream - Stream of recent events.
 */
import React from 'react';
import htm from 'htm';
import TelemetryEmptyState from './TelemetryEmptyState.js';

const html = htm.bind(React.createElement);

const TelemetryEventStream = ({
  items = [],
  emptyStateSection = 'activity',
  emptyStateHint,
}) => {
  if (!items || items.length === 0) {
    return html`
      <${TelemetryEmptyState} section=${emptyStateSection} filtersHint=${emptyStateHint} />
    `;
  }

  return html`
    <div className="space-y-2">
      ${items.map((item, i) => html`
        <div
          key=${item.id ?? i}
          className="text-sm py-2 px-3 rounded border"
          style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
        >
          <span className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>${item.type ?? item.domain ?? 'Event'}</span>
          ${item.timestamp ? html` · ${new Date(item.timestamp).toLocaleString()}` : null}
          ${item.actorId ? html` · Actor: ${item.actorId}` : null}
        </div>
      `)}
    </div>
  `;
};

export default TelemetryEventStream;
