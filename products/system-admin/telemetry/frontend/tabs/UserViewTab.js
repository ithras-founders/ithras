import React from 'react';
import htm from 'htm';
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, StatCard, Skeleton, EmptyState } from './shared.js';

const html = htm.bind(React.createElement);

const UserViewTab = ({ activeUsers, loading }) => {
  if (loading) return html`<${Skeleton} />`;

  const users = activeUsers?.users || [];
  const topUsers = users.slice(0, 10);
  const topUsersChart = topUsers.map(u => ({ name: (u.user_id || '').slice(0, 20), events: u.events, pages: u.pages_visited }));

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <${StatCard} label="Active Users" value=${activeUsers?.active_count ?? 0} color="text-[var(--app-accent)]" />
        <${StatCard} label="Total Events" value=${users.reduce((s, u) => s + u.events, 0)} />
        <${StatCard} label="Avg Events/User" value=${users.length > 0 ? Math.round(users.reduce((s, u) => s + u.events, 0) / users.length) : 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <${Card} title="Most Active Users">
          ${topUsersChart.length === 0 ? html`<${EmptyState} message="No user activity data" hint="Users need to be logged in, and user_id tracking must be active." />` : html`
            <${ResponsiveContainer} width="100%" height=${280}>
              <${BarChart} data=${topUsersChart}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} dataKey="name" stroke="#64748b" tick=${{ fontSize: 9 }} angle=${-25} textAnchor="end" height=${60} />
                <${YAxis} stroke="#64748b" />
                <${Tooltip} />
                <${Legend} />
                <${Bar} dataKey="events" fill="#6366f1" name="Events" radius=${[4,4,0,0]} />
                <${Bar} dataKey="pages" fill="#a78bfa" name="Pages Visited" radius=${[4,4,0,0]} />
              <//>
            <//>
          `}
        <//>

        <${Card} title="User Activity">
          ${users.length === 0 ? html`<${EmptyState} message="No active users found" />` : html`
            <div className="overflow-x-auto max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-[var(--app-surface)]">
                  <tr className="border-b border-[var(--app-border-soft)]">
                    <th className="text-left py-3 font-semibold text-[var(--app-text-secondary)]">User ID</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Events</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Pages</th>
                    <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => html`
                    <tr key=${u.user_id} className="border-b border-[var(--app-border-soft)]">
                      <td className="py-2 font-mono text-xs">${u.user_id}</td>
                      <td className="text-right py-2">${u.events}</td>
                      <td className="text-right py-2">${u.pages_visited}</td>
                      <td className="text-right py-2 text-xs text-[var(--app-text-secondary)]">${u.last_seen ? new Date(u.last_seen * 1000).toLocaleString() : '-'}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          `}
        <//>
      </div>
    </div>
  `;
};

export { UserViewTab };
