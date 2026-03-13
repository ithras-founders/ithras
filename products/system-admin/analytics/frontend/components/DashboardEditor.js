import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getDashboards,
  getDashboard,
  createDashboard,
  updateDashboard,
  deleteDashboard,
  getReports,
  getReport,
  executeAnalyticsQuery,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import ChartView from './ChartView.js';

const html = htm.bind(React.createElement);

const DashboardEditor = () => {
  const toast = useToast();
  const { confirm, prompt } = useDialog();
  const [dashboards, setDashboards] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);

  const fetchDashboards = async () => {
    try {
      const data = await getDashboards();
      setDashboards(data || []);
    } catch (err) {
      console.error('Failed to fetch dashboards:', err);
      setDashboards([]);
    }
  };

  const fetchReports = async () => {
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (err) {
      setReports([]);
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDashboards(), fetchReports()]);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setDashboard(null);
      return;
    }
    getDashboard(selectedId)
      .then(setDashboard)
      .catch(() => setDashboard(null));
  }, [selectedId]);

  const handleCreateDashboard = async () => {
    const name = await prompt({ title: 'New Dashboard', promptMessage: 'Dashboard name:', defaultValue: '' });
    if (!name?.trim()) return;
    try {
      const d = await createDashboard({ name: name.trim(), layout: { widgets: [] } });
      await fetchDashboards();
      setSelectedId(d.id);
      setDashboard(d);
    } catch (err) {
      toast.error('Failed to create: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteDashboard = async (id) => {
    if (!(await confirm({ message: 'Delete this dashboard?' }))) return;
    try {
      await deleteDashboard(id);
      await fetchDashboards();
      if (selectedId === id) setSelectedId(null);
    } catch (err) {
      toast.error('Failed to delete: ' + (err.message || 'Unknown error'));
    }
  };

  const handleAddWidget = async (reportId) => {
    if (!dashboard) return;
    const report = reports.find(r => r.id === reportId);
    if (!report) return;
    const layout = dashboard.layout || { widgets: [] };
    const widgets = layout.widgets || [];
    const newWidget = {
      id: `w-${Date.now()}`,
      reportId: report.id,
      x: widgets.length % 2 * 6,
      y: Math.floor(widgets.length / 2) * 4,
      w: 6,
      h: 4,
      chartConfig: report.chart_config || {},
    };
    widgets.push(newWidget);
    try {
      const updated = await updateDashboard(dashboard.id, { layout: { widgets } });
      setDashboard(updated);
      setShowAddWidget(false);
    } catch (err) {
      toast.error('Failed to add widget: ' + (err.message || 'Unknown error'));
    }
  };

  const handleRemoveWidget = async (widgetId) => {
    if (!dashboard) return;
    const widgets = (dashboard.layout?.widgets || []).filter(w => w.id !== widgetId);
    try {
      const updated = await updateDashboard(dashboard.id, { layout: { widgets } });
      setDashboard(updated);
    } catch (err) {
      toast.error('Failed to remove widget: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return html`<div className="py-20 text-center text-[var(--app-text-muted)]">Loading...</div>`;
  }

  return html`
    <div className="space-y-10 animate-in pb-20">
      <header className="flex flex-col md:flex-row md:items-center md:justify-end gap-4">
        <button
          onClick=${handleCreateDashboard}
          className="px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-bold uppercase hover:bg-[var(--app-accent-hover)]"
        >
          + New Dashboard
        </button>
      </header>

      <div className="flex gap-6">
        <div className="w-56 shrink-0 space-y-2">
          <h3 className="font-bold text-[var(--app-text-primary)]">My Dashboards</h3>
          ${dashboards.length === 0 ? html`
            <p className="text-[var(--app-text-muted)] text-sm">No dashboards yet</p>
          ` : dashboards.map(d => html`
            <div
              key=${d.id}
              onClick=${() => setSelectedId(d.id)}
              className=${`px-4 py-2 rounded-xl cursor-pointer text-sm font-medium ${selectedId === d.id ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'hover:bg-[var(--app-surface-muted)]'}`}
            >
              ${d.name}
            </div>
          `)}
        </div>

        <div className="flex-1 min-w-0">
          ${!selectedId ? html`
            <div className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] text-center text-[var(--app-text-muted)]">
              Select or create a dashboard
            </div>
          ` : dashboard ? html`
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-[var(--app-text-primary)]">${dashboard.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick=${() => setShowAddWidget(true)}
                    className="px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700"
                  >
                    + Add Widget
                  </button>
                  <button
                    onClick=${() => handleDeleteDashboard(dashboard.id)}
                    className="px-4 py-2 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.12)] text-sm rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>

              ${showAddWidget ? html`
                <div className="mb-6 p-4 bg-[var(--app-surface-muted)] rounded-xl">
                  <h4 className="font-medium text-[var(--app-text-secondary)] mb-2">Add report widget</h4>
                  <div className="flex flex-wrap gap-2">
                    ${reports.length === 0 ? html`<p className="text-[var(--app-text-secondary)] text-sm">No saved reports</p>` : reports.map(r => html`
                      <button
                        key=${r.id}
                        onClick=${() => handleAddWidget(r.id)}
                        className="px-3 py-2 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg text-sm hover:bg-[var(--app-accent-soft)]"
                      >
                        ${r.name}
                      </button>
                    `)}
                    <button
                      onClick=${() => setShowAddWidget(false)}
                      className="px-3 py-2 text-[var(--app-text-secondary)] text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ` : ''}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${(dashboard.layout?.widgets || []).map(w => html`
                  <${DashboardWidget}
                    key=${w.id}
                    widget=${w}
                    onRemove=${() => handleRemoveWidget(w.id)}
                  />
                `)}
              </div>
              ${(dashboard.layout?.widgets || []).length === 0 && !showAddWidget ? html`
                <div className="py-12 text-center text-[var(--app-text-muted)]">
                  No widgets. Click "+ Add Widget" to add a report.
                </div>
              ` : ''}
            </div>
          ` : html`<div className="text-[var(--app-text-muted)]">Loading dashboard...</div>`}
        </div>
      </div>
    </div>
  `;
};

const DashboardWidget = ({ widget, onRemove }) => {
  const [report, setReport] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await getReport(widget.reportId);
        setReport(r);
        const data = await executeAnalyticsQuery({ query: r.query, params: r.params || [], read_only: true });
        setResult(data);
      } catch (err) {
        setResult({ error: err.message });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [widget.reportId]);

  return html`
    <div className="border border-[var(--app-border-soft)] rounded-xl p-4 relative min-h-[200px]">
      <button
        onClick=${onRemove}
        className="absolute top-2 right-2 text-[var(--app-text-muted)] hover:text-[var(--app-danger)] text-lg leading-none"
      >
        ×
      </button>
      ${loading ? html`<div className="py-8 text-center text-[var(--app-text-muted)]">Loading...</div>` : result?.error ? html`
        <div className="text-[var(--app-danger)] text-sm">${result.error}</div>
      ` : report ? html`
        <h4 className="font-bold text-[var(--app-text-primary)] mb-3">${report.name}</h4>
        <${ChartView}
          columns=${result?.columns || []}
          rows=${result?.rows || []}
          chartConfig=${widget.chartConfig || report.chart_config || {}}
        />
      ` : ''}
    </div>
  `;
};

export default DashboardEditor;
