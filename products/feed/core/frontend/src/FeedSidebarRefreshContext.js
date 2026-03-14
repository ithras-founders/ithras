/**
 * Context for triggering a refresh of the feed sidebar (FeedLeftNav in Layout).
 * Used when CommunityPageView join/leave actions need to refresh the sidebar.
 */
import React from 'react';

const FeedSidebarRefreshContext = React.createContext({ refresh: () => {} });

export { FeedSidebarRefreshContext };
