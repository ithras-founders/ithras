import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { 
  getUsers, 
  getCompanies, 
  getJobs, 
  getCycles, 
  getCVs, 
  getShortlists,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';
import AuditTrailPanel from '/core/frontend/src/modules/shared/components/AuditTrailPanel.js';
import SkeletonLoader from '/core/frontend/src/modules/shared/components/SkeletonLoader.js';
import { SectionCard, StatusBadge } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const Dashboard = ({ user, navigate }) => {
  const { isTutorialMode } = useTutorialContext();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    activeJobs: 0,
    activeCycles: 0,
    pendingCVs: 0,
    totalShortlists: 0,
    verifiedCVs: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialMockData('PLACEMENT_TEAM');
      const g = mock?.governanceStats || {};
      setStats({
        totalStudents: g.totalStudents ?? 120,
        totalCompanies: g.totalCompanies ?? 24,
        activeJobs: g.activeJobs ?? 42,
        activeCycles: g.activeCycles ?? 1,
        pendingCVs: g.pendingCVs ?? 14,
        totalShortlists: g.totalShortlists ?? 245,
        verifiedCVs: g.verifiedCVs ?? 98
      });
      setLoading(false);
      return;
    }
    fetchStats();
  }, [user?.institution_id, isTutorialMode]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const filters = user.institution_id ? { institution_id: user.institution_id } : {};
      
      const [
        usersData,
        companiesData,
        jobsData,
        cyclesData,
        cvsData,
        shortlistsData
      ] = await Promise.all([
        getUsers({ ...filters, limit: 500 }).catch(() => ({ items: [] })),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
        getJobs().catch(() => []),
        getCycles().catch(() => []),
        getCVs(filters).catch(() => []),
        getShortlists().catch(() => [])
      ]);

      const usersList = usersData?.items ?? usersData ?? [];
      const companiesList = companiesData?.items ?? companiesData ?? [];
      const students = usersList.filter(u => u.role === UserRole.CANDIDATE);
      const activeJobs = jobsData.filter(j => j.jd_status === 'Approved' || j.jd_status === 'Submitted');
      const activeCycles = cyclesData.filter(c => c.status === 'APPLICATIONS_OPEN' || c.status === 'SHORTLISTING');
      const pendingCVs = cvsData.filter(cv => cv.status === 'SUBMITTED' || cv.status === 'DRAFT');
      const verifiedCVs = cvsData.filter(cv => cv.status === 'VERIFIED');

      setStats({
        totalStudents: students.length,
        totalCompanies: companiesList.length,
        activeJobs: activeJobs.length,
        activeCycles: activeCycles.length,
        pendingCVs: pendingCVs.length,
        totalShortlists: shortlistsData.length,
        verifiedCVs: verifiedCVs.length
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="cards" lines=${6} /></div>`;
  }

  const statCards = [
    { label: 'Total Students', value: stats.totalStudents, icon: '👥', color: 'bg-[var(--app-accent-soft)]', change: '+12%', badgeVariant: 'accent' },
    { label: 'Active Companies', value: stats.totalCompanies, icon: '🏢', color: 'bg-[var(--app-accent-soft)]', change: '+5', badgeVariant: 'accent' },
    { label: 'Active Job Postings', value: stats.activeJobs, icon: '💼', color: 'bg-[var(--app-accent-soft)]', change: '+8', badgeVariant: 'accent' },
    { label: 'Active Cycles', value: stats.activeCycles, icon: '🔄', color: 'bg-[var(--app-success-soft)]', change: '2', badgeVariant: 'success' },
    { label: 'Pending CV Reviews', value: stats.pendingCVs, icon: '📄', color: 'bg-[var(--app-warning-soft)]', change: stats.pendingCVs > 0 ? 'Action required' : 'All clear', badgeVariant: stats.pendingCVs > 0 ? 'warning' : 'success' },
    { label: 'Total Shortlists', value: stats.totalShortlists, icon: '📋', color: 'bg-[var(--app-accent-soft)]', change: '+24', badgeVariant: 'accent' },
    { label: 'Verified CVs', value: stats.verifiedCVs, icon: '✅', color: 'bg-[var(--app-success-soft)]', change: `${Math.round((stats.verifiedCVs / Math.max(stats.totalStudents, 1)) * 100)}%`, badgeVariant: 'success' },
  ];

  return html`
    <div className="space-y-[var(--app-space-8)] animate-in pb-20" data-tour-id="placement-header">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[var(--app-space-6)]" data-tour-id="placement-stats">
        ${statCards.map((stat, idx) => html`
          <div key=${idx} className="app-card p-[var(--app-space-6)] rounded-[var(--app-radius-md)] hover:shadow-[var(--app-shadow-card)] transition-shadow">
            <div className="flex items-center justify-between mb-[var(--app-space-4)]">
              <div className=${`w-12 h-12 ${stat.color} rounded-[var(--app-radius-md)] flex items-center justify-center text-2xl`}>
                ${stat.icon}
              </div>
              <${StatusBadge} variant=${stat.badgeVariant}>${stat.change}<//>
            </div>
            <div>
              <p className="text-[var(--app-text-xs)] font-medium text-[var(--app-text-muted)] uppercase tracking-wider mb-[var(--app-space-1)]">${stat.label}</p>
              <p className="text-[var(--app-text-3xl)] font-semibold text-[var(--app-text-primary)]">${stat.value}</p>
            </div>
          </div>
        `)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[var(--app-space-6)]" data-tour-id="placement-actions">
        <${SectionCard} title="Quick Actions" className="p-[var(--app-space-8)]">
          <div className="space-y-[var(--app-space-3)]">
            <button
              onClick=${() => navigate && navigate('cv-verification')}
              className="w-full p-[var(--app-space-4)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-[var(--app-radius-sm)] text-left font-medium hover:bg-[rgba(0,113,227,0.14)] transition-colors app-focus-ring"
            >
              Review Pending CVs (${stats.pendingCVs})
            </button>
            <button
              onClick=${() => navigate && navigate('recruitment_cycles')}
              className="w-full p-[var(--app-space-4)] bg-[var(--app-surface-muted)] text-[var(--app-text-primary)] rounded-[var(--app-radius-sm)] text-left font-medium hover:bg-[var(--app-border-soft)] transition-colors app-focus-ring border border-[var(--app-border-soft)]"
            >
              Manage Active Cycles
            </button>
            <button
              onClick=${() => navigate && navigate('approval-queue')}
              className="w-full p-[var(--app-space-4)] bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-[var(--app-radius-sm)] text-left font-medium hover:bg-[rgba(0,113,227,0.14)] transition-colors app-focus-ring"
            >
              View Approval Queue
            </button>
          </div>
        <//>

        <${SectionCard} title="Recent Activity" className="p-[var(--app-space-8)]">
          <${AuditTrailPanel}
            institutionId=${user?.institution_id}
            title=""
            compact=${true}
            limit=${10}
            showFilters=${false}
          />
        <//>
      </div>
    </div>
  `;
};

export default Dashboard;
