import React from 'react';
import htm from 'htm';
import SectionCard from '/core/frontend/src/modules/shared/primitives/SectionCard.js';
import CoreStatCard from '/core/frontend/src/modules/shared/primitives/StatCard.js';
import SharedEmptyState from '/core/frontend/src/modules/shared/components/EmptyState.js';
import { CHART_COLORS_HEX } from '/core/frontend/src/modules/shared/ui/charts/index.js';

const html = htm.bind(React.createElement);

export const COLORS = { '2xx': '#34c759', '4xx': '#ff9f0a', '5xx': '#ff3b30' };
export const CHART_PALETTE = CHART_COLORS_HEX;

export const Card = ({ title, children, className = '' }) => html`
  <${SectionCard} title=${title} className=${className}>
    ${children}
  <//>
`;

const MAP_COLOR = (c) => {
  if (!c) return 'default';
  if (c.includes('accent')) return 'accent';
  if (c.includes('success')) return 'success';
  if (c.includes('danger')) return 'danger';
  if (c.includes('warning') || c.includes('amber')) return 'warning';
  return 'default';
};

export const StatCard = ({ label, value, color, sub }) => html`
  <${CoreStatCard} label=${label} value=${value} delta=${sub} color=${MAP_COLOR(color)} />
`;

export const Skeleton = () => html`
  <div className="animate-pulse space-y-6" role="status" aria-label="Loading">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      ${[1, 2, 3, 4].map((i) => html`<div key=${i} className="bg-[var(--app-surface-muted)] h-28 rounded-[var(--app-radius-md)]" />`)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-[var(--app-surface-muted)] h-80 rounded-[var(--app-radius-md)]" />
      <div className="bg-[var(--app-surface-muted)] h-80 rounded-[var(--app-radius-md)]" />
    </div>
  </div>
`;

export const EmptyState = ({ message, hint }) => html`
  <${SharedEmptyState}
    title=${message}
    message=${hint}
  />
`;

export const formatTime = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};
