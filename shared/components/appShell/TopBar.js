/**
 * TopBar - Full-width sticky top bar.
 * General mode: [ BrandArea ][ Search (hidden on /search) ][ Feed ][ Network ][ LongForm ][ Prepare ][ Jobs ][ Messages ][ Profile ]
 * Admin mode: [ BrandArea ][ Search ][ Users ][ Entities ][ Communities ][ Profile ]
 */
import React from 'react';
import htm from 'htm';
import { Users, Building2, MessageCircle, Activity, BookOpen, Newspaper, Briefcase, Search, Menu, Moon, Sun } from 'lucide-react';
import BrandArea from './BrandArea.js';
import SearchBar from './SearchBar.js';
import ProfileMenu from './ProfileMenu.js';
const html = htm.bind(React.createElement);

const FeedIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
`;

const NetworkIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
`;

const MessagesIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
`;

const PrepareIcon = () => html`<${BookOpen} size=${20} strokeWidth=${2} />`;

const LongFormIcon = () => html`<${Newspaper} size=${20} strokeWidth=${2} />`;

const JobsIcon = () => html`<${Briefcase} size=${20} strokeWidth=${2} />`;

const NavButton = ({ href, label, icon, isActive, badge = 0 }) => {
  const handleClick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };
  return html`
    <a
      href=${href}
      onClick=${handleClick}
      className="relative ith-focus-ring flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-[var(--radius-pill)] min-w-[56px] transition-colors hover:bg-[var(--app-surface-hover)]"
      style=${{
        background: isActive ? 'var(--app-accent-soft)' : 'transparent',
        color: isActive ? 'var(--app-accent)' : 'var(--app-text-secondary)',
        boxShadow: isActive ? 'inset 0 0 0 1px var(--app-accent-soft)' : 'none',
      }}
    >
      <span className="flex-shrink-0 relative">
        <${icon} />
        ${badge > 0 ? html`
          <span style=${{
            position: 'absolute',
            top: '-4px',
            right: '-6px',
            background: '#F59E0B',
            color: '#fff',
            borderRadius: '999px',
            fontSize: '9px',
            fontWeight: 700,
            padding: '0 4px',
            minWidth: '14px',
            textAlign: 'center',
            lineHeight: '14px',
            pointerEvents: 'none',
          }}>${badge > 99 ? '99+' : badge}</span>
        ` : null}
      </span>
      <span className="text-xs font-medium">${label}</span>
    </a>
  `;
};

/**
 * @param {{
 *   collapsed: boolean,
 *   onCollapseToggle: () => void,
 *   user: object,
 *   onLogout: () => void,
 *   searchPlaceholder?: string,
 *   variant?: 'admin' | 'general',
 *   pendingUsersCount?: number,
 *   onSearchActivate?: () => void,
 *   topSearchValue?: string,
 *   onTopSearchChange?: (v: string) => void,
 *   onTopSearchSubmit?: (q: string) => void,
 *   onTopSearchNavigate?: (href: string) => void,
 *   logoTheme?: 'light' | 'dark',
 *   theme?: 'light' | 'dark',
 *   onThemeToggle?: () => void,
 *   onMobileMenuOpen?: () => void,
 * }}
 */
const TopBar = ({
  collapsed,
  onCollapseToggle,
  user,
  onLogout,
  searchPlaceholder = 'Search...',
  variant,
  pendingUsersCount = 0,
  onSearchActivate,
  topSearchValue = '',
  onTopSearchChange,
  onTopSearchSubmit,
  onTopSearchNavigate,
  logoTheme = 'dark',
  theme = 'light',
  onThemeToggle,
  onMobileMenuOpen,
}) => {
  const path = typeof window !== 'undefined' ? (window.location.pathname || '') : '';
  const isFullSearchPage = path === '/search';
  const isAdminMode = variant === 'admin' || (variant == null && path.startsWith('/admin'));

  const isFeed = path === '/feed' || path.startsWith('/feed/');
  const isPrepare = path === '/prepare' || path.startsWith('/prepare/');
  const isLongForm = path === '/longform' || path.startsWith('/longform/');
  const isNetwork = path === '/network' || path.startsWith('/network/');
  const isJobs = path === '/jobs' || path.startsWith('/jobs/');
  const isMessages = path === '/messages' || path.startsWith('/messages/');
  const isUsers = path === '/admin/users' || path.startsWith('/admin/users');
  const isEntities = path.startsWith('/admin/institutions') || path.startsWith('/admin/organisations');
  const isCommunities = path.startsWith('/admin/communities') || path.startsWith('/admin/community-requests');
  const isTechnology = path.startsWith('/admin/technology');

  const adminNavSpec = [
    { key: 'users', href: '/admin/users', label: 'Users', icon: Users, isActive: isUsers, badge: pendingUsersCount },
    { key: 'entities', href: '/admin/institutions', label: 'Entities', icon: Building2, isActive: isEntities, badge: 0 },
    { key: 'communities', href: '/admin/communities', label: 'Communities', icon: MessageCircle, isActive: isCommunities, badge: 0 },
    { key: 'technology', href: '/admin/technology', label: 'Technology', icon: Activity, isActive: isTechnology, badge: 0 },
  ];
  const generalNavSpec = [
    { key: 'feed', href: '/feed', label: 'Feed', icon: FeedIcon, isActive: isFeed, badge: 0 },
    { key: 'network', href: '/network', label: 'Network', icon: NetworkIcon, isActive: isNetwork, badge: 0 },
    { key: 'longform', href: '/longform', label: 'LongForm', icon: LongFormIcon, isActive: isLongForm, badge: 0 },
    { key: 'prepare', href: '/prepare', label: 'Prepare', icon: PrepareIcon, isActive: isPrepare, badge: 0 },
    { key: 'jobs', href: '/jobs', label: 'Jobs', icon: JobsIcon, isActive: isJobs, badge: 0 },
    { key: 'messages', href: '/messages', label: 'Messages', icon: MessagesIcon, isActive: isMessages, badge: 0 },
  ];
  const navButtons = isAdminMode
    ? adminNavSpec.map(({ key, href, label, icon, isActive, badge }) =>
        React.createElement(NavButton, { key, href, label, icon, isActive, badge }),
      )
    : generalNavSpec.map(({ key, href, label, icon, isActive, badge }) =>
        React.createElement(NavButton, { key, href, label, icon, isActive, badge }),
      );

  return html`
    <header className="ith-topbar-glass sticky top-0 left-0 right-0 z-50 flex-shrink-0 h-14 flex items-center overflow-x-hidden overflow-y-visible">
      <${BrandArea} collapsed=${collapsed} onCollapseToggle=${onCollapseToggle} logoTheme=${logoTheme} />
      <div className="flex-1 min-w-0 flex items-center gap-3 sm:gap-4 pl-2 sm:pl-4 pr-3 sm:pr-4 h-full">
        ${onMobileMenuOpen
          ? html`
              <button
                type="button"
                className="md:hidden ith-focus-ring p-2 rounded-[var(--radius-md)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)]"
                onClick=${onMobileMenuOpen}
                aria-label="Open navigation menu"
              >
                <${Menu} size=${22} strokeWidth=${2} />
              </button>
            `
          : null}
        ${onSearchActivate && !isFullSearchPage
          ? html`
              <button
                type="button"
                className="sm:hidden ith-focus-ring p-2 rounded-[var(--radius-md)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)]"
                onClick=${() => onSearchActivate()}
                aria-label="Open search"
                title="Search"
              >
                <${Search} size=${20} strokeWidth=${2} />
              </button>
            `
          : null}
        ${!isFullSearchPage
          ? html`
              <div className="flex-1 min-w-0 max-w-md hidden sm:flex items-center gap-1.5">
                ${onSearchActivate && typeof onTopSearchSubmit === 'function'
                  ? html`
                      <div className="flex-1 min-w-0">
                        <${SearchBar}
                          placeholder=${`${searchPlaceholder} — suggestions as you type, Enter for full search`}
                          value=${topSearchValue}
                          onChange=${onTopSearchChange}
                          onSubmit=${onTopSearchSubmit}
                          suggestEnabled=${Boolean(user && onTopSearchNavigate)}
                          onNavigateHref=${onTopSearchNavigate}
                        />
                      </div>
                    `
                  : onSearchActivate
                    ? html`
                        <button
                          type="button"
                          onClick=${() => onSearchActivate()}
                          className="ith-focus-ring relative w-full flex items-center gap-3 pl-10 pr-4 py-2 rounded-[var(--radius-md)] border text-left text-sm transition-colors border-[var(--app-border-soft)] bg-[var(--app-surface-subtle)] text-[var(--app-text-muted)] hover:border-[var(--app-border-strong)]"
                          aria-label="Open advanced search"
                        >
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)] pointer-events-none">
                            <${Search} size=${18} strokeWidth=${2} />
                          </span>
                          <span className="truncate">${searchPlaceholder} — full page</span>
                        </button>
                      `
                    : html`<${SearchBar} placeholder=${searchPlaceholder} />`}
              </div>
            `
          : null}
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-0.5 sm:gap-1 mr-1 overflow-x-auto max-w-[min(52vw,240px)] sm:max-w-none sm:overflow-visible scrollbar-none">
          ${navButtons}
        </div>
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
