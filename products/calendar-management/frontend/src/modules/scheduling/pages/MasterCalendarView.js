import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getAvailabilityAggregate,
  getInstitutions,
  getCompanies,
  getCycles,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SLOT_TYPES = { INTERVIEW: 'Interview', PRESENTATION: 'Presentation', NETWORKING: 'Networking' };

const MasterCalendarView = ({ user }) => {
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [institutions, setInstitutions] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [aggregate, setAggregate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterInst, setFilterInst] = useState('');
  const [filterCompanies, setFilterCompanies] = useState('');
  const [filterProcessStage, setFilterProcessStage] = useState('BEFORE_APPLICATIONS');
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const PROCESS_STAGES = [
    { value: 'BEFORE_APPLICATIONS', label: 'All Candidates' },
    { value: 'APPLICATIONS_SUBMITTED', label: 'Applicants Only' },
    { value: 'SHORTLISTED', label: 'Shortlisted Only' },
  ];

  const fetchFilters = useCallback(async () => {
    if (isTutorialMode) return;
    try {
      const [instRes, compRes, cycleData] = await Promise.all([
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
        getCycles().catch(() => []),
      ]);
      setInstitutions(instRes?.items ?? []);
      setCompanies(compRes?.items ?? []);
      setCycles(Array.isArray(cycleData) ? cycleData : []);
    } catch (e) {
      console.error('Failed to fetch filters:', e);
    }
  }, [isTutorialMode]);

  const fetchAggregate = useCallback(async () => {
    if (isTutorialMode) return;
    setLoading(true);
    try {
      const start = new Date(selectedMonth);
      start.setDate(1);
      const end = new Date(selectedMonth);
      end.setMonth(end.getMonth() + 1);
      const filters = {
        institution_id: filterInst || undefined,
        company_ids: filterCompanies || undefined,
        process_stage: filterProcessStage || undefined,
        start_date: start.toISOString(),
        end_date: end.toISOString(),
      };
      Object.keys(filters).forEach((k) => !filters[k] && delete filters[k]);
      const data = await getAvailabilityAggregate(filters);
      setAggregate(data);
    } catch (e) {
      console.error('Failed to fetch aggregate:', e);
      setAggregate(null);
    } finally {
      setLoading(false);
    }
  }, [isTutorialMode, filterInst, filterCompanies, filterProcessStage, selectedMonth]);

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM');
      const cal = mock.masterCalendar || {};
      setInstitutions(cal.institutions || []);
      setCompanies(cal.companies || []);
      setCycles(mock.cycles || []);
      setAggregate({ summary: cal.summary || {}, slots: cal.slots || [] });
      setLoading(false);
      return;
    }
    fetchFilters();
  }, [isTutorialMode, fetchFilters]);

  useEffect(() => {
    fetchAggregate();
  }, [fetchAggregate]);

  const summary = aggregate?.summary || {};
  const slots = aggregate?.slots || [];

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <select
            value=${filterInst}
            onChange=${(e) => setFilterInst(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm font-medium"
          >
            <option value="">All Institutions</option>
            ${institutions.map((i) => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
          </select>
          <select
            value=${filterCompanies}
            onChange=${(e) => setFilterCompanies(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm font-medium"
          >
            <option value="">All Companies</option>
            ${companies.map((c) => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
          </select>
          <select
            value=${filterProcessStage}
            onChange=${(e) => setFilterProcessStage(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm font-medium"
          >
            ${PROCESS_STAGES.map((ps) => html`<option key=${ps.value} value=${ps.value}>${ps.label}</option>`)}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick=${() => {
                const d = new Date(selectedMonth);
                d.setMonth(d.getMonth() - 1);
                setSelectedMonth(d);
              }}
              className="p-2 rounded-lg border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-sm font-bold text-[var(--app-text-secondary)] min-w-[140px] text-center">
              ${selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick=${() => {
                const d = new Date(selectedMonth);
                d.setMonth(d.getMonth() + 1);
                setSelectedMonth(d);
              }}
              className="p-2 rounded-lg border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>

      ${loading ? html`
        <div className="p-20 text-center text-[var(--app-text-muted)]">Loading...</div>
      ` : html`
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <p className="text-[10px] font-semibold text-[var(--app-success)] uppercase tracking-widest">Available</p>
            <p className="text-3xl font-semibold text-emerald-700">${summary.total_available ?? 0}</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-widest">Tentative</p>
            <p className="text-3xl font-semibold text-amber-700">${summary.total_tentative ?? 0}</p>
          </div>
          <div className="bg-[rgba(255,59,48,0.06)] rounded-2xl p-6 border border-red-100">
            <p className="text-[10px] font-semibold text-[var(--app-danger)] uppercase tracking-widest">Not Available</p>
            <p className="text-3xl font-semibold text-[var(--app-danger)]">${summary.total_unavailable ?? 0}</p>
          </div>
          <div className="bg-[var(--app-surface-muted)] rounded-2xl p-6 border border-[var(--app-border-soft)]">
            <p className="text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest">Total Slots</p>
            <p className="text-3xl font-semibold text-[var(--app-text-secondary)]">${summary.total_slots ?? 0}</p>
          </div>
        </div>

        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden">
          <h3 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider p-4 border-b border-[var(--app-border-soft)]">All Blocks</h3>
          ${slots.length === 0 ? html`
            <div className="p-12 text-center text-[var(--app-text-muted)]">No calendar slots in this range.</div>
          ` : html`
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Start</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">End</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Type</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Available</th>
                    <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Unavailable</th>
                  </tr>
                </thead>
                <tbody>
                  ${slots.map((s) => html`
                    <tr key=${s.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                      <td className="p-3">${s.start_time ? new Date(s.start_time).toLocaleString() : '-'}</td>
                      <td className="p-3">${s.end_time ? new Date(s.end_time).toLocaleString() : '-'}</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-50 text-indigo-700">${SLOT_TYPES[s.slot_type] || s.slot_type}</span></td>
                      <td className="p-3"><span className=${'px-2 py-0.5 rounded text-xs font-bold ' + (s.status === 'AVAILABLE' ? 'bg-[rgba(52,199,89,0.12)] text-emerald-700' : s.status === 'BOOKED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]')}>${s.status}</span></td>
                      <td className="p-3 font-bold text-[var(--app-success)]">${s.available ?? '-'}</td>
                      <td className="p-3 font-bold text-[var(--app-danger)]">${s.unavailable ?? '-'}</td>
                    </tr>
                  `)}
                </tbody>
              </table>
            </div>
          `}
        </div>
      `}
    </div>
  `;
};

export default MasterCalendarView;
