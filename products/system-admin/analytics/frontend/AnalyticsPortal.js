import React, { useState } from 'react';
import htm from 'htm';
import TableBrowser from './components/TableBrowser.js';
import SQLEditor from './components/SQLEditor.js';
import ReportsList from './components/ReportsList.js';
import VisualQueryBuilder from './components/VisualQueryBuilder.js';
import DashboardEditor from './components/DashboardEditor.js';
import Scheduler from './components/Scheduler.js';

const html = htm.bind(React.createElement);

const AnalyticsPortal = ({ user, activeView, setView }) => {
  const [activeTab, setActiveTab] = useState('sql');
  const [editorReport, setEditorReport] = useState(null);

  const tabs = [
    { id: 'sql', label: 'SQL Editor', component: SQLEditor },
    { id: 'visual', label: 'Visual Builder', component: VisualQueryBuilder },
    { id: 'tables', label: 'Table Browser', component: TableBrowser },
    { id: 'reports', label: 'Saved Reports', component: ReportsList },
    { id: 'dashboards', label: 'Dashboards', component: DashboardEditor },
    { id: 'scheduler', label: 'Scheduler', component: Scheduler },
  ];

  const handleOpenInEditor = (report) => {
    setEditorReport(report);
    setActiveTab('sql');
  };

  const handleReportSaved = () => {
    setEditorReport(null);
    setActiveTab('reports');
  };

  const ActiveComponent = tabs.find(t => t.id === activeTab)?.component || SQLEditor;

  return html`
    <div className="w-full px-4 md:px-6 pt-2">
      <div className="mb-4 border-b border-[var(--app-border-soft)]">
        <div className="flex gap-6">
          ${tabs.map(t => html`
            <button
              key=${t.id}
              onClick=${() => setActiveTab(t.id)}
              className=${`px-6 py-3 text-[11px] font-semibold uppercase tracking-widest border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-[var(--app-accent)] text-[var(--app-accent)]'
                  : 'border-transparent text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]'
              }`}
            >
              ${t.label}
            </button>
          `)}
        </div>
      </div>

      ${activeTab === 'sql' ? html`<${SQLEditor}
        key=${editorReport?.id || 'new'}
        initialQuery=${editorReport?.query || ''}
        initialChartConfig=${editorReport?.chart_config || {}}
        onReportSaved=${handleReportSaved}
      />` : activeTab === 'reports' ? html`<${ReportsList} onOpenInEditor=${handleOpenInEditor} />` : html`<${ActiveComponent} />`}
    </div>
  `;
};

export default AnalyticsPortal;
