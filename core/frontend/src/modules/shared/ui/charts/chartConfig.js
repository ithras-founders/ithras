/**
 * Shared chart config for Recharts - enterprise design language.
 * Restrained, analytical palette. Use with Recharts components.
 */
export const CHART_COLORS = [
  'var(--chart-primary)',   // #0071e3
  'var(--chart-secondary)', // #5e5ce6
  'var(--chart-success)',   // #34c759
  'var(--chart-warning)',  // #ff9f0a
  'var(--chart-alert)',    // #ff375f
];

export const CHART_COLORS_HEX = ['#0071e3', '#5e5ce6', '#34c759', '#ff9f0a', '#ff375f'];

export const chartGridStroke = 'rgba(0, 0, 0, 0.06)';
export const chartAxisColor = '#86868b';

/** Recharts-compatible config for consistent chart styling */
export const rechartsConfig = {
  colors: CHART_COLORS_HEX,
  grid: { stroke: chartGridStroke },
  axis: { tick: { fill: chartAxisColor }, axisLine: { stroke: chartGridStroke } },
  tooltip: {
    contentStyle: {
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border-soft)',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-floating)',
      padding: 'var(--space-3)',
      fontSize: 'var(--text-sm)',
    },
  },
};
