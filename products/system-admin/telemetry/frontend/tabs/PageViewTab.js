import React from 'react';
import htm from 'htm';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Card, Skeleton, EmptyState } from './shared.js';

const html = htm.bind(React.createElement);

const PageViewTab = ({ pageMetrics, loading }) => {
  if (loading) return html`<${Skeleton} />`;

  const pages = (pageMetrics || []).filter(p => p.avg_duration_ms > 0 || p.count > 0);
  const timeSpentData = pages.map(p => ({
    name: (p.product || 'general') + '/' + (p.view || 'unknown'),
    avg_ms: Math.round(p.avg_duration_ms),
    count: p.count,
  })).sort((a, b) => b.avg_ms - a.avg_ms).slice(0, 12);

  const visitCountData = pages.map(p => ({
    name: (p.product || 'general') + '/' + (p.view || 'unknown'),
    visits: p.count,
  })).sort((a, b) => b.visits - a.visits).slice(0, 12);

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <${Card} title="Avg Time Spent per Page (ms)">
          ${timeSpentData.length === 0 ? html`<${EmptyState} message="No page view data" hint="Navigate between views and data will appear." />` : html`
            <${ResponsiveContainer} width="100%" height=${280}>
              <${BarChart} data=${timeSpentData}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" tick=${{ fontSize: 9 }} angle=${-25} textAnchor="end" height=${60} />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} />
                <${Bar} dataKey="avg_ms" fill="#8b5cf6" name="Avg Time (ms)" radius=${[4,4,0,0]} />
              <//>
            <//>
          `}
        <//>

        <${Card} title="Page Visit Counts">
          ${visitCountData.length === 0 ? html`<${EmptyState} message="No visit data" />` : html`
            <${ResponsiveContainer} width="100%" height=${280}>
              <${BarChart} data=${visitCountData}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" tick=${{ fontSize: 9 }} angle=${-25} textAnchor="end" height=${60} />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} />
                <${Bar} dataKey="visits" fill="#6366f1" name="Visits" radius=${[4,4,0,0]} />
              <//>
            <//>
          `}
        <//>
      </div>

      <${Card} title="All Pages">
        ${pages.length === 0 ? html`<${EmptyState} message="No page data recorded" />` : html`
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left py-3 font-semibold text-[var(--app-text-secondary)]">Page</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Visits</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Avg Duration</th>
                </tr>
              </thead>
              <tbody>
                ${pages.sort((a, b) => b.count - a.count).map(p => html`
                  <tr key=${p.product + p.view} className="border-b border-[var(--app-border-soft)]">
                    <td className="py-2">${p.product || 'general'}/${p.view || 'unknown'}</td>
                    <td className="text-right py-2">${p.count}</td>
                    <td className="text-right py-2">${Math.round(p.avg_duration_ms)}ms</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `}
      <//>
    </div>
  `;
};

export { PageViewTab };
