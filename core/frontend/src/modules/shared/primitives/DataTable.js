/**
 * Unified DataTable primitive - enterprise design system.
 * Scannable, light separators, muted headers, subtle hover.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const DataTable = ({
  columns = [],
  rows = [],
  onSort,
  sortBy,
  order = 'asc',
  onRowClick,
  dense = false,
  className = '',
  selectedRowId,
}) => {
  const cellPadding = dense ? 'px-[var(--app-space-3)] py-[var(--app-space-2)]' : 'px-[var(--app-space-4)] py-[var(--app-space-3)]';

  return html`
    <div className=${`overflow-hidden rounded-[var(--app-radius-2xl)] border border-[var(--app-border-soft)] custom-scrollbar ${className}`.trim()}>
      <table className="w-full border-collapse text-[var(--app-text-base)]">
        <thead>
          <tr className="border-b border-[var(--app-border-soft)] bg-[var(--app-surface-subtle)]">
            ${columns.map((col) => html`
              <th
                key=${col.key}
                className=${`${cellPadding} text-left text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--app-text-faint)] ${col.sortable && onSort ? 'cursor-pointer hover:text-[var(--app-text-secondary)] select-none' : ''}`}
                onClick=${col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  ${col.label}
                  ${col.sortable && sortBy === col.key ? (order === 'asc' ? ' ↑' : ' ↓') : ''}
                </span>
              </th>
            `)}
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, i) => {
            const rowId = row.id ?? row.table_name ?? i;
            const isSelected = selectedRowId != null && rowId === selectedRowId;
            const rowClass = `border-b border-[var(--border-soft)] ${onRowClick ? 'cursor-pointer hover:bg-[rgba(0,0,0,0.015)]' : ''} ${isSelected ? 'bg-[rgba(0,113,227,0.05)]' : ''} transition-colors`;
            return html`
            <tr
              key=${rowId}
              className=${rowClass}
              onClick=${onRowClick ? () => onRowClick(row) : undefined}
            >
              ${columns.map((col) => html`
                <td key=${col.key} className=${`${cellPadding} text-[var(--app-text-primary)]`}>
                  ${typeof col.render === 'function' ? col.render(row[col.key], row) : row[col.key]}
                </td>
              `)}
            </tr>
          `;
          })}
        </tbody>
      </table>
    </div>
  `;
};

export default DataTable;
