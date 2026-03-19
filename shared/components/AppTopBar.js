/**
 * Shared top bar: logo, search, profile photo, name.
 * Optional: Settings dropdown when showSettings=true (for layouts without sidebar).
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import IthrasLogo from '/shared/components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const SearchIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
`;

const SettingsIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
`;

const LogOutIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
`;

const AppTopBar = ({ user, onLogout, showSettings = true, searchPlaceholder = 'Search...', hideLogo = false }) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setSettingsOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const displayName = user?.full_name || user?.name || user?.email || 'User';
  const initials = (displayName || 'U').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  return html`
    <header className="flex-shrink-0 flex items-center gap-4 px-4 md:px-6 py-3 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)]">
      ${!hideLogo ? html`<${IthrasLogo} size="sm" theme="dark" />` : null}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]">
            <${SearchIcon} />
          </span>
          <input
            type="search"
            placeholder=${searchPlaceholder}
            value=${searchValue}
            onChange=${(e) => setSearchValue(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)]"
            title=${displayName}
          >
            ${initials}
          </div>
          <span className="hidden sm:inline text-sm font-medium text-[var(--app-text-primary)]">${displayName}</span>
        </div>
        ${showSettings ? html`
          <div className="relative" ref=${ref}>
            <button
              onClick=${() => setSettingsOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)] transition-colors"
              title="Settings"
            >
              <${SettingsIcon} />
              <span className="text-sm font-medium">Settings</span>
            </button>
            ${settingsOpen ? html`
              <div className="absolute right-0 top-full mt-1 py-1 w-48 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg shadow-lg z-50">
                <button
                  onClick=${() => { setSettingsOpen(false); onLogout?.(); }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)]"
                >
                  <${LogOutIcon} />
                  Sign out
                </button>
              </div>
            ` : null}
          </div>
        ` : null}
      </div>
    </header>
  `;
};

export default AppTopBar;
