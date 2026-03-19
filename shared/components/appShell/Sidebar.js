/**
 * Sidebar - Left nav below the top bar.
 * Accepts navItems array - when empty, renders empty sidebar (collapsible rail only).
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { Building2, Briefcase, Users, Settings, LogOut } from 'lucide-react';
import SidebarNavItem from './SidebarNavItem.js';
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './BrandArea.js';

const html = htm.bind(React.createElement);

const DEFAULT_NAV_ITEMS = [
  { key: 'institutions', label: 'Institution Management', href: '/admin/institutions', icon: Building2 },
  { key: 'organisations', label: 'Organisation Management', href: '/admin/organisations', icon: Briefcase },
  { key: 'users', label: 'User Management', href: '/admin/users', icon: Users },
];

/**
 * @param {{
 *   collapsed: boolean,
 *   activeTab?: string,
 *   onLogout?: () => void,
 *   navItems?: Array<{ key: string, label: string, href: string, icon: React.ComponentType }>,
 *   showSettings?: boolean,
 * }}
 */
const Sidebar = ({ collapsed, activeTab = '', onLogout, navItems = DEFAULT_NAV_ITEMS, showSettings = true }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const ref = useRef(null);
  const width = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const hasNavItems = navItems && navItems.length > 0;

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setSettingsOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  return html`
    <aside
      className="flex-shrink-0 flex flex-col border-r border-[var(--app-border-soft)] bg-[var(--app-surface)] transition-all duration-300 ease-in-out overflow-hidden"
      style=${{ width: `${width}px` }}
      aria-label="Main navigation"
    >
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto min-h-0">
        ${hasNavItems ? navItems.map(
          (item) => html`
            <${SidebarNavItem}
              key=${item.key}
              icon=${item.icon}
              label=${item.label}
              href=${item.href}
              active=${activeTab === item.key}
              collapsed=${collapsed}
            />
          `
        ) : html`<div className="py-4" />`}
      </nav>
      ${showSettings ? html`
        <div className="relative flex-shrink-0 p-3 pt-2 border-t border-[var(--app-border-soft)]" ref=${ref}>
          ${settingsOpen ? html`
            <div className="absolute bottom-full left-3 right-3 mb-1 py-1 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg shadow-lg z-10" role="menu">
              <button
                onClick=${() => { setSettingsOpen(false); onLogout?.(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] text-left"
                role="menuitem"
              >
                <${LogOut} size=${16} />
                Sign out
              </button>
            </div>
          ` : null}
          <button
            onClick=${() => setSettingsOpen((v) => !v)}
            className=${`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              settingsOpen ? 'bg-[var(--app-surface-hover)] text-[var(--app-text-primary)]' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text-primary)]'
            } ${collapsed ? 'justify-center px-2' : ''}`}
            title=${collapsed ? 'Settings' : undefined}
            aria-expanded=${settingsOpen}
            aria-haspopup="menu"
          >
            <span className="flex-shrink-0 flex items-center justify-center"><${Settings} size=${20} strokeWidth=${2} /></span>
            ${!collapsed ? 'Settings' : null}
          </button>
        </div>
      ` : null}
    </aside>
  `;
};

export default Sidebar;
