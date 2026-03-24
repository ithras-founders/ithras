/**
 * FeedLayout - Three-column layout for feed.
 * Left: sidebar (240px), Center: main feed (flex-1), Right rail (300px): trending or community channels
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const FeedLayout = ({ leftSidebar, children, rightSidebar }) => html`
  <div className="min-h-screen flex w-full" style=${{ background: 'var(--app-bg)' }}>
    ${leftSidebar != null ? html`
      <aside className="flex-shrink-0 w-60 border-r" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
        ${leftSidebar}
      </aside>
    ` : null}
    <main className="flex-1 min-w-0 overflow-auto">
      ${children}
    </main>
    ${rightSidebar != null ? html`
      <aside className="flex-shrink-0 w-[300px] border-l hidden lg:block overflow-y-auto custom-scrollbar" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-bg)' }}>
        ${rightSidebar}
      </aside>
    ` : null}
  </div>
`;

export default FeedLayout;
