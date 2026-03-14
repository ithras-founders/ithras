import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getUsers, getPrograms, getBatches, getCVs, getApplications } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { SkeletonLoader } from '/core/frontend/src/modules/shared/index.js';
import { Button, Select, SectionCard, StatusBadge } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const StudentDirectoryView = ({ user }) => {
  const [students, setStudents] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [cvs, setCVs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [programFilter, setProgramFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const institutionId = user?.institution_id;

  const fetchPrograms = useCallback(async () => {
    if (!institutionId) return;
    try {
      const progs = await getPrograms(institutionId);
      setPrograms(Array.isArray(progs) ? progs : []);
    } catch {
      setPrograms([]);
    }
  }, [institutionId]);

  const fetchBatches = useCallback(async (programId) => {
    if (!programId) {
      setBatches([]);
      return;
    }
    try {
      const b = await getBatches({ program_id: programId });
      setBatches(Array.isArray(b) ? b : []);
    } catch {
      setBatches([]);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    if (!institutionId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const filters = {
        institution_id: institutionId,
        role: UserRole.CANDIDATE,
      };
      if (programFilter) filters.program_id = programFilter;
      if (batchFilter) filters.batch_id = batchFilter;

      const [usersRes, cvsData, appsData] = await Promise.all([
        getUsers(filters),
        getCVs({ institution_id: institutionId }).catch(() => []),
        getApplications().catch(() => []),
      ]);

      setStudents(usersRes?.items ?? []);
      setCVs(Array.isArray(cvsData) ? cvsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [institutionId, programFilter, batchFilter]);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  useEffect(() => {
    if (programFilter) {
      fetchBatches(programFilter);
      setBatchFilter('');
    } else {
      setBatches([]);
      setBatchFilter('');
    }
  }, [programFilter, fetchBatches]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const getProgramName = (id) => programs.find((p) => p.id === id)?.name || '-';

  if (!institutionId) {
    return html`
      <div className="p-20 text-center font-semibold text-[var(--app-text-muted)]">
        No institution assigned. Contact your administrator.
      </div>
    `;
  }

  if (loading && students.length === 0) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${6} /></div>`;
  }

  const hasActiveFilters = programFilter || batchFilter;

  return html`
    <div className="space-y-8 animate-in pb-20">
      <${SectionCard} className="shadow-[var(--app-shadow-subtle)]">
        <div className="flex flex-wrap gap-4 items-end mb-6">
          <div className="flex flex-col gap-1">
            <${Select}
              label="Program"
              value=${programFilter}
              onChange=${(e) => setProgramFilter(e.target.value)}
              options=${programs.map((p) => ({ value: p.id, label: p.name }))}
              placeholder="All Programs"
              className="min-w-[200px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <${Select}
              label="Batch"
              value=${batchFilter}
              onChange=${(e) => setBatchFilter(e.target.value)}
              disabled=${!programFilter}
              options=${batches.map((b) => ({ value: b.id, label: b.name }))}
              placeholder="All Batches"
              className="min-w-[200px] disabled:cursor-not-allowed"
            />
          </div>
          ${hasActiveFilters ? html`
            <${Button}
              onClick=${() => { setProgramFilter(''); setBatchFilter(''); }}
              variant="ghost"
            >
              Clear filters
            <//>
          ` : null}
          <span className="text-sm text-[var(--app-text-muted)] font-semibold ml-auto self-center">
            ${students.length} student${students.length !== 1 ? 's' : ''}
          </span>
        </div>

        ${students.length === 0 ? html`
          <div className="py-16 text-center text-[var(--app-text-muted)] border border-[var(--app-border-soft)] rounded-xl bg-[var(--app-surface-muted)]">
            No students match your filters.
          </div>
        ` : html`
          <div className="overflow-x-auto rounded-xl border border-[var(--app-border-soft)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Name</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Roll No</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Program</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Batch</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">CVs</th>
                  <th className="text-left p-4 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Applications</th>
                </tr>
              </thead>
              <tbody>
                ${students.map((s) => {
                  const studentCvs = cvs.filter((c) => c.candidate_id === s.id);
                  const studentApps = applications.filter((a) => a.student_id === s.id);
                  const batch = batches.find((b) => b.id === s.batch_id) || (s.batch_id && { name: s.batch_id });
                  return html`
                    <tr key=${s.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] transition-colors">
                      <td className="p-4 font-semibold text-[var(--app-text-primary)]">${s.name || '-'}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${s.email || '-'}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${s.roll_number || '-'}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${getProgramName(s.program_id)}</td>
                      <td className="p-4 text-[var(--app-text-secondary)]">${batch?.name || '-'}</td>
                      <td className="p-4">
                        <${StatusBadge} variant="accent">${studentCvs.length}<//>
                      </td>
                      <td className="p-4">
                        <${StatusBadge} variant="warning">${studentApps.length}<//>
                      </td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        `}
      <//>
    </div>
  `;
};

export default StudentDirectoryView;
