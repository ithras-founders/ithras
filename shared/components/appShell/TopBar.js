/**
 * TopBar - Full-width sticky top bar.
 * General mode: [ BrandArea ][ Search ][ Feed ][ Network ][ Messages ][ Profile ]
 * Admin mode: [ BrandArea ][ Search ][ Users ][ Entities ][ Communities ][ Profile ]
 */
import React from 'react';
import htm from 'htm';
import { Users, Building2, MessageCircle, Activity } from 'lucide-react';
import BrandArea from './BrandArea.js';
import SearchBar from './SearchBar.js';
import ProfileMenu from './ProfileMenu.js';
import NotificationBell from './NotificationBell.js';

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

const InfoIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="8"/>
    <line x1="12" y1="12" x2="12" y2="16"/>
  </svg>
`;

const NavButton = ({ href, label, icon, isActive }) => {
  const handleClick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };
  return html`
    <a
      href=${href}
      onClick=${handleClick}
      className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors hover:bg-[var(--app-surface-hover)]"
      style=${{
        background: isActive ? 'var(--app-accent-soft)' : 'transparent',
        color: isActive ? 'var(--app-accent)' : 'var(--app-text-secondary)',
      }}
    >
      <span className="flex-shrink-0"><${icon} /></span>
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
 * }}
 */
const TopBar = ({
  collapsed,
  onCollapseToggle,
  user,
  onLogout,
  searchPlaceholder = 'Search...',
  variant,
}) => {
  const path = typeof window !== 'undefined' ? (window.location.pathname || '') : '';
  const isAdminMode = variant === 'admin' || (variant == null && path.startsWith('/admin'));

  const isFeed = path === '/feed' || path.startsWith('/feed/');
  const isNetwork = path === '/network' || path.startsWith('/network/');
  const isMessages = path === '/messages' || path.startsWith('/messages/');
  const isUsers = path === '/admin/users' || path.startsWith('/admin/users');
  const isEntities = path.startsWith('/admin/institutions') || path.startsWith('/admin/organisations');
  const isCommunities = path.startsWith('/admin/communities') || path.startsWith('/admin/community-requests');
  const isTechnology = path.startsWith('/admin/technology');

  const navButtons = isAdminMode
    ? html`
        <${NavButton} key="users" href="/admin/users" label="Users" icon=${Users} isActive=${isUsers} />
        <${NavButton} key="entities" href="/admin/institutions" label="Entities" icon=${Building2} isActive=${isEntities} />
        <${NavButton} key="communities" href="/admin/communities" label="Communities" icon=${MessageCircle} isActive=${isCommunities} />
        <${NavButton} key="technology" href="/admin/technology" label="Technology" icon=${Activity} isActive=${isTechnology} />
      `
    : html`
        <${NavButton} key="feed" href="/feed" label="Feed" icon=${FeedIcon} isActive=${isFeed} />
        <${NavButton} key="network" href="/network" label="Network" icon=${NetworkIcon} isActive=${isNetwork} />
        <${NavButton} key="messages" href="/messages" label="Messages" icon=${MessagesIcon} isActive=${isMessages} />
        <${NavButton} key="about" href="/about" label="About" icon=${InfoIcon} isActive=${path === '/about'} />
        ${!isAdminMode ? html`<${NotificationBell} key="notifications" />` : null}
      `;

  return html`
    <header className="sticky top-0 left-0 right-0 z-20 flex-shrink-0 h-14 flex items-center overflow-x-hidden overflow-y-visible border-b border-[var(--app-border-soft)] bg-[var(--app-surface)] shadow-sm">
      <${BrandArea} collapsed=${collapsed} onCollapseToggle=${onCollapseToggle} />
      <div className="flex-1 min-w-0 flex items-center gap-4 pl-4 pr-4 h-full">
        <div className="flex-1 min-w-0 max-w-md hidden sm:block">
          <${SearchBar} placeholder=${searchPlaceholder} />
        </div>
        <div className="flex-1 min-w-0" />
        <div className="flex items-center gap-1 mr-2">
          ${navButtons}
        </div>
        <${ProfileMenu} user=${user} onLogout=${onLogout} showDropdown=${true} />
      </div>
    </header>
  `;
};

export default TopBar;
