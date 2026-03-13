import React, { useState } from 'react';
import htm from 'htm';
import {
  BarChart, Bar, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, StatCard, Skeleton, CHART_PALETTE } from './shared.js';

const html = htm.bind(React.createElement);

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-[rgba(255,59,48,0.06)]', border: 'border-[var(--app-danger)]', icon: '🔴', text: 'text-[var(--app-danger)]', badge: 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' },
  warning: { bg: 'bg-[rgba(255,149,0,0.06)]', border: 'border-[rgba(255,149,0,0.3)]', icon: '🟡', text: 'text-amber-700', badge: 'bg-[rgba(255,149,0,0.12)] text-amber-800' },
  info: { bg: 'bg-[var(--app-accent-soft)]', border: 'border-[var(--app-accent)]', icon: '🔵', text: 'text-[var(--app-accent)]', badge: 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' },
};

const ALERT_TYPE_LABELS = {
  error_spike: 'Error Spike',
  client_error_spike: 'Client Errors',
  latency_degradation: 'Latency',
  tail_latency: 'Tail Latency',
  recurring_error: 'Recurring Error',
  endpoint_degradation: 'Endpoint Health',
  traffic_drop: 'Traffic Drop',
};

const AlertCard = ({ alert }) => {
  const [showDetails, setShowDetails] = useState(false);
  const cfg = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.info;
  return html`
    <div className=${'rounded-2xl border p-5 transition-all ' + cfg.bg + ' ' + cfg.border}>
      <div className="flex items-start gap-3">
        <span className="text-xl mt-0.5">${cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className=${'font-semibold text-sm ' + cfg.text}>${alert.title}</h4>
            <span className=${'px-2 py-0.5 rounded-full text-xs font-semibold ' + cfg.badge}>${alert.severity}</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[var(--app-surface)] border border-[var(--app-border-soft)] text-[var(--app-text-secondary)]">${ALERT_TYPE_LABELS[alert.type] || alert.type}</span>
          </div>
          <p className="text-sm text-[var(--app-text-secondary)] mb-2">${alert.message}</p>
          <div className="flex items-center gap-4 text-xs text-[var(--app-text-muted)]">
            <span>Detected: ${alert.detected_at ? new Date(alert.detected_at * 1000).toLocaleString() : 'Unknown'}</span>
            ${alert.metric_value != null ? html`
              <span>Value: <strong className="text-[var(--app-text-secondary)]">${alert.metric_value}${alert.unit}</strong> (threshold: ${alert.threshold}${alert.unit})</span>
            ` : null}
          </div>
          ${showDetails ? html`
            <div className="mt-3 p-3 bg-[var(--app-surface)]/60 rounded-xl border border-[var(--app-border-soft)]/50">
              ${alert.hint ? html`<p className="text-xs text-[var(--app-text-secondary)] mb-2"><strong>Resolution hint:</strong> ${alert.hint}</p>` : null}
              ${alert.route ? html`<p className="text-xs text-[var(--app-text-secondary)]"><strong>Route:</strong> <code className="bg-[var(--app-surface-muted)] px-1.5 py-0.5 rounded text-xs">${alert.route}</code></p>` : null}
              ${alert.sample_error ? html`<p className="text-xs text-[var(--app-danger)] mt-1"><strong>Sample:</strong> ${alert.sample_error}</p>` : null}
            </div>
          ` : null}
        </div>
        <button
          onClick=${() => setShowDetails(!showDetails)}
          className="text-xs text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] px-2 py-1 rounded-lg hover:bg-[var(--app-surface)] transition-colors shrink-0"
        >${showDetails ? 'Hide' : 'Details'}</button>
      </div>
    </div>
  `;
};

const AlertsTab = ({ alertData, loading }) => {
  if (loading) return html`<${Skeleton} />`;
  const alerts = alertData?.alerts || [];
  const criticalCount = alertData?.critical_count ?? 0;
  const warningCount = alertData?.warning_count ?? 0;

  if (!alerts.length) {
    return html`
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <${StatCard} label="Total Alerts" value=${0} color="text-[var(--app-success)]" />
          <${StatCard} label="Critical" value=${0} color="text-[var(--app-success)]" />
          <${StatCard} label="Warnings" value=${0} color="text-[var(--app-success)]" />
        </div>
        <${Card} title="Anomaly Detection">
          <div className="h-48 flex flex-col items-center justify-center text-center px-4">
            <div className="w-16 h-16 bg-[rgba(52,199,89,0.12)] rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--app-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <p className="text-[var(--app-success)] font-bold">All Systems Healthy</p>
            <p className="mt-2 text-sm text-[var(--app-text-muted)]">No anomalies detected. Error rates, latency, and traffic patterns are within normal thresholds.</p>
          </div>
        <//>
      </div>
    `;
  }

  const alertsByType = {};
  alerts.forEach(a => {
    const t = ALERT_TYPE_LABELS[a.type] || a.type;
    alertsByType[t] = (alertsByType[t] || 0) + 1;
  });
  const typeChartData = Object.entries(alertsByType).map(([name, value], i) => ({ name, value, fill: CHART_PALETTE[i % CHART_PALETTE.length] }));

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <${StatCard} label="Total Alerts" value=${alerts.length} color=${criticalCount > 0 ? 'text-[var(--app-danger)]' : 'text-amber-600'} />
        <${StatCard} label="Critical" value=${criticalCount} color="text-[var(--app-danger)]" />
        <${StatCard} label="Warnings" value=${warningCount} color="text-amber-600" />
        <${StatCard} label="Health Score" value=${Math.max(0, 100 - criticalCount * 20 - warningCount * 5) + '/100'} color=${criticalCount > 0 ? 'text-[var(--app-danger)]' : 'text-[var(--app-success)]'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <${Card} title="Alerts by Category">
          <${ResponsiveContainer} width="100%" height=${220}>
            <${BarChart} data=${typeChartData}>
              <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
              <${XAxis} dataKey="name" stroke="#64748b" tick=${{ fontSize: 9 }} angle=${-15} textAnchor="end" height=${50} />
              <${YAxis} stroke="#64748b" allowDecimals=${false} />
              <${Tooltip} />
              <${Bar} dataKey="value" name="Alerts" radius=${[4, 4, 0, 0]}>
                ${typeChartData.map((e, i) => html`<${Cell} key=${i} fill=${e.fill} />`)}
              <//>
            <//>
          <//>
        <//>

        <${Card} title="Severity Breakdown">
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-[var(--app-danger)] uppercase">Critical</span>
                  <span className="text-xs font-bold text-[var(--app-danger)]">${criticalCount}</span>
                </div>
                <div className="h-4 bg-[rgba(255,59,48,0.12)] rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--app-danger)] rounded-full transition-all" style=${{ width: (alerts.length ? criticalCount / alerts.length * 100 : 0) + '%' }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-semibold text-amber-600 uppercase">Warning</span>
                  <span className="text-xs font-bold text-amber-600">${warningCount}</span>
                </div>
                <div className="h-4 bg-[rgba(255,149,0,0.12)] rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style=${{ width: (alerts.length ? warningCount / alerts.length * 100 : 0) + '%' }} />
                </div>
              </div>
            </div>
          </div>
        <//>
      </div>

      <${Card} title="Active Alerts" className="overflow-visible">
        <div className="space-y-3">
          ${alerts.map(a => html`<${AlertCard} key=${a.id} alert=${a} />`)}
        </div>
      <//>
    </div>
  `;
};

export { AlertsTab };
