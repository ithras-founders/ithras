/**
 * Unified SectionCard primitive - enterprise design system.
 * Card with optional title, consistent padding and shadow.
 */
import React from 'react';
import htm from 'htm';
import { toDisplayString } from '../utils/displayUtils.js';

const html = htm.bind(React.createElement);

const SectionCard = ({ title, children, className = '', padding = true }) => {
  const paddingClass = padding ? 'p-[var(--app-space-6)]' : '';
  const baseClass = 'rounded-[var(--app-radius-card)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-card)] bg-[var(--app-surface)]';
  const combined = `${baseClass} ${paddingClass} ${className}`.trim();

  return html`
    <div className=${combined}>
      ${title ? html`
        <h2 className="text-[var(--app-text-lg)] font-semibold text-[var(--app-text-primary)] mb-[var(--app-space-4)]">
          ${toDisplayString(title)}
        </h2>
      ` : null}
      ${children}
    </div>
  `;
};

export default SectionCard;
