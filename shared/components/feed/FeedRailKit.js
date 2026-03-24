/**
 * Shared right-rail primitives — editorial panels, calm empty states (feed + community).
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/** Rounded panel; use for each rail block. */
export const FeedRailPanel = ({ children, className = '' }) => html`
  <div
    className=${`rounded-2xl border shadow-[var(--app-shadow-subtle)] mb-3 last:mb-0 overflow-hidden ${className}`}
    style=${{
      borderColor: 'var(--app-border-soft)',
      background: 'var(--app-surface)',
    }}
  >
    ${children}
  </div>
`;

/**
 * @param {{ icon?: React.ComponentType<{className?: string, strokeWidth?: number}>, title: string, kicker?: string }} props
 */
export const FeedRailHeading = ({ icon: Icon, title, kicker }) => html`
  <div className="px-3.5 pt-3.5 pb-2 flex items-start gap-3">
    ${Icon
      ? html`
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style=${{
              background: 'linear-gradient(145deg, var(--app-accent-soft), transparent)',
              color: 'var(--app-accent)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
            aria-hidden="true"
          >
            <${Icon} className="w-4 h-4" strokeWidth=${2} />
          </span>
        `
      : null}
    <div className="min-w-0 pt-0.5">
      <h3 className="text-sm font-semibold leading-snug tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>
        ${title}
      </h3>
      ${kicker
        ? html`<p className="text-[11px] mt-1 leading-relaxed" style=${{ color: 'var(--app-text-muted)' }}>${kicker}</p>`
        : null}
    </div>
  </div>
`;

/**
 * Soft empty state — no shouting headline.
 * @param {{ icon?: React.ComponentType<{className?: string, strokeWidth?: number}>, line: string, hint?: string }} props
 */
export const FeedRailEmpty = ({ icon: Icon, line, hint }) => html`
  <div className="px-3.5 pb-3.5 pt-0">
    <div
      className="relative overflow-hidden rounded-xl px-3 py-4 text-center"
      style=${{
        border: '1px dashed var(--app-border-soft)',
        background: 'var(--app-surface-subtle)',
      }}
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-[0.12]"
        style=${{ background: 'radial-gradient(circle, var(--app-accent) 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      ${Icon
        ? html`
            <div className="relative flex justify-center mb-2" style=${{ color: 'var(--app-accent)' }}>
              <${Icon} className="w-5 h-5 opacity-80" strokeWidth=${1.75} />
            </div>
          `
        : null}
      <p className="relative text-xs font-medium leading-snug" style=${{ color: 'var(--app-text-secondary)' }}>${line}</p>
      ${hint
        ? html`<p className="relative text-[11px] mt-2 leading-relaxed max-w-[220px] mx-auto" style=${{ color: 'var(--app-text-faint)' }}>${hint}</p>`
        : null}
    </div>
  </div>
`;

/** Divider inside panel */
export const FeedRailDivider = () => html`
  <div className="mx-3.5 h-px" style=${{ background: 'var(--app-border-soft)' }} role="separator" />
`;
