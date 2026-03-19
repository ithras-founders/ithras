/**
 * About Company page - /o/{slug}. Real data only, tabs, charts.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getPublicOrganisation, getOrganisationPeople } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
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
import { Briefcase } from 'lucide-react';

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

const AboutCompanyPage = ({ slug }) => {
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
      getPublicOrganisation(slug),
      getOrganisationPeople(slug),
    ])
      .then(([data, ppl]) => {
        setApiData(data);
        setPeople(ppl);
      })
      .catch((e) => setError(e.message || 'Not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  const org = apiData?.organisation || {};
  const combos = apiData?.combos || [];
  const currentCount = apiData?.current_count ?? 0;
  const alumniCount = apiData?.alumni_count ?? 0;
  const totalCount = apiData?.total_count ?? currentCount + alumniCount;

  const currentList = (people?.current || []).map((p) => ({
    id: String(p.user_id),
    fullName: p.full_name,
    title: p.title || [p.function, p.business_unit].filter(Boolean).join(' · '),
    team: p.business_unit,
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
    formerTitle: p.title || [p.function, p.business_unit].filter(Boolean).join(' · '),
    team: p.business_unit,
    yearsAtCompany: yearsBetween(p.start_month, p.end_month) ?? 0,
    currentCompany: '—',
    departureYear: parseYear(p.end_month),
    profileSlug: p.profile_slug,
  }));

  const roleDistribution = (() => {
    const byTitle = {};
    [...(people?.current || []), ...(people?.alumni || [])].forEach((p) => {
      const t = p.title || [p.function, p.business_unit].filter(Boolean).join(' · ') || 'Unknown';
      byTitle[t] = (byTitle[t] || 0) + 1;
    });
    return Object.entries(byTitle).map(([name, count]) => ({ name, count }));
  })();

  const hasEnoughData = totalCount >= MIN_DATA_FOR_INSIGHTS;
  const rolesFromCombos = combos.map((c) => ({
    title: [c.business_unit, c.function, c.title].filter(Boolean).join(' · ') || '—',
    business_unit: c.business_unit,
    function: c.function,
  }));

  if (loading) {
    return html`
      <div className="min-h-screen flex flex-col bg-gray-50">
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
          <a href="/" className="flex items-center"><${IthrasLogo} size="sm" theme="dark" /></a>
          <span className="text-sm text-gray-500">Loading...</span>
        </header>
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 space-y-8">
          <${HeroSkeleton} />
          <${StatsGridSkeleton} />
          <${MemberListSkeleton} />
        </main>
      </div>
    `;
  }

  if (error) {
    return html`
      <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
        <p className="text-red-600 font-medium">${error}</p>
        <a href="/" className="mt-4 text-sm text-blue-600 hover:underline">Go home</a>
      </div>
    `;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'people', label: 'People' },
    { id: 'roles', label: 'Roles' },
    { id: 'insights', label: 'Insights' },
  ];

  return html`
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-6 py-3 border-b border-gray-200 bg-white">
        <a href="/" className="flex items-center"><${IthrasLogo} size="sm" theme="dark" /></a>
        <div className="text-right">
          <p className="text-sm text-gray-500">Companies / ${org.name || slug}</p>
          <p className="font-semibold text-gray-900">${org.name || slug}</p>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 md:px-6 py-8 space-y-6">
        ${org.status === 'placeholder'
          ? html`
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
                Pending verification. This organisation has been added by a user and is awaiting admin approval.
              </div>
            `
          : null}

        <${CompanyHeroCard}
          org=${{ ...org, name: org.name || slug }}
          extras=${{ teamCount: combos.length, openRoles: 0, avgTenure: null }}
          stats=${{ current_count: currentCount, alumni_count: alumniCount, total_count: totalCount }}
        />

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
          html`<section key="role-dist">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 mb-3">Role distribution</h2>
            ${roleDistribution.length > 0
              ? html`<${ProgrammeDistributionChart} items=${roleDistribution} />`
              : html`<${NotEnoughData} message="Not enough data available for role distribution." />`}
          </section>`,
        ] : null}

        ${activeTab === 'people' ? html`
          <${MemberList} members=${currentList} />
          <${AlumniList} alumni=${alumniList} />
        ` : null}

        ${activeTab === 'roles' ? html`
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Roles</h2>
            ${rolesFromCombos.length === 0
              ? html`<${EmptyState} icon=${Briefcase} message="No roles defined yet." />`
              : html`
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    ${rolesFromCombos.map((r, i) => html`<${RoleCard} key=${i} role=${r} />`)}
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
                      mostCommonRole: roleDistribution[0]?.name || '—',
                      avgTenure: '—',
                      alumniAtTopFirms: '—',
                      hiringTrend: '—',
                    }}
                    teams=${[]}
                    roles=${rolesFromCombos}
                  />
                `
              : html`<${NotEnoughData} message="Not enough data available for insights. Add more members and alumni to see derived insights." />`}
          </section>
        ` : null}
      </main>
    </div>
  `;
};

export default AboutCompanyPage;
