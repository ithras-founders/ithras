import React, { useState, useEffect } from 'react';
import htm from 'htm';
import PlacementAIInsights from '../components/PlacementAIInsights.js';
import PolicyEditor from '../components/PolicyEditor.js';
import Dashboard from '../components/Dashboard.js';
import GovernanceFlow from './GovernanceFlow.js';
import { MasterCalendarView } from '/products/calendar-management/frontend/src/modules/scheduling/index.js';
import WorkflowTemplatesView from '../components/WorkflowTemplatesView.js';
import RequestApplicationsView from '../components/RequestApplicationsView.js';
import WorkflowManager from './WorkflowManager.js';
import StudentsView from './StudentsView.js';
import { getActivePolicy, getPendingProposals, getCompanies } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole, PolicyStatus, RestrictionLevel } from '/core/frontend/src/modules/shared/types.js';
import { useToast, SkeletonLoader } from '/core/frontend/src/modules/shared/index.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const AdminPortal = ({ user, activeView, navigate }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [proposal, setProposal] = useState(null);
  const [currentPolicy, setCurrentPolicy] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [policy, proposals, companiesRes] = await Promise.all([
        getActivePolicy().catch(() => null),
        getPendingProposals().catch(() => []),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] }))
      ]);
      setCurrentPolicy(policy);
      setProposal(proposals.length > 0 ? proposals[0] : null);
      setCompanies(companiesRes?.items ?? []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM');
      setCurrentPolicy(mock.policy);
      setProposal(mock.proposals?.length > 0 ? mock.proposals[0] : null);
      setCompanies(mock.companies || []);
      setLoading(false);
      return;
    }
    fetchData();
  }, [isTutorialMode, getTutorialData]);

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${6} /></div>`;
  }

  const isAdmin = user.role === UserRole.SYSTEM_ADMIN || user.role === UserRole.FACULTY_OBSERVER || user.role === UserRole.PLACEMENT_ADMIN;
  const isPT = user.role === UserRole.PLACEMENT_TEAM || user.role === UserRole.PLACEMENT_ADMIN;
  const isPlacementAdmin = user.role === UserRole.PLACEMENT_ADMIN;

  const handleApprove = async () => {
    if (proposal && proposal.policy_id) {
      try {
        const { updatePolicy } = await import('/core/frontend/src/modules/shared/services/api.js');
        await updatePolicy(proposal.policy_id, { status: PolicyStatus.ACTIVE });
        setCurrentPolicy({ ...proposal, status: PolicyStatus.ACTIVE });
        setProposal(null);
      } catch (error) {
        console.error('Failed to approve policy:', error);
      }
    }
  };

  const handlePolicySaved = async () => {
    setShowPolicyEditor(false);
    setIsEditing(false);
    // Refresh policy data
    await fetchData();
  };

  const renderWorkshop = () => {
    // Show PolicyEditor for Placement Admin
    if (isPlacementAdmin && (showPolicyEditor || !currentPolicy)) {
      return html`
        <div className="space-y-10 animate-in pb-20">
          <${PolicyEditor}
            policy=${currentPolicy}
            institutionId=${user.institution_id}
            onSave=${handlePolicySaved}
            onCancel=${() => {
              setShowPolicyEditor(false);
              if (!currentPolicy) {
                toast.error('No policy exists yet. Please create one to continue.');
              }
            }}
          />
        </div>
      `;
    }

    return html`
    <div className="space-y-8 animate-in pb-20">
      <div className="flex justify-end">
        ${isPlacementAdmin && html`
          <button 
            onClick=${() => setShowPolicyEditor(true)} 
            className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-card)] hover:bg-[var(--app-accent-hover)] transition-colors"
          >
            ${currentPolicy ? 'Edit Policy' : 'Create Policy'}
          </button>
        `}
        ${isPT && !isPlacementAdmin && !isEditing && html`
          <button onClick=${() => setIsEditing(true)} className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-card)]">Propose Amendment</button>
        `}
      </div>

      ${proposal && isAdmin && html`
        <div className="bg-[rgba(245,158,11,0.1)] border-2 border-[rgba(245,158,11,0.24)] p-8 rounded-[var(--app-radius-lg)] mb-10 flex flex-col md:flex-row justify-between items-center gap-6">
           <div>
              <p className="text-[10px] font-semibold text-[rgb(146,64,14)] uppercase tracking-widest mb-1">Pending Proposal</p>
              <h4 className="text-xl font-semibold text-[var(--app-text-primary)]">${proposal.proposedBy} requested a policy update</h4>
              <p className="text-sm text-[var(--app-text-muted)] font-medium mt-1">Changes detected in Max Shortlists and Tier structure.</p>
           </div>
           <div className="flex gap-4">
              <button className="px-6 py-3 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] text-[10px] font-semibold uppercase">Reject</button>
              <button onClick=${handleApprove} className="px-8 py-3 bg-[var(--app-text-primary)] text-white rounded-[var(--app-radius-sm)] text-[10px] font-semibold uppercase shadow-[var(--app-shadow-card)]">Approve & Activate</button>
           </div>
        </div>
      `}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <section className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest mb-8">Classification Tiers</h3>
            <div className="space-y-6">
              ${currentPolicy && currentPolicy.levels && currentPolicy.levels.length > 0 ? currentPolicy.levels.map(level => {
                const levelObj = typeof level === 'string' ? { name: level, restrictions: [] } : level;
                return html`
                  <div key=${levelObj.name || level} className="flex items-center justify-between p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
                    <div className="flex items-center gap-5">
                      <div className="w-4 h-12 bg-[var(--app-accent)] rounded-full"></div>
                      <div>
                        <p className="text-lg font-semibold text-[var(--app-text-primary)]">${levelObj.name || level}</p>
                        <p className="text-[10px] font-bold text-[var(--app-text-muted)] uppercase tracking-widest mt-1">Visit Weight: Standard</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      ${levelObj.restrictions && levelObj.restrictions.length > 0 ? levelObj.restrictions.map(r => html`
                        <span key=${r} className="px-3 py-1 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-lg text-[8px] font-semibold uppercase text-[var(--app-text-muted)]">${r} Locked</span>
                      `) : ''}
                    </div>
                  </div>
                `;
              }) : html`<p className="text-[var(--app-text-muted)]">No policy levels defined</p>`}
            </div>
          </section>

          <section className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest mb-8">Process Stages & Constraints</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              ${currentPolicy && currentPolicy.stages && currentPolicy.stages.length > 0 ? currentPolicy.stages.map(stage => {
                const stageObj = typeof stage === 'string' ? { id: stage, name: stage, rules: '' } : stage;
                return html`
                  <div key=${stageObj.id || stage} className="p-6 bg-[var(--app-surface-muted)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-md)] relative group">
                    <span className="absolute -top-3 -right-3 w-8 h-8 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-full flex items-center justify-center text-xs font-semibold shadow-[var(--app-shadow-subtle)]">${stageObj.id ? stageObj.id[1] : '?'}</span>
                    <h4 className="font-semibold text-[var(--app-text-primary)] mb-2">${stageObj.name || stage}</h4>
                    <p className="text-[10px] text-[var(--app-text-muted)] leading-relaxed italic">${stageObj.rules || ''}</p>
                  </div>
                `;
              }) : html`<p className="text-[var(--app-text-muted)] col-span-3">No policy stages defined</p>`}
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-[var(--app-text-primary)] p-10 rounded-[var(--app-radius-lg)] text-white shadow-[var(--app-shadow-floating)] relative overflow-hidden">
            <h3 className="text-[10px] font-semibold text-[rgba(147,197,253,0.9)] uppercase tracking-widest mb-6">Global Enforcement Engine</h3>
            <div className="space-y-8">
              <div>
                 <p className="text-[9px] font-semibold text-[var(--app-text-muted)] uppercase mb-1">Max Shortlist Limit</p>
                 <p className="text-4xl font-semibold tracking-tighter">${currentPolicy && currentPolicy.globalCaps ? (currentPolicy.globalCaps.maxShortlists || 0) : 0}</p>
              </div>
              <div>
                 <p className="text-[9px] font-semibold text-[var(--app-text-muted)] uppercase mb-3">Distribution Logic (Current)</p>
                 <div className="flex gap-4">
                    ${currentPolicy && currentPolicy.globalCaps && currentPolicy.globalCaps.distribution && currentPolicy.globalCaps.distribution.length > 0 ? currentPolicy.globalCaps.distribution.map((d, i) => html`
                      <div key=${i} className="flex-1 p-3 bg-[var(--app-surface)]/10 rounded-[var(--app-radius-md)] border border-white/10 text-center">
                        <p className="text-2xl font-semibold">${d}</p>
                        <p className="text-[8px] font-semibold text-[var(--app-text-muted)]">Node ${i+1}</p>
                      </div>
                    `) : html`<p className="text-[var(--app-text-muted)] text-sm">No distribution data available</p>`}
                 </div>
              </div>
            </div>
          </div>
          <${PlacementAIInsights} />
        </div>
      </div>
    </div>
    `;
  };

  // Render based on activeView from navigation
  if (activeView === 'dashboard') {
    return html`<${Dashboard} user=${user} navigate=${navigate} />`;
  }
  
  if (activeView === 'policy_approvals') {
    return html`<${GovernanceFlow} user=${user} />`;
  }

  if (activeView === 'master_calendar') {
    return html`<${MasterCalendarView} user=${user} />`;
  }

  if (activeView === 'placement_templates') {
    return html`<${WorkflowTemplatesView} user=${user} />`;
  }

  if (activeView === 'request_applications') {
    return html`<${RequestApplicationsView} user=${user} />`;
  }

  if (activeView === 'students') {
    return html`<${StudentsView} user=${user} navigate=${navigate} />`;
  }

  if (activeView === 'cycle_ops' || activeView === 'recruitment_cycles') {
    const mockData = isTutorialMode ? (getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM')) : null;
    const cycleOps = mockData?.cycleOps;
    const activeCycles = isTutorialMode ? (cycleOps?.activeCycles || []) : [];
    const closedCycles = isTutorialMode ? (cycleOps?.closedCycles || []) : [];
    const slotTransitions = isTutorialMode ? (cycleOps?.slotTransitions || []) : [];

    const statusBadge = (status) => {
      const map = {
        APPLICATIONS_OPEN: 'bg-[rgba(5,150,105,0.12)] text-[var(--app-success)]',
        SHORTLISTING: 'bg-[rgba(0,113,227,0.12)] text-[var(--app-accent)]',
        INTERVIEWS: 'bg-[rgba(147,51,234,0.12)] text-[rgb(126,34,206)]',
        OFFERS: 'bg-[rgba(245,158,11,0.12)] text-[rgb(180,83,9)]',
        CLOSED: 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]',
        SCHEDULED: 'bg-[rgba(0,113,227,0.12)] text-[var(--app-accent)]',
        PENDING: 'bg-[rgba(245,158,11,0.12)] text-[rgb(180,83,9)]',
      };
      return map[status] || 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]';
    };

    return html`
      <div className="space-y-10 animate-in pb-20" data-tour-id="recruitment-cycles-content">
        <div data-tour-id="workflow-manager-section">
          <${WorkflowManager} user=${user} />
        </div>

        <div className="border-t border-[var(--app-border-soft)] pt-10">
        <div className="flex items-center justify-between mb-6">
          <button className="px-6 py-2.5 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] text-xs font-semibold uppercase tracking-wider hover:bg-[var(--app-accent-hover)] transition-colors"
            onClick=${() => isTutorialMode && toast.success('Demo mode — cycle creation simulated')}>
            + New Cycle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[rgba(5,150,105,0.06)] rounded-[var(--app-radius-md)] p-5 border border-[rgba(5,150,105,0.15)]">
            <p className="text-[10px] font-semibold text-[var(--app-success)] uppercase tracking-widest">Active Cycles</p>
            <p className="text-3xl font-semibold text-[var(--app-text-primary)] mt-1">${activeCycles.length}</p>
          </div>
          <div className="bg-[rgba(0,113,227,0.06)] rounded-[var(--app-radius-md)] p-5 border border-[rgba(0,113,227,0.15)]">
            <p className="text-[10px] font-semibold text-[var(--app-accent)] uppercase tracking-widest">Total Companies</p>
            <p className="text-3xl font-semibold text-[var(--app-text-primary)] mt-1">${activeCycles.reduce((s, c) => s + (c.companiesEnrolled || 0), 0)}</p>
          </div>
          <div className="bg-[var(--app-accent-soft)] rounded-[var(--app-radius-md)] p-5 border border-[rgba(0,113,227,0.15)]">
            <p className="text-[10px] font-semibold text-[var(--app-accent)] uppercase tracking-widest">Students Registered</p>
            <p className="text-3xl font-semibold text-[var(--app-text-primary)] mt-1">${activeCycles.reduce((s, c) => s + (c.studentsRegistered || 0), 0)}</p>
          </div>
          <div className="bg-[var(--app-warning-soft)] rounded-[var(--app-radius-md)] p-5 border border-[rgba(245,158,11,0.15)]">
            <p className="text-[10px] font-semibold text-[var(--app-warning)] uppercase tracking-widest">Total Applications</p>
            <p className="text-3xl font-semibold text-[var(--app-text-primary)] mt-1">${activeCycles.reduce((s, c) => s + (c.totalApplications || 0), 0)}</p>
          </div>
        </div>

        ${activeCycles.length > 0 && html`
          <div>
            <h3 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider mb-4">Active Cycles</h3>
            <div className="space-y-4">
              ${activeCycles.map(cycle => html`
                <div key=${cycle.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-6 hover:shadow-[var(--app-shadow-card)] transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--app-text-primary)]">${cycle.name}</h4>
                      <span className=${'mt-1 inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ' + statusBadge(cycle.status)}>
                        ${cycle.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 text-xs font-medium bg-[var(--app-bg-elevated)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface-muted)]"
                        onClick=${() => isTutorialMode && toast.success('Demo mode — settings opened')}>
                        Settings
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium text-[var(--app-accent)] bg-[var(--app-accent-soft)] rounded-[var(--app-radius-sm)] hover:bg-[rgba(0,113,227,0.14)]"
                        onClick=${() => isTutorialMode && toast.success('Demo mode — timeline view opened')}>
                        View Timeline
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                    <div>
                      <p className="text-[10px] text-[var(--app-text-muted)] uppercase font-semibold">Companies</p>
                      <p className="text-lg font-semibold text-[var(--app-text-primary)]">${cycle.companiesEnrolled}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--app-text-muted)] uppercase font-semibold">Students</p>
                      <p className="text-lg font-semibold text-[var(--app-text-primary)]">${cycle.studentsRegistered}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--app-text-muted)] uppercase font-semibold">Applications</p>
                      <p className="text-lg font-semibold text-[var(--app-text-primary)]">${cycle.totalApplications}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[var(--app-text-muted)] uppercase font-semibold">Shortlist Deadline</p>
                      <p className="text-sm font-medium text-[var(--app-text-primary)]">${cycle.shortlistDeadline ? new Date(cycle.shortlistDeadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                    </div>
                  </div>
                  <div className="bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)] p-4">
                    <p className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-3">Cycle Timeline</p>
                    <div className="flex items-center gap-1">
                      ${[
                        { label: 'Applications', date: cycle.applicationWindowStart, endDate: cycle.applicationWindowEnd },
                        { label: 'Shortlisting', date: cycle.shortlistDeadline },
                        { label: 'Interviews', date: cycle.interviewWindow },
                        { label: 'Offers', date: cycle.offersDeadline },
                      ].map((phase, i) => html`
                        <div key=${i} className="flex-1 relative">
                          <div className=${'h-2 rounded-full ' + (i === 0 && cycle.status === 'APPLICATIONS_OPEN' ? 'bg-[var(--app-success)]' : i === 1 && cycle.status === 'SHORTLISTING' ? 'bg-[var(--app-accent)]' : 'bg-[var(--app-border-soft)]')}></div>
                          <p className="text-[9px] font-medium text-[var(--app-text-muted)] mt-1.5">${phase.label}</p>
                          <p className="text-[9px] text-[var(--app-text-muted)]">${phase.date ? new Date(phase.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''}</p>
                        </div>
                      `)}
                    </div>
                  </div>
                </div>
              `)}
            </div>
          </div>
        `}

        ${slotTransitions.length > 0 && html`
          <div>
            <h3 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider mb-4">Slot Transitions</h3>
            <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Transition</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Scheduled Date</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Companies Affected</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${slotTransitions.map(st => html`
                    <tr key=${st.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                      <td className="p-3 font-medium text-[var(--app-text-primary)]">${st.fromSlot} → ${st.toSlot}</td>
                      <td className="p-3 text-[var(--app-text-secondary)]">${new Date(st.scheduledDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                      <td className="p-3 text-[var(--app-text-secondary)]">${st.affectedCompanies} companies</td>
                      <td className="p-3"><span className=${'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ' + statusBadge(st.status)}>${st.status}</span></td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          </div>
        `}

        ${closedCycles.length > 0 && html`
          <div>
            <h3 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider mb-4">Completed Cycles</h3>
            <div className="space-y-3">
              ${closedCycles.map(cycle => html`
                <div key=${cycle.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-semibold text-[var(--app-text-primary)]">${cycle.name}</h4>
                      <p className="text-xs text-[var(--app-text-muted)] mt-0.5">${cycle.companiesEnrolled} companies · ${cycle.placedStudents}/${cycle.studentsRegistered} placed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--app-text-muted)] uppercase font-semibold">Avg CTC</p>
                      <p className="font-semibold text-[var(--app-text-primary)]">₹${cycle.avgCompensation}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[var(--app-text-muted)] uppercase font-semibold">Top Sector</p>
                      <p className="font-semibold text-[var(--app-text-primary)]">${cycle.topSector}</p>
                    </div>
                    <span className=${'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ' + statusBadge(cycle.status)}>${cycle.status}</span>
                  </div>
                </div>
              `)}
            </div>
          </div>
        `}
        </div>
      </div>
    `;
  }

  return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Page not found</div>`;
};

export default AdminPortal;
