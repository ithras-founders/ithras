import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getUsers,
  getPrograms,
  getBatches,
  getCVs,
  getApplications,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { SkeletonLoader } from '/core/frontend/src/modules/shared/index.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import { Button, Input, Select, StatusBadge } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const StudentsView = ({ user, navigate }) => {
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [cvs, setCvs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [programFilter, setProgramFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [search, setSearch] = useState('');

  const institutionId = user?.institution_id;

  const fetchData = useCallback(async () => {
    if (!institutionId) return;
    try {
      setLoading(true);
      const filters = { institution_id: institutionId, role: UserRole.CANDIDATE };
      if (programFilter) filters.program_id = programFilter;
      if (batchFilter) filters.batch_id = batchFilter;

      const [usersRes, progsData, cvsData, appsData] = await Promise.all([
        getUsers({ ...filters, limit: 500 }).catch(() => ({ items: [] })),
        getPrograms(institutionId).catch(() => []),
        getCVs({ institution_id: institutionId }).catch(() => []),
        getApplications().catch(() => []),
      ]);

      const progs = Array.isArray(progsData) ? progsData : [];
      setPrograms(progs);
      setCvs(Array.isArray(cvsData) ? cvsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);

      setStudents(usersRes?.items ?? []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [institutionId, programFilter, batchFilter]);

  useEffect(() => {
    if (batchFilter && !programFilter) {
      fetchData();
      return;
    }
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (programFilter) {
      getBatches({ program_id: programFilter })
        .then((b) => setBatches(Array.isArray(b) ? b : []))
        .catch(() => setBatches([]));
      setBatchFilter('');
    } else {
      setBatches([]);
      setBatchFilter('');
    }
  }, [programFilter]);

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM');
      const mockStudents = mock.cvStudents || mock.users?.filter((u) => u.role === UserRole.CANDIDATE) || [];
      setStudents(mockStudents);
      setPrograms(mock.programs || []);
      setBatches(mock.batches || []);
      setCvs(mock.cvSubmissions || []);
      setApplications(mock.applications || []);
      setLoading(false);
      return;
    }
  }, [isTutorialMode, getTutorialData]);

  const filtered = students.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (!s.name?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q) && !(s.roll_number || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (programFilter && s.program_id !== programFilter) return false;
    if (batchFilter && s.batch_id !== batchFilter) return false;
    return true;
  });

  const getProgramName = (id) => programs.find((p) => p.id === id)?.name || id || '-';
  const getBatchName = (id) => batches.find((b) => b.id === id)?.name || id || '-';

  if (!institutionId && !isTutorialMode) {
    return html`
      <div className="p-20 text-center font-semibold text-[var(--app-text-muted)]">
        No institution assigned. Contact your administrator.
      </div>
    `;
  }

  if (loading && !isTutorialMode) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${6} /></div>`;
  }

  return html`
    <div className="space-y-6 animate-in pb-20">
      <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">Filters</span>
          ${(programFilter || batchFilter || search) ? html`
            <${Button} onClick=${() => { setProgramFilter(''); setBatchFilter(''); setSearch(''); }} variant="ghost" size="sm">
              Clear all
            <//>
          ` : null}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <${Input}
            type="text"
            placeholder="Search by name, email, or roll number..."
            value=${search}
            onChange=${(e) => setSearch(e.target.value)}
            ariaLabel="Search students"
            className="flex-1 min-w-[200px]"
          />
          <${Select}
            value=${programFilter}
            onChange=${(e) => setProgramFilter(e.target.value)}
            ariaLabel="Filter by program"
            className="min-w-[180px]"
            placeholder="All Programs"
            options=${programs.map((p) => ({ value: p.id, label: p.name }))}
          />
          <${Select}
            value=${batchFilter}
            onChange=${(e) => setBatchFilter(e.target.value)}
            disabled=${!programFilter && batches.length === 0}
            ariaLabel="Filter by batch"
            className="min-w-[180px]"
            placeholder="All Batches"
            options=${batches.map((b) => ({ value: b.id, label: b.name }))}
          />
          <span className="text-sm text-[var(--app-text-muted)] font-semibold">${filtered.length} student${filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="space-y-4">
        ${filtered.length === 0 ? html`
          <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">
            No students match your filters.
          </div>
        ` : html`
          <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden shadow-[var(--app-shadow-subtle)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Name</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Email</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Roll No</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Program</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Batch</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">CVs</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Applications</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((s) => {
                  const studentCvs = cvs.filter((c) => c.candidate_id === s.id);
                  const studentApps = applications.filter((a) => a.student_id === s.id);
                  const progName = getProgramName(s.program_id);
                  const batchName = s.batch_id ? getBatchName(s.batch_id) : (batches.find((b) => b.id === s.batch_id)?.name || '-');
                  return html`
                    <tr key=${s.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] transition-colors">
                      <td className="p-4">
                        ${navigate ? html`
                          <button onClick=${() => navigate('candidate/' + s.id)} className="font-bold text-[var(--app-text-primary)] hover:text-[var(--app-accent)] hover:underline text-left">
                            ${s.name}
                          </button>
                        ` : html`<span className="font-bold text-[var(--app-text-primary)]">${s.name}</span>`}
                      </td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${s.email}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${s.roll_number || '-'}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${progName}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${batchName}</td>
                      <td className="p-4"><${StatusBadge} variant="accent">${studentCvs.length}<//></td>
                      <td className="p-4"><${StatusBadge} variant="warning">${studentApps.length}<//></td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        `}
      </div>
    </div>
  `;
};

export default StudentsView;
