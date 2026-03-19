/**
 * AppShell - Dashboard layout (top bar + sidebar + main content).
 * Used by both admin and profile. navItems empty = empty sidebar.
 * When user is admin, ModeSelector appears at top of sidebar; TopBar variant switches by path.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import TopBar from './TopBar.js';
import Sidebar from './Sidebar.js';
import ModeSelector from './ModeSelector.js';
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './BrandArea.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   children: React.ReactNode,
 *   activeTab?: string,
 *   user: object,
 *   onLogout: () => void,
 *   searchPlaceholder?: string,
 *   navItems?: Array<{ key: string, label: string, href: string, icon: React.ComponentType }>,
 *   showSettings?: boolean,
 *   sidebarContent?: React.ReactNode,
 *   topBarVariant?: 'admin' | 'general',
 *   pendingUsersCount?: number,
 * }}
 */
const AppShell = ({
  children,
  activeTab = '',
  user,
  onLogout,
  searchPlaceholder = 'Search...',
  navItems = [],
  showSettings,
  sidebarContent,
  topBarVariant,
  pendingUsersCount = 0,
}) => {
  const hasNavItems = navItems && navItems.length > 0;
  const showSettingsSection = showSettings !== undefined ? showSettings : hasNavItems;
  const [collapsed, setCollapsed] = useState(false);
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const useCustomSidebar = sidebarContent != null;
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const showModeSelector = user?.user_type === 'admin';
  const resolvedTopBarVariant = topBarVariant ?? (path.startsWith('/admin') ? 'admin' : 'general');

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  return html`
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)]">
      <${TopBar}
        collapsed=${collapsed}
        onCollapseToggle=${() => setCollapsed((c) => !c)}
        user=${user}
        onLogout=${onLogout}
        searchPlaceholder=${searchPlaceholder}
        variant=${resolvedTopBarVariant}
        pendingUsersCount=${pendingUsersCount}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className="flex flex-col flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
          style=${{ width: `${sidebarWidth}px`, borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)', borderRight: '1px solid var(--app-border-soft)' }}
        >
          ${showModeSelector ? html`<${ModeSelector} collapsed=${collapsed} sidebarWidth=${sidebarWidth} />` : null}
          ${useCustomSidebar ? html`
            <aside className="flex-1 min-h-0 overflow-hidden flex flex-col" aria-label="Main navigation">
              ${React.isValidElement(sidebarContent)
                ? React.cloneElement(sidebarContent, { collapsed })
                : sidebarContent}
            </aside>
          ` : html`
            <div className="flex-1 min-h-0 overflow-hidden">
              <${Sidebar}
                collapsed=${collapsed}
                activeTab=${activeTab}
                onLogout=${onLogout}
                navItems=${navItems}
                showSettings=${showSettingsSection}
              />
            </div>
          `}
        </div>
        <main className="flex-1 min-w-0 overflow-auto p-6 bg-[var(--app-bg)]">
          ${children}
        </main>
      </div>
    </div>
  `;
};

export default AppShell;
