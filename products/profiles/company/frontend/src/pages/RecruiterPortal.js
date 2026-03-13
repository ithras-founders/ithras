
import React, { useState, useMemo, useEffect } from 'react';
import htm from 'htm';
import { getCompanies, getJobs, getCycles, getInstitutions } from '/core/frontend/src/modules/shared/services/api.js';
import { ProcessStatus, CycleCategory } from '/core/frontend/src/modules/shared/types.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import { isDemoUser } from '/core/frontend/src/modules/shared/utils/demoUtils.js';
import ApplicationRequestsApprovalQueue from '../components/ApplicationRequestsApprovalQueue.js';

const html = htm.bind(React.createElement);

const RecruiterPortal = ({ user, activeView }) => {
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [selectedTargetId, setSelectedTargetId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('RECRUITER') ?? getTutorialMockData('RECRUITER');
      setJobs(mock.jobs || []);
      setCycles(mock.cycles || []);
      setCompanies(mock.companies || []);
      setInstitutions(mock.institutions || []);
      setLoading(false);
      return;
    }
    const fetchData = async () => {
      try {
        setLoading(true);
        const [companiesRes, jobsData, cyclesData, institutionsRes] = await Promise.all([
          getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
          getJobs(),
          getCycles(),
          getInstitutions({ limit: 500 }).catch(() => ({ items: [] }))
        ]);
        setCompanies(companiesRes?.items ?? []);
        setJobs(jobsData);
        setCycles(cyclesData);
        setInstitutions(institutionsRes?.items ?? []);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, isTutorialMode]);

  const selectedTarget = useMemo(() => 
    institutions.find(i => i.id === selectedTargetId), [selectedTargetId, institutions]);

  const renderTargetGate = () => {
    const mock = isTutorialMode ? (getTutorialData('RECRUITER') ?? getTutorialMockData('RECRUITER')) : null;
    const institutionStats = mock?.institutionStats || {};
    return html`
    <div className="space-y-12 animate-in pb-20">
       <p data-tour-id="recruiter-header" className="text-sm text-[var(--app-text-secondary)] mb-6">Multi-institution pipelines</p>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-tour-id="institution-cards">
          ${(institutions.length > 0 || !isTutorialMode) ? institutions.map(inst => {
            const stats = institutionStats[inst.id] || {};
            return html`
            <button 
              key=${inst.id} 
              onClick=${() => setSelectedTargetId(inst.id)}
              className="p-12 bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] transition-all text-left relative overflow-hidden group hover:border-[var(--app-accent)] hover:shadow-[var(--app-shadow-floating)] hover:-translate-y-2"
            >
              <div className="flex justify-between items-start mb-12">
                 <div className="w-16 h-16 bg-[var(--app-surface-muted)] rounded-2xl flex items-center justify-center font-semibold text-[var(--app-text-primary)] text-3xl border border-[var(--app-border-soft)]">${inst.name[inst.id === 'lateral' ? 0 : 4]}</div>
                 <span className=${`px-4 py-1.5 text-white text-[9px] font-semibold uppercase rounded-xl ${inst.tier === 'Lateral' ? 'bg-indigo-600' : 'bg-[var(--app-text-primary)]'}`}>${inst.tier}</span>
              </div>
              <h4 className="text-3xl font-semibold text-[var(--app-text-primary)] tracking-tighter leading-tight">${inst.name}</h4>
              ${(stats.totalHires !== undefined || stats.pendingApplications !== undefined) ? html`
                <div className="mt-4 flex gap-4 text-[11px] font-bold">
                  ${stats.totalHires !== undefined ? html`<span className="text-[var(--app-accent)]">${stats.totalHires} hires</span>` : ''}
                  ${stats.roles !== undefined ? html`<span className="text-[var(--app-text-secondary)]">${stats.roles} roles</span>` : ''}
                  ${stats.pendingApplications !== undefined ? html`<span className="text-amber-600">${stats.pendingApplications} pending</span>` : ''}
                </div>
              ` : html`<p className="text-[11px] font-bold text-[var(--app-text-muted)] uppercase tracking-widest mt-4">Connected Active Registry</p>`}
              
              <div className="mt-12 flex items-center gap-3 text-[var(--app-accent)] text-[10px] font-semibold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                Configure Pipeline
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4 4H3"/></svg>
              </div>
            </button>
          `;
          }) : html`
            <div className="p-12 bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] text-center col-span-full">
              <p className="text-[var(--app-text-muted)]">Demo: Select an institution to begin.</p>
            </div>
          `}
       </div>
    </div>
  `;
  };

  const renderInstitutionalDashboard = () => html`
    <div className="space-y-12 animate-in" data-tour-id="institution-dashboard-content">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <button onClick=${() => setSelectedTargetId(null)} className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-3 hover:text-[var(--app-text-secondary)]">← Switch Focus Target</button>
            <h2 className="text-xl font-semibold text-[var(--app-text-primary)] tracking-tight">${selectedTarget.name}</h2>
            <p className=${`text-sm font-semibold mt-1 ${selectedTarget.id === 'lateral' ? 'text-indigo-600' : 'text-[var(--app-accent)]'}`}>
               ${selectedTarget.id === 'lateral' ? 'Global Lateral Hiring Hub' : 'Placement Cycle 2024-25'}
            </p>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button className="flex-1 md:flex-none px-8 py-4 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-2xl text-[11px] font-semibold uppercase tracking-widest hover:bg-[var(--app-surface-muted)] transition-all">Historical Performance</button>
            <button className="flex-1 md:flex-none px-10 py-4 bg-[var(--app-text-primary)] text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-floating)]">Post New Opportunity</button>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-3 space-y-8">
             <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-widest px-2">Live Pipelines at ${selectedTarget.name}</h3>
             ${jobs.filter(j => j.institutionId === selectedTargetId).map(job => html`
               <div key=${job.id} className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex flex-col sm:flex-row items-start sm:items-center justify-between group hover:border-[var(--app-accent)] transition-all">
                  <div className="flex items-center gap-8">
                     <div className="w-16 h-16 bg-[var(--app-accent-soft)] rounded-2xl flex items-center justify-center font-semibold text-[var(--app-accent)] text-2xl border border-[rgba(0,113,227,0.15)]">JD</div>
                     <div>
                       <h4 className="text-2xl font-semibold text-[var(--app-text-primary)] tracking-tighter leading-tight">${job.title}</h4>
                       <p className="text-[11px] font-bold text-[var(--app-text-muted)] uppercase tracking-widest mt-2">${job.sector} • ${job.slot}</p>
                     </div>
                  </div>
                  <button className="mt-6 sm:mt-0 w-full sm:w-auto px-10 py-4 bg-[var(--app-accent)] text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-floating)] shadow-[var(--app-accent-soft)] hover:scale-[1.02] transition-transform">Manage Candidates</button>
               </div>
             `)}
             ${jobs.filter(j => j.institutionId === selectedTargetId).length === 0 && html`
               <div className="p-20 text-center bg-[var(--app-surface-muted)] border-2 border-dashed border-[var(--app-border-soft)] rounded-[var(--app-radius-lg)]">
                  <p className="text-[var(--app-text-muted)] font-medium italic">No active opportunities found for this context. Post a role to begin recruitment.</p>
               </div>
             `}
          </div>
          
          <div className="space-y-6">
             <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
                <h3 className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-6">Context Intelligence</h3>
                <div className="space-y-4">
                  ${cycles.filter(c => c.category === CycleCategory.HISTORICAL).map(c => html`
                    <div key=${c.id} className="p-5 bg-[var(--app-surface-muted)] rounded-2xl border border-[var(--app-border-soft)]">
                      <p className="text-[11px] font-semibold text-[var(--app-text-primary)]">${c.name}</p>
                      <p className="text-[12px] text-[var(--app-accent)] font-bold mt-2">${c.stats?.find(s => s.companyId === user.companyId)?.totalHires || 0} Hires Secured</p>
                    </div>
                  `)}
                </div>
             </div>
          </div>
       </div>
    </div>
  `;

  const [calendarSlots, setCalendarSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotForm, setSlotForm] = useState({ date: '', start: '09:00', end: '10:00', label: '' });
  const [showSlotForm, setShowSlotForm] = useState(false);

  const fetchSlots = async () => {
    if (isTutorialMode || isDemoUser(user)) return;
    setSlotsLoading(true);
    try {
      const { apiRequest } = await import('/core/frontend/src/modules/shared/services/api/apiBase.js');
      const data = await apiRequest(`/v1/calendar-slots?company_id=${user.company_id || ''}`);
      setCalendarSlots(Array.isArray(data) ? data : []);
    } catch (e) { console.warn('Operation failed:', e); setCalendarSlots([]); }
    setSlotsLoading(false);
  };

  const handleCreateSlot = async () => {
    if (!slotForm.date || !slotForm.start || !slotForm.end) return;
    try {
      const { apiRequest } = await import('/core/frontend/src/modules/shared/services/api/apiBase.js');
      const start_time = `${slotForm.date}T${slotForm.start}:00`;
      const end_time = `${slotForm.date}T${slotForm.end}:00`;
      await apiRequest('/v1/calendar-slots', {
        method: 'POST',
        body: JSON.stringify({
          company_id: user.company_id,
          institution_id: selectedTargetId,
          start_time, end_time,
          slot_type: 'INTERVIEW',
          label: slotForm.label || 'Interview',
        }),
      });
      setShowSlotForm(false);
      setSlotForm({ date: '', start: '09:00', end: '10:00', label: '' });
      fetchSlots();
    } catch (err) { console.error('Failed to create slot:', err); }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const { apiRequest } = await import('/core/frontend/src/modules/shared/services/api/apiBase.js');
      await apiRequest(`/v1/calendar-slots/${slotId}`, { method: 'DELETE' });
      fetchSlots();
    } catch (err) { console.error('Failed to delete slot:', err); }
  };

  useEffect(() => { if (selectedTargetId) fetchSlots(); }, [selectedTargetId]);

  const renderCalendar = () => html`
    <div className="space-y-8 animate-in pb-20">
      <div className="flex items-center justify-between">
        <button onClick=${() => setSelectedTargetId(null)} className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest">← Switch Context</button>
        <button
          onClick=${() => setShowSlotForm(!showSlotForm)}
          className="px-5 py-2.5 app-button-primary rounded-[var(--app-radius-sm)] text-sm font-semibold"
        >+ Add Interview Slot</button>
      </div>

      ${showSlotForm ? html`
        <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <h3 className="text-sm font-semibold text-[var(--app-text-primary)] mb-4">New Interview Slot</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">Date</label>
              <input type="date" value=${slotForm.date} onChange=${e => setSlotForm({...slotForm, date: e.target.value})}
                className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] app-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">Start Time</label>
              <input type="time" value=${slotForm.start} onChange=${e => setSlotForm({...slotForm, start: e.target.value})}
                className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] app-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">End Time</label>
              <input type="time" value=${slotForm.end} onChange=${e => setSlotForm({...slotForm, end: e.target.value})}
                className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] app-input text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--app-text-secondary)] mb-1">Label</label>
              <input type="text" value=${slotForm.label} onChange=${e => setSlotForm({...slotForm, label: e.target.value})}
                placeholder="e.g. Round 1" className="w-full px-3 py-2 rounded-[var(--app-radius-sm)] app-input text-sm" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick=${handleCreateSlot} className="px-4 py-2 app-button-primary rounded-[var(--app-radius-sm)] text-sm font-semibold">Create</button>
            <button onClick=${() => setShowSlotForm(false)} className="px-4 py-2 app-button-ghost rounded-[var(--app-radius-sm)] text-sm">Cancel</button>
          </div>
        </div>
      ` : null}

      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] overflow-hidden">
        <div className="p-4 border-b border-[var(--app-border-soft)]">
          <h3 className="text-sm font-semibold text-[var(--app-text-primary)]">Interview Slots</h3>
          <p className="text-xs text-[var(--app-text-muted)] mt-1">${calendarSlots.length} slot${calendarSlots.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        ${slotsLoading ? html`<div className="p-8 text-center text-[var(--app-text-muted)]">Loading slots...</div>` :
          calendarSlots.length === 0 ? html`
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-[var(--app-accent-soft)] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p className="text-[var(--app-text-muted)] text-sm">No interview slots yet. Add slots to start scheduling.</p>
            </div>
          ` : html`
            <div className="divide-y divide-[var(--app-border-soft)]">
              ${calendarSlots.map(slot => html`
                <div key=${slot.id} className="p-4 flex items-center justify-between hover:bg-[var(--app-surface-muted)]">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-[var(--app-radius-sm)] bg-[var(--app-accent-soft)] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--app-text-primary)]">${slot.label || 'Interview'}</p>
                      <p className="text-xs text-[var(--app-text-secondary)]">
                        ${new Date(slot.start_time).toLocaleDateString()} · ${new Date(slot.start_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})} – ${new Date(slot.end_time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                  <button onClick=${() => handleDeleteSlot(slot.id)} className="text-xs text-[var(--app-danger)] hover:underline">Remove</button>
                </div>
              `)}
            </div>
          `}
      </div>
    </div>
  `;

  return html`
    <div className="w-full max-w-none px-4 md:px-6 space-y-12 pb-20">
      ${activeView === 'request-approvals' ? html`<${ApplicationRequestsApprovalQueue} user=${user} />` :
        !selectedTargetId ? renderTargetGate() : 
        activeView === 'calendar' ? renderCalendar() : renderInstitutionalDashboard()}
    </div>
  `;
};

export default RecruiterPortal;
