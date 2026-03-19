/**
 * TopBar - Full-width sticky top bar.
 * Structure: [ BrandArea (matches sidebar width) ][ Search ][ Spacer ][ Profile ]
 * Brand width = sidebar width to prevent overlap.
 */
import React from 'react';
import htm from 'htm';
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
 * }} props
 */
const TopBar = ({
  collapsed,
  onCollapseToggle,
  user,
  onLogout,
  searchPlaceholder = 'Search...',
}) => {
  return html`
    <header className="sticky top-0 left-0 right-0 z-20 flex-shrink-0 h-14 flex items-center overflow-x-hidden overflow-y-visible border-b border-[var(--app-border-soft)] bg-[var(--app-surface)] shadow-sm">
      <${BrandArea} collapsed=${collapsed} onCollapseToggle=${onCollapseToggle} />
      <div className="flex-1 min-w-0 flex items-center gap-4 pl-4 pr-4 h-full">
        <div className="flex-1 min-w-0 max-w-md hidden sm:block">
          <${SearchBar} placeholder=${searchPlaceholder} />
        </div>
        <div className="flex-1 min-w-0" />
        <${ProfileMenu} user=${user} onLogout=${onLogout} showDropdown=${true} />
      </div>
    </header>
  `;
};

export default TopBar;
