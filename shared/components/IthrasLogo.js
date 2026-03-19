import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TITTLE_COLOR = '#FFD700';

const sizeClasses = {
  xs: 'text-[9px]',
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
  xl: 'text-5xl md:text-7xl',
};

const themeClasses = {
  light: 'text-white',
  dark: 'text-[var(--app-text-primary)]',
};

/**
 * Full "ithras" wordmark with golden tittle on the "i".
 */
const IthrasLogo = ({ size = 'md', theme = 'light', className = '' }) => {
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  const textClass = themeClasses[theme] || themeClasses.light;
  return html`
    <span className=${`font-medium tracking-wide inline-flex items-baseline ${sizeClass} ${textClass} ${className}`} style=${{ letterSpacing: '0.08em' }}>
      <span className="relative inline-block align-baseline">
        <span className="absolute left-1/2 bottom-full -translate-x-1/2 mb-0 flex items-center justify-center" style=${{ width: '0.2em', height: '0.2em', minWidth: '8px', minHeight: '8px' }}>
          <span className="w-full h-full rounded-full" style=${{ backgroundColor: TITTLE_COLOR }} />
        </span>
        <span>ı</span>
      </span>thras
    </span>
  `;
};

export default IthrasLogo;
