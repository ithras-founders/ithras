/**
 * Simple hover/focus tooltip (no portal) for icon buttons and dense UI.
 */
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ label: string, children: React.ReactNode, position?: 'top' | 'bottom' }} props
 */
const Tooltip = ({ label, children, position = 'bottom' }) => {
  const [open, setOpen] = useState(false);
  const posClass =
    position === 'top'
      ? 'bottom-full left-1/2 -translate-x-1/2 mb-1'
      : 'top-full left-1/2 -translate-x-1/2 mt-1';

  return html`
    <span
      className="relative inline-flex"
      onFocusCapture=${() => setOpen(true)}
      onBlurCapture=${() => setOpen(false)}
      onMouseEnter=${() => setOpen(true)}
      onMouseLeave=${() => setOpen(false)}
    >
      ${children}
      ${open
        ? html`
            <span
              role="tooltip"
              className=${`absolute z-50 px-2 py-1 text-[11px] font-medium rounded-md pointer-events-none whitespace-nowrap ${posClass}`}
              style=${{
                background: 'var(--app-text-primary)',
                color: 'var(--app-surface)',
                boxShadow: 'var(--app-shadow-floating)',
              }}
            >
              ${label}
            </span>
          `
        : null}
    </span>
  `;
};

export default Tooltip;
