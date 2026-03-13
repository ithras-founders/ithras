import React from 'react';
import htm from 'htm';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, Skeleton, EmptyState, COLORS } from './shared.js';

const html = htm.bind(React.createElement);

const ApiViewTab = ({ metrics, clientApi, loading }) => {
  if (loading) return html`<${Skeleton} />`;

  const endpointBarData = (metrics?.metrics || []).slice(0, 10).map(m => ({
    name: (m.method + ' ' + m.path).slice(0, 45),
    total: m.total,
    '2xx': m['2xx'],
    '4xx': m['4xx'],
    '5xx': m['5xx'],
  }));

  const failingEndpoints = (metrics?.metrics || [])
    .filter(m => (m['4xx'] || 0) + (m['5xx'] || 0) > 0)
    .map(m => ({ ...m, errorRate: m.total > 0 ? (((m['4xx'] || 0) + (m['5xx'] || 0)) / m.total * 100).toFixed(1) : '0' }))
    .sort((a, b) => parseFloat(b.errorRate) - parseFloat(a.errorRate))
    .slice(0, 10);

  const slowest = [...(metrics?.metrics || [])].sort((a, b) => (b.p95_ms || 0) - (a.p95_ms || 0)).slice(0, 10);

  const clientApiData = (clientApi || []).slice(0, 10).map(e => ({
    name: (e.method + ' ' + e.path).slice(0, 45),
    avg_ms: e.avg_ms,
    p50_ms: e.p50_ms,
    p95_ms: e.p95_ms,
    count: e.count,
  }));

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <${Card} title="Top Endpoints by Request Count">
          ${endpointBarData.length === 0 ? html`<${EmptyState} message="No endpoint data" />` : html`
            <${ResponsiveContainer} width="100%" height=${300}>
              <${BarChart} data=${endpointBarData} layout="vertical" margin=${{ left: 100 }}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} type="number" stroke="#64748b" />
                <${YAxis} type="category" dataKey="name" width=${95} stroke="#64748b" tick=${{ fontSize: 9 }} />
                <${Tooltip} />
                <${Legend} />
                <${Bar} dataKey="2xx" stackId="a" fill=${COLORS['2xx']} name="2xx" />
                <${Bar} dataKey="4xx" stackId="a" fill=${COLORS['4xx']} name="4xx" />
                <${Bar} dataKey="5xx" stackId="a" fill=${COLORS['5xx']} name="5xx" />
              <//>
            <//>
          `}
        <//>

        <${Card} title="Slowest Endpoints (by P95)">
          ${slowest.length === 0 ? html`<${EmptyState} message="No latency data" />` : html`
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--app-border-soft)]">
                    <th className="text-left py-3 font-semibold text-[var(--app-text-secondary)]">Endpoint</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Avg</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">P50</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">P95</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">P99</th>
                  </tr>
                </thead>
                <tbody>
                  ${slowest.map(m => html`
                    <tr key=${m.path + m.method} className="border-b border-[var(--app-border-soft)]">
                      <td className="py-2 font-mono text-xs">${m.method} ${m.path}</td>
                      <td className="text-right py-2">${m.avg_ms || '-'}ms</td>
                      <td className="text-right py-2">${m.p50_ms}ms</td>
                      <td className="text-right py-2 font-bold text-amber-600">${m.p95_ms}ms</td>
                      <td className="text-right py-2 text-[var(--app-danger)]">${m.p99_ms}ms</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          `}
        <//>
      </div>

      ${failingEndpoints.length > 0 ? html`
        <${Card} title="Top Failing Endpoints">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left py-3 font-semibold text-[var(--app-text-secondary)]">Endpoint</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Total</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">4xx</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">5xx</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Error Rate</th>
                </tr>
              </thead>
              <tbody>
                ${failingEndpoints.map(m => html`
                  <tr key=${m.path + m.method} className="border-b border-[var(--app-border-soft)]">
                    <td className="py-2 font-mono text-xs">${m.method} ${m.path}</td>
                    <td className="text-right py-2">${m.total}</td>
                    <td className="text-right py-2 text-amber-600">${m['4xx']}</td>
                    <td className="text-right py-2 text-[var(--app-danger)]">${m['5xx']}</td>
                    <td className="text-right py-2 font-bold text-[var(--app-danger)]">${m.errorRate}%</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        <//>
      ` : null}

      <${Card} title="Client-Side API Latency (Browser Experience)">
        ${clientApiData.length === 0 ? html`<${EmptyState} message="No client API data yet" hint="Client-side API timing is recorded as you navigate the app." />` : html`
          <${ResponsiveContainer} width="100%" height=${280}>
            <${BarChart} data=${clientApiData} layout="vertical" margin=${{ left: 100 }}>
              <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
              <${XAxis} type="number" stroke="#64748b" label=${{ value: 'ms', position: 'insideBottomRight' }} />
              <${YAxis} type="category" dataKey="name" width=${95} stroke="#64748b" tick=${{ fontSize: 9 }} />
              <${Tooltip} />
              <${Legend} />
              <${Bar} dataKey="avg_ms" fill="#6366f1" name="Avg (ms)" />
              <${Bar} dataKey="p95_ms" fill="#a78bfa" name="P95 (ms)" />
            <//>
          <//>
        `}
      <//>
    </div>
  `;
};

export { ApiViewTab };
