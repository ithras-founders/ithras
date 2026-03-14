/**
 * List available CAT mocks (sectional/full) with Start CTA.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCATAvailableMocks } from '/core/frontend/src/modules/shared/services/api/preparation.js';
import CATMockTest from './CATMockTest.js';

const html = htm.bind(React.createElement);

const CATMocksList = ({ navigate }) => {
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startedSession, setStartedSession] = useState(null);

  useEffect(() => {
    getCATAvailableMocks()
      .then((d) => setMocks(d?.mock_types || []))
      .catch(() => setMocks([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = (sessionType) => {
    setStartedSession(sessionType);
  };

  if (startedSession) {
    return html`
      <div>
        <button onClick=${() => setStartedSession(null)} className="mb-4 text-sm text-[var(--app-accent)] hover:underline">← Back to mock list</button>
        <${CATMockTest}
          sessionId=${null}
          sessionType=${startedSession}
          navigate=${navigate}
          onBack=${() => setStartedSession(null)}
        />
      </div>
    `;
  }

  if (loading) {
    return html`<div className="flex justify-center py-8"><div className="animate-spin w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full" /></div>`;
  }

  return html`
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-[var(--app-text-primary)]">Available Mocks</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${mocks.map((m) => html`
          <div key=${m.id} className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-4">
            <h3 className="font-semibold text-[var(--app-text-primary)]">${m.label}</h3>
            <p className="text-sm text-[var(--app-text-muted)] mt-1">${m.questions_per_section || 0} questions • ${Math.round((m.time_sec || 0) / 60)} min</p>
            <button
              onClick=${() => handleStart(m.id)}
              className="mt-3 px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              Start
            </button>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default CATMocksList;
