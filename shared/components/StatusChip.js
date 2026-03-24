/**
 * Status chip for Listed, Pending Approval, Alumni, Current.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/** Uses --chip-* tokens in tokens.css (light + [data-theme="dark"]). */
const CHIP_STYLE = {
  listed: {
    background: 'var(--chip-listed-bg)',
    color: 'var(--chip-listed-fg)',
    borderColor: 'var(--chip-listed-border)',
  },
  pending: {
    background: 'var(--chip-pending-bg)',
    color: 'var(--chip-pending-fg)',
    borderColor: 'var(--chip-pending-border)',
  },
  alumni: {
    background: 'var(--chip-alumni-bg)',
    color: 'var(--chip-alumni-fg)',
    borderColor: 'var(--chip-alumni-border)',
  },
  current: {
    background: 'var(--chip-current-bg)',
    color: 'var(--chip-current-fg)',
    borderColor: 'var(--chip-current-border)',
  },
};

const StatusChip = ({ status, className = '' }) => {
  const s = typeof status === 'string' ? status : '';
  const chipStyle = CHIP_STYLE[s] || CHIP_STYLE.pending;
  const label = s === 'listed' ? 'Listed' : s === 'pending' ? 'Pending Approval' : s === 'alumni' ? 'Alumni' : s === 'current' ? 'Current' : s || '—';
  return html`
    <span
      className=${`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
      style=${chipStyle}
    >
      ${label}
    </span>
  `;
};

export default StatusChip;
