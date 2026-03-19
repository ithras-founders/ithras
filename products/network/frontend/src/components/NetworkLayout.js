/**
 * NetworkLayout - Main content area for network views (no left sidebar - that's in AppShell).
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const NetworkLayout = ({ children }) => html`
  <div className="min-h-screen w-full" style=${{ background: 'var(--app-bg)' }}>
    ${children}
  </div>
`;

export default NetworkLayout;
