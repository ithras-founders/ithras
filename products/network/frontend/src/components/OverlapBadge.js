/**
 * OverlapBadge - Single overlap badge for "Same institution", "Same major", etc.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const OverlapBadge = ({ label }) => html`
  <span
    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
    style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
  >
    ${label}
  </span>
`;

export default OverlapBadge;
