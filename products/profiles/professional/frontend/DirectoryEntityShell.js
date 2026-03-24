/**
 * App chrome for public institution (/i) and organisation (/o) pages — same as public profiles:
 * AppShell (top bar + search) + FeedSidebar + FeedLayout main column.
 */
import React from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import FeedSidebar from '/products/feed/frontend/src/components/FeedSidebar.js';
import FeedLayout from '/products/feed/frontend/src/components/FeedLayout.js';

const html = htm.bind(React.createElement);

const DirectoryEntityShell = ({ user, onLogout, children }) => {
  const feedSidebar = html`
    <${FeedSidebar} activeView="" onNavigate=${() => {}} pathPrefix="/feed" showSettings=${Boolean(user)} onLogout=${onLogout} />
  `;

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      navItems=${[]}
      showSettings=${Boolean(user)}
      sidebarContent=${feedSidebar}
      searchPlaceholder="Search…"
    >
      <${FeedLayout} leftSidebar=${null} rightSidebar=${null}>${children}</${FeedLayout}>
    </${AppShell}>
  `;
};

export default DirectoryEntityShell;
