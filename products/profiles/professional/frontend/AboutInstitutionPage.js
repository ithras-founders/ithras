/**
 * About Institution page - /i/{slug}. Real data only, tabs, charts.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getPublicInstitution, getInstitutionPeople } from '/shared/services/index.js';
import DirectoryEntityShell from './DirectoryEntityShell.js';
import CompanyHeroCard from './components/CompanyHeroCard.js';
import MemberList from './components/MemberList.js';
import AlumniList from './components/AlumniList.js';
import RoleCard from './components/RoleCard.js';
import InsightPanel from './components/InsightPanel.js';
import EmptyState from './components/EmptyState.js';
import NotEnoughData from './components/NotEnoughData.js';
import StatsChart from './components/StatsChart.js';
import ProgrammeDistributionChart from './components/ProgrammeDistributionChart.js';
import { HeroSkeleton, StatsGridSkeleton, MemberListSkeleton } from './components/SkeletonLoader.js';
import EntityPageCommunitySection from './components/EntityPageCommunitySection.js';
import { GraduationCap } from 'lucide-react';

const html = htm.bind(React.createElement);

const MIN_DATA_FOR_INSIGHTS = 2;

const parseYear = (ym) => (ym && typeof ym === 'string' ? parseInt(ym.slice(0, 4), 10) : null);
const tenureFromMonths = (start, end) => {
  if (!start) return null;
  const endMonth = end || new Date().toISOString().slice(0, 7);
  const [sy, sm] = (start || '').split('-').map(Number);
  const [ey, em] = (endMonth || '').split('-').map(Number);
  const months = (ey - sy) * 12 + (em - sm);
  if (months < 12) return `${months} mo`;
  return `${(months / 12).toFixed(1)} yrs`;
};

const goHome = (e) => {
  e.preventDefault();
  window.history.pushState(null, '', '/');
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

const AboutInstitutionPage = ({ slug, user, onLogout }) => {
  const [apiData, setApiData] = useState(null);
  const [people, setPeople] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError('');
    Promise.all([
      getPublicInstitution(slug),
      getInstitutionPeople(slug),
    ])
      .then(([data, ppl]) => {
        setApiData(data);
        setPeople(ppl);
      })
      .catch((e) => setError(e.message || 'Not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const inst = apiData?.institution || {};
  const linkedCommunity = apiData?.linked_community || null;
  const degreeMajors = apiData?.degree_majors || [];
  const currentCount = apiData?.current_count ?? 0;
  const alumniCount = apiData?.alumni_count ?? 0;
  const totalCount = apiData?.total_count ?? currentCount + alumniCount;

  const programmeLabel = (p) => [p.degree, ...(p.majors || [])].filter(Boolean).join(' · ') || '—';

  const currentList = (people?.current || []).map((p) => ({
    id: String(p.user_id),
    fullName: p.full_name,
    title: programmeLabel(p),
    team: null,
    startDate: p.start_month,
    tenure: tenureFromMonths(p.start_month, p.end_month),
    profileSlug: p.profile_slug,
  }));

  const yearsBetween = (start, end) => {
    if (!start || !end) return null;
    const [sy, sm] = (start || '').split('-').map(Number);
    const [ey, em] = (end || '').split('-').map(Number);
    return ((ey - sy) * 12 + (em - sm)) / 12;
  };
  const alumniList = (people?.alumni || []).map((p) => ({
    id: String(p.user_id),
    fullName: p.full_name,
    formerTitle: programmeLabel(p),
    team: null,
    yearsAtCompany: yearsBetween(p.start_month, p.end_month) ?? 0,
    currentCompany: '—',
    departureYear: parseYear(p.end_month),
    profileSlug: p.profile_slug,
  }));

  const programmeDistribution = (() => {
    const byProgramme = {};
    [...(people?.current || []), ...(people?.alumni || [])].forEach((p) => {
      const label = programmeLabel(p);
      byProgramme[label] = (byProgramme[label] || 0) + 1;
    });
    return Object.entries(byProgramme).map(([name, count]) => ({ name, count }));
  })();

  const hasEnoughData = totalCount >= MIN_DATA_FOR_INSIGHTS;
  const rolesFromDegreeMajors = degreeMajors.map((c) => ({
    title: programmeLabel(c),
    department: null,
  }));

  const breadcrumb = (titleLine) => html`
    <div className="pb-4 mb-6 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
      <p className="text-xs font-medium" style=${{ color: 'var(--app-text-muted)' }}>
        Institutions / ${titleLine}
      </p>
      <p className="text-lg font-semibold mt-0.5" style=${{ color: 'var(--app-text-primary)' }}>
        ${titleLine}
      </p>
    </div>
  `;

  if (loading) {
    return html`
      <${DirectoryEntityShell} user=${user} onLogout=${onLogout}>
        <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto w-full">
          <div className="pb-4 mb-6 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
            <p className="text-xs font-medium" style=${{ color: 'var(--app-text-muted)' }}>Institutions</p>
            <p className="text-lg font-semibold mt-0.5" style=${{ color: 'var(--app-text-secondary)' }}>Loading…</p>
          </div>
          <div className="space-y-8">
            <${HeroSkeleton} />
            <${StatsGridSkeleton} />
            <${MemberListSkeleton} />
          </div>
        </div>
      </${DirectoryEntityShell}>
    `;
  }

  if (error) {
    return html`
      <${DirectoryEntityShell} user=${user} onLogout=${onLogout}>
        <main className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
          <p className="font-medium" style=${{ color: 'var(--app-danger, #dc2626)' }}>${error}</p>
          <a
            href="/"
            onClick=${goHome}
            className="mt-4 text-sm font-medium hover:underline"
            style=${{ color: 'var(--app-accent)' }}
          >
            Go home
          </a>
        </main>
      </${DirectoryEntityShell}>
    `;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'People' },
    { id: 'programmes', label: 'Programmes' },
    { id: 'insights', label: 'Insights' },
  ];

  const title = inst.name || slug;

  return html`
    <${DirectoryEntityShell} user=${user} onLogout=${onLogout}>
      <div className="px-4 md:px-6 py-6 max-w-6xl mx-auto w-full space-y-6">
        ${breadcrumb(title)}

        ${inst.status === 'placeholder'
          ? html`
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
                Pending verification. This institution has been added by a user and is awaiting admin approval.
              </div>
            `
          : null}

        <${CompanyHeroCard}
          org=${{ ...inst, name: title }}
          extras=${{
            teamCount: degreeMajors.length,
            openRoles: degreeMajors.length,
            avgTenure: null,
            industry: inst.institution_type,
            headquarters: [inst.city, inst.state, inst.country].filter(Boolean).join(', '),
            founded: inst.founded_year,
            tags: [inst.campus_type, inst.short_name].filter(Boolean),
          }}
          stats=${{ current_count: currentCount, alumni_count: alumniCount, total_count: totalCount }}
          variant="institution"
        />

        <${EntityPageCommunitySection} linkedCommunity=${linkedCommunity} user=${user} />

        <div className="flex gap-1 p-1 rounded-xl bg-white border border-gray-200 w-fit">
          ${tabs.map((t) => html`
            <button
              key=${t.id}
              onClick=${() => setActiveTab(t.id)}
              className=${`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              ${t.label}
            </button>
          `)}
        </div>

        ${activeTab === 'overview' ? [
          html`<section key="current-alumni">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Current vs Alumni</h2>
            ${totalCount > 0
              ? html`<${StatsChart} current=${currentCount} alumni=${alumniCount} />`
              : html`<${NotEnoughData} message="Not enough data available to display this chart." />`}
          </section>`,
          html`<section key="programme-dist">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Programme distribution</h2>
            ${programmeDistribution.length > 0
              ? html`<${ProgrammeDistributionChart} items=${programmeDistribution} />`
              : html`<${NotEnoughData} message="Not enough data available for programme distribution." />`}
          </section>`,
        ] : null}

        ${activeTab === 'people' ? html`
          <${MemberList} members=${currentList} title="Current students" teamFilterLabel="All programmes" />
          <${AlumniList} alumni=${alumniList} variant="institution" />
        ` : null}

        ${activeTab === 'programmes' ? html`
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Programmes</h2>
            ${rolesFromDegreeMajors.length === 0
              ? html`<${EmptyState} icon=${GraduationCap} message="No programmes defined yet." />`
              : html`
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    ${rolesFromDegreeMajors.map((r, i) => html`<${RoleCard} key=${i} role=${r} />`)}
                  </div>
                `}
          </section>
        ` : null}

        ${activeTab === 'insights' ? html`
          <section>
            ${hasEnoughData
              ? html`
                  <${InsightPanel}
                    insights=${{
                      fastestGrowingTeam: '—',
                      mostCommonRole: programmeDistribution[0]?.name || '—',
                      avgTenure: '—',
                      alumniAtTopFirms: '—',
                      hiringTrend: '—',
                    }}
                    teams=${[]}
                    roles=${rolesFromDegreeMajors}
                  />
                `
              : html`<${NotEnoughData} message="Not enough data available for insights. Add more students and alumni to see derived insights." />`}
          </section>
        ` : null}
      </div>
    </${DirectoryEntityShell}>
  `;
};

export default AboutInstitutionPage;
