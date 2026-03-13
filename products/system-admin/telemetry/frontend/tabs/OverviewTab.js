import React from 'react';
import htm from 'htm';
import {
  AreaChart, Area, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, StatCard, Skeleton, EmptyState, formatTime } from './shared.js';

const html = htm.bind(React.createElement);

const OverviewTab = ({ summary, timeseries, statusPieData, loading }) => {
  if (loading) return html`<${Skeleton} />`;

  const tsData = (timeseries || []).map(d => ({
    time: formatTime(d.ts),
    requests: d.count,
    avg_ms: d.avg_ms,
    errors: d.errors,
  }));

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6" data-tour-id="telemetry-stats">
        <${StatCard} label="Total Requests" value=${summary?.total_requests ?? 0} />
        <${StatCard} label="Success Rate" value=${((summary?.success_rate ?? 0) * 100).toFixed(1) + '%'} color="text-[var(--app-success)]" />
        <${StatCard} label="Avg Latency" value=${(summary?.avg_latency_ms ?? 0) + 'ms'} />
        <${StatCard} label="P95 Latency" value=${(summary?.p95_ms ?? 0) + 'ms'} />
        <${StatCard} label="Active Users" value=${summary?.active_users ?? 0} color="text-[var(--app-accent)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8" data-tour-id="telemetry-timeseries">
        <${Card} title="Requests Over Time">
          ${tsData.length === 0 ? html`<${EmptyState} message="No time-series data" hint="Data accumulates as API requests flow in." />` : html`
            <${ResponsiveContainer} width="100%" height=${280}>
              <${AreaChart} data=${tsData}>
                <defs>
                  <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity=${0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity=${0} />
                  </linearGradient>
                </defs>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="time" stroke="#64748b" tick=${{ fontSize: 10 }} />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} />
                <${Area} type="monotone" dataKey="requests" stroke="#6366f1" fillOpacity=${1} fill="url(#colorReq)" name="Requests" />
                <${Line} type="monotone" dataKey="errors" stroke="#ef4444" dot=${false} name="Errors" />
              <//>
            <//>
          `}
        <//>

        <${Card} title="Status Distribution">
          ${statusPieData.length === 0 ? html`<${EmptyState} message="No requests in this window" />` : statusPieData.length === 1 ? html`
            <div className="h-64 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-[rgba(52,199,89,0.12)] flex items-center justify-center">
                <span className="text-3xl font-semibold text-[var(--app-success)]">${((summary?.success_rate ?? 0) * 100).toFixed(0)}%</span>
              </div>
              <p className="mt-3 text-[var(--app-text-secondary)] font-medium">All requests successful</p>
              <p className="text-sm text-[var(--app-text-muted)]">${statusPieData[0].value.toLocaleString()} ${statusPieData[0].name}</p>
            </div>
          ` : html`
            <${ResponsiveContainer} width="100%" height=${280}>
              <${PieChart}>
                <${Pie} data=${statusPieData} cx="50%" cy="50%" innerRadius=${60} outerRadius=${100} paddingAngle=${2} dataKey="value" nameKey="name">
                  ${statusPieData.map((entry, i) => html`<${Cell} key=${i} fill=${entry.fill} />`)}
                <//>
                <${Tooltip} />
                <${Legend} />
              <//>
            <//>
          `}
        <//>
      </div>

      <${Card} title="Latency Distribution">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl">
            <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase">P50</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">${summary?.p50_ms ?? 0}ms</p>
          </div>
          <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl">
            <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase">P95</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">${summary?.p95_ms ?? 0}ms</p>
          </div>
          <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl">
            <p className="text-xs font-semibold text-[var(--app-text-secondary)] uppercase">P99</p>
            <p className="text-2xl font-semibold text-[var(--app-text-primary)]">${summary?.p99_ms ?? 0}ms</p>
          </div>
        </div>
      <//>
    </div>
  `;
};

export { OverviewTab };
