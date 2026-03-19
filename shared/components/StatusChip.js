/**
 * Status chip for Listed, Pending Approval, Alumni, Current.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const CHIP_STYLES = {
  listed: 'bg-[var(--color-green-500)]/10 text-[var(--color-green-700)] border-[var(--color-green-500)]/30',
  pending: 'bg-[var(--color-orange-500)]/10 text-[var(--color-orange-700)] border-[var(--color-orange-500)]/30',
  alumni: 'bg-[var(--color-blue-500)]/10 text-[var(--color-blue-700)] border-[var(--color-blue-500)]/30',
  current: 'bg-[var(--color-cyan-500)]/10 text-[var(--color-cyan-700)] border-[var(--color-cyan-500)]/30',
};

const StatusChip = ({ status, className = '' }) => {
  const s = typeof status === 'string' ? status : '';
  const style = CHIP_STYLES[s] || CHIP_STYLES.pending;
  const label = s === 'listed' ? 'Listed' : s === 'pending' ? 'Pending Approval' : s === 'alumni' ? 'Alumni' : s === 'current' ? 'Current' : s || '—';
  return html`
    <span className=${`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${style} ${className}`}>
      ${label}
    </span>
  `;
};

export default StatusChip;
