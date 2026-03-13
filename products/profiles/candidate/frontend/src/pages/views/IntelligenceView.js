import React, { useState } from 'react';
import htm from 'htm';
import { getCycleAnalytics } from '/core/frontend/src/modules/shared/services/api.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const IntelligenceView = ({ cycles, isTutorialMode, isDemoUser, getTutorialData }) => {
  const [selectedCycleAnalytics, setSelectedCycleAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const useMock = isTutorialMode || isDemoUser;
  const mock = useMock ? (getTutorialData?.('CANDIDATE') ?? getTutorialMockData('CANDIDATE')) : null;
  const cycleStats = useMock && mock?.cycleStats ? mock.cycleStats : { totalCompanies: 0, totalRoles: 0, totalApplications: 0, avgCompensation: 'N/A' };
  const placementSummary = useMock && mock?.placementSummary ? mock.placementSummary : [];
  const displayCycles = cycles.length > 0 ? cycles : (mock?.cycles || []);

  const loadCycleAnalytics = async (cycleId) => {
    if (isTutorialMode || isDemoUser) {
      setSelectedCycleAnalytics({
        cycle_id: cycleId,
        cycle_name: 'Final Placements 2024-25',
        total_jobs: 156,
        total_applications: 892,
        total_offers: 184,
        accepted_offers: 162,
        offer_rate_pct: 20.6,
        median_ctc: 2800000,
        sector_distribution: [
          { sector: 'Consulting', count: 42 },
          { sector: 'Finance', count: 38 },
          { sector: 'Technology', count: 35 },
          { sector: 'FMCG', count: 18 },
          { sector: 'Analytics', count: 12 },
          { sector: 'Other', count: 11 },
        ],
        stage_funnel: [
          { stage: 'SUBMITTED', count: 340 },
          { stage: 'SHORTLISTED', count: 280 },
          { stage: 'IN_PROGRESS', count: 88 },
          { stage: 'SELECTED', count: 184 },
        ],
        top_recruiters: [
          { company_id: 'c1', company_name: 'Apex Consulting', offers: 12 },
          { company_id: 'c2', company_name: 'Goldman Sachs', offers: 8 },
          { company_id: 'c3', company_name: 'Amazon', offers: 10 },
          { company_id: 'c5', company_name: 'Bain & Company', offers: 8 },
          { company_id: 'c4', company_name: 'Hindustan Unilever', offers: 5 },
        ],
      });
      return;
    }
    setLoadingAnalytics(true);
    try {
      const data = await getCycleAnalytics(cycleId);
      setSelectedCycleAnalytics(data);
    } catch {
      setSelectedCycleAnalytics(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const a = selectedCycleAnalytics;

  return html`
    <div className="space-y-12 animate-in pb-20" data-tour-id="intelligence-content">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Companies</p>
          <p className="text-3xl font-semibold text-[var(--app-text-primary)]">${cycleStats.totalCompanies}</p>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Total Roles</p>
          <p className="text-3xl font-semibold text-[var(--app-text-primary)]">${cycleStats.totalRoles}</p>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Applications</p>
          <p className="text-3xl font-semibold text-[var(--app-text-primary)]">${cycleStats.totalApplications}</p>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Avg. Compensation</p>
          <p className="text-3xl font-semibold text-[var(--app-text-primary)]">₹${cycleStats.avgCompensation}</p>
        </div>
      </div>

      <section>
        <div className="space-y-4">
          ${displayCycles.length === 0 ? html`
            <div className="bg-[var(--app-surface)] p-12 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] text-center">
              <p className="text-[var(--app-text-muted)]">${useMock ? 'Demo: No active cycles.' : 'No active cycles.'}</p>
            </div>
          ` : displayCycles.map(c => html`
            <button
              key=${c.id}
              onClick=${() => loadCycleAnalytics(c.id)}
              className="w-full bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex items-center justify-between text-left hover:bg-[var(--app-surface-muted)]/50 transition-colors"
            >
              <div>
                <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">${c.name}</h3>
                <p className="text-sm text-[var(--app-text-secondary)] mt-1">${c.category || 'Placement'}</p>
              </div>
              <span className="text-xs text-[var(--app-accent)] font-semibold">View Analytics →</span>
            </button>
          `)}
        </div>
      </section>

      ${loadingAnalytics ? html`
        <div className="bg-[var(--app-surface)] p-12 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] text-center">
          <p className="text-[var(--app-text-muted)]">Loading analytics...</p>
        </div>
      ` : ''}

      ${a && !loadingAnalytics ? html`
        <section>
          <h2 className="text-2xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-6">${a.cycle_name} — Analytics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
              <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Offer Rate</p>
              <p className="text-3xl font-semibold text-[var(--app-success)]">${a.offer_rate_pct}%</p>
            </div>
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
              <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Median CTC</p>
              <p className="text-3xl font-semibold text-[var(--app-text-primary)]">${a.median_ctc ? `₹${(a.median_ctc / 100000).toFixed(1)}L` : 'N/A'}</p>
            </div>
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
              <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Total Offers</p>
              <p className="text-3xl font-semibold text-[var(--app-text-primary)]">${a.total_offers}</p>
            </div>
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
              <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-2">Total Roles</p>
              <p className="text-3xl font-semibold text-[var(--app-text-primary)]">${a.total_jobs}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
              <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest mb-4">Sector Distribution</h3>
              <div className="space-y-3">
                ${(a.sector_distribution || []).map(s => {
                  const maxCount = Math.max(...(a.sector_distribution || []).map(x => x.count), 1);
                  const pct = Math.round((s.count / maxCount) * 100);
                  return html`
                    <div key=${s.sector}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--app-text-primary)] font-medium">${s.sector}</span>
                        <span className="text-[var(--app-text-muted)]">${s.count}</span>
                      </div>
                      <div className="h-2 bg-[var(--app-bg-elevated)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--app-accent)] rounded-full transition-all" style=${{ width: pct + '%' }} />
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>

            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
              <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest mb-4">Application Funnel</h3>
              <div className="space-y-3">
                ${(a.stage_funnel || []).map((s, i) => {
                  const maxStage = Math.max(...(a.stage_funnel || []).map(x => x.count), 1);
                  const pct = Math.round((s.count / maxStage) * 100);
                  const colors = ['bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-emerald-400'];
                  return html`
                    <div key=${s.stage}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--app-text-primary)] font-medium capitalize">${s.stage.toLowerCase().replace('_', ' ')}</span>
                        <span className="text-[var(--app-text-muted)]">${s.count}</span>
                      </div>
                      <div className="h-2 bg-[var(--app-bg-elevated)] rounded-full overflow-hidden">
                        <div className=${`h-full rounded-full transition-all ${colors[i % colors.length]}`} style=${{ width: pct + '%' }} />
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>
          </div>

          ${(a.top_recruiters || []).length > 0 ? html`
            <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] mt-6">
              <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest mb-4">Top Recruiters</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                ${a.top_recruiters.map(r => html`
                  <div key=${r.company_id} className="text-center p-4 rounded-xl bg-[var(--app-surface-muted)] border border-[var(--app-border-soft)]">
                    <p className="text-2xl font-semibold text-[var(--app-text-primary)]">${r.offers}</p>
                    <p className="text-xs text-[var(--app-text-muted)] mt-1 truncate">${r.company_name}</p>
                  </div>
                `)}
              </div>
            </div>
          ` : ''}
        </section>
      ` : ''}

      ${placementSummary.length > 0 ? html`
        <section>
          <div className="grid gap-4">
            ${placementSummary.map((s, i) => html`
              <div key=${i} className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex items-center justify-between">
                <span className="font-bold text-[var(--app-text-primary)]">${s.company}</span>
                <span className="text-sm text-[var(--app-text-secondary)]">${s.roles} roles • ${s.hires} hires</span>
              </div>
            `)}
          </div>
        </section>
      ` : ''}
    </div>
  `;
};

export default IntelligenceView;
