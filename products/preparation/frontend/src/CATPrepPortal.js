/**
 * CAT Prep Portal: Dashboard, Mocks, History, Insights.
 */
import React from 'react';
import htm from 'htm';
import CATDashboard from './components/CATDashboard.js';
import CATMocksList from './components/CATMocksList.js';
import { getCATMockHistory } from '/core/frontend/src/modules/shared/services/api/preparation.js';
import { useState, useEffect } from 'react';

const html = htm.bind(React.createElement);

const CATPrepPortal = ({ user, view = 'preparation/cat', navigate }) => {
  const viewParts = (view || 'preparation/cat').split('/').filter(Boolean);
  const subView = viewParts[2] || 'dashboard';
  const sessionId = viewParts[3];
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (subView === 'history') {
      getCATMockHistory().then((r) => setHistory(r?.items || [])).catch(() => setHistory([]));
    }
  }, [subView]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', view: 'preparation/cat' },
    { id: 'mocks', label: 'Mock Tests', view: 'preparation/cat/mocks' },
    { id: 'history', label: 'History', view: 'preparation/cat/history' },
  ];

  return html`
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <nav className="flex gap-4 mb-6 border-b border-[var(--app-border-soft)] pb-4">
        ${navItems.map((item) => html`
          <button
            key=${item.id}
            onClick=${() => navigate?.(item.view)}
            className=${`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              subView === item.id ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'
            }`}
          >
            ${item.label}
          </button>
        `)}
      </nav>

      ${subView === 'dashboard' && html`<${CATDashboard} navigate=${navigate} />`}

      ${subView === 'mocks' && !sessionId && html`<${CATMocksList} navigate=${navigate} />`}

      ${subView === 'history' && html`
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-[var(--app-text-primary)]">Mock History</h2>
          ${history.length === 0 ? html`
            <p className="text-[var(--app-text-muted)]">No mocks taken yet.</p>
          ` : html`
            <div className="space-y-2">
              ${history.map((h) => html`
                <div key=${h.session_id} className="bg-[var(--app-surface)] rounded-lg border p-4">
                  <p className="font-medium">${h.session_type}</p>
                  <p className="text-sm text-[var(--app-text-muted)]">${h.submitted_at || '-'}</p>
                  <p className="text-sm">Score: ${JSON.stringify(h.score_raw || {})}</p>
                </div>
              `)}
            </div>
          `}
        </div>
      `}
    </div>
  `;
};

export default CATPrepPortal;
