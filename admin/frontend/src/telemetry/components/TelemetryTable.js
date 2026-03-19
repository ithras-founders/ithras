/**
 * TelemetryTable - Table with configurable columns and empty state.
 */
import React from 'react';
import htm from 'htm';
import TelemetryEmptyState from './TelemetryEmptyState.js';

const html = htm.bind(React.createElement);

const TelemetryTable = ({
  columns = [],
  items = [],
  emptyStateSection = 'data',
  emptyStateHint,
  onRowClick,
}) => {
  if (!items || items.length === 0) {
    return html`
      <${TelemetryEmptyState} section=${emptyStateSection} filtersHint=${emptyStateHint} />
    `;
  }

  const getCell = (row, col) => {
    const val = row[col.key];
    if (col.render) return col.render(row);
    return val ?? '—';
  };

  return html`
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr>
            ${columns.map((col) => html`
              <th key=${col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>
                ${col.label}
              </th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${items.map((row, i) => html`
            <tr
              key=${row.id ?? i}
              className=${onRowClick ? 'cursor-pointer hover:bg-[var(--app-surface-subtle)]' : ''}
              onClick=${onRowClick ? () => onRowClick(row) : undefined}
            >
              ${columns.map((col) => html`
                <td key=${col.key} className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>
                  ${getCell(row, col)}
                </td>
              `)}
            </tr>
          `)}
        </tbody>
      </table>
    </div>
  `;
};

export default TelemetryTable;
