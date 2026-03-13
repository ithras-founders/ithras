import React from 'react';
import htm from 'htm';
import {
  BarChart, Bar, PieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Card, StatCard, Skeleton, EmptyState, formatBytes } from './shared.js';

const html = htm.bind(React.createElement);

const DatabaseViewTab = ({ dbHealth, loading }) => {
  if (loading) return html`<${Skeleton} />`;

  if (dbHealth?.error) {
    return html`
      <${Card} title="Database Health">
        <div className="text-[var(--app-danger)] p-4">${dbHealth.error}</div>
      <//>
    `;
  }

  const tables = dbHealth?.tables || [];
  const connections = dbHealth?.connections || {};
  const largestTables = [...tables].sort((a, b) => (b.size_bytes || 0) - (a.size_bytes || 0)).slice(0, 10).map(t => ({
    name: t.table_name,
    size_mb: t.size_mb || 0,
    rows: t.row_count || 0,
  }));

  const connData = [
    { name: 'Active', value: connections.active || 0, fill: '#10b981' },
    { name: 'Idle', value: connections.idle || 0, fill: '#6366f1' },
    { name: 'Idle in Txn', value: connections.idle_in_transaction || 0, fill: '#f59e0b' },
  ].filter(d => d.value > 0);

  return html`
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <${StatCard} label="Total Tables" value=${dbHealth?.total_tables ?? 0} />
        <${StatCard} label="Database Size" value=${formatBytes(dbHealth?.database_size_bytes ?? 0)} color="text-[var(--app-accent)]" />
        <${StatCard} label="Connections" value=${connections.total ?? 0} />
        <${StatCard} label="Active Conns" value=${connections.active ?? 0} color="text-[var(--app-success)]" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <${Card} title="Largest Tables (by size)">
          ${largestTables.length === 0 ? html`<${EmptyState} message="No table data" />` : html`
            <${ResponsiveContainer} width="100%" height=${300}>
              <${BarChart} data=${largestTables} layout="vertical" margin=${{ left: 80 }}>
                <${CartesianGrid} strokeDasharray="3 3" stroke="#e2e8f0" />
                <${XAxis} type="number" stroke="#64748b" label=${{ value: 'MB', position: 'insideBottomRight' }} />
                <${YAxis} type="category" dataKey="name" width=${75} stroke="#64748b" tick=${{ fontSize: 10 }} />
                <${Tooltip} />
                <${Bar} dataKey="size_mb" fill="#6366f1" name="Size (MB)" radius=${[0,4,4,0]} />
              <//>
            <//>
          `}
        <//>

        <${Card} title="Connection Pool">
          ${connData.length === 0 ? html`<${EmptyState} message="No connection data" />` : html`
            <${ResponsiveContainer} width="100%" height=${300}>
              <${PieChart}>
                <${Pie} data=${connData} cx="50%" cy="50%" innerRadius=${60} outerRadius=${100} paddingAngle=${2} dataKey="value" nameKey="name">
                  ${connData.map((entry, i) => html`<${Cell} key=${i} fill=${entry.fill} />`)}
                <//>
                <${Tooltip} />
                <${Legend} />
              <//>
            <//>
          `}
        <//>
      </div>

      <${Card} title="All Tables">
        ${tables.length === 0 ? html`<${EmptyState} message="No tables found" />` : html`
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--app-surface)]">
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left py-3 font-semibold text-[var(--app-text-secondary)]">Table</th>
                  <th className="text-left py-3 font-semibold text-[var(--app-text-secondary)]">Schema</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Rows</th>
                  <th className="text-right py-3 font-semibold text-[var(--app-text-secondary)]">Size</th>
                </tr>
              </thead>
              <tbody>
                ${tables.sort((a, b) => (b.row_count || 0) - (a.row_count || 0)).map(t => html`
                  <tr key=${t.table_name} className="border-b border-[var(--app-border-soft)]">
                    <td className="py-2 font-mono text-xs">${t.table_name}</td>
                    <td className="py-2 text-[var(--app-text-secondary)]">${t.table_schema}</td>
                    <td className="text-right py-2">${(t.row_count || 0).toLocaleString()}</td>
                    <td className="text-right py-2">${formatBytes(t.size_bytes)}</td>
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

export { DatabaseViewTab };
