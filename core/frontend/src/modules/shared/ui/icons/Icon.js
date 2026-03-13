/**
 * Unified Icon component - Lucide icons only.
 * Use iconMap names: dashboard, home, workflows, search, etc.
 * Sizes: 14, 16, 18, 20, 24 (default 18).
 */
import React from 'react';
import htm from 'htm';
import { iconMap } from './iconMap.js';

const html = htm.bind(React.createElement);

const Icon = ({ name, size = 18, className = '', ...props }) => {
  const LucideIcon = iconMap[name];
  if (!LucideIcon) return null;
  return html`
    <${LucideIcon}
      size=${size}
      strokeWidth=${1.75}
      className=${className}
      ...${props}
    />
  `;
};

export default Icon;
