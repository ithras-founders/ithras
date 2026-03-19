/**
 * SidebarNavItem - Single nav item with icon and optional label.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ icon: React.ComponentType, label: string, href: string, active?: boolean, collapsed?: boolean, badge?: number }}
 */
const SidebarNavItem = ({ icon: Icon, label, href, active = false, collapsed = false, badge = 0 }) => {
  const handleClick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', href);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <a
      href=${href}
      onClick=${handleClick}
      title=${collapsed ? label : undefined}
      className=${`relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text-primary)]'
      } ${collapsed ? 'justify-center px-2' : ''}`}
      aria-current=${active ? 'page' : undefined}
    >
      <span className="flex-shrink-0 flex items-center justify-center">${html`<${Icon} size=${20} strokeWidth=${2} />`}</span>
      ${!collapsed ? html`
        <span className="flex items-center gap-2 flex-1 min-w-0">
          <span className="truncate flex-1">${label}</span>
          ${badge > 0 ? html`
            <span style=${{
              background: '#F59E0B',
              color: '#fff',
              borderRadius: '999px',
              fontSize: '10px',
              fontWeight: 700,
              padding: '1px 6px',
              minWidth: '18px',
              textAlign: 'center',
              lineHeight: '16px',
              flexShrink: 0,
            }}>${badge}</span>
          ` : null}
        </span>
      ` : null}
      ${collapsed && badge > 0 ? html`
        <span style=${{
          position: 'absolute',
          top: '6px',
          right: '6px',
          background: '#F59E0B',
          borderRadius: '50%',
          width: '8px',
          height: '8px',
        }} />
      ` : null}
    </a>
  `;
};

export default SidebarNavItem;
