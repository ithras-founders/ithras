/**
 * TelemetryJsonBlock - Collapsible JSON payload display.
 */
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TelemetryJsonBlock = ({ data, title = 'Payload', defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const jsonStr = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data ?? '');

  return html`
    <div>
      <button
        type="button"
        onClick=${() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-sm font-medium mb-2"
        style=${{ color: 'var(--app-text-primary)' }}
      >
        ${collapsed ? '▶' : '▼'} ${title}
      </button>
      ${!collapsed ? html`
        <pre className="text-xs p-3 rounded overflow-x-auto" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}>
          ${jsonStr}
        </pre>
      ` : null}
    </div>
  `;
};

export default TelemetryJsonBlock;
