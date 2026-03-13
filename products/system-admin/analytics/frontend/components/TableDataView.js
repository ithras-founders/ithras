import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { executeAnalyticsQuery } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import { safeCellDisplay } from '../utils/cellDisplay.js';

const html = htm.bind(React.createElement);

const LIMIT = 500;

function sqlQuote(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'number' && !isNaN(v)) return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

const TableDataView = ({ tableName, tableDetail, writeMode, onClose }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRowIdx, setSelectedRowIdx] = useState(null);
  const [showInsertForm, setShowInsertForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [insertValues, setInsertValues] = useState({});
  const [editValues, setEditValues] = useState({});

  const columns = tableDetail?.columns || [];
  const pkColumns = tableDetail?.primary_key_columns || [];
  const hasPk = pkColumns.length > 0;

  const fetchData = async () => {
    if (!tableName) return;
    setLoading(true);
    setError(null);
    try {
      const result = await executeAnalyticsQuery({
        query: `SELECT * FROM ${tableName} LIMIT ${LIMIT}`,
        params: [],
        read_only: true,
      });
      setData(result);
      setSelectedRowIdx(null);
    } catch (err) {
      setError(err.message || 'Failed to load table');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [tableName]);

  const selectedRow = selectedRowIdx != null && data?.rows?.[selectedRowIdx]
    ? data.rows[selectedRowIdx]
    : null;

  const getRowByCol = (row, colName) => {
    const idx = data?.columns?.indexOf(colName);
    return idx >= 0 ? row[idx] : null;
  };

  const buildWhereClause = (row) => {
    if (!hasPk || !data?.columns) return null;
    const parts = pkColumns.map(col => {
      const idx = data.columns.indexOf(col);
      const val = idx >= 0 ? row[idx] : null;
      return `${col} = ${sqlQuote(val)}`;
    });
    return parts.join(' AND ');
  };

  const handleInsert = async () => {
    const insertCols = columns.filter(c => {
      const dt = (c.data_type || '').toLowerCase();
      const def = (c.column_default || '').toLowerCase();
      return !dt.includes('serial') && !dt.includes('identity') && !def.includes('nextval');
    });
    const vals = insertCols.map(c => insertValues[c.column_name] ?? '');
    const colsStr = insertCols.map(c => c.column_name).join(', ');
    const valsStr = vals.map(v => sqlQuote(v === '' ? null : v)).join(', ');
    const query = `INSERT INTO ${tableName} (${colsStr}) VALUES (${valsStr})`;
    try {
      await executeAnalyticsQuery({ query, params: [], read_only: false });
      setShowInsertForm(false);
      setInsertValues({});
      fetchData();
    } catch (err) {
      toast.error('Insert failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleUpdate = async () => {
    if (!selectedRow || !hasPk) return;
    const whereClause = buildWhereClause(selectedRow);
    if (!whereClause) return;
    if (!(await confirm({ message: 'Update this row?' }))) return;
    const setParts = columns
      .filter(c => !pkColumns.includes(c.column_name))
      .map(c => {
        const val = editValues[c.column_name] ?? getRowByCol(selectedRow, c.column_name);
        return `${c.column_name} = ${sqlQuote(val)}`;
      });
    if (!setParts.length) return;
    const query = `UPDATE ${tableName} SET ${setParts.join(', ')} WHERE ${whereClause}`;
    try {
      await executeAnalyticsQuery({ query, params: [], read_only: false });
      setShowEditForm(false);
      setEditValues({});
      fetchData();
    } catch (err) {
      toast.error('Update failed: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDelete = async () => {
    if (!selectedRow || !hasPk) return;
    const whereClause = buildWhereClause(selectedRow);
    if (!whereClause) return;
    if (!(await confirm({ message: `Delete this row? (${pkColumns.map(c => `${c}=${getRowByCol(selectedRow, c)}`).join(', ')})` }))) return;
    const query = `DELETE FROM ${tableName} WHERE ${whereClause}`;
    try {
      await executeAnalyticsQuery({ query, params: [], read_only: false });
      setSelectedRowIdx(null);
      fetchData();
    } catch (err) {
      toast.error('Delete failed: ' + (err.message || 'Unknown error'));
    }
  };

  const openInsertForm = () => {
    const init = {};
    columns.forEach(c => { init[c.column_name] = ''; });
    setInsertValues(init);
    setShowInsertForm(true);
  };

  const openEditForm = () => {
    if (!selectedRow || !data?.columns) return;
    const init = {};
    data.columns.forEach((col, i) => { init[col] = selectedRow[i]; });
    setEditValues(init);
    setShowEditForm(true);
  };

  if (!tableDetail) return null;

  return html`
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick=${onClose}
            className="text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] text-sm font-medium"
          >
            ← Back
          </button>
          <h3 className="text-lg font-bold text-[var(--app-text-primary)]">${tableName}</h3>
          ${tableDetail.approximate_row_count != null ? html`
            <span className="text-sm text-[var(--app-text-secondary)]">~${tableDetail.approximate_row_count.toLocaleString()} rows</span>
          ` : ''}
        </div>
        ${writeMode ? html`
          <div className="flex gap-2">
            <button
              onClick=${openInsertForm}
              className="px-4 py-2 bg-[var(--app-success)] text-white text-sm font-bold rounded-lg hover:opacity-90"
            >
              + Insert
            </button>
            <button
              onClick=${openEditForm}
              disabled=${!selectedRow || !hasPk}
              className="px-4 py-2 bg-[var(--app-accent)] text-white text-sm font-bold rounded-lg hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
            <button
              onClick=${handleDelete}
              disabled=${!selectedRow || !hasPk}
              className="px-4 py-2 bg-[var(--app-danger)] text-white text-sm font-bold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        ` : ''}
      </div>

      ${loading ? html`<div className="py-12 text-center text-[var(--app-text-muted)]">Loading...</div>` : error ? html`
        <div className="p-4 bg-[rgba(255,59,48,0.12)] rounded-xl text-[var(--app-danger)] text-sm">${error}</div>
      ` : html`
        <div className="flex-1 overflow-auto border border-[var(--app-border-soft)] rounded-xl min-h-[200px]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--app-surface-muted)] sticky top-0">
              <tr>
                ${data?.columns?.map(c => html`
                  <th key=${c} className="text-left py-2 px-3 font-bold text-[var(--app-text-secondary)] whitespace-nowrap">${c}</th>
                `)}
              </tr>
            </thead>
            <tbody>
              ${(data?.rows || []).length === 0 ? html`
                <tr><td colSpan=${data?.columns?.length || 1} className="py-8 text-center text-[var(--app-text-muted)]">No rows</td></tr>
              ` : (data?.rows || []).map((row, ri) => html`
                <tr
                  key=${ri}
                  onClick=${() => writeMode && setSelectedRowIdx(ri)}
                  className=${`border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] cursor-${writeMode ? 'pointer' : 'default'} ${selectedRowIdx === ri ? 'bg-[var(--app-accent-soft)]' : ''}`}
                >
                  ${row.map((cell, ci) => html`
                    <td key=${ci} className="py-2 px-3 whitespace-nowrap">${safeCellDisplay(cell)}</td>
                  `)}
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[var(--app-text-secondary)] mt-2">${(data?.row_count || 0)} rows</p>
      `}

      ${showInsertForm ? html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick=${() => setShowInsertForm(false)}>
          <div className="bg-[var(--app-surface)] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-[var(--app-shadow-floating)]" onClick=${e => e.stopPropagation()}>
            <h4 className="font-bold text-[var(--app-text-primary)] mb-4">Insert Row</h4>
            <div className="space-y-3">
              ${columns.filter(c => {
                const dt = (c.data_type || '').toLowerCase();
                const def = (c.column_default || '').toLowerCase();
                return !dt.includes('serial') && !dt.includes('identity') && !def.includes('nextval');
              }).map(c => html`
                <div key=${c.column_name}>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">${c.column_name}</label>
                  <input
                    type="text"
                    value=${insertValues[c.column_name] ?? ''}
                    onChange=${e => setInsertValues(prev => ({ ...prev, [c.column_name]: e.target.value }))}
                    placeholder=${c.is_nullable === 'YES' ? 'NULL' : 'required'}
                    className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm"
                  />
                </div>
              `)}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick=${handleInsert} className="px-4 py-2 bg-[var(--app-success)] text-white rounded-lg font-medium">Insert</button>
              <button onClick=${() => setShowInsertForm(false)} className="px-4 py-2 text-[var(--app-text-secondary)]">Cancel</button>
            </div>
          </div>
        </div>
      ` : ''}

      ${showEditForm ? html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick=${() => setShowEditForm(false)}>
          <div className="bg-[var(--app-surface)] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-[var(--app-shadow-floating)]" onClick=${e => e.stopPropagation()}>
            <h4 className="font-bold text-[var(--app-text-primary)] mb-4">Edit Row</h4>
            <div className="space-y-3">
              ${(data?.columns || []).filter(col => !pkColumns.includes(col)).map(col => html`
                <div key=${col}>
                  <label className="block text-sm font-medium text-[var(--app-text-secondary)] mb-1">${col}</label>
                  <input
                    type="text"
                    value=${editValues[col] != null ? (typeof editValues[col] === 'object' ? JSON.stringify(editValues[col]) : String(editValues[col])) : ''}
                    onChange=${e => setEditValues(prev => ({ ...prev, [col]: e.target.value }))}
                    className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm"
                  />
                </div>
              `)}
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick=${handleUpdate} className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg font-medium">Update</button>
              <button onClick=${() => setShowEditForm(false)} className="px-4 py-2 text-[var(--app-text-secondary)]">Cancel</button>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default TableDataView;
