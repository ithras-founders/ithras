/**
 * Analytics strip: compact metric cards with optional trends.
 */
import React from 'react';
import htm from 'htm';
import { TrendingUp, TrendingDown } from 'lucide-react';

const html = htm.bind(React.createElement);

/**
 * @param {{ stats: { currentEmployees?: number, alumni?: number, totalRoles?: number, activeDepartments?: number, growth12mo?: number, retentionRate?: number, hiringVelocity?: number } }} props
 */
const CompanyStatsGrid = ({ stats = {} }) => {
  const items = [
    { label: 'Current employees', value: stats.currentEmployees ?? 0 },
    { label: 'Alumni', value: stats.alumni ?? 0 },
    { label: 'Total roles', value: stats.totalRoles ?? 0 },
    { label: 'Active departments', value: stats.activeDepartments ?? 0 },
    { label: 'Growth (12 mo)', value: `${stats.growth12mo ?? 0}%`, trend: stats.growth12mo >= 0 ? 'up' : 'down' },
    { label: 'Retention', value: `${stats.retentionRate ?? 0}%`, trend: 'up' },
    { label: 'Hiring velocity', value: stats.hiringVelocity ?? 0, sub: 'mo' },
  ];

  return html`
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      ${items.map((item) =>
        html`
          <div
            key=${item.label}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 truncate">${item.label}</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-xl font-bold text-gray-900">${item.value}${item.sub ? ` / ${item.sub}` : ''}</span>
              ${item.trend
                ? html`
                    <span className=${`flex items-center text-xs ${item.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                      ${item.trend === 'up' ? html`<${TrendingUp} className="w-3.5 h-3.5" />` : html`<${TrendingDown} className="w-3.5 h-3.5" />`}
                    </span>
                  `
                : null}
            </div>
            <div className="mt-1 h-6 bg-gray-100 rounded" style=${{ minWidth: '40px' }} />
          </div>
        `
      )}
    </div>
  `;
};

export default CompanyStatsGrid;
