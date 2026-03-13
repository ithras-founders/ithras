import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getReports,
  deleteReport,
  executeAnalyticsQuery,
  exportAnalytics,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import ChartView from './ChartView.js';
import { safeCellDisplay } from '../utils/cellDisplay.js';

const html = htm.bind(React.createElement);

const ReportsList = ({ onOpenInEditor }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [drillFilters, setDrillFilters] = useState([]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await getReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const appendWhere = (query, filters) => {
    if (!filters.length) return query;
    const q = query.replace(/;\s*$/, '').trim();
    const part = filters.map(f => `${f.column} = '${String(f.value).replace(/'/g, "''")}'`).join(' AND ');
    return q.toUpperCase().includes(' WHERE ') ? `${q} AND (${part})` : `${q} WHERE (${part})`;
  };

  const handleRun = async (report, filters = []) => {
    if (filters.length === 0) setDrillFilters([]);
    setRunLoading(true);
    setRunResult(null);
    try {
      const q = filters.length ? appendWhere(report.query, filters) : report.query;
      const data = await executeAnalyticsQuery({
        query: q,
        params: report.params || [],
        read_only: true,
      });
      setRunResult({ report, data });
      setExpandedId(report.id);
    } catch (err) {
      setRunResult({ report, error: err.message });
    } finally {
      setRunLoading(false);
    }
  };

  const handleDrillDown = (report, { column, value }) => {
    const newFilters = [...drillFilters, { column, value }];
    setDrillFilters(newFilters);
    handleRun(report, newFilters);
  };

  const handleClearDrill = () => {
    setDrillFilters([]);
    if (currentResult?.report) handleRun(currentResult.report, []);
  };

  const handleExport = async (report, format) => {
    setExporting(true);
    try {
      await exportAnalytics({
        format,
        report_id: report.id,
      });
    } catch (err) {
      toast.error('Export failed: ' + (err.message || 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ message: 'Delete this report?' }))) return;
    try {
      await deleteReport(id);
      fetchReports();
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  const currentResult = runResult?.report?.id === expandedId ? runResult : null;
  const currentReport = currentResult?.report;

  return html`
    <div className="space-y-10 animate-in pb-20">
      <header>
        <h2 className="text-3xl font-semibold text-[var(--app-text-primary)] tracking-tighter">Saved Reports</h2>
        <p className="text-[var(--app-text-secondary)] font-medium italic mt-2">
          Load and run saved reports. Click "Run" to execute and view results.
        </p>
      </header>

      <div className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
        ${loading ? html`
          <div className="py-12 text-center text-[var(--app-text-muted)]">Loading reports...</div>
        ` : reports.length === 0 ? html`
          <div className="py-12 text-center text-[var(--app-text-muted)]">No saved reports. Save a report from the SQL Editor.</div>
        ` : html`
          <div className="space-y-4">
            ${reports.map(r => html`
              <div key=${r.id} className="border border-[var(--app-border-soft)] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-[var(--app-surface-muted)]">
                  <div>
                    <h3 className="font-bold text-[var(--app-text-primary)]">${r.name}</h3>
                    <p className="text-xs text-[var(--app-text-secondary)] font-mono truncate max-w-xl">${r.query}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    ${onOpenInEditor ? html`
                      <button
                        onClick=${() => onOpenInEditor(r)}
                        className="px-4 py-2 text-sm font-medium text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] rounded-lg"
                      >
                        Open in Editor
                      </button>
                    ` : ''}
                    <button
                      onClick=${() => handleRun(r)}
                      disabled=${runLoading}
                      className="px-4 py-2 bg-[var(--app-accent)] text-white text-sm font-bold rounded-lg hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
                    >
                      Run
                    </button>
                    <button
                      onClick=${() => handleExport(r, 'xlsx')}
                      disabled=${exporting}
                      className="px-4 py-2 text-emerald-700 hover:bg-emerald-50 text-sm font-medium rounded-lg border border-emerald-200"
                    >
                      Export Excel
                    </button>
                    <button
                      onClick=${() => handleExport(r, 'pdf')}
                      disabled=${exporting}
                      className="px-4 py-2 text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] text-sm font-medium rounded-lg border border-[var(--app-border-soft)]"
                    >
                      Export PDF
                    </button>
                    <button
                      onClick=${() => handleDelete(r.id)}
                      className="px-4 py-2 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.12)] text-sm font-medium rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                ${expandedId === r.id && currentResult ? html`
                  <div className="p-4 border-t border-[var(--app-border-soft)]">
                    ${drillFilters.length > 0 ? html`
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm text-[var(--app-text-secondary)]">Drill filters:</span>
                        ${drillFilters.map((f, i) => html`
                          <span key=${i} className="px-2 py-1 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded text-xs">${f.column} = ${f.value}</span>
                        `)}
                        <button onClick=${handleClearDrill} className="text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)]">Clear</button>
                      </div>
                    ` : ''}
                    ${currentResult.error ? html`
                      <div className="p-4 bg-[rgba(255,59,48,0.12)] rounded-xl text-[var(--app-danger)] text-sm">${currentResult.error}</div>
                    ` : currentResult.data?.columns?.length > 0 ? html`
                      <div className="space-y-4">
                        <${ChartView}
                          columns=${currentResult.data.columns}
                          rows=${currentResult.data.rows || []}
                          chartConfig=${r.chart_config || {}}
                          onDrillDown=${currentReport ? (ev) => handleDrillDown(currentReport, ev) : undefined}
                          drillFilters=${drillFilters}
                        />
                        <div className="overflow-x-auto max-h-64 overflow-y-auto border border-[var(--app-border-soft)] rounded-xl">
                          <table className="w-full text-sm">
                            <thead className="bg-[var(--app-surface-muted)] sticky top-0">
                              <tr>
                                ${currentResult.data.columns.map(col => html`
                                  <th key=${col} className="text-left py-2 px-3 font-bold text-[var(--app-text-secondary)]">${col}</th>
                                `)}
                              </tr>
                            </thead>
                            <tbody>
                              ${(currentResult.data.rows || []).slice(0, 100).map((row, ri) => html`
                                <tr key=${ri} className="border-b border-[var(--app-border-soft)]">
                                  ${row.map((cell, ci) => html`
                                    <td key=${ci} className="py-2 px-3 text-[var(--app-text-secondary)]">${safeCellDisplay(cell)}</td>
                                  `)}
                                </tr>
                              `)}
                            </tbody>
                          </table>
                          ${(currentResult.data.rows?.length || 0) > 100 ? html`
                            <div className="text-center py-2 text-[var(--app-text-secondary)] text-xs">
                              Showing first 100 of ${currentResult.data.rows.length} rows
                            </div>
                          ` : ''}
                        </div>
                      </div>
                    ` : html`
                      <div className="text-[var(--app-text-secondary)] text-sm">Query executed. No rows returned.</div>
                    `}
                  </div>
                ` : ''}
              </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default ReportsList;
