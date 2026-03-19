/**
 * ModeSelector - Rich mode picker for admin users.
 * Box shows current mode; click opens overlay covering left nav with rich options (icon, header, description).
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import { Shield, LayoutGrid, ChevronDown } from 'lucide-react';

const html = htm.bind(React.createElement);

const MODES = [
  {
    id: 'admin',
    label: 'Admin Mode',
    description: 'Manage institutions, organisations, communities, and users',
    icon: Shield,
    href: '/admin/institutions',
  },
  {
    id: 'general',
    label: 'General Mode',
    description: 'Browse feed, network, and messages like a regular user',
    icon: LayoutGrid,
    href: '/feed',
  },
];

const TOP_BAR_HEIGHT = 56;

const ModeSelector = ({ collapsed = false, sidebarWidth = 280 }) => {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const isAdminMode = path.startsWith('/admin');
  const currentMode = isAdminMode ? MODES[0] : MODES[1];

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
    const close = (e) => {
      if (open && ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [open]);

  const selectMode = (mode) => {
    const isCurrentlyAdmin = path.startsWith('/admin');
    if (mode.id === 'admin' && !isCurrentlyAdmin) {
      window.history.pushState(null, '', '/admin/institutions');
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    } else if (mode.id === 'general' && isCurrentlyAdmin) {
      window.history.pushState(null, '', '/feed');
      window.dispatchEvent(new CustomEvent('ithras:path-changed'));
    }
    setOpen(false);
  };

  return html`
    <div ref=${ref} className="flex-shrink-0 relative p-2 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
      <button
        onClick=${() => setOpen((v) => !v)}
        className=${`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all hover:bg-[var(--app-surface-hover)] ${collapsed ? 'justify-center px-2' : ''}`}
        style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
        aria-expanded=${open}
        aria-haspopup="listbox"
        aria-label="Switch mode"
      >
        <span
          className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg"
          style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
        >
          <${currentMode.icon} size=${20} strokeWidth=${2} />
        </span>
        ${!collapsed ? html`
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Mode</p>
            <p className="text-sm font-semibold truncate" style=${{ color: 'var(--app-text-primary)' }}>${currentMode.label}</p>
          </div>
          <${ChevronDown} size=${18} className="flex-shrink-0 transition-transform" style=${{ color: 'var(--app-text-muted)', transform: open ? 'rotate(180deg)' : 'none' }} />
        ` : null}
      </button>

      ${open ? html`
        <div
          className="fixed z-50 flex flex-col border-r shadow-xl overflow-hidden"
          style=${{
            top: `${TOP_BAR_HEIGHT}px`,
            left: 0,
            width: `${sidebarWidth}px`,
            height: `calc(100vh - ${TOP_BAR_HEIGHT}px)`,
            borderColor: 'var(--app-border-soft)',
            background: 'var(--app-surface)',
            borderTopRightRadius: '0.75rem',
            borderBottomRightRadius: '0.75rem',
          }}
        >
          <div className="p-3 border-b flex-shrink-0" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Switch mode</p>
            <p className="text-sm mt-0.5" style=${{ color: 'var(--app-text-secondary)' }}>Choose how you want to use the app</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            ${MODES.map((mode) => {
              const isActive = (mode.id === 'admin' && isAdminMode) || (mode.id === 'general' && !isAdminMode);
              return React.createElement(
                React.Fragment,
                { key: mode.id },
                html`
                  <button
                    onClick=${() => selectMode(mode)}
                    className="w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all hover:bg-[var(--app-surface-hover)]"
                    style=${{
                      borderColor: isActive ? 'var(--app-accent)' : 'var(--app-border-soft)',
                      background: isActive ? 'var(--app-accent-soft)' : 'transparent',
                    }}
                    role="option"
                    aria-selected=${isActive}
                  >
                    <span
                      className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg"
                      style=${{ background: isActive ? 'var(--app-accent)' : 'var(--app-surface)', color: isActive ? 'white' : 'var(--app-text-secondary)' }}
                    >
                      <${mode.icon} size=${22} strokeWidth=${2} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${mode.label}</p>
                      <p className="text-xs mt-1" style=${{ color: 'var(--app-text-muted)' }}>${mode.description}</p>
                    </div>
                  </button>
                `
              );
            })}
          </div>
        </div>
      ` : null}
    </div>
  `;
};

export default ModeSelector;
