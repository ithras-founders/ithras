import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getTelemetryMetrics, getTelemetrySummary, getTelemetryClientPages,
  getTelemetryClientApi, getTelemetryTimeseries, getTelemetryActiveUsers,
  getTelemetryDatabase,
  getTelemetryFunnels,
  getTelemetrySessions,
  getTelemetryAlerts,
} from '/core/frontend/src/modules/shared/services/api/telemetry.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import {
  OverviewTab, ApiViewTab, PageViewTab, UserViewTab,
  DatabaseViewTab, AuditTab, JourneysTab, SessionsTab, AlertsTab,
  COLORS,
} from './tabs/index.js';

const html = htm.bind(React.createElement);

const TAB_LABELS = ['Overview', 'API View', 'Page View', 'User View', 'Database View', 'Audit', 'Journeys', 'Sessions', 'Alerts'];
const TAB_SLUGS = ['overview', 'api', 'pages', 'users', 'database', 'audit', 'journeys', 'sessions', 'alerts'];
const SLUG_TO_INDEX = Object.fromEntries(TAB_SLUGS.map((s, i) => [s, i]));

// ─── Main Dashboard ────────────────────────────────────────────────────────────
const TelemetryDashboard = ({ activeView, navigate }) => {
  const { isTutorialMode } = useTutorialContext();
  const subPath = activeView?.split('/')[1] || 'overview';
  const activeTab = SLUG_TO_INDEX[subPath] ?? 0;
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [pageMetrics, setPageMetrics] = useState(null);
  const [clientApi, setClientApi] = useState(null);
  const [timeseries, setTimeseries] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [dbHealth, setDbHealth] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [alertData, setAlertData] = useState(null);

  const fetchData = useCallback(async () => {
    if (isTutorialMode) {
      const mock = getTutorialMockData('SYSTEM_ADMIN');
      const td = mock.telemetryData || {};
      setSummary(td.summary || null);
      setMetrics(td.metrics || null);
      setPageMetrics(td.pages?.pages || []);
      setClientApi(td.clientApi?.endpoints || []);
      setTimeseries(td.timeseries || []);
      setActiveUsers(td.activeUsers || null);
      setDbHealth(td.dbHealth || null);
      setFunnelData(td.funnels || null);
      setSessionData(td.sessions || null);
      setAlertData(td.alerts || null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const fetches = [
        getTelemetrySummary(timeRange).catch(e => ({ error: e.message })),
        getTelemetryMetrics({ last: timeRange }).catch(e => ({ error: e.message })),
        getTelemetryClientPages(timeRange).catch(() => ({ pages: [] })),
        getTelemetryClientApi(timeRange).catch(() => ({ endpoints: [] })),
        getTelemetryTimeseries(timeRange).catch(() => ({ series: [] })),
        getTelemetryActiveUsers(timeRange).catch(() => ({ active_count: 0, users: [] })),
        activeTab === 4 ? getTelemetryDatabase().catch(e => ({ error: e.message })) : Promise.resolve(null),
        getTelemetryFunnels(timeRange),
        getTelemetrySessions(timeRange),
        getTelemetryAlerts(timeRange),
      ];
      const results = await Promise.all(fetches);

      if (results[0]?.error) setError(results[0].error);
      else setSummary(results[0]);

      if (!results[1]?.error) setMetrics(results[1]);
      setPageMetrics(results[2]?.pages || []);
      setClientApi(results[3]?.endpoints || []);
      setTimeseries(results[4]?.series || []);
      setActiveUsers(results[5]);

      if (results[6]) setDbHealth(results[6]);
      setFunnelData(results[7] || null);
      setSessionData(results[8] || null);
      setAlertData(results[9] || null);
    } catch (err) {
      setError(err.message || 'Failed to load telemetry');
    } finally {
      setLoading(false);
    }
  }, [timeRange, activeTab, isTutorialMode]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (activeTab === 4 && !dbHealth) {
      getTelemetryDatabase().then(setDbHealth).catch(() => {});
    }
  }, [activeTab, dbHealth]);

  const statusPieData = summary
    ? [
        { name: '2xx Success', value: summary.success_count || 0, fill: COLORS['2xx'] },
        { name: '4xx Client Error', value: summary['4xx_count'] || 0, fill: COLORS['4xx'] },
        { name: '5xx Server Error', value: summary['5xx_count'] || 0, fill: COLORS['5xx'] },
      ].filter(d => d.value > 0)
    : [];

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div data-tour-id="telemetry-header" className="flex justify-end">
        <select
          value=${timeRange}
          onChange=${e => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm font-medium"
        >
          <option value="1h">Last 1 hour</option>
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
        </select>
      </div>

      <div className="flex gap-1 bg-[var(--app-surface-muted)] p-1 rounded-2xl">
        ${TAB_LABELS.map((label, i) => html`
          <button
            key=${label}
            onClick=${() => navigate ? navigate('telemetry/' + TAB_SLUGS[i]) : null}
            className=${'flex-1 py-2.5 px-4 text-sm font-bold rounded-xl transition-all ' + (activeTab === i ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)]')}
          >${label}</button>
        `)}
      </div>

      ${error ? html`<div className="bg-[rgba(255,59,48,0.06)] border border-[var(--app-danger)] rounded-2xl p-4 text-[var(--app-danger)]">${error}</div>` : null}

      ${activeTab === 0 ? html`<${OverviewTab} summary=${summary} timeseries=${timeseries} statusPieData=${statusPieData} loading=${loading && !summary} />`
      : activeTab === 1 ? html`<${ApiViewTab} metrics=${metrics} clientApi=${clientApi} loading=${loading && !metrics} />`
      : activeTab === 2 ? html`<${PageViewTab} pageMetrics=${pageMetrics} loading=${loading && !pageMetrics} />`
      : activeTab === 3 ? html`<${UserViewTab} activeUsers=${activeUsers} loading=${loading && !activeUsers} />`
      : activeTab === 4 ? html`<${DatabaseViewTab} dbHealth=${dbHealth} loading=${loading && !dbHealth} />`
      : activeTab === 5 ? html`<${AuditTab} />`
      : activeTab === 6 ? html`<${JourneysTab} funnelData=${funnelData} loading=${loading && !funnelData} />`
      : activeTab === 7 ? html`<${SessionsTab} sessionData=${sessionData} loading=${loading && !sessionData} />`
      : html`<${AlertsTab} alertData=${alertData} loading=${loading && !alertData} />`}
    </div>
  `;
};

export default TelemetryDashboard;
