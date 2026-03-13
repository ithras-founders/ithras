import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TableField = ({ field, value, onChange, error }) => {
  const columns = field.columns || [{ id: 'col1', label: 'Column 1', type: 'text' }];
  const repeatableRows = field.repeatableRows !== false;
  const rows = Array.isArray(value) ? value : (value && typeof value === 'object' ? [value] : [{}]);

  const updateCell = (rowIndex, colId, val) => {
    const newRows = [...rows];
    if (!newRows[rowIndex]) newRows[rowIndex] = {};
    newRows[rowIndex][colId] = val;
    onChange(repeatableRows ? newRows : newRows[0] || {});
  };

  const addRow = () => {
    onChange([...rows, {}]);
  };

  const removeRow = (index) => {
    if (rows.length <= 1) return;
    const newRows = rows.filter((_, i) => i !== index);
    onChange(newRows);
  };

  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        ${field.label}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y divide-[var(--app-border-soft)]">
          <thead className="bg-[var(--app-surface-muted)]">
            <tr>
              ${columns.map(col => html`
                <th key=${col.id} className="px-3 py-2 text-left text-xs font-medium text-[var(--app-text-secondary)] uppercase">
                  ${col.label}
                </th>
              `)}
              ${repeatableRows ? html`<th className="px-3 py-2 w-16"></th>` : ''}
            </tr>
          </thead>
          <tbody className="bg-[var(--app-surface)] divide-y divide-[var(--app-border-soft)]">
            ${rows.map((row, rowIndex) => html`
              <tr key=${rowIndex}>
                ${columns.map(col => html`
                  <td key=${col.id} className="px-3 py-2">
                    <input
                      type="text"
                      value=${row[col.id] || ''}
                      onChange=${e => updateCell(rowIndex, col.id, e.target.value)}
                      className="w-full px-2 py-1 border rounded text-sm"
                      placeholder=${col.label}
                    />
                  </td>
                `)}
                ${repeatableRows ? html`
                  <td className="px-2 py-1">
                    <button
                      onClick=${() => removeRow(rowIndex)}
                      disabled=${rows.length <= 1}
                      className="px-2 py-1 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.08)] rounded disabled:opacity-50"
                    >
                      ×
                    </button>
                  </td>
                ` : ''}
              </tr>
            `)}
          </tbody>
        </table>
      </div>
      ${repeatableRows ? html`
        <button
          onClick=${addRow}
          className="mt-2 px-3 py-1 bg-[var(--app-success)] text-white rounded text-sm hover:bg-[var(--app-accent-hover)]"
        >
          + Add Row
        </button>
      ` : ''}
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default TableField;
