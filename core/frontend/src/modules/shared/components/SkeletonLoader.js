/**
 * Skeleton loader for loading states - replaces generic "Loading..." text.
 * Variants: default (lines), listRows, cards, pipeline.
 */
import React from 'react';
import htm from 'htm';
const html = htm.bind(React.createElement);

const SkeletonLine = ({ width = '100%' }) => html`
  <div
    className="h-4 bg-[var(--app-surface-muted)] rounded animate-pulse"
    style=${{ width }}
    aria-hidden="true"
  />
`;

const SkeletonListRows = ({ rows = 5 }) => html`
  <div className="space-y-2" role="status" aria-label="Loading">
    ${Array.from({ length: rows }, (_, i) => html`
      <div key=${i} className="flex items-center gap-4 p-4 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] animate-pulse">
        <div className="h-10 w-10 rounded-full bg-[var(--app-border-soft)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 rounded w-1/3 bg-[var(--app-border-soft)]" />
          <div className="h-3 rounded w-1/4 bg-[var(--app-border-soft)]" />
        </div>
      </div>
    `)}
  </div>
`;

const SkeletonCards = ({ count = 3 }) => html`
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Loading">
    ${Array.from({ length: count }, (_, i) => html`
      <div key=${i} className="p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] animate-pulse space-y-4">
        <div className="h-6 rounded w-2/3 bg-[var(--app-surface-muted)]" />
        <div className="h-4 rounded w-full bg-[var(--app-surface-muted)]" />
        <div className="h-4 rounded w-4/5 bg-[var(--app-surface-muted)]" />
      </div>
    `)}
  </div>
`;

const SkeletonPipeline = ({ stages = 4 }) => html`
  <div className="flex gap-4 overflow-x-auto pb-4" role="status" aria-label="Loading">
    ${Array.from({ length: stages }, (_, i) => html`
      <div key=${i} className="flex-shrink-0 w-48 p-6 rounded-[var(--app-radius-md)] bg-[var(--app-surface-muted)] animate-pulse space-y-4">
        <div className="h-5 rounded w-3/4 bg-[var(--app-border-soft)]" />
        <div className="h-8 rounded bg-[var(--app-border-soft)]" />
        <div className="h-4 rounded w-1/2 bg-[var(--app-border-soft)]" />
      </div>
    `)}
  </div>
`;

const SkeletonLoader = ({ lines = 3, title, variant }) => {
  if (variant === 'listRows') return html`<${SkeletonListRows} rows=${lines} />`;
  if (variant === 'cards') return html`<${SkeletonCards} count=${lines} />`;
  if (variant === 'pipeline') return html`<${SkeletonPipeline} stages=${lines} />`;
  return html`
    <div
      className="space-y-4 p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] bg-[var(--app-surface)]"
      role="status"
      aria-label=${title || 'Loading'}
    >
      ${title ? html`<div className="h-5 bg-[var(--app-surface-muted)] rounded w-1/3 animate-pulse" aria-hidden="true" />` : null}
      ${Array.from({ length: lines }, (_, i) => html`
        <${SkeletonLine} key=${i} width=${i === lines - 1 && lines > 1 ? '75%' : '100%'} />
      `)}
    </div>
  `;
};

export default SkeletonLoader;
