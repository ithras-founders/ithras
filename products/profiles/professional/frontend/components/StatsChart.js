/**
 * Current vs Alumni bar chart - CSS-only, no recharts.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const StatsChart = ({ current = 0, alumni = 0 }) => {
  const total = current + alumni;
  const hasData = total > 0;

  if (!hasData) return null;

  const maxVal = Math.max(current, alumni, 1);
  const currentPct = (current / maxVal) * 100;
  const alumniPct = (alumni / maxVal) * 100;

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-4 h-48">
      <div className="flex gap-6 h-full items-end">
        <div className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-blue-500 transition-all min-h-[4px]"
            style=${{ height: `${Math.max(currentPct, 4)}%` }}
            title=${`Current: ${current}`}
          />
          <span className="text-xs font-medium text-gray-600">Current</span>
          <span className="text-sm font-semibold text-gray-900">${current}</span>
        </div>
        <div className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-gray-500 transition-all min-h-[4px]"
            style=${{ height: `${Math.max(alumniPct, 4)}%` }}
            title=${`Alumni: ${alumni}`}
          />
          <span className="text-xs font-medium text-gray-600">Alumni</span>
          <span className="text-sm font-semibold text-gray-900">${alumni}</span>
        </div>
      </div>
    </div>
  `;
};

export default StatsChart;
