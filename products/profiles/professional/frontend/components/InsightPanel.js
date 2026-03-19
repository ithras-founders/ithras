/**
 * Insights panel: derived metrics and highlights.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ insights: { fastestGrowingTeam?: string, mostCommonRole?: string, avgTenure?: string, alumniAtTopFirms?: string, hiringTrend?: string } }} props
 */
const InsightPanel = ({
  insights = {},
  teams = [],
  roles = [],
}) => {
  const fastestTeam = insights.fastestGrowingTeam ?? (teams[0]?.name || '—');
  const mostCommonRole = insights.mostCommonRole ?? (roles[0]?.title || '—');
  const avgTenure = insights.avgTenure ?? '4.2 yrs';
  const alumniAtTop = insights.alumniAtTopFirms ?? 'Goldman Sachs, JPMorgan, Morgan Stanley';
  const hiringTrend = insights.hiringTrend ?? 'Steady growth, 3 hires/month avg';

  const items = [
    { label: 'Fastest growing team', value: fastestTeam },
    { label: 'Most common role', value: mostCommonRole },
    { label: 'Average tenure', value: avgTenure },
    { label: 'Alumni at top firms', value: alumniAtTop },
    { label: 'Hiring trend', value: hiringTrend },
  ];

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Insights</h2>
      <div className="space-y-3">
        ${items.map(
          (item) => html`
            <div key=${item.label} className="flex flex-col gap-0.5">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">${item.label}</p>
              <p className="text-sm font-medium text-gray-900">${item.value}</p>
            </div>
          `
        )}
      </div>
    </div>
  `;
};

export default InsightPanel;
