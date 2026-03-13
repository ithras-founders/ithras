import React from 'react';
import htm from 'htm';
import { useToast, SkeletonLoader, ApiError } from '/core/frontend/src/modules/shared/index.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import { useCandidateData } from './hooks/useCandidateData.js';
import DashboardView from './views/DashboardView.js';
import ActiveProcessesView from './views/ActiveProcessesView.js';
import IntelligenceView from './views/IntelligenceView.js';

const html = htm.bind(React.createElement);

const CandidatePortal = ({ user, activeSubView, setView }) => {
  const toast = useToast();
  const data = useCandidateData(user);
  const {
    loading,
    fetchError,
    fetchData,
    fetchOffers,
    activePolicy,
    companies,
    jobs,
    cycles,
    activeShortlists,
    applications,
    cvs,
    offers,
    historicalHires,
    selectedCompanyId,
    setSelectedCompanyId,
    respondingOffer,
    setRespondingOffer,
    expandedApplicationId,
    toggleApplicationExpand,
    stageProgressCache,
    loadStageProgress,
    loadingStageProgress,
    isTutorialMode,
    isDemoUser: isDemo,
    getTutorialData,
  } = data;

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${5} /></div>`;
  }

  if (fetchError) {
    return html`<div className="p-6"><${ApiError} message=${fetchError} onRetry=${fetchData} /></div>`;
  }

  if (!activePolicy && !isTutorialMode && !isDemoUser(user)) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">No active policy found</div>`;
  }

  if (selectedCompanyId) {
    const selectedCompany = companies.find(c => c.id === selectedCompanyId);
    if (!selectedCompany) return html`<div>Company not found</div>`;
    const companyJobs = jobs.filter(j => j.company_id === selectedCompanyId);
    const companyHires = historicalHires.filter(h => h.company_id === selectedCompanyId);
  return html`
    <div className="w-full max-w-none px-4 md:px-6">
        <div className="animate-in space-y-10">
          <button onClick=${() => setSelectedCompanyId(null)} className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest">← Back to Dashboard</button>
              <div className="bg-[var(--app-surface)] p-12 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex flex-col md:flex-row items-center gap-12">
                 <div className="w-24 h-24 bg-[var(--app-accent-soft)] rounded-full flex items-center justify-center text-[var(--app-accent)] font-semibold text-4xl">${selectedCompany.name[0]}</div>
                 <div className="text-center md:text-left">
                    <h2 className="text-4xl font-semibold text-[var(--app-text-primary)] tracking-tighter">${selectedCompany.name}</h2>
                    <p className="text-[var(--app-text-secondary)] font-medium leading-relaxed max-w-2xl mt-4 italic">Corporate Partner</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                 <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest px-1">Institutional JDs</h3>
                    ${companyJobs.map(job => html`
                       <div key=${job.id} className="bg-[var(--app-text-primary)] p-10 rounded-[var(--app-radius-lg)] text-white flex justify-between items-center group cursor-pointer hover:opacity-90 transition-all">
                          <div>
                             <h4 className="text-2xl font-semibold tracking-tight">${job.title}</h4>
                             <p className="text-[10px] text-[var(--app-accent)] font-semibold uppercase tracking-widest mt-2">${job.slot} • Fixed ₹${job.fixed_comp ? (job.fixed_comp/100000).toFixed(0) : 'N/A'}L+</p>
                          </div>
                          <button className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-xl text-[10px] font-semibold uppercase">Apply Now</button>
                       </div>
                    `)}
                 </div>
                 <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]" data-tour-id="company-detail-hires">
                    <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest mb-6 px-1">Hire Archives</h3>
                    <div className="space-y-4">
                      ${companyHires.map(hire => html`
                        <div key=${hire.id} className="p-5 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
                           <p className="text-sm font-semibold text-[var(--app-text-primary)]">${hire.name}</p>
                           <p className="text-[10px] font-bold text-[var(--app-text-muted)] uppercase mt-1">${hire.year} • ${hire.role}</p>
                        </div>
                      `)}
                    </div>
                 </div>
              </div>
        </div>
      </div>
    `;
  }

  if (activeSubView === 'dashboard') {
    return html`
      <div className="w-full max-w-none px-4 md:px-6">
        <${DashboardView}
          companies=${companies}
          jobs=${jobs}
          offers=${offers}
          applications=${applications}
          cvs=${cvs}
          activeShortlists=${activeShortlists}
          expandedApplicationId=${expandedApplicationId}
          stageProgressCache=${stageProgressCache}
          loadingStageProgress=${loadingStageProgress}
          toggleApplicationExpand=${toggleApplicationExpand}
          setView=${setView}
          toast=${toast}
          fetchOffers=${fetchOffers}
          respondingOffer=${respondingOffer}
          setRespondingOffer=${setRespondingOffer}
        />
      </div>
    `;
  }

  if (activeSubView === 'active_processes') {
    return html`
      <div className="w-full max-w-none px-4 md:px-6">
        <${ActiveProcessesView}
          activeShortlists=${activeShortlists}
          companies=${companies}
          isTutorialMode=${isTutorialMode}
          getTutorialData=${getTutorialData}
        />
      </div>
    `;
  }

  if (activeSubView === 'intelligence') {
    return html`
      <div className="w-full max-w-none px-4 md:px-6">
        <${IntelligenceView}
          cycles=${cycles}
          isTutorialMode=${isTutorialMode}
          isDemoUser=${isDemo}
          getTutorialData=${getTutorialData}
        />
    </div>
  `;
  }

  return html`<div className="w-full max-w-none px-4 md:px-6"><div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Intel Node Initializing...</div></div>`;
};

export default CandidatePortal;
