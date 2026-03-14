# Feed Product

The Feed product is split into submodules for different concerns:

| Module | Purpose |
|--------|---------|
| **core** | Shared feed UI: `FeedLeftNav`, `FeedSidebarRefreshContext`. Used by Layout and GeneralFeedPortal. |
| **channel** | Channel-specific UI and API: `ChannelFilters`, `ChannelVisibilitySettings`. Backend: channel router. |
| **community** | Feed community views: `FeedCommunitiesView` (list), `CommunityPageView` (detail with join/leave). Uses preparation API—no feed-community backend. |
| **global** | Main feed portal: `GeneralFeedPortal`, `FeedUtilityWing`, `MyNetworkPage`, `MessagesInboxView`. Backend: posts, network routers. |

## Backend

- **feed-global**: posts, network (loaded from `products/feed/global/backend`)
- **feed-channel**: channel router (loaded from `products/feed/channel/backend`)
- **feed-community**: Community APIs live in the **preparation** product. `products/feed/community/backend` is a stub and is not loaded.

## Entry Point

Product registry loads feed from `/products/feed/global/frontend/src/index.js`, which exports `GeneralFeedPortal`, `MyNetworkPage`, and `MessagesInboxView`.
