/**
 * AppShell - Dashboard layout.
 * Fixed top bar; sidebar and main content below. No horizontal overflow.
 */
import React, { useState } from 'react';
import htm from 'htm';
import TopBar from './TopBar.js';
import Sidebar from './Sidebar.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   children: React.ReactNode,
 *   activeTab: string,
 *   user: object,
 *   onLogout: () => void,
 *   searchPlaceholder?: string,
 * }} props
 */
const AppShell = ({
  children,
  activeTab,
  user,
  onLogout,
  searchPlaceholder = 'Search...',
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return html`
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)]">
      <${TopBar}
        collapsed=${collapsed}
        onCollapseToggle=${() => setCollapsed((c) => !c)}
        user=${user}
        onLogout=${onLogout}
        searchPlaceholder=${searchPlaceholder}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <${Sidebar} collapsed=${collapsed} activeTab=${activeTab} onLogout=${onLogout} />
        <main className="flex-1 min-w-0 overflow-auto p-6 bg-[var(--app-bg)]">
          ${children}
        </main>
      </div>
    </div>
  `;
};

export default AppShell;
