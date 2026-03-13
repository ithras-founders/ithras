import React, { useState } from 'react';
import htm from 'htm';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, StatCard, Skeleton, EmptyState, CHART_PALETTE } from './shared.js';

const html = htm.bind(React.createElement);

const formatDuration = (seconds) => {
  if (seconds < 60) return seconds + 's';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h + 'h ' + m + 'm';
};

const SessionRow = ({ session }) => {
  const [expanded, setExpanded] = useState(false);
  const s = session;
  const errorBadge = s.errors > 0
    ? html`<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]">${s.errors} errors</span>`
    : html`<span className="px-2 py-0.5 text-xs font-bold rounded-full bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]">Clean</span>`;
  const deviceIcon = s.device === 'Mobile' ? '📱' : s.device === 'Tablet' ? '📟' : '🖥️';

  return html`
    <div className="border border-[var(--app-border-soft)] rounded-2xl overflow-hidden transition-all">
      <button
        onClick=${() => setExpanded(!expanded)}
        className="w-full px-5 py-4 flex items-center gap-4 text-left hover:bg-[var(--app-surface-muted)] transition-colors"
      >
        <span className="text-lg">${deviceIcon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-[var(--app-text-primary)]">${s.user_id || 'Anonymous'}</span>
            ${errorBadge}
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]">${s.browser} · ${s.os}</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-[var(--app-text-muted)]">
            <span>${formatDuration(s.duration_seconds)}</span>
            <span>${s.total_events} events</span>
            <span>${s.pages_visited} pages</span>
            <span className="font-mono">${s.client_ip || '-'}</span>
          </div>
        </div>
        <div className="text-xs text-[var(--app-text-muted)] text-right shrink-0">
          ${s.start_ts ? new Date(s.start_ts * 1000).toLocaleTimeString() : '-'}
          <br/>
          <span className="text-[var(--app-text-muted)]">${s.session_id?.slice(0, 16)}</span>
        </div>
        <svg className=${'w-5 h-5 text-[var(--app-text-muted)] transition-transform ' + (expanded ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
      </button>
      ${expanded ? html`
        <div className="px-5 pb-5 border-t border-[var(--app-border-soft)] bg-[var(--app-surface-muted)]/50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase">Server Events</p>
              <p className="text-lg font-semibold text-[var(--app-text-primary)]">${s.server_events}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase">Client Events</p>
              <p className="text-lg font-semibold text-[var(--app-text-primary)]">${s.client_events}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase">API Calls</p>
              <p className="text-lg font-semibold text-[var(--app-text-primary)]">${s.api_calls}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase">Avg Response</p>
              <p className="text-lg font-semibold text-[var(--app-text-primary)]">${s.avg_response_ms}ms</p>
            </div>
          </div>
          ${s.pages?.length ? html`
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-2">Pages Visited</p>
              <div className="flex flex-wrap gap-2">
                ${(s.pages || []).map(p => html`
                  <span key=${p} className="px-3 py-1 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg text-xs font-medium text-[var(--app-text-secondary)]">${p}</span>
                `)}
              </div>
            </div>
          ` : null}
          <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-[var(--app-text-secondary)]">
            <div><span className="font-bold text-[var(--app-text-secondary)]">Session ID:</span> <span className="font-mono">${s.session_id}</span></div>
            <div><span className="font-bold text-[var(--app-text-secondary)]">IP Address:</span> <span className="font-mono">${s.client_ip || 'N/A'}</span></div>
            <div><span className="font-bold text-[var(--app-text-secondary)]">Started:</span> ${s.start_ts ? new Date(s.start_ts * 1000).toLocaleString() : 'N/A'}</div>
            <div><span className="font-bold text-[var(--app-text-secondary)]">Ended:</span> ${s.end_ts ? new Date(s.end_ts * 1000).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
      ` : null}
    </div>
  `;
};

const SessionsTab = ({ sessionData, loading }) => {
  if (loading) return html`<${Skeleton} />`;
  const sessions = sessionData?.sessions || [];
  const browserDist = sessionData?.browser_distribution || {};
  const osDist = sessionData?.os_distribution || {};
  const deviceDist = sessionData?.device_distribution || {};

  const browserPie = Object.entries(browserDist).map(([name, value], i) => ({ name, value, fill: CHART_PALETTE[i % CHART_PALETTE.length] }));
  const osPie = Object.entries(osDist).map(([name, value], i) => ({ name, value, fill: CHART_PALETTE[(i + 3) % CHART_PALETTE.length] }));
  const devicePie = Object.entries(deviceDist).map(([name, value], i) => ({ name, value, fill: CHART_PALETTE[(i + 5) % CHART_PALETTE.length] }));

  if (!sessions.length) {
    return html`
      <div className="space-y-8">
        <${Card} title="Session Explorer">
          <${EmptyState}
            message="No sessions recorded yet"
            hint="Sessions are tracked automatically as users navigate the app. Each browser tab gets a unique session ID."
          />
        <//>
      </div>
    `;
  }

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <${StatCard} label="Total Sessions" value=${sessionData?.total_sessions ?? sessions.length} color="text-[var(--app-accent)]" />
        <${StatCard} label="Avg Duration" value=${formatDuration(sessionData?.avg_duration_seconds ?? 0)} />
        <${StatCard} label="Avg Pages/Session" value=${sessionData?.avg_pages_per_session ?? 0} color="text-[var(--app-success)]" />
        <${StatCard} label="Unique IPs" value=${new Set(sessions.map(s => s.client_ip).filter(Boolean)).size} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <${Card} title="Browser Distribution">
          ${browserPie.length === 0 ? html`<${EmptyState} message="No data" />` : html`
            <${ResponsiveContainer} width="100%" height=${200}>
              <${PieChart}>
                <${Pie} data=${browserPie} cx="50%" cy="50%" innerRadius=${40} outerRadius=${70} paddingAngle=${2} dataKey="value" nameKey="name">
                  ${browserPie.map((e, i) => html`<${Cell} key=${i} fill=${e.fill} />`)}
                <//>
                <${Tooltip} />
                <${Legend} wrapperStyle=${{ fontSize: 11 }} />
              <//>
            <//>
          `}
        <//>
        <${Card} title="Operating System">
          ${osPie.length === 0 ? html`<${EmptyState} message="No data" />` : html`
            <${ResponsiveContainer} width="100%" height=${200}>
              <${PieChart}>
                <${Pie} data=${osPie} cx="50%" cy="50%" innerRadius=${40} outerRadius=${70} paddingAngle=${2} dataKey="value" nameKey="name">
                  ${osPie.map((e, i) => html`<${Cell} key=${i} fill=${e.fill} />`)}
                <//>
                <${Tooltip} />
                <${Legend} wrapperStyle=${{ fontSize: 11 }} />
              <//>
            <//>
          `}
        <//>
        <${Card} title="Device Type">
          ${devicePie.length === 0 ? html`<${EmptyState} message="No data" />` : html`
            <${ResponsiveContainer} width="100%" height=${200}>
              <${PieChart}>
                <${Pie} data=${devicePie} cx="50%" cy="50%" innerRadius=${40} outerRadius=${70} paddingAngle=${2} dataKey="value" nameKey="name">
                  ${devicePie.map((e, i) => html`<${Cell} key=${i} fill=${e.fill} />`)}
                <//>
                <${Tooltip} />
                <${Legend} wrapperStyle=${{ fontSize: 11 }} />
              <//>
            <//>
          `}
        <//>
      </div>

      <${Card} title="Session Explorer" className="overflow-visible">
        <div className="space-y-3">
          ${sessions.map(s => html`<${SessionRow} key=${s.session_id} session=${s} />`)}
        </div>
      <//>
    </div>
  `;
};

export { SessionsTab };
