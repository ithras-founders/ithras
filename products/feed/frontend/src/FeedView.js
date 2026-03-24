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
import CommunityFeedRightRail from './components/community/CommunityFeedRightRail.js';
import SavedFeed from './views/SavedFeed.js';
import DiscoverPage from './views/DiscoverPage.js';
import { TrendingUp, Sparkles, Compass } from 'lucide-react';
import { FeedRailPanel, FeedRailHeading, FeedRailEmpty } from '/shared/components/feed/FeedRailKit.js';

const html = htm.bind(React.createElement);

const RightSidebarPlaceholder = () => html`
  <div className="p-2.5 sm:p-3 space-y-0">
    <${FeedRailPanel}>
      <${FeedRailHeading} icon=${TrendingUp} title="Trending" kicker="What’s gaining traction across your communities." />
      <${FeedRailEmpty}
        icon=${TrendingUp}
        line="Quiet for now"
        hint="When discussions heat up, popular posts from your joined spaces can appear here."
      />
    </${FeedRailPanel}>
    <${FeedRailPanel}>
      <${FeedRailHeading} icon=${Compass} title="Suggested communities" kicker="Places worth exploring next." />
      <${FeedRailEmpty}
        icon=${Sparkles}
        line="No picks yet"
        hint="Head to Discover to find cohorts and networks that fit you—we’ll learn from what you join."
      />
    </${FeedRailPanel}>
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

  let activeView = 'updates';
  if (matchSaved) activeView = 'saved';
  else if (matchDiscover) activeView = 'discover';

  const activeCommunitySlug = matchChannel ? matchChannel[1] : matchCommunity ? matchCommunity[1] : null;
  const activeChannelSlug = matchChannel ? matchChannel[2] : null;

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
        rightSidebar=${isCommunityRoute && activeCommunitySlug
          ? html`<${CommunityFeedRightRail} communitySlug=${activeCommunitySlug} channelSlug=${activeChannelSlug} />`
          : html`<${RightSidebarPlaceholder} />`}
      >
        ${content}
      </${FeedLayout}>
    </${AppShell}>
  `;
};

export default FeedView;
