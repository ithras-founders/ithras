/**
 * LongForm — AppShell + discovery, publication, post reader.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import FeedLayout from '../../../feed/frontend/src/components/FeedLayout.js';
import LongFormSidebar from './LongFormSidebar.js';
import LongFormRightRail from './LongFormRightRail.js';
import LongFormDiscoverPage from './LongFormDiscoverPage.js';
import LongFormPublicationPage from './LongFormPublicationPage.js';
import LongFormPostPage from './LongFormPostPage.js';

const html = htm.bind(React.createElement);

const LongFormView = ({ user, onLogout }) => {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname || '/longform' : '/longform');

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/longform');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  const postMatch = path.match(/^\/longform\/p\/([^/]+)\/([^/]+)$/);
  const pubMatch = path.match(/^\/longform\/p\/([^/]+)$/);

  let content;
  if (postMatch) {
    content = html`<${LongFormPostPage} user=${user} publicationSlug=${postMatch[1]} postSlug=${postMatch[2]} />`;
  } else if (pubMatch) {
    content = html`<${LongFormPublicationPage} user=${user} publicationSlug=${pubMatch[1]} />`;
  } else {
    content = html`<${LongFormDiscoverPage} />`;
  }

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      navItems=${[]}
      showSettings=${true}
      searchPlaceholder="Search…"
      sidebarContent=${html`
        <${LongFormSidebar}
          path=${path}
          onNavigate=${() => setPath(window.location.pathname || '/longform')}
          showSettings=${true}
          onLogout=${onLogout}
        />
      `}
    >
      <${FeedLayout} leftSidebar=${null} rightSidebar=${html`<${LongFormRightRail} />`}>
        ${content}
      </${FeedLayout}>
    </${AppShell}>
  `;
};

export default LongFormView;
