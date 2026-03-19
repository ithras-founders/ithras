/**
 * FeedView - Main feed entry: three-column layout, routes to Global/Community/Channel/Saved/Discover.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import FeedLayout from './components/FeedLayout.js';
import FeedSidebar from './components/FeedSidebar.js';
import GlobalFeed from './views/GlobalFeed.js';
import CommunityFeedPage from './views/CommunityFeedPage.js';
import SavedFeed from './views/SavedFeed.js';
import DiscoverPage from './views/DiscoverPage.js';
import EmptyState from './components/EmptyState.js';

const html = htm.bind(React.createElement);

const RightSidebarPlaceholder = () => html`
  <div className="p-4 space-y-4">
    <div className="p-4 rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      <h4 className="text-sm font-semibold mb-3" style=${{ color: 'var(--app-text-secondary)' }}>Trending</h4>
      <${EmptyState}
        title="No trending discussions"
        description="When there is activity, trending posts will appear here."
      />
    </div>
    <div className="p-4 rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      <h4 className="text-sm font-semibold mb-3" style=${{ color: 'var(--app-text-secondary)' }}>Suggested communities</h4>
      <${EmptyState}
        title="No suggestions"
        description="Discover communities to get started."
      />
    </div>
  </div>
`;

const FeedView = ({ user, onLogout }) => {
  const [path, setPath] = useState(window.location.pathname || '/feed');

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/feed');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  const matchSaved = path === '/feed/saved';
  const matchDiscover = path === '/feed/discover';
  const matchCommunity = path.match(/^\/feed\/c\/([^/]+)$/);
  const matchChannel = path.match(/^\/feed\/c\/([^/]+)\/ch\/([^/]+)$/);
  const isCommunityRoute = matchCommunity || matchChannel;

  let activeView = 'home';
  if (matchSaved) activeView = 'saved';
  else if (matchDiscover) activeView = 'discover';

  const activeCommunitySlug = matchChannel ? matchChannel[1] : matchCommunity ? matchCommunity[1] : null;

  let content;
  if (matchSaved) {
    content = html`<${SavedFeed} user=${user} />`;
  } else if (matchDiscover) {
    content = html`<${DiscoverPage} />`;
  } else if (matchChannel) {
    content = html`<${CommunityFeedPage} communitySlug=${matchChannel[1]} channelSlug=${matchChannel[2]} user=${user} />`;
  } else if (matchCommunity) {
    content = html`<${CommunityFeedPage} communitySlug=${matchCommunity[1]} user=${user} />`;
  } else {
    content = html`<${GlobalFeed} user=${user} />`;
  }

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      navItems=${[]}
      showSettings=${true}
      sidebarContent=${html`<${FeedSidebar} activeView=${activeView} activeCommunitySlug=${activeCommunitySlug} onNavigate=${() => setPath(window.location.pathname)} pathPrefix="/feed" showSettings=${true} onLogout=${onLogout} />`}
    >
      <${FeedLayout}
        leftSidebar=${null}
        rightSidebar=${isCommunityRoute ? null : html`<${RightSidebarPlaceholder} />`}
      >
        ${content}
      </${FeedLayout}>
    </${AppShell}>
  `;
};

export default FeedView;
