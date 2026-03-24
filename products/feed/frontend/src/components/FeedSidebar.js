/**
 * FeedSidebar - Left nav: Home, Saved, Discover + joined communities list.
 * Optionally shows Settings at bottom (when showSettings=true).
 * Collapsible like shared Sidebar.
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { getMyCommunities } from '../services/feedApi.js';
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

const HomeIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
`;

const BookmarkIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
  </svg>
`;

const CompassIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
  </svg>
`;

const FeedSidebar = ({ activeView, activeCommunitySlug, onNavigate, pathPrefix = '/feed', showSettings, onLogout, collapsed = false }) => {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [communityQuery, setCommunityQuery] = useState('');
  const settingsRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false); };
    if (showSettings) {
      document.addEventListener('click', h);
      return () => document.removeEventListener('click', h);
    }
  }, [showSettings]);

  useEffect(() => {
    getMyCommunities()
      .then((r) => setCommunities(r.items || []))
      .catch(() => setCommunities([]))
      .finally(() => setLoading(false));
  }, []);

  const navItems = [
    { key: 'updates', label: 'Updates', href: pathPrefix, icon: HomeIcon },
    { key: 'saved', label: 'Saved', href: `${pathPrefix}/saved`, icon: BookmarkIcon },
    { key: 'discover', label: 'Discover', href: `${pathPrefix}/discover`, icon: CompassIcon },
  ];

  const handleNav = (e, href) => {
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    onNavigate?.(href);
  };

  const handleCommunityClick = (slug) => {
    const href = `${pathPrefix}/c/${slug}`;
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    onNavigate?.(href);
  };

  const q = communityQuery.trim().toLowerCase();
  const filteredCommunities = q
    ? communities.filter((c) => (c.name || '').toLowerCase().includes(q))
    : communities;

  return html`
    <div className="flex flex-col h-full">
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto min-h-0" aria-label="Feed navigation">
        <div className="mb-6">
          ${navItems.map((item) => html`
            <${SidebarNavItem}
              key=${item.key}
              icon=${item.icon}
              label=${item.label}
              href=${item.href}
              active=${activeView === item.key}
              collapsed=${collapsed}
            />
          `)}
        </div>
        ${!collapsed ? html`
        <div className="border-t pt-4" style=${{ borderColor: 'var(--app-border-soft)' }}>
          <h4 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Joined communities</h4>
          ${loading ? html`
            <div className="px-3 py-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
          ` : communities.length === 0 ? html`
            <div className="px-3 py-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
              No communities joined. Join communities to build your feed.
            </div>
          ` : html`
            <div className="space-y-0.5">
              ${communities.length > 5 ? html`
                <div className="px-3 mb-2">
                  <label className="sr-only" htmlFor="ithras-sidebar-community-search">Filter communities</label>
                  <input
                    id="ithras-sidebar-community-search"
                    type="search"
                    placeholder="Filter communities…"
                    value=${communityQuery}
                    onInput=${(e) => setCommunityQuery(e.target.value)}
                    className="w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                    style=${{
                      borderColor: 'var(--app-border-soft)',
                      background: 'var(--app-surface-subtle)',
                      color: 'var(--app-text-primary)',
                    }}
                  />
                </div>
              ` : null}
              ${filteredCommunities.length === 0 ? html`
                <div className="px-3 py-2 text-xs" style=${{ color: 'var(--app-text-muted)' }}>No communities match your filter.</div>
              ` : null}
              ${filteredCommunities.map((c) => {
                const isActive = activeCommunitySlug === c.slug;
                return html`
                  <button
                    key=${c.id}
                    type="button"
                    onClick=${() => handleCommunityClick(c.slug)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors"
                    style=${{
                      background: isActive ? 'var(--app-accent-soft)' : 'transparent',
                      color: isActive ? 'var(--app-accent)' : 'var(--app-text-primary)',
                      fontWeight: isActive ? '600' : 'normal',
                    }}
                    onMouseEnter=${(e) => { if (!isActive) e.currentTarget.style.background = 'var(--app-surface-hover)'; }}
                    onMouseLeave=${(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    ${c.logo_url ? html`<img src=${c.logo_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />` : html`
                      <span className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium flex-shrink-0"
                        style=${{ background: isActive ? 'var(--app-accent)' : 'var(--app-accent-soft)', color: isActive ? '#fff' : 'var(--app-accent)' }}>
                        ${(c.name || 'C').charAt(0).toUpperCase()}
                      </span>
                    `}
                    <span className="truncate">${c.name}</span>
                  </button>
                `;
              })}
            </div>
          `}
        </div>
        ` : null}
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

export default FeedSidebar;
