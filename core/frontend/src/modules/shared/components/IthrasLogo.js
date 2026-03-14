import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TITTLE_COLOR = '#FFD700';

const sizeClasses = {
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
  const lightThemeStyle = theme === 'light' ? { textShadow: '0 1px 2px rgba(0,0,0,0.2)' } : {};
  return html`
    <span className=${`font-semibold tracking-wide inline-flex items-baseline ${sizeClass} ${textClass} ${className}`} style=${{ letterSpacing: '0.08em', ...lightThemeStyle }}>
      <span className="relative inline-block align-baseline">
        <span className="absolute left-1/2 bottom-full -translate-x-1/2 mb-0 flex items-center justify-center" style=${{ width: '0.2em', height: '0.2em', minWidth: '10px', minHeight: '10px' }}>
          <span className="w-full h-full rounded-full" style=${{ backgroundColor: TITTLE_COLOR }} />
        </span>
        <span>ı</span>
      </span>thras
    </span>
  `;
};

/**
 * Compact icon: just the "i" stem + golden tittle, sized to fit in a square container.
 * Use in place of the old owl logo image wherever a small icon is needed.
 *
 * @param {Object} props
 * @param {string} props.size - CSS width/height, e.g. '32px', '2rem'
 * @param {'light'|'dark'} props.theme
 * @param {string} props.className
 */
export const IthrasIcon = ({ size = '32px', theme = 'dark', className = '' }) => {
  const textClass = themeClasses[theme] || themeClasses.dark;
  return html`
    <span
      className=${`inline-flex items-center justify-center shrink-0 ${textClass} ${className}`}
      style=${{ width: size, height: size, fontSize: `calc(${size} * 0.6)` }}
    >
      <span className="relative inline-block leading-none font-medium">
        <span className="absolute left-1/2 bottom-full -translate-x-1/2 mb-0 flex items-center justify-center rounded-full" style=${{ width: '0.25em', height: '0.25em', minWidth: '5px', minHeight: '5px', backgroundColor: TITTLE_COLOR }} />
        <span>ı</span>
      </span>
    </span>
  `;
};

export default IthrasLogo;
