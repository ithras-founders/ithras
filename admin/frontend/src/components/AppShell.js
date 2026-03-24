/**
 * AppShell - Dashboard layout.
 * Fixed top bar; sidebar and main content below. No horizontal overflow.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import TopBar from './TopBar.js';
import Sidebar from './Sidebar.js';
import { getInitialTheme, applyThemeToDocument } from '/shared/utils/theme.js';

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
  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme();
    if (typeof document !== 'undefined') applyThemeToDocument(t);
    return t;
  });

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  const logoTheme = theme === 'dark' ? 'light' : 'dark';

  return html`
    <div className="h-screen flex flex-col overflow-hidden bg-[var(--app-bg)]">
      <${TopBar}
        collapsed=${collapsed}
        onCollapseToggle=${() => setCollapsed((c) => !c)}
        user=${user}
        onLogout=${onLogout}
        searchPlaceholder=${searchPlaceholder}
        logoTheme=${logoTheme}
        theme=${theme}
        onThemeToggle=${toggleTheme}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <${Sidebar} collapsed=${collapsed} activeTab=${activeTab} onLogout=${onLogout} />
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-transparent custom-scrollbar">
          <div className="app-main-inner py-3 md:py-5">${children}</div>
        </main>
      </div>
    </div>
  `;
};

export default AppShell;
