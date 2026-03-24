/**
 * Horizontal tab list — a11y-friendly.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   tabs: Array<{ id: string, label: string }>,
 *   value: string,
 *   onChange: (id: string) => void,
 *   className?: string,
 *   size?: 'sm' | 'md',
 * }} props
 */
const Tabs = ({ tabs, value, onChange, className = '', size = 'md' }) => {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return html`
    <div className=${`flex flex-wrap gap-1 ${className}`} role="tablist" aria-label="Tabs">
      ${tabs.map((t) => {
        const active = t.id === value;
        return html`
          <button
            key=${t.id}
            type="button"
            role="tab"
            aria-selected=${active}
            className=${`ith-focus-ring rounded-[var(--radius-md)] font-medium whitespace-nowrap transition-colors ${pad} ${
              active ? '' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)]'
            }`}
            style=${active ? { background: 'var(--app-accent)', color: '#fff' } : {}}
            onClick=${() => onChange(t.id)}
          >
            ${t.label}
          </button>
        `;
      })}
    </div>
  `;
};

export default Tabs;
