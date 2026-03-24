/**
 * NetworkView - Main entry: AppShell + NetworkSidebar + main content routing.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import NetworkLayout from './components/NetworkLayout.js';
import NetworkSidebar from './components/NetworkSidebar.js';
import OverviewPage from './views/OverviewPage.js';
import ConnectionsPage from './views/ConnectionsPage.js';
import FollowingPage from './views/FollowingPage.js';
import OrgNetworkPage from './views/OrgNetworkPage.js';
import InstitutionNetworkPage from './views/InstitutionNetworkPage.js';
import FunctionNetworkPage from './views/FunctionNetworkPage.js';
import SuggestionsPage from './views/SuggestionsPage.js';
import { getPendingConnections } from './services/networkApi.js';

const html = htm.bind(React.createElement);

const NetworkView = ({ user, onLogout }) => {
  const [path, setPath] = useState(window.location.pathname || '/network');
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingItems, setPendingItems] = useState([]);

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/network');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  useEffect(() => {
    const load = () =>
      getPendingConnections()
        .then((r) => {
          const items = r.items || [];
          setPendingItems(items);
          setPendingCount(items.length);
        })
        .catch(() => {
          setPendingItems([]);
          setPendingCount(0);
        });
    load();
    window.addEventListener('ithras:notifications-changed', load);
    return () => window.removeEventListener('ithras:notifications-changed', load);
  }, []);

  const matchConnections = path === '/network/connections';
  const matchFollowing = path === '/network/following';
  const matchOrg = path === '/network/org';
  const matchInstitution = path === '/network/institution';
  const matchFunction = path === '/network/function';
  const matchSuggestions = path === '/network/suggestions';

  let activeView = 'overview';
  if (matchConnections) activeView = 'connections';
  else if (matchFollowing) activeView = 'following';
  else if (matchOrg) activeView = 'org';
  else if (matchInstitution) activeView = 'institution';
  else if (matchFunction) activeView = 'function';
  else if (matchSuggestions) activeView = 'suggestions';

  let content;
  if (matchConnections) content = html`<${ConnectionsPage} />`;
  else if (matchFollowing) content = html`<${FollowingPage} />`;
  else if (matchOrg) content = html`<${OrgNetworkPage} />`;
  else if (matchInstitution) content = html`<${InstitutionNetworkPage} />`;
  else if (matchFunction) content = html`<${FunctionNetworkPage} />`;
  else if (matchSuggestions) content = html`<${SuggestionsPage} />`;
  else content = html`<${OverviewPage} pendingItems=${pendingItems} />`;

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      navItems=${[]}
      showSettings=${true}
      sidebarContent=${html`<${NetworkSidebar} activeView=${activeView} onNavigate=${() => setPath(window.location.pathname)} pendingCount=${pendingCount} showSettings=${true} onLogout=${onLogout} />`}
    >
      <${NetworkLayout}>
        ${content}
      </${NetworkLayout}>
    </${AppShell}>
  `;
};

export default NetworkView;
