/**
 * BrandArea - Logo and collapse button.
 * Width matches sidebar; used by both admin and profile shells.
 */
import React from 'react';
import htm from 'htm';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import IthrasLogo from '/shared/components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const SIDEBAR_EXPANDED = 280;
const SIDEBAR_COLLAPSED = 96;

/**
 * @param {{ collapsed: boolean, onCollapseToggle: () => void, logoTheme?: 'light' | 'dark' }}
 */
const BrandArea = ({ collapsed, onCollapseToggle, logoTheme = 'dark' }) => {
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return html`
    <div
      className="flex-shrink-0 flex items-center h-full border-r border-[var(--app-border-soft)] bg-[var(--app-surface)] transition-all duration-300 ease-in-out overflow-x-hidden"
      style=${{ width: `${width}px` }}
    >
      <div
        className=${`flex items-center h-full gap-1 transition-all duration-300 ease-in-out w-full ${
          collapsed ? 'justify-center px-1' : 'justify-between pl-4 pr-2'
        }`}
      >
        <a
          href="/feed"
          onClick=${(e) => {
            e.preventDefault();
            window.history.pushState(null, '', '/feed');
            window.dispatchEvent(new CustomEvent('ithras:path-changed'));
          }}
          className="flex items-center min-w-0 overflow-visible flex-1 justify-center"
          aria-label="Ithras feed"
        >
          <${IthrasLogo} size="sm" theme=${logoTheme} className="flex-shrink-0 transition-all duration-300" />
        </a>
        <button
          onClick=${onCollapseToggle}
          className="flex-shrink-0 p-1.5 rounded-md text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text-primary)] active:bg-[var(--app-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-inset"
          title=${collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label=${collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          ${collapsed ? html`<${ChevronRight} size=${20} strokeWidth=${2} />` : html`<${ChevronLeft} size=${20} strokeWidth=${2} />`}
        </button>
      </div>
    </div>
  `;
};

export default BrandArea;
export { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED };
