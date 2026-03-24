/**
 * LongForm left nav — Discover, Subscribed, Your publications + Settings footer.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import htm from 'htm';
import { Compass } from 'lucide-react';
import SidebarNavItem from '/shared/components/appShell/SidebarNavItem.js';
import { listPublications } from '/shared/services/longformApi.js';

const html = htm.bind(React.createElement);

const PATH_PREFIX = '/longform';

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

const LongFormSidebar = ({ path = '/longform', onNavigate, showSettings, onLogout, collapsed = false }) => {
  const [subscribed, setSubscribed] = useState([]);
  const [mine, setMine] = useState([]);
  const [loadingSub, setLoadingSub] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [subQuery, setSubQuery] = useState('');
  const [mineQuery, setMineQuery] = useState('');
  const settingsRef = useRef(null);

  const fetchLists = useCallback(() => {
    setLoadingSub(true);
    setLoadingMine(true);
    listPublications({ subscribed: 1, limit: 50, sort: 'updated' })
      .then((r) => setSubscribed(r.items || []))
      .catch(() => setSubscribed([]))
      .finally(() => setLoadingSub(false));
    listPublications({ mine: 1, limit: 50, sort: 'updated' })
      .then((r) => setMine(r.items || []))
      .catch(() => setMine([]))
      .finally(() => setLoadingMine(false));
  }, []);

  useEffect(() => {
    fetchLists();
  }, [path, fetchLists]);

  useEffect(() => {
    const h = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false);
    };
    if (showSettings) {
      document.addEventListener('click', h);
      return () => document.removeEventListener('click', h);
    }
  }, [showSettings]);

  const normalizedPath = (path || '').replace(/\/$/, '') || '/longform';
  const discoverActive = normalizedPath === '/longform';
  const pubMatch = (path || '').match(/^\/longform\/p\/([^/]+)/);
  const activePubSlug = pubMatch ? pubMatch[1] : null;

  const handlePubNav = (slug) => {
    const href = `${PATH_PREFIX}/p/${slug}`;
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    onNavigate?.(href);
  };

  const sq = subQuery.trim().toLowerCase();
  const filteredSub = sq
    ? subscribed.filter((p) => (p.title || '').toLowerCase().includes(sq) || (p.slug || '').toLowerCase().includes(sq))
    : subscribed;
  const mq = mineQuery.trim().toLowerCase();
  const filteredMine = mq
    ? mine.filter((p) => (p.title || '').toLowerCase().includes(mq) || (p.slug || '').toLowerCase().includes(mq))
    : mine;

  const pubRow = (p) => {
    const isActive = activePubSlug === p.slug;
    return html`
      <button
        key=${p.id}
        type="button"
        onClick=${() => handlePubNav(p.slug)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors"
        style=${{
          background: isActive ? 'var(--app-accent-soft)' : 'transparent',
          color: isActive ? 'var(--app-accent)' : 'var(--app-text-primary)',
          fontWeight: isActive ? '600' : 'normal',
        }}
        onMouseEnter=${(e) => {
          if (!isActive) e.currentTarget.style.background = 'var(--app-surface-hover)';
        }}
        onMouseLeave=${(e) => {
          if (!isActive) e.currentTarget.style.background = 'transparent';
        }}
      >
        <span
          className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium flex-shrink-0"
          style=${{ background: isActive ? 'var(--app-accent)' : 'var(--app-accent-soft)', color: isActive ? '#fff' : 'var(--app-accent)' }}
        >
          ${(p.title || 'P').charAt(0).toUpperCase()}
        </span>
        <span className="truncate">${p.title || p.slug}</span>
      </button>
    `;
  };

  return html`
    <div className="flex flex-col h-full">
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto min-h-0" aria-label="LongForm navigation">
        <div className="mb-6">
          <${SidebarNavItem}
            icon=${Compass}
            label="Discover"
            href=${PATH_PREFIX}
            active=${discoverActive}
            collapsed=${collapsed}
          />
        </div>
        ${!collapsed
          ? html`
              <div className="border-t pt-4 space-y-6" style=${{ borderColor: 'var(--app-border-soft)' }}>
                <div>
                  <h4 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>
                    Subscribed
                  </h4>
                  ${loadingSub
                    ? html`<div className="px-3 py-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading…</div>`
                    : subscribed.length === 0
                      ? html`
                          <div className="px-3 py-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                            No subscriptions yet. Open a publication and subscribe.
                          </div>
                        `
                      : html`
                          <div className="space-y-0.5">
                            ${subscribed.length > 5
                              ? html`
                                  <div className="px-3 mb-2">
                                    <label className="sr-only" htmlFor="ithras-longform-sidebar-subscribed-search">Filter subscribed</label>
                                    <input
                                      id="ithras-longform-sidebar-subscribed-search"
                                      type="search"
                                      placeholder="Filter subscribed…"
                                      value=${subQuery}
                                      onInput=${(e) => setSubQuery(e.target.value)}
                                      className="w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                                      style=${{
                                        borderColor: 'var(--app-border-soft)',
                                        background: 'var(--app-surface-subtle)',
                                        color: 'var(--app-text-primary)',
                                      }}
                                    />
                                  </div>
                                `
                              : null}
                            ${filteredSub.length === 0
                              ? html`<div className="px-3 py-2 text-xs" style=${{ color: 'var(--app-text-muted)' }}>No matches.</div>`
                              : null}
                            ${filteredSub.map(pubRow)}
                          </div>
                        `}
                </div>
                <div>
                  <h4 className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>
                    Your publications
                  </h4>
                  ${loadingMine
                    ? html`<div className="px-3 py-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading…</div>`
                    : mine.length === 0
                      ? html`
                          <div className="px-3 py-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                            You have not created a publication yet. Start one from Discover.
                          </div>
                        `
                      : html`
                          <div className="space-y-0.5">
                            ${mine.length > 5
                              ? html`
                                  <div className="px-3 mb-2">
                                    <label className="sr-only" htmlFor="ithras-longform-sidebar-mine-search">Filter your publications</label>
                                    <input
                                      id="ithras-longform-sidebar-mine-search"
                                      type="search"
                                      placeholder="Filter your publications…"
                                      value=${mineQuery}
                                      onInput=${(e) => setMineQuery(e.target.value)}
                                      className="w-full rounded-lg border px-2 py-1.5 text-sm outline-none"
                                      style=${{
                                        borderColor: 'var(--app-border-soft)',
                                        background: 'var(--app-surface-subtle)',
                                        color: 'var(--app-text-primary)',
                                      }}
                                    />
                                  </div>
                                `
                              : null}
                            ${filteredMine.length === 0
                              ? html`<div className="px-3 py-2 text-xs" style=${{ color: 'var(--app-text-muted)' }}>No matches.</div>`
                              : null}
                            ${filteredMine.map(pubRow)}
                          </div>
                        `}
                </div>
              </div>
            `
          : null}
      </nav>
      ${showSettings
        ? html`
            <div className="relative flex-shrink-0 p-3 pt-2 border-t" style=${{ borderColor: 'var(--app-border-soft)' }} ref=${settingsRef}>
              ${settingsOpen
                ? html`
                    <div
                      className="absolute bottom-full left-3 right-3 mb-1 py-1 bg-[var(--app-surface)] border rounded-lg shadow-lg z-10"
                      style=${{ borderColor: 'var(--app-border-soft)' }}
                      role="menu"
                    >
                      <button
                        onClick=${() => {
                          setSettingsOpen(false);
                          onLogout?.();
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] text-left"
                        role="menuitem"
                      >
                        <${LogOutIcon} />
                        Sign out
                      </button>
                    </div>
                  `
                : null}
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
          `
        : null}
    </div>
  `;
};

export default LongFormSidebar;
