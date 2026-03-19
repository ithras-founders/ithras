/**
 * NetworkSidebar - Left nav: Overview, Connections, Following, Org, Institution, Function, Suggestions.
 * Collapsible like shared Sidebar.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import SidebarNavItem from '/shared/components/appShell/SidebarNavItem.js';

const html = htm.bind(React.createElement);

const SettingsIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`;

const LogOutIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
`;

const ChartIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 3v18h18"/>
    <path d="m19 9-5 5-4-4-3 3"/>
  </svg>
`;

const UsersIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
`;

const UserPlusIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" x2="19" y1="8" y2="14"/>
    <line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
`;

const BuildingIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
  </svg>
`;

const GraduationCapIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
`;

const BriefcaseIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
`;

const SparklesIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
`;

const getNavItems = (pendingCount) => [
  { key: 'overview', label: 'Overview', href: '/network', icon: ChartIcon },
  { key: 'connections', label: 'Connections', href: '/network/connections', icon: UsersIcon, badge: pendingCount },
  { key: 'following', label: 'Following', href: '/network/following', icon: UserPlusIcon },
  { key: 'org', label: 'Organization Network', href: '/network/org', icon: BuildingIcon },
  { key: 'institution', label: 'Institution Network', href: '/network/institution', icon: GraduationCapIcon },
  { key: 'function', label: 'Function Network', href: '/network/function', icon: BriefcaseIcon },
  { key: 'suggestions', label: 'Suggested Connections', href: '/network/suggestions', icon: SparklesIcon },
];

const NetworkSidebar = ({ activeView, onNavigate, pendingCount = 0, showSettings, onLogout, collapsed = false }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); };
    if (showSettings) {
      document.addEventListener('click', h);
      return () => document.removeEventListener('click', h);
    }
  }, [showSettings]);

  const handleNav = (e, href) => {
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    onNavigate?.(href);
  };

  return html`
    <div className="flex flex-col h-full">
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto min-h-0" aria-label="Network navigation">
        <div className="space-y-0.5">
          ${getNavItems(pendingCount).map((item) => html`
            <a
              key=${item.key}
              href=${item.href}
              onClick=${(e) => handleNav(e, item.href)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style=${{
                background: activeView === item.key ? 'var(--app-accent-soft)' : 'transparent',
                color: activeView === item.key ? 'var(--app-accent)' : 'var(--app-text-secondary)',
              }}
            >
              <span className="flex-shrink-0"><${item.icon} /></span>
              ${item.label}
              ${item.badge > 0 ? html`
                <span className="ml-auto inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">${item.badge}</span>
              ` : null}
            </a>
          `)}
        </div>
      </nav>
      ${showSettings ? html`
        <div className="relative flex-shrink-0 p-3 pt-2 border-t" style=${{ borderColor: 'var(--app-border-soft)' }} ref=${settingsRef}>
          ${settingsOpen ? html`
            <div className="absolute bottom-full left-3 right-3 mb-1 py-1 bg-[var(--app-surface)] border rounded-lg shadow-lg z-10" style=${{ borderColor: 'var(--app-border-soft)' }} role="menu">
              <button
                onClick=${() => { setSettingsOpen(false); onLogout?.(); }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] text-left"
                role="menuitem"
              >
                <${LogOutIcon} />
                Sign out
              </button>
            </div>
          ` : null}
          <button
            onClick=${() => setSettingsOpen((v) => !v)}
            className=${`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${settingsOpen ? 'bg-[var(--app-surface-hover)] text-[var(--app-text-primary)]' : ''} ${collapsed ? 'justify-center px-2' : ''}`}
            style=${settingsOpen ? {} : { color: 'var(--app-text-secondary)' }}
            title="Settings"
            aria-expanded=${settingsOpen}
            aria-haspopup="menu"
          >
            <span className="flex-shrink-0 flex items-center justify-center"><${SettingsIcon} /></span>
            ${!collapsed ? 'Settings' : null}
          </button>
        </div>
      ` : null}
    </div>
  `;
};

export default NetworkSidebar;
