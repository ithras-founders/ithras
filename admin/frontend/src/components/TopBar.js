/**
 * TopBar - Full-width sticky top bar.
 * Structure: [ BrandArea (matches sidebar width) ][ Search ][ Spacer ][ Theme ][ Profile ]
 */
import React from 'react';
import htm from 'htm';
import { Moon, Sun } from 'lucide-react';
import BrandArea from './BrandArea.js';
import SearchBar from './SearchBar.js';
import ProfileMenu from './ProfileMenu.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   collapsed: boolean,
 *   onCollapseToggle: () => void,
 *   user: object,
 *   onLogout: () => void,
 *   searchPlaceholder?: string,
 *   logoTheme?: 'light' | 'dark',
 *   theme?: 'light' | 'dark',
 *   onThemeToggle?: () => void,
 * }} props
 */
const TopBar = ({
  collapsed,
  onCollapseToggle,
  user,
  onLogout,
  searchPlaceholder = 'Search...',
  logoTheme = 'dark',
  theme = 'light',
  onThemeToggle,
}) => {
  return html`
    <header className="ith-topbar-glass sticky top-0 left-0 right-0 z-50 flex-shrink-0 h-14 flex items-center overflow-x-hidden overflow-y-visible">
      <${BrandArea} collapsed=${collapsed} onCollapseToggle=${onCollapseToggle} logoTheme=${logoTheme} />
      <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pl-2 sm:pl-4 pr-3 sm:pr-4 h-full">
        <div className="flex-1 min-w-0 max-w-md hidden sm:block">
          <${SearchBar} placeholder=${searchPlaceholder} />
        </div>
        <div className="flex-1 min-w-0" />
        ${onThemeToggle
          ? html`
              <button
                type="button"
                onClick=${onThemeToggle}
                className="ith-focus-ring p-2 rounded-[var(--radius-md)] text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)]"
                title=${theme === 'dark' ? 'Light mode' : 'Dark mode'}
                aria-label=${theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                ${theme === 'dark' ? html`<${Sun} size=${20} />` : html`<${Moon} size=${20} />`}
              </button>
            `
          : null}
        <${ProfileMenu} user=${user} onLogout=${onLogout} showDropdown=${true} />
      </div>
    </header>
  `;
};

export default TopBar;
