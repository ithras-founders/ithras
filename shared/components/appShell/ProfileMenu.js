/**
 * ProfileMenu - User avatar and name, anchored to the right.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { LogOut, ChevronDown } from 'lucide-react';
import { resolveApiMediaUrl } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const goPath = (href) => {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

/**
 * @param {{ user: object | null, onLogout?: () => void, showDropdown?: boolean }}
 */
const ProfileMenu = ({ user, onLogout, showDropdown = true }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  if (!user) {
    return html`
      <div className="flex flex-shrink-0 items-center gap-1.5 sm:gap-2">
        <a
          href="/"
          onClick=${(e) => {
            e.preventDefault();
            goPath('/');
          }}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)] ith-focus-ring"
        >
          Sign in
        </a>
        <a
          href="/register"
          onClick=${(e) => {
            e.preventDefault();
            goPath('/register');
          }}
          className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-white ith-focus-ring"
          style=${{ background: 'var(--app-accent)' }}
        >
          Register
        </a>
      </div>
    `;
  }

  const displayName = user?.full_name || user?.name || user?.email || 'User';
  const initials = (displayName || 'U').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const profileHref = user?.profile_slug ? `/p/${user.profile_slug}` : '/';
  const photoUrl = resolveApiMediaUrl(user?.profile_photo_url);

  const handleProfileClick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', profileHref);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <div className="relative flex-shrink-0" ref=${ref}>
      <div className="flex items-center">
        <a
          href=${profileHref}
          onClick=${handleProfileClick}
          className="flex items-center gap-2.5 py-1.5 pl-1 pr-1 rounded-lg text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2"
          aria-label="Profile"
        >
          ${photoUrl
            ? html`<img src=${photoUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" width="36" height="36" title=${displayName} />`
            : html`<div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex-shrink-0" title=${displayName}>
                ${initials}
              </div>`}
          <span className="hidden sm:block text-sm font-medium truncate max-w-[140px]">${displayName}</span>
        </a>
        ${showDropdown ? html`
          <button
            onClick=${() => setOpen((v) => !v)}
            className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:bg-[var(--app-surface-hover)] transition-colors focus:outline-none"
            aria-expanded=${open}
            aria-haspopup="menu"
            aria-label="Menu"
          >
            <${ChevronDown} size=${18} className=${`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        ` : null}
      </div>
      ${showDropdown && open ? html`
        <div className="absolute right-0 top-full mt-1 py-1 min-w-[160px] bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg shadow-lg z-50" role="menu">
          <a
            href=${profileHref}
            onClick=${(e) => { e.preventDefault(); setOpen(false); handleProfileClick(e); }}
            className="block w-full px-4 py-2.5 text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] text-left"
            role="menuitem"
          >
            Profile
          </a>
          <button
            onClick=${() => { setOpen(false); onLogout?.(); }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] text-left transition-colors"
            role="menuitem"
          >
            <${LogOut} size=${16} />
            Sign out
          </button>
        </div>
      ` : null}
    </div>
  `;
};

export default ProfileMenu;
