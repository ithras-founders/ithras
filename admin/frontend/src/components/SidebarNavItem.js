/**
 * SidebarNavItem - Single nav item with icon and optional label.
 * Active state has subtle highlighted background.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ icon: React.ComponentType, label: string, href: string, active?: boolean, collapsed?: boolean }} props
 */
const SidebarNavItem = ({ icon: Icon, label, href, active = false, collapsed = false }) => {
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
      className=${`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
          : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)] hover:text-[var(--app-text-primary)]'
      } ${collapsed ? 'justify-center px-2' : ''}`}
      aria-current=${active ? 'page' : undefined}
    >
      <span className="flex-shrink-0 flex items-center justify-center">${html`<${Icon} size=${20} strokeWidth=${2} />`}</span>
      ${!collapsed ? html`<span className="truncate">${label}</span>` : null}
    </a>
  `;
};

export default SidebarNavItem;
