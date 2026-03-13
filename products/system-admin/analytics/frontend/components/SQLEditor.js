import React, { useState } from 'react';
import htm from 'htm';
import {
  executeAnalyticsQuery,
  createReport,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import ChartView from './ChartView.js';
import { safeCellDisplay } from '../utils/cellDisplay.js';

const html = htm.bind(React.createElement);

function appendWhereClause(query, filters) {
  if (!filters.length) return query;
  const q = query.replace(/;\s*$/, '').trim();
  const wherePart = filters.map(f => {
    const val = typeof f.value === 'string' ? `'${String(f.value).replace(/'/g, "''")}'` : f.value;
    return `${f.column} = ${val}`;
  }).join(' AND ');
  const upper = q.toUpperCase();
  if (upper.includes(' WHERE ')) {
    return `${q} AND (${wherePart})`;
  }
  return `${q} WHERE (${wherePart})`;
}

const SQLEditor = ({ initialQuery, initialChartConfig, onReportSaved }) => {
  const [query, setQuery] = useState(initialQuery || '');
  const [readOnly, setReadOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [chartConfig, setChartConfig] = useState(initialChartConfig || {});
  const [saving, setSaving] = useState(false);
  const [drillFilters, setDrillFilters] = useState([]);

  const handleExecuteWithFilters = async (filters = []) => {
    if (!query.trim()) return;
    const q = filters.length ? appendWhereClause(query.trim(), filters) : query.trim();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await executeAnalyticsQuery({
        query: q,
        params: [],
        read_only: readOnly,
      });
      if (data.error) {
        setError(data.error);
        setResult(null);
      } else {
        setResult(data);
        setError(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to execute query');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = ({ column, value }) => {
    const newFilters = [...drillFilters, { column, value }];
    setDrillFilters(newFilters);
    handleExecuteWithFilters(newFilters);
  };

  const handleClearDrillFilters = () => {
    setDrillFilters([]);
    if (query.trim()) handleExecuteWithFilters([]);
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError(null);
    setDrillFilters([]);
  };

  const handleSaveReport = async () => {
    const name = await prompt({ title: 'Save Report', promptMessage: 'Report name:', defaultValue: '' });
    if (!name || !name.trim()) return;
    setSaving(true);
    try {
      await createReport({
        name: name.trim(),
        query: query.trim(),
        params: [],
        chart_config: chartConfig,
      });
      if (onReportSaved) onReportSaved();
      toast.success('Report saved.');
    } catch (err) {
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return html`
    <div className="space-y-10 animate-in pb-20">
      <header>
        <h2 className="text-3xl font-semibold text-[var(--app-text-primary)] tracking-tighter">SQL Editor</h2>
        <p className="text-[var(--app-text-secondary)] font-medium italic mt-2">
          Run SQL queries against the database. Toggle read-only to allow INSERT/UPDATE/DELETE.
        </p>
      </header>

      <div className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] space-y-6">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked=${readOnly}
              onChange=${(e) => setReadOnly(e.target.checked)}
              className="rounded border-[var(--app-border-soft)]"
            />
            <span className="text-sm font-medium">Read-only mode</span>
          </label>
        </div>

        <textarea
          value=${query}
          onChange=${(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM users LIMIT 10;"
          className="w-full h-40 px-4 py-3 font-mono text-sm border border-[var(--app-border-soft)] rounded-xl resize-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
          spellCheck=${false}
        />

        <div className="flex gap-3 flex-wrap">
          <button
            onClick=${() => handleExecuteWithFilters([])}
            disabled=${loading || !query.trim()}
            className="px-6 py-2 bg-[var(--app-accent)] text-white rounded-xl text-xs font-bold uppercase hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ${loading ? 'Running...' : 'Execute'}
          </button>
          <button
            onClick=${handleClear}
            className="px-6 py-2 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border-soft)] rounded-xl text-xs font-bold uppercase"
          >
            Clear
          </button>
          ${drillFilters.length > 0 ? html`
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--app-text-secondary)]">Drill filters:</span>
              ${drillFilters.map((f, i) => html`
                <span key=${i} className="px-2 py-1 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded text-xs">
                  ${f.column} = ${f.value}
                </span>
              `)}
              <button onClick=${handleClearDrillFilters} className="text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)]">
                Clear
              </button>
            </div>
          ` : ''}
          ${result && result.columns?.length > 0 ? html`
            <button
              onClick=${handleSaveReport}
              disabled=${saving}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-700 disabled:opacity-50"
            >
              ${saving ? 'Saving...' : 'Save Report'}
            </button>
          ` : ''}
        </div>

        ${error ? html`
          <div className="p-4 bg-[rgba(255,59,48,0.12)] border border-[var(--app-danger)] rounded-xl text-[var(--app-danger)] text-sm font-mono">
            ${error}
          </div>
        ` : null}

        ${result && result.columns?.length > 0 ? html`
          <div className="border-t border-[var(--app-border-soft)] pt-6 space-y-6">
            <${ChartView}
              columns=${result.columns}
              rows=${result.rows || []}
              chartConfig=${chartConfig}
              onConfigChange=${setChartConfig}
              onDrillDown=${handleDrillDown}
              drillFilters=${drillFilters}
            />
            <div>
              <h3 className="text-lg font-bold text-[var(--app-text-primary)] mb-4">
                Results (${result.row_count} row${result.row_count !== 1 ? 's' : ''})
              </h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-[var(--app-border-soft)] rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--app-surface-muted)] sticky top-0">
                    <tr>
                      ${result.columns.map(col => html`
                        <th key=${col} className="text-left py-2 px-3 font-bold text-[var(--app-text-secondary)] border-b border-[var(--app-border-soft)]">
                          ${col}
                        </th>
                      `)}
                    </tr>
                  </thead>
                  <tbody>
                    ${result.rows?.length === 0 ? html`
                      <tr><td colSpan=${result.columns.length} className="py-8 text-center text-[var(--app-text-muted)]">No rows</td></tr>
                    ` : result.rows?.map((row, ri) => html`
                      <tr key=${ri} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                        ${row.map((cell, ci) => html`
                          <td key=${ci} className="py-2 px-3 text-[var(--app-text-secondary)]">${safeCellDisplay(cell)}</td>
                        `)}
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ` : result && result.row_count === 0 && !result.error ? html`
          <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl text-[var(--app-text-secondary)] text-sm">
            Query executed successfully. No rows returned.
          </div>
        ` : null}
      </div>
    </div>
  `;
};

export default SQLEditor;
