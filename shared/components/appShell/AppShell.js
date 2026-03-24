/**
 * AppShell - Dashboard layout (top bar + sidebar + main content).
 * Used by both admin and profile. navItems empty = empty sidebar.
 * When user is admin, ModeSelector appears at top of sidebar; TopBar variant switches by path.
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import TopBar from './TopBar.js';
import Sidebar from './Sidebar.js';
import ModeSelector from './ModeSelector.js';
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED } from './BrandArea.js';
import { getInitialTheme, applyThemeToDocument } from '/shared/utils/theme.js';

const html = htm.bind(React.createElement);

const TOP_BAR_PX = 56;

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
 *   sidebarNavSectionTitle?: string | null,
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
  sidebarNavSectionTitle = null,
}) => {
  const hasNavItems = navItems && navItems.length > 0;
  const showSettingsSection = showSettings !== undefined ? showSettings : hasNavItems;
  const [collapsed, setCollapsed] = useState(false);
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const useCustomSidebar = sidebarContent != null;
  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;
  const showModeSelector = user?.user_type === 'admin';
  const resolvedTopBarVariant = topBarVariant ?? (path.startsWith('/admin') ? 'admin' : 'general');
  const [topSearchQ, setTopSearchQ] = useState('');
  const goToFullSearch = useCallback(() => {
    window.history.pushState(null, '', '/search');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  }, []);
  const submitTopSearch = useCallback((q) => {
    const trimmed = (q || '').trim();
    const qs = trimmed ? `?q=${encodeURIComponent(trimmed)}` : '';
    window.history.pushState(null, '', `/search${qs}`);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    setTopSearchQ('');
  }, []);

  const navigateTopSearchHref = useCallback((href) => {
    const h = href || '/';
    window.history.pushState(null, '', h);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    setTopSearchQ('');
  }, []);

  const [theme, setTheme] = useState(() => {
    const t = getInitialTheme();
    if (typeof document !== 'undefined') applyThemeToDocument(t);
    return t;
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const showSidebarRail = hasNavItems || useCustomSidebar || showModeSelector;

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  useEffect(() => {
    const closeMobile = () => setMobileNavOpen(false);
    window.addEventListener('ithras:path-changed', closeMobile);
    window.addEventListener('popstate', closeMobile);
    return () => {
      window.removeEventListener('ithras:path-changed', closeMobile);
      window.removeEventListener('popstate', closeMobile);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = () => {
      if (mq.matches) setMobileNavOpen(false);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    const isTypingTarget = (el) => {
      if (!el || !el.tagName) return false;
      const t = el.tagName.toLowerCase();
      if (t === 'input' || t === 'textarea' || t === 'select') return true;
      return el.isContentEditable;
    };
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        goToFullSearch();
        return;
      }
      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        goToFullSearch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [user, goToFullSearch]);

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
        variant=${resolvedTopBarVariant}
        pendingUsersCount=${pendingUsersCount}
        onSearchActivate=${user ? goToFullSearch : undefined}
        topSearchValue=${topSearchQ}
        onTopSearchChange=${setTopSearchQ}
        onTopSearchSubmit=${user ? submitTopSearch : undefined}
        onTopSearchNavigate=${user ? navigateTopSearchHref : undefined}
        logoTheme=${logoTheme}
        theme=${theme}
        onThemeToggle=${toggleTheme}
        onMobileMenuOpen=${showSidebarRail ? () => setMobileNavOpen(true) : undefined}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        ${mobileNavOpen && showSidebarRail
          ? html`
              <div
                className="fixed inset-x-0 bottom-0 z-30 md:hidden"
                style=${{ top: `${TOP_BAR_PX}px`, background: 'var(--backdrop-scrim)' }}
                onClick=${() => setMobileNavOpen(false)}
                aria-hidden="true"
              />
            `
          : null}
        <div
          className=${`flex flex-col flex-shrink-0 overflow-hidden border-r z-40 transition-transform duration-300 ease-in-out
            fixed left-0 top-14 bottom-0 max-w-[min(100vw-3rem,320px)] md:max-w-none md:static md:inset-auto md:top-auto md:bottom-auto md:z-auto md:translate-x-0
            ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
          style=${{
            width: `${sidebarWidth}px`,
            borderColor: 'var(--app-border-soft)',
            background: 'var(--app-surface)',
          }}
        >
          ${showModeSelector ? html`<${ModeSelector} collapsed=${collapsed} sidebarWidth=${sidebarWidth} />` : null}
          ${useCustomSidebar ? html`
            <aside className="flex-1 min-h-0 overflow-hidden flex flex-col custom-scrollbar" aria-label="Main navigation">
              ${React.isValidElement(sidebarContent)
                ? React.cloneElement(sidebarContent, { collapsed })
                : sidebarContent}
            </aside>
          ` : html`
            <div className="flex flex-1 flex-col min-h-0 overflow-hidden w-full">
              <${Sidebar}
                collapsed=${collapsed}
                activeTab=${activeTab}
                onLogout=${onLogout}
                navItems=${navItems}
                showSettings=${showSettingsSection}
                navSectionTitle=${sidebarNavSectionTitle}
              />
            </div>
          `}
        </div>
        <main className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-transparent custom-scrollbar">
          <div className="app-main-inner py-3 md:py-5">${children}</div>
        </main>
      </div>
    </div>
  `;
};

export default AppShell;
