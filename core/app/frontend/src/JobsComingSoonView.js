/**
 * Authenticated placeholder for /jobs until the jobs product ships.
 * Layout and visuals align with Prepare (PreparationView + PreparationHubPage).
 */
import React from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import JobsHubPage from './views/JobsHubPage.js';

const html = htm.bind(React.createElement);

const JobsComingSoonView = ({ user, onLogout }) => html`
  <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true} searchPlaceholder="Search…">
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 pb-6">
      <header className="mb-8 md:mb-10">
        <h1 className="text-2xl font-bold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>Jobs</h1>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>
          Role discovery and applications—rolling out in phases. For now, explore your network and feed from the top bar.
        </p>
      </header>
      <${JobsHubPage} />
    </div>
  </${AppShell}>
`;

export default JobsComingSoonView;
