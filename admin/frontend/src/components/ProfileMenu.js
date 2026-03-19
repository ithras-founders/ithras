/**
 * ProfileMenu - User avatar and name, anchored to the right.
 * Optional dropdown for Sign out.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';
import { LogOut, ChevronDown } from 'lucide-react';

const html = htm.bind(React.createElement);

/**
 * @param {{ user: { full_name?: string, name?: string, email?: string }, onLogout?: () => void, showDropdown?: boolean }} props
 */
const ProfileMenu = ({ user, onLogout, showDropdown = true }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, []);

  const displayName = user?.full_name || user?.name || user?.email || 'User';
  const initials = (displayName || 'U')
    .split(/\s+/)
    .map((s) => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return html`
    <div className="relative flex-shrink-0" ref=${ref}>
      <button
        onClick=${() => showDropdown && setOpen((v) => !v)}
        className="flex items-center gap-2.5 py-1.5 pl-1 pr-2 rounded-lg text-[var(--app-text-primary)] hover:bg-[var(--app-surface-hover)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-2"
        aria-expanded=${open}
        aria-haspopup=${showDropdown ? 'menu' : undefined}
        aria-label=${showDropdown ? 'Profile menu' : displayName}
      >
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex-shrink-0"
          title=${displayName}
        >
          ${initials}
        </div>
        <span className="hidden sm:block text-sm font-medium truncate max-w-[140px]">${displayName}</span>
        ${showDropdown ? html`
          <${ChevronDown}
            size=${18}
            className=${`text-[var(--app-text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        ` : null}
      </button>
      ${showDropdown && open ? html`
        <div
          className="absolute right-0 top-full mt-1 py-1 min-w-[160px] bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg shadow-lg z-50"
          role="menu"
        >
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
