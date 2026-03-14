/**
 * CAT Dashboard: topic-wise scores, sectional trends, weak/strong areas, insights.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getCATDashboard, getCATInsights } from '/core/frontend/src/modules/shared/services/api/preparation.js';

const html = htm.bind(React.createElement);

const CATDashboard = ({ navigate }) => {
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [insightsLoading, setInsightsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getCATDashboard()
      .then((d) => { if (!cancelled) setDashboard(d); })
      .catch(() => { if (!cancelled) setDashboard(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setInsightsLoading(true);
    getCATInsights()
      .then((r) => { if (!cancelled) setInsights(r?.insights || []); })
      .catch(() => { if (!cancelled) setInsights([]); })
      .finally(() => { if (!cancelled) setInsightsLoading(false); });
    return () => { cancelled = true; };
  }, [dashboard?.last_mock?.session_id]);

  if (loading) {
    return html`
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full" />
      </div>
    `;
  }

  const sections = dashboard?.section_scores || {};
  const topicScores = dashboard?.topic_scores || [];
  const weakAreas = dashboard?.weak_areas || [];
  const strongAreas = dashboard?.strong_areas || [];
  const lastMock = dashboard?.last_mock;

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-[var(--app-text-primary)]">CAT Prep Dashboard</h2>
        <button
          onClick=${() => navigate?.('preparation/cat/mocks')}
          className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          Take Mock
        </button>
      </div>

      ${Object.keys(sections).length > 0 ? html`
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${['VARC', 'DILR', 'QA'].map((sec) => html`
            <div key=${sec} className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-4">
              <p className="text-sm text-[var(--app-text-muted)] mb-1">${sec}</p>
              <p className="text-2xl font-bold text-[var(--app-accent)]">${sections[sec] ?? 0}%</p>
              <p className="text-xs text-[var(--app-text-secondary)]">Section accuracy</p>
            </div>
          `)}
        </div>
      ` : html`
        <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-8 text-center">
          <p className="text-[var(--app-text-secondary)] mb-4">No mock attempts yet. Take your first mock to see your topic-wise scores.</p>
          <button
            onClick=${() => navigate?.('preparation/cat/mocks')}
            className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg font-medium hover:opacity-90"
          >
            Start First Mock
          </button>
        </div>
      `}

      ${topicScores.length > 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] overflow-hidden">
          <h3 className="px-4 py-3 font-semibold text-[var(--app-text-primary)] border-b border-[var(--app-border-soft)]">Topic-wise Scores</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left p-3">Section</th>
                  <th className="text-left p-3">Topic</th>
                  <th className="text-right p-3">Attempts</th>
                  <th className="text-right p-3">Correct</th>
                  <th className="text-right p-3">Accuracy</th>
                </tr>
              </thead>
              <tbody>
                ${topicScores.map((t) => html`
                  <tr key=${t.section + t.topic} className="border-b border-[var(--app-border-soft)] last:border-0">
                    <td className="p-3">${t.section}</td>
                    <td className="p-3">${t.topic.replace(/_/g, ' ')}</td>
                    <td className="p-3 text-right">${t.attempts_count}</td>
                    <td className="p-3 text-right">${t.correct_count}</td>
                    <td className="p-3 text-right font-medium">${t.accuracy_pct ?? 0}%</td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </div>
      ` : null}

      ${(weakAreas.length > 0 || strongAreas.length > 0) ? html`
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-4">
            <h3 className="font-semibold text-[var(--app-text-primary)] mb-2 text-amber-600">Weak Areas</h3>
            <ul className="space-y-1 text-sm">
              ${weakAreas.slice(0, 5).map((w) => html`
                <li key=${w.topic}>${w.topic?.replace(/_/g, ' ')} (${w.accuracy_pct ?? 0}%)</li>
              `)}
            </ul>
          </div>
          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-4">
            <h3 className="font-semibold text-[var(--app-text-primary)] mb-2 text-green-600">Strong Areas</h3>
            <ul className="space-y-1 text-sm">
              ${strongAreas.slice(0, 5).map((s) => html`
                <li key=${s.topic}>${s.topic?.replace(/_/g, ' ')} (${s.accuracy_pct ?? 0}%)</li>
              `)}
            </ul>
          </div>
        </div>
      ` : null}

      <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-4">
        <h3 className="font-semibold text-[var(--app-text-primary)] mb-2">Prep Insights</h3>
        ${insightsLoading ? html`<p className="text-sm text-[var(--app-text-muted)]">Loading...</p>` : insights.length > 0 ? html`
          <ul className="space-y-2">
            ${insights.map((i, idx) => html`
              <li key=${idx} className="flex gap-2 text-sm">
                <span className="text-[var(--app-accent)]">•</span>
                <span>${i}</span>
              </li>
            `)}
          </ul>
        ` : html`<p className="text-sm text-[var(--app-text-muted)]">Complete mocks to get personalized insights.</p>`}
      </div>

      ${lastMock ? html`
        <div className="text-sm text-[var(--app-text-muted)]">
          Last mock: ${lastMock.session_type} • Score: ${JSON.stringify(lastMock.score_raw)}
        </div>
      ` : null}
    </div>
  `;
};

export default CATDashboard;
