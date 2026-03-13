import React from 'react';
import htm from 'htm';
import { acceptOffer, rejectOffer } from '/core/frontend/src/modules/shared/services/api.js';
import { SectionCard } from '/core/frontend/src/modules/shared/primitives/index.js';
import StagePipeline from '../components/StagePipeline.js';

const html = htm.bind(React.createElement);

const DashboardView = ({
  companies,
  jobs,
  offers,
  applications,
  cvs,
  activeShortlists,
  expandedApplicationId,
  stageProgressCache,
  loadingStageProgress,
  toggleApplicationExpand,
  renderStagePipeline,
  setView,
  toast,
  fetchOffers,
  respondingOffer,
  setRespondingOffer,
}) => {
  const primaryCV = cvs?.[0];
  const cvStatus = primaryCV?.status || (cvs?.length > 0 ? cvs[0]?.status : 'None');
  const cvStatusLabel = cvStatus === 'VERIFIED' ? 'Verified' : cvStatus === 'SUBMITTED' ? 'Pending Review' : cvStatus === 'DRAFT' ? 'Draft' : cvStatus === 'REJECTED' ? 'Rejected' : 'No CV';
  const pendingOffers = offers.filter(o => o.status === 'PENDING').length;

  const renderPersonalSummary = () => html`
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12" data-tour-id="personal-summary-cards">
      <${SectionCard} padding=${false} className="p-8">
        <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-4">My Applications</p>
        <p className="text-4xl font-semibold text-[var(--app-text-primary)]">${applications.length}</p>
      <//>
      <${SectionCard} padding=${false} className="p-8">
        <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-4">My Shortlists</p>
        <p className="text-4xl font-semibold text-[var(--app-text-primary)]">${activeShortlists.length}</p>
      <//>
      <${SectionCard} padding=${false} className="p-8">
        <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-4">CV Status</p>
        <p className="text-2xl font-semibold text-[var(--app-text-primary)]">${cvStatusLabel}</p>
      <//>
      <${SectionCard} padding=${false} className="p-8">
        <p className="text-[10px] font-semibold uppercase text-[var(--app-text-muted)] tracking-widest mb-4">Pending Offers</p>
        <p className="text-4xl font-semibold text-[var(--app-text-primary)]">${pendingOffers}</p>
      <//>
    </div>
  `;

  return html`
    <div className="space-y-12 animate-in pb-20">
      ${renderPersonalSummary()}

      ${offers.filter(o => o.status === 'PENDING').length > 0 ? html`
      <section data-tour-id="offers-section">
        <div className="grid gap-4">
          ${offers.filter(o => o.status === 'PENDING').map(offer => {
            const company = companies.find(c => c.id === offer.company_id);
            const job = jobs.find(j => j.id === offer.job_id);
            return html`
              <div key=${offer.id} className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border-2 border-[var(--app-success)]/30 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">${company?.name || 'Company'} – ${job?.title || 'Role'}</h3>
                  <p className="text-sm text-[var(--app-text-secondary)] mt-1">${offer.ctc ? `₹${(offer.ctc / 100000).toFixed(0)}L` : ''} ${offer.deadline ? `• Deadline: ${new Date(offer.deadline).toLocaleDateString()}` : ''}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick=${async () => {
                      setRespondingOffer(offer.id);
                      try {
                        await acceptOffer(offer.id);
                        toast.success('Offer accepted');
                        fetchOffers();
                      } catch (e) {
                        toast.error(e.message || 'Failed to accept');
                      } finally {
                        setRespondingOffer(null);
                      }
                    }}
                    disabled=${respondingOffer === offer.id}
                    className="px-4 py-2 bg-[var(--app-success)] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    ${respondingOffer === offer.id ? 'Accepting...' : 'Accept'}
                  </button>
                  <button
                    onClick=${async () => {
                      setRespondingOffer(offer.id);
                      try {
                        await rejectOffer(offer.id);
                        toast.success('Offer declined');
                        fetchOffers();
                      } catch (e) {
                        toast.error(e.message || 'Failed to decline');
                      } finally {
                        setRespondingOffer(null);
                      }
                    }}
                    disabled=${respondingOffer === offer.id}
                    className="px-4 py-2 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-lg text-xs font-semibold border border-[var(--app-border-soft)] disabled:opacity-50"
                  >
                    ${respondingOffer === offer.id ? 'Declining...' : 'Decline'}
                  </button>
                </div>
              </div>
            `;
          })}
        </div>
      </section>
      ` : null}

      ${applications.length > 0 ? html`
      <section data-tour-id="applications-stage-progress">
        <div className="grid gap-4">
          ${applications.map((app) => {
            const job = jobs.find((j) => j.id === app.job_id);
            const company = job ? companies.find((c) => c.id === job.company_id) : null;
            const isExpanded = expandedApplicationId === app.id;
            const stageData = stageProgressCache[app.id];
            const isLoading = loadingStageProgress === app.id;
            return html`
              <div key=${app.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] overflow-hidden">
                <button
                  onClick=${() => toggleApplicationExpand(app.id)}
                  className="w-full p-6 flex items-center justify-between text-left hover:bg-[var(--app-surface-muted)]/50 transition-colors"
                >
                  <div>
                    <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">${company?.name || 'Company'} – ${job?.title || 'Role'}</h3>
                    <p className="text-sm text-[var(--app-text-secondary)] mt-1">${app.status || 'In progress'}</p>
                  </div>
                  <span className=${`px-3 py-1.5 rounded-lg text-[10px] font-semibold uppercase ${
                    app.status === 'SHORTLISTED' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' :
                    app.status === 'SUBMITTED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' :
                    'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'
                  }`}>${app.status || 'Active'}</span>
                  <svg className=${`w-5 h-5 text-[var(--app-text-muted)] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                ${isExpanded ? html`
                  <div className="px-6 pb-6">
                    ${isLoading ? html`<div className="py-4 text-sm text-[var(--app-text-muted)]">Loading stage progress...</div>` : stageData?.stages ? html`<${StagePipeline} stages=${stageData.stages} />` : html`<div className="py-4 text-sm text-[var(--app-text-muted)]">No stage data available.</div>`}
                  </div>
                ` : ''}
              </div>
            `;
          })}
        </div>
      </section>
      ` : null}

      <section>
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 px-2">
          <div className="flex gap-3">
            <button data-tour-id="view-active-processes" onClick=${() => setView('active_processes')} className="px-4 py-2.5 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              My Active Processes (${activeShortlists.length})
            </button>
            <button data-tour-id="view-cycle-intel" onClick=${() => setView('intelligence')} className="px-4 py-2.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] border border-[var(--app-border-soft)] rounded-xl text-sm font-semibold hover:bg-[var(--app-surface)] transition-colors">
              View Cycle Intel
            </button>
          </div>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <p className="text-sm text-[var(--app-text-secondary)]">
            ${activeShortlists.length === 0 && applications.length === 0
              ? 'You have no active applications or shortlists yet. Visit Cycle Intelligence to explore opportunities, or go to Active Processes to track your pipeline.'
              : `You have ${activeShortlists.length} shortlist${activeShortlists.length !== 1 ? 's' : ''} and ${applications.length} application${applications.length !== 1 ? 's' : ''} in progress. Use the links above to manage them.`}
          </p>
        </div>
      </section>
    </div>
  `;
};

export default DashboardView;
