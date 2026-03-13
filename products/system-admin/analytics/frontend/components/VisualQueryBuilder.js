import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import {
  getAnalyticsTables,
  getAnalyticsTableDetails,
  executeAnalyticsQuery,
} from '/core/frontend/src/modules/shared/services/api.js';
import { safeCellDisplay } from '../utils/cellDisplay.js';

const html = htm.bind(React.createElement);

const JOIN_TYPES = [
  { id: 'inner', label: 'INNER' },
  { id: 'left', label: 'LEFT' },
  { id: 'right', label: 'RIGHT' },
];

const VisualQueryBuilder = () => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTables, setSelectedTables] = useState([]);
  const [tableDetails, setTableDetails] = useState({});
  const [joins, setJoins] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState({});
  const [filters, setFilters] = useState([]);
  const [groupBy, setGroupBy] = useState('');
  const [generatedSQL, setGeneratedSQL] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        setLoading(true);
        const data = await getAnalyticsTables({ page_size: 100 });
        setTables(data.items || []);
      } catch (err) {
        console.error('Failed to fetch tables:', err);
        setTables([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTables();
  }, []);

  const handleAddTable = async (tableName) => {
    if (selectedTables.includes(tableName)) return;
    setSelectedTables([...selectedTables, tableName]);
    try {
      const detail = await getAnalyticsTableDetails(tableName);
      setTableDetails(prev => ({ ...prev, [tableName]: detail }));
      setSelectedColumns(prev => ({
        ...prev,
        [tableName]: detail.columns.map(c => c.column_name),
      }));
    } catch (err) {
      console.error('Failed to fetch table details:', err);
    }
  };

  const handleRemoveTable = (tableName) => {
    setSelectedTables(selectedTables.filter(t => t !== tableName));
    setTableDetails(prev => {
      const next = { ...prev };
      delete next[tableName];
      return next;
    });
    setSelectedColumns(prev => {
      const next = { ...prev };
      delete next[tableName];
      return next;
    });
    setJoins(joins.filter(j => j.leftTable !== tableName && j.rightTable !== tableName));
  };

  const handleToggleColumn = (tableName, col) => {
    setSelectedColumns(prev => {
      const cols = prev[tableName] || [];
      const next = cols.includes(col) ? cols.filter(c => c !== col) : [...cols, col];
      return { ...prev, [tableName]: next };
    });
  };

  const handleAddJoin = (leftTable, rightTable, leftCol, rightCol, type = 'inner') => {
    if (joins.some(j => j.leftTable === leftTable && j.rightTable === rightTable && j.leftCol === leftCol && j.rightCol === rightCol)) return;
    setJoins([...joins, { leftTable, rightTable, leftCol, rightCol, type }]);
  };

  const handleRemoveJoin = (idx) => {
    setJoins(joins.filter((_, i) => i !== idx));
  };

  const addFilter = () => {
    const firstTable = selectedTables[0];
    const firstCol = tableDetails[firstTable]?.columns?.[0]?.column_name || 'column';
    setFilters([...filters, { table: firstTable, column: firstCol, op: '=', value: '' }]);
  };

  const updateFilter = (idx, field, val) => {
    setFilters(filters.map((f, i) => i === idx ? { ...f, [field]: val } : f));
  };

  const removeFilter = (idx) => {
    setFilters(filters.filter((_, i) => i !== idx));
  };

  const generateSQL = () => {
    if (selectedTables.length === 0) {
      setGeneratedSQL('-- Select at least one table');
      return;
    }
    const cols = selectedTables.flatMap(t => {
      const sel = selectedColumns[t] || [];
      return sel.map(c => `${t}.${c}`);
    });
    const selectClause = cols.length ? cols.join(', ') : '*';

    let sql = `SELECT ${selectClause}\nFROM ${selectedTables[0]}`;
    joins.forEach(j => {
      sql += ` ${j.type.toUpperCase()} JOIN ${j.rightTable} ON ${j.leftTable}.${j.leftCol} = ${j.rightTable}.${j.rightCol}`;
    });
    if (filters.length > 0) {
      const whereParts = filters
        .filter(f => f.column && f.value)
        .map(f => `${f.table}.${f.column} ${f.op} '${String(f.value).replace(/'/g, "''")}'`);
      if (whereParts.length) sql += `\nWHERE ${whereParts.join(' AND ')}`;
    }
    if (groupBy) {
      sql += `\nGROUP BY ${groupBy}`;
    }
    sql += ';';
    setGeneratedSQL(sql);
  };

  const handleRun = async () => {
    if (!generatedSQL.trim() || generatedSQL.startsWith('--')) return;
    setRunLoading(true);
    setRunResult(null);
    try {
      const data = await executeAnalyticsQuery({
        query: generatedSQL.replace(/;\s*$/, ''),
        params: [],
        read_only: true,
      });
      setRunResult(data);
    } catch (err) {
      setRunResult({ error: err.message });
    } finally {
      setRunLoading(false);
    }
  };

  return html`
    <div className="animate-in pb-8 flex flex-col min-h-[calc(100vh-140px)]">
      <header className="mb-3">
        <h2 className="text-3xl font-semibold text-[var(--app-text-primary)] tracking-tighter">Visual Query Builder</h2>
        <p className="text-[var(--app-text-secondary)] font-medium italic mt-2">
          Drag tables, pick columns, define joins and filters. Generate SQL and run.
        </p>
      </header>

      <div className="flex flex-1 gap-4 min-h-0 flex-col lg:flex-row">
        <aside className="w-full lg:w-[280px] shrink-0 flex flex-col gap-3 overflow-hidden" style=${{ minHeight: '400px' }}>
          <div className="bg-[var(--app-surface)] p-3 rounded-xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex flex-col shrink-0" style=${{ maxHeight: '180px' }}>
            <h3 className="font-bold text-[var(--app-text-primary)] mb-2 text-sm">Tables</h3>
            ${loading ? html`<div className="text-[var(--app-text-muted)] text-sm">Loading...</div>` : html`
              <div className="space-y-1 overflow-y-auto flex-1 min-h-[80px]">
              ${tables.map(t => html`
                <div
                  key=${t.table_name}
                  onClick=${() => handleAddTable(t.table_name)}
                  className=${`px-3 py-2 rounded-lg cursor-pointer text-sm font-medium ${selectedTables.includes(t.table_name) ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'hover:bg-[var(--app-surface-muted)]'}`}
                >
                  ${t.table_name}
                </div>
              `)}
            </div>
          `}
          </div>

          <div className="bg-[var(--app-surface)] p-3 rounded-xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex flex-col overflow-y-auto flex-1 min-h-[220px]">
            <h3 className="font-bold text-[var(--app-text-primary)] mb-2 text-sm">Selected</h3>
            ${selectedTables.length === 0 ? html`
            <p className="text-[var(--app-text-muted)] text-sm">Click a table to add it</p>
          ` : selectedTables.map(t => html`
            <div key=${t} className="border border-[var(--app-border-soft)] rounded-xl p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[var(--app-text-primary)]">${t}</span>
                <button onClick=${() => handleRemoveTable(t)} className="text-[var(--app-danger)] text-xs">Remove</button>
              </div>
              <div className="space-y-1">
                ${(tableDetails[t]?.columns || []).map(c => html`
                  <label key=${c.column_name} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked=${(selectedColumns[t] || []).includes(c.column_name)}
                      onChange=${() => handleToggleColumn(t, c.column_name)}
                    />
                    ${c.column_name}
                  </label>
                `)}
              </div>
              ${selectedTables.indexOf(t) > 0 ? html`
                <div className="mt-2 pt-2 border-t border-[var(--app-border-soft)]">
                  <span className="text-xs text-[var(--app-text-secondary)]">Join to:</span>
                  <select
                    onChange=${(e) => {
                      const v = e.target.value;
                      if (!v) return;
                      const [left, right, lc, rc] = v.split(':');
                      handleAddJoin(left, right, lc, rc, 'inner');
                      e.target.value = '';
                    }}
                    className="mt-1 w-full text-xs border rounded px-2 py-1"
                  >
                    <option value="">Add join...</option>
                    ${selectedTables.filter(ot => ot !== t).flatMap(ot =>
                      (tableDetails[ot]?.columns || []).flatMap(oc =>
                        (tableDetails[t]?.columns || []).map(tc =>
                          [ot, t, oc.column_name, tc.column_name]
                        )
                      )
                    ).filter(Boolean).map(([ot, rt, lc, rc]) => html`
                      <option key=${ot + lc + rt + rc} value=${[ot, rt, lc, rc].join(':')}>
                        ${ot}.${lc} = ${rt}.${rc}
                      </option>
                    `)}
                  </select>
                </div>
              ` : ''}
            </div>
          `)}
          ${joins.length > 0 ? html`
            <div className="text-sm">
              <span className="font-medium text-[var(--app-text-secondary)]">Joins:</span>
              ${joins.map((j, i) => html`
                <div key=${i} className="flex items-center gap-2 mt-1">
                  <span className="text-[var(--app-text-secondary)]">${j.leftTable}.${j.leftCol} = ${j.rightTable}.${j.rightCol}</span>
                  <button onClick=${() => handleRemoveJoin(i)} className="text-[var(--app-danger)] text-xs">×</button>
                </div>
              `)}
            </div>
          ` : ''}
          <div>
            <button onClick=${addFilter} className="text-sm text-[var(--app-accent)] font-medium">+ Add filter</button>
            ${filters.map((f, i) => html`
              <div key=${i} className="flex gap-2 mt-2 items-center">
                <select value=${f.table} onChange=${(e) => updateFilter(i, 'table', e.target.value)} className="text-xs border rounded px-2 py-1">
                  ${selectedTables.map(t => html`<option key=${t} value=${t}>${t}</option>`)}
                </select>
                <select value=${f.column} onChange=${(e) => updateFilter(i, 'column', e.target.value)} className="text-xs border rounded px-2 py-1">
                  ${(tableDetails[f.table]?.columns || []).map(c => html`<option key=${c.column_name} value=${c.column_name}>${c.column_name}</option>`)}
                </select>
                <select value=${f.op} onChange=${(e) => updateFilter(i, 'op', e.target.value)} className="text-xs border rounded px-2 py-1">
                  <option value="=">=</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value="<">&lt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<=">&lt;=</option>
                  <option value="LIKE">LIKE</option>
                </select>
                <input
                  type="text"
                  value=${f.value}
                  onChange=${(e) => updateFilter(i, 'value', e.target.value)}
                  placeholder="value"
                  className="text-xs border rounded px-2 py-1 flex-1"
                />
                <button onClick=${() => removeFilter(i)} className="text-[var(--app-danger)]">×</button>
              </div>
            `)}
          </div>
          <div>
            <label className="text-sm font-medium text-[var(--app-text-secondary)]">GROUP BY</label>
            <select value=${groupBy} onChange=${(e) => setGroupBy(e.target.value)} className="w-full mt-1 text-sm border rounded px-3 py-1">
              <option value="">None</option>
              ${selectedTables.flatMap(t => (tableDetails[t]?.columns || []).map(c => html`
                <option key=${t + c.column_name} value=${t + '.' + c.column_name}>${t}.${c.column_name}</option>
              `))}
            </select>
          </div>
            <div className="flex gap-2">
              <button onClick=${generateSQL} className="px-3 py-2 bg-[var(--app-accent)] text-white text-xs font-bold rounded-lg">
                Generate SQL
              </button>
            </div>
          </div>
        </aside>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex gap-2 mb-2">
            <textarea
              value=${generatedSQL}
              onChange=${(e) => setGeneratedSQL(e.target.value)}
              className="flex-1 min-w-0 h-20 font-mono text-sm border border-[var(--app-border-soft)] rounded-xl p-3 resize-none"
              placeholder="Click Generate SQL or paste query"
            />
            <button
              onClick=${handleRun}
              disabled=${runLoading || !generatedSQL.trim()}
              className="shrink-0 px-6 py-2 h-20 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50"
            >
              ${runLoading ? 'Running...' : 'Run'}
            </button>
          </div>

          <div className="flex-1 min-h-[250px] bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] overflow-hidden flex flex-col">
            ${runResult ? html`
              ${runResult.error ? html`
                <div className="p-4 bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)] text-sm">${runResult.error}</div>
              ` : runResult.columns?.length > 0 ? html`
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="w-full text-sm">
                    <thead className="bg-[var(--app-surface-muted)] sticky top-0 z-10">
                      <tr>
                        ${runResult.columns.map(c => html`<th key=${c} className="text-left py-2 px-3 font-bold text-[var(--app-text-secondary)] whitespace-nowrap">${c}</th>`)}
                      </tr>
                    </thead>
                    <tbody>
                      ${(runResult.rows || []).map((row, ri) => html`
                        <tr key=${ri} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                          ${row.map((cell, ci) => html`<td key=${ci} className="py-2 px-3 whitespace-nowrap">${safeCellDisplay(cell)}</td>`)}
                        </tr>
                      `)}
                    </tbody>
                  </table>
                </div>
                <div className="shrink-0 px-4 py-2 border-t border-[var(--app-border-soft)] text-xs text-[var(--app-text-secondary)]">
                  ${runResult.row_count} row${runResult.row_count !== 1 ? 's' : ''}
                </div>
              ` : html`<div className="p-8 text-center text-[var(--app-text-secondary)]">Executed. No rows.</div>`}
            ` : html`
              <div className="flex-1 flex items-center justify-center text-[var(--app-text-muted)]">
                Generate SQL and click Run to see results
              </div>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
};

export default VisualQueryBuilder;
