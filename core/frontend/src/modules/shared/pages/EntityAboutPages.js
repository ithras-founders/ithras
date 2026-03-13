/**
 * Institution and Company About pages - LinkedIn-style.
 * Accessible via profile clicks on institution/company names.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { ArrowLeft, Building2, GraduationCap, Briefcase, Users, Award, BookOpen, LayoutGrid } from 'lucide-react';
import { getInstitutionAbout, getCompanyAbout } from '../services/api/core.js';
import { getInstitutionLogoUrl, getInstitutionLogoFallback, getCompanyLogoUrl, getCompanyLogoFallback } from '../utils/logoUtils.js';

const html = htm.bind(React.createElement);

const TabButton = ({ active, label, onClick, Icon }) => html`
  <button
    onClick=${onClick}
    className=${`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
      active ? 'bg-[var(--app-accent)] text-white' : 'text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]'
    }`}
  >
    ${Icon ? html`<${Icon} className="w-4 h-4" />` : ''}
    ${label}
  </button>
`;

const safeStr = (v) => (v == null ? '' : typeof v === 'object' ? String(v?.text ?? v?.value ?? v?.label ?? '') : String(v));

const StatCard = ({ label, value, icon: Icon }) => html`
  <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-4 flex items-center gap-3">
    ${Icon ? html`<div className="w-10 h-10 rounded-lg bg-[var(--app-accent-soft)] flex items-center justify-center text-[var(--app-accent)]"><${Icon} className="w-5 h-5" /></div>` : ''}
    <div>
      <p className="text-2xl font-bold text-[var(--app-text-primary)]">${safeStr(value)}</p>
      <p className="text-xs text-[var(--app-text-muted)]">${label}</p>
    </div>
  </div>
`;

export const InstitutionAboutPage = ({ institutionId, navigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    getInstitutionAbout(institutionId)
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [institutionId]);

  if (loading) {
    return html`<div className="p-12 text-center animate-pulse">Loading institution...</div>`;
  }
  if (error || !data) {
    return html`
      <div className="p-12 text-center">
        <p className="text-[var(--app-text-muted)]">${error || 'Institution not found'}</p>
        ${navigate ? html`<button onClick=${() => navigate('profile/me')} className="mt-4 text-[var(--app-accent)] hover:underline">Back to profile</button>` : ''}
      </div>
    `;
  }

  const { institution, programs, degrees, certifications, stats } = data;
  const logoUrl = getInstitutionLogoUrl(institution);
  const logoSrc = logoUrl || getInstitutionLogoFallback(institution);

  return html`
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        ${navigate ? html`<button onClick=${() => navigate('profile/me')} className="p-2 rounded-lg hover:bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]"><${ArrowLeft} className="w-5 h-5" /></button>` : ''}
        <h1 className="text-xl font-semibold text-[var(--app-text-primary)]">Institution</h1>
      </div>

      <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] overflow-hidden shadow-[var(--app-shadow-subtle)]">
        <div className="h-24 md:h-32 bg-gradient-to-r from-[var(--app-accent-soft)] to-[var(--app-accent)]/20" />
        <div className="px-6 -mt-12 relative">
          <img src=${logoSrc} alt="" className="w-24 h-24 rounded-xl border-4 border-[var(--app-surface)] shadow-lg object-cover bg-[var(--app-surface-muted)]" onError=${(e) => { e.target.src = getInstitutionLogoFallback(institution); }} />
          <h2 className="mt-4 text-2xl font-bold text-[var(--app-text-primary)]">${institution.name}</h2>
          ${institution.tier ? html`<span className="inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)]">${institution.tier}</span>` : ''}
          ${institution.location ? html`<p className="mt-2 text-sm text-[var(--app-text-secondary)]">${institution.location}</p>` : ''}
        </div>

        <div className="px-6 pt-4 pb-4 flex flex-wrap gap-2 border-b border-[var(--app-border-soft)]">
          <${TabButton} active=${activeTab === 'overview'} label="Overview" onClick=${() => setActiveTab('overview')} Icon=${LayoutGrid} />
          <${TabButton} active=${activeTab === 'programs'} label="Programs" onClick=${() => setActiveTab('programs')} Icon=${GraduationCap} />
          <${TabButton} active=${activeTab === 'degrees'} label="Degrees" onClick=${() => setActiveTab('degrees')} Icon=${BookOpen} />
          <${TabButton} active=${activeTab === 'certifications'} label="Certifications" onClick=${() => setActiveTab('certifications')} Icon=${Award} />
          <${TabButton} active=${activeTab === 'people'} label="People & stats" onClick=${() => setActiveTab('people')} Icon=${Users} />
        </div>

        <div className="p-6">
          ${activeTab === 'overview' && html`
            <div className="space-y-4">
              ${institution.about ? html`<p className="text-[var(--app-text-secondary)] whitespace-pre-wrap">${safeStr(institution.about)}</p>` : html`<p className="text-[var(--app-text-muted)] italic">No description added yet.</p>`}
              <div className="flex flex-wrap gap-4 pt-4">
                ${institution.website ? html`<a href=${institution.website.startsWith('http') ? institution.website : 'https://' + institution.website} target="_blank" rel="noopener noreferrer" className="text-[var(--app-accent)] hover:underline text-sm">Website</a>` : ''}
                ${institution.founding_year ? html`<span className="text-sm text-[var(--app-text-muted)]">Founded ${institution.founding_year}</span>` : ''}
                ${institution.student_count_range ? html`<span className="text-sm text-[var(--app-text-muted)]">~${institution.student_count_range} students</span>` : ''}
              </div>
            </div>
          `}
          ${activeTab === 'programs' && html`
            <div className="space-y-3">
              ${programs?.length ? programs.map((p) => html`<div key=${p.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--app-surface-muted)]"><${GraduationCap} className="w-5 h-5 text-[var(--app-accent)]" /><span>${p.name}</span>${p.code ? html`<span className="text-xs text-[var(--app-text-muted)]">${p.code}</span>` : ''}</div>`) : html`<p className="text-[var(--app-text-muted)] italic">No programs listed.</p>`}
            </div>
          `}
          ${activeTab === 'degrees' && html`
            <div className="space-y-3">
              ${degrees?.length ? degrees.map((d) => html`<div key=${d.id} className="flex items-center justify-between p-3 rounded-lg bg-[var(--app-surface-muted)]"><span>${d.name}</span>${d.degree_type ? html`<span className="text-xs px-2 py-0.5 rounded bg-[var(--app-accent-soft)]">${d.degree_type}</span>` : ''}</div>`) : html`<p className="text-[var(--app-text-muted)] italic">No degrees listed.</p>`}
            </div>
          `}
          ${activeTab === 'certifications' && html`
            <div className="space-y-3">
              ${certifications?.length ? certifications.map((c) => html`<div key=${c.id} className="p-3 rounded-lg bg-[var(--app-surface-muted)]"><p className="font-medium">${c.name}</p>${c.issuing_body ? html`<p className="text-xs text-[var(--app-text-muted)] mt-1">${c.issuing_body}</p>` : ''}${c.description ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-1">${c.description}</p>` : ''}</div>`) : html`<p className="text-[var(--app-text-muted)] italic">No certifications listed.</p>`}
            </div>
          `}
          ${activeTab === 'people' && html`
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              ${stats?.total_users != null ? html`<${StatCard} label="People" value=${stats.total_users} icon=${Users} />` : ''}
              ${stats?.total_programs != null ? html`<${StatCard} label="Programs" value=${stats.total_programs} icon=${GraduationCap} />` : ''}
              ${stats?.total_degrees != null && stats.total_degrees > 0 ? html`<${StatCard} label="Degrees" value=${stats.total_degrees} icon=${BookOpen} />` : ''}
              ${stats?.total_certifications != null && stats.total_certifications > 0 ? html`<${StatCard} label="Certifications" value=${stats.total_certifications} icon=${Award} />` : ''}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

export const CompanyAboutPage = ({ companyId, navigate }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (companyId === 'demo-company') {
      setData({ company: { id: 'demo-company', name: 'TechCorp India' }, business_units: [], designations: [], functions: [], stats: {} });
      setLoading(false);
      return;
    }
    getCompanyAbout(companyId)
      .then(setData)
      .catch((e) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [companyId]);

  if (loading) {
    return html`<div className="p-12 text-center animate-pulse">Loading company...</div>`;
  }
  if (error || !data) {
    return html`
      <div className="p-12 text-center">
        <p className="text-[var(--app-text-muted)]">${error || 'Company not found'}</p>
        ${navigate ? html`<button onClick=${() => navigate('profile/me')} className="mt-4 text-[var(--app-accent)] hover:underline">Back to profile</button>` : ''}
      </div>
    `;
  }

  const { company, business_units, designations, functions, stats } = data;
  const logoUrl = getCompanyLogoUrl(company);
  const logoSrc = logoUrl || getCompanyLogoFallback(company);

  return html`
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        ${navigate ? html`<button onClick=${() => navigate('profile/me')} className="p-2 rounded-lg hover:bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]"><${ArrowLeft} className="w-5 h-5" /></button>` : ''}
        <h1 className="text-xl font-semibold text-[var(--app-text-primary)]">Company</h1>
      </div>

      <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] overflow-hidden shadow-[var(--app-shadow-subtle)]">
        <div className="h-24 md:h-32 bg-gradient-to-r from-[var(--app-accent-soft)] to-[var(--app-accent)]/20" />
        <div className="px-6 -mt-12 relative">
          <img src=${logoSrc} alt="" className="w-24 h-24 rounded-xl border-4 border-[var(--app-surface)] shadow-lg object-cover bg-[var(--app-surface-muted)]" onError=${(e) => { e.target.src = getCompanyLogoFallback(company); }} />
          <h2 className="mt-4 text-2xl font-bold text-[var(--app-text-primary)]">${company.name}</h2>
          ${company.headquarters ? html`<p className="mt-2 text-sm text-[var(--app-text-secondary)]">${company.headquarters}</p>` : ''}
        </div>

        <div className="px-6 pt-4 pb-4 flex flex-wrap gap-2 border-b border-[var(--app-border-soft)]">
          <${TabButton} active=${activeTab === 'overview'} label="Overview" onClick=${() => setActiveTab('overview')} Icon=${LayoutGrid} />
          <${TabButton} active=${activeTab === 'business-units'} label="Business Units" onClick=${() => setActiveTab('business-units')} Icon=${Building2} />
          <${TabButton} active=${activeTab === 'designations'} label="Designations" onClick=${() => setActiveTab('designations')} Icon=${Briefcase} />
          <${TabButton} active=${activeTab === 'functions'} label="Functions" onClick=${() => setActiveTab('functions')} Icon=${LayoutGrid} />
          <${TabButton} active=${activeTab === 'people'} label="People & stats" onClick=${() => setActiveTab('people')} Icon=${Users} />
        </div>

        <div className="p-6">
          ${activeTab === 'overview' && html`
            <div className="space-y-4">
              ${company.description ? html`<p className="text-[var(--app-text-secondary)] whitespace-pre-wrap">${safeStr(company.description)}</p>` : html`<p className="text-[var(--app-text-muted)] italic">No description added yet.</p>`}
              <div className="flex flex-wrap gap-4 pt-4">
                ${company.founding_year ? html`<span className="text-sm text-[var(--app-text-muted)]">Founded ${company.founding_year}</span>` : ''}
                ${company.last_year_hires != null && company.last_year_hires > 0 ? html`<span className="text-sm text-[var(--app-text-muted)]">${company.last_year_hires} hires (last year)</span>` : ''}
              </div>
            </div>
          `}
          ${activeTab === 'business-units' && html`
            <div className="space-y-3">
              ${business_units?.length ? business_units.map((b) => html`<div key=${b.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--app-surface-muted)]"><${Building2} className="w-5 h-5 text-[var(--app-accent)]" /><span>${b.name}</span>${b.code ? html`<span className="text-xs text-[var(--app-text-muted)]">${b.code}</span>` : ''}</div>`) : html`<p className="text-[var(--app-text-muted)] italic">No business units listed.</p>`}
            </div>
          `}
          ${activeTab === 'designations' && html`
            <div className="space-y-3">
              ${designations?.length ? designations.map((d) => html`<div key=${d.id} className="p-3 rounded-lg bg-[var(--app-surface-muted)]"><span>${d.name}</span></div>`) : html`<p className="text-[var(--app-text-muted)] italic">No designations listed.</p>`}
            </div>
          `}
          ${activeTab === 'functions' && html`
            <div className="space-y-3">
              ${functions?.length ? functions.map((f) => html`<div key=${f.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--app-surface-muted)]"><span>${f.name}</span>${f.code ? html`<span className="text-xs text-[var(--app-text-muted)]">${f.code}</span>` : ''}</div>`) : html`<p className="text-[var(--app-text-muted)] italic">No functions listed.</p>`}
            </div>
          `}
          ${activeTab === 'people' && html`
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              ${stats?.total_users != null ? html`<${StatCard} label="People" value=${stats.total_users} icon=${Users} />` : ''}
              ${stats?.total_current != null ? html`<${StatCard} label="Current" value=${stats.total_current} icon=${Briefcase} />` : ''}
              ${stats?.total_alumni != null && stats.total_alumni > 0 ? html`<${StatCard} label="Alumni" value=${stats.total_alumni} icon=${Users} />` : ''}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};
