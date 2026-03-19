/**
 * Programme/Role distribution horizontal bar chart - CSS-only, no recharts.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ items: Array<{ name: string, count: number }> }} props
 */
const ProgrammeDistributionChart = ({ items = [] }) => {
  const hasData = items.length > 0 && items.some((i) => (i.count || 0) > 0);

  if (!hasData) return null;

  const data = items
    .filter((i) => (i.count || 0) > 0)
    .map((i) => ({ name: i.name.length > 20 ? i.name.slice(0, 17) + '...' : i.name, count: i.count }))
    .slice(0, 10);

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="space-y-3">
        ${data.map(
          (item, i) => html`
            <div key=${i} className="flex items-center gap-3">
              <span className="w-32 text-sm text-gray-700 truncate flex-shrink-0" title=${item.name}>
                ${item.name}
              </span>
              <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded transition-all min-w-[4px]"
                  style=${{ width: `${(item.count / maxCount) * 100}%` }}
                  title=${item.count}
                />
              </div>
              <span className="w-8 text-sm font-medium text-gray-900 text-right flex-shrink-0"
                >${item.count}</span
              >
            </div>
          `
        )}
      </div>
    </div>
  `;
};

export default ProgrammeDistributionChart;
