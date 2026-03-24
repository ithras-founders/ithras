/**
 * Preparation — career prep hub (mock interviews, tests, etc.).
 * LongForm lives at /longform (top bar).
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import PreparationHubPage from './views/PreparationHubPage.js';

const html = htm.bind(React.createElement);

const PreparationView = ({ user, onLogout }) => {
  const [path, setPath] = useState(typeof window !== 'undefined' ? window.location.pathname || '/prepare' : '/prepare');

  useEffect(() => {
    const handler = () => setPath(window.location.pathname || '/prepare');
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  return html`
    <${AppShell} user=${user} onLogout=${onLogout} navItems=${[]} showSettings=${true} searchPlaceholder="Search…">
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-2 pb-6">
        <header className="mb-8 md:mb-10">
          <h1 className="text-2xl font-bold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>Prepare</h1>
          <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>
            Career tools—rolling out in phases. Read and write essays in <span className="font-semibold" style=${{ color: 'var(--app-accent)' }}>LongForm</span> from the top bar.
          </p>
        </header>
        <${PreparationHubPage} />
      </div>
    </${AppShell}>
  `;
};

export default PreparationView;
