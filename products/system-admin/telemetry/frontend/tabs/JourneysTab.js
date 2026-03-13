import React from 'react';
import htm from 'htm';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, StatCard, Skeleton, EmptyState } from './shared.js';

const html = htm.bind(React.createElement);

const FUNNEL_COLORS = ['#6366f1', '#818cf8', '#a78bfa', '#c4b5fd', '#ddd6fe'];
const FunnelBar = ({ steps, total }) => {
  if (!steps?.length) return null;
  return html`
    <div className="space-y-3">
      ${steps.map((step, i) => {
        const pct = step.percentage || 0;
        const barColor = FUNNEL_COLORS[i % FUNNEL_COLORS.length];
        return html`
          <div key=${i}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white" style=${{ background: barColor }}>${i + 1}</span>
                <span className="text-sm font-bold text-[var(--app-text-secondary)]">${step.label}</span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="font-semibold text-[var(--app-text-primary)]">${step.count.toLocaleString()}</span>
                <span className="text-[var(--app-text-muted)]">${pct}%</span>
                ${i > 0 && step.drop_off > 0 ? html`<span className="text-[var(--app-danger)] font-bold">↓${step.drop_off}%</span>` : null}
              </div>
            </div>
            <div className="h-3 bg-[var(--app-surface-muted)] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style=${{ width: pct + '%', background: barColor }} />
            </div>
          </div>
        `;
      })}
    </div>
  `;
};

const JourneysTab = ({ funnelData, loading }) => {
  if (loading) return html`<${Skeleton} />`;
  const funnels = funnelData?.funnels || [];

  if (!funnels.length) {
    return html`
      <div className="space-y-8">
        <${Card} title="Journey Funnels">
          <${EmptyState}
            message="No funnel data yet"
            hint="Funnel analytics are computed from real user journeys. Navigate through the app to generate data."
          />
        <//>
      </div>
    `;
  }

  const conversionData = funnels.map(f => ({
    name: f.name.split(' ')[0],
    conversion: f.conversion || 0,
    sessions: f.total_sessions || 0,
  }));

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <${StatCard} label="Total Funnels Tracked" value=${funnels.length} color="text-[var(--app-accent)]" />
        <${StatCard} label="Avg Conversion Rate" value=${(funnels.reduce((s, f) => s + (f.conversion || 0), 0) / funnels.length).toFixed(1) + '%'} color="text-[var(--app-success)]" />
        <${StatCard} label="Total Sessions Analyzed" value=${funnels.reduce((s, f) => s + (f.total_sessions || 0), 0).toLocaleString()} />
      </div>

      <${Card} title="Conversion Rate Comparison">
        <${ResponsiveContainer} width="100%" height=${240}>
          <${BarChart} data=${conversionData}>
            <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
            <${XAxis} dataKey="name" stroke="#64748b" tick=${{ fontSize: 10 }} />
            <${YAxis} stroke="#64748b" unit="%" />
            <${Tooltip} formatter=${(v, n) => n === 'conversion' ? v + '%' : v} />
            <${Legend} />
            <${Bar} dataKey="conversion" fill="#6366f1" name="Conversion %" radius=${[4, 4, 0, 0]} />
            <${Bar} dataKey="sessions" fill="#a78bfa" name="Sessions" radius=${[4, 4, 0, 0]} />
          <//>
        <//>
      <//>

      ${funnels.map(f => html`
        <${Card} key=${f.id} title=${f.name} className="relative">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[var(--app-text-secondary)]">${f.description}</p>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold ${'bg-' + (f.conversion >= 50 ? 'emerald' : f.conversion >= 25 ? 'amber' : 'red') + '-100 text-' + (f.conversion >= 50 ? 'emerald' : f.conversion >= 25 ? 'amber' : 'red') + '-700'}">
                ${f.conversion}% conversion
              </span>
              <span className="text-xs text-[var(--app-text-muted)]">${(f.total_sessions || 0).toLocaleString()} sessions</span>
            </div>
          </div>
          <${FunnelBar} steps=${f.steps} total=${f.total_sessions} />
        <//>
      `)}
    </div>
  `;
};

export { JourneysTab };
