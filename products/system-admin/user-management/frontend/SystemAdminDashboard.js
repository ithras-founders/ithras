import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getInstitutions,
  getAdminSummary,
  getUsers,
  getCompanies,
  getJobs,
  getCycles,
  getCVs,
  getShortlists,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import AuditTrailPanel from '/core/frontend/src/modules/shared/components/AuditTrailPanel.js';
import SkeletonLoader from '/core/frontend/src/modules/shared/components/SkeletonLoader.js';
import { PageHeaderCard, SectionCard, StatCard } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const BuildingIcon = () => html`<svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>`;
const UsersIcon = () => html`<svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>`;
const BriefcaseIcon = () => html`<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`;

const SystemAdminDashboard = ({ user, navigate }) => {
  const [stats, setStats] = useState({
    totalInstitutions: 0,
    totalCompanies: 0,
    totalUsers: 0,
    totalCandidates: 0,
    activeJobs: 0,
    activeCycles: 0,
    totalCVs: 0,
    totalShortlists: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const summary = await getAdminSummary().catch(() => null);
      if (summary && typeof summary === 'object') {
        setStats((prev) => ({ ...prev, ...summary }));
        return;
      }
      const [
        institutionsData,
        usersData,
        companiesData,
        jobsData,
        cyclesData,
        cvsData,
        shortlistsData,
      ] = await Promise.all([
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
        getUsers({ limit: 500 }).catch(() => ({ items: [] })),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
        getJobs().catch(() => []),
        getCycles().catch(() => []),
        getCVs({}).catch(() => []),
        getShortlists().catch(() => []),
      ]);

      const institutionsList = institutionsData?.items ?? institutionsData ?? [];
      const companiesList = companiesData?.items ?? companiesData ?? [];
      const usersList = usersData?.items ?? usersData ?? [];
      const candidates = usersList.filter((u) => u.role === UserRole.CANDIDATE || u.role === 'CANDIDATE');
      const activeJobs = jobsData.filter((j) => j.jd_status === 'Approved' || j.jd_status === 'Submitted');
      const activeCycles = cyclesData.filter((c) => c.status === 'APPLICATIONS_OPEN' || c.status === 'SHORTLISTING');

      setStats({
        totalInstitutions: institutionsList.length,
        totalCompanies: companiesList.length,
        totalUsers: usersList.length,
        totalCandidates: candidates.length,
        activeJobs: activeJobs.length,
        activeCycles: activeCycles.length,
        totalCVs: cvsData.length,
        totalShortlists: shortlistsData.length,
      });
    } catch (error) {
      console.error('Failed to fetch platform stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${6} /></div>`;
  }

  const quickActions = [
    { label: 'Institutions', desc: 'Configure institutions & staff', path: 'system-admin/institutions', Icon: BuildingIcon },
    { label: 'Companies', desc: 'Onboard companies & recruiters', path: 'system-admin/companies', Icon: BriefcaseIcon },
    { label: 'All Users', desc: 'Search users across all orgs', path: 'system-admin/people', Icon: UsersIcon },
  ];

  return html`
    <div className="space-y-8 animate-in pb-20" data-tour-id="admin-dashboard">
      <${PageHeaderCard}
        title="System Admin"
        subtitle="Platform overview and quick actions"
        contextBadge="Dashboard"
      />
      <${SectionCard} title="Quick Actions" padding=${true}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          ${quickActions.map((a, i) => html`
            <button
              key=${i}
              onClick=${() => navigate && navigate(a.path)}
              className="flex items-start gap-4 p-5 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] bg-[var(--app-surface)] hover:border-indigo-300 hover:shadow-[var(--app-shadow-subtle)] transition-all text-left group"
            >
              <div className="w-12 h-12 rounded-[var(--app-radius-md)] bg-[var(--app-accent-soft)] flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
                <${a.Icon} />
              </div>
              <div>
                <p className="font-bold text-[var(--app-text-primary)]">${a.label}</p>
                <p className="text-sm text-[var(--app-text-muted)] mt-0.5">${a.desc}</p>
              </div>
              <svg className="w-5 h-5 text-[var(--app-text-muted)] ml-auto shrink-0 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
            </button>
          `)}
        </div>
      </${SectionCard}>
      <${SectionCard} title="Platform Stats" padding=${true}>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <${StatCard} label="Institutions" value=${stats.totalInstitutions} color="accent" />
          <${StatCard} label="Companies" value=${stats.totalCompanies} color="accent" />
          <${StatCard} label="Total Users" value=${stats.totalUsers} />
          <${StatCard} label="Candidates" value=${stats.totalCandidates} />
          <${StatCard} label="Active Jobs" value=${stats.activeJobs} color="warning" />
          <${StatCard} label="Active Cycles" value=${stats.activeCycles} color="success" />
          <${StatCard} label="Total CVs" value=${stats.totalCVs} />
          <${StatCard} label="Shortlists" value=${stats.totalShortlists} />
        </div>
      </${SectionCard}>
      <${SectionCard} title="Recent Platform Activity" padding=${true}>
        <${AuditTrailPanel}
          institutionId=${undefined}
          title=""
          compact=${true}
          limit=${10}
          showFilters=${false}
        />
      </${SectionCard}>
    </div>
  `;
};

export default SystemAdminDashboard;
