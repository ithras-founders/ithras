/**
 * Organisation Admin Board: full multi-tab management console.
 * Replaces OrganisationEditPage at /admin/organisations/:id
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import HeroPanel from './organisation/HeroPanel.js';
import StickyActionBar from './institution/components/StickyActionBar.js';
import OverviewTab from './organisation/tabs/OverviewTab.js';
import ProfileTab from './organisation/tabs/ProfileTab.js';
import StructureTab from './organisation/tabs/StructureTab.js';
import RolesTab from './organisation/tabs/RolesTab.js';
import PeopleTab from './organisation/tabs/PeopleTab.js';
import PublicPageTab from './organisation/tabs/PublicPageTab.js';
import ActivityTab from './organisation/tabs/ActivityTab.js';
import SettingsTab from './organisation/tabs/SettingsTab.js';

const html = htm.bind(React.createElement);

const ArrowLeftIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="m12 19-7-7 7-7"/>
    <path d="M19 12H5"/>
  </svg>
`;

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'profile', label: 'Profile' },
  { id: 'structure', label: 'Structure' },
  { id: 'roles', label: 'Roles' },
  { id: 'people', label: 'People' },
  { id: 'public', label: 'Public Page' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

const OrganisationAdminBoard = ({ organisationId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [organisation, setOrganisation] = useState(null);
  const [form, setForm] = useState(null);
  const [stats, setStats] = useState(null);
  const [people, setPeople] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  const refresh = () => {
    if (!organisationId) return;
    setLoading(true);
    Promise.all([
      apiRequest(`/v1/admin/organisations/${organisationId}`),
      apiRequest(`/v1/admin/organisations/${organisationId}/stats`).catch(() => null),
      apiRequest(`/v1/admin/organisations/${organisationId}/people`).catch(() => null),
      apiRequest(`/v1/admin/organisations/${organisationId}/activity?limit=10`).catch(() => ({ items: [] })),
    ])
      .then(([org, st, ppl, act]) => {
        setOrganisation(org);
        setForm(org);
        setStats(st);
        setPeople(ppl);
        setActivity(act?.items ?? []);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [organisationId]);

  const handleFormChange = (next) => {
    setForm(next);
    setDirty(true);
  };

  const saveProfile = async () => {
    if (!form || !organisationId) return;
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        short_name: form.short_name,
        logo_url: form.logo_url,
        description: form.description,
        website: form.website,
        status: form.status,
        organisation_type: form.organisation_type,
        industry: form.industry,
        headquarters: form.headquarters,
        founded_year: form.founded_year,
        company_size: form.company_size,
        cover_image_url: form.cover_image_url,
        brand_colors_json: form.brand_colors_json,
        linkedin_url: form.linkedin_url,
        twitter_url: form.twitter_url,
        crunchbase_url: form.crunchbase_url,
        is_public: form.is_public,
      };
      await apiRequest(`/v1/admin/organisations/${organisationId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (form.slug && form.slug.trim() && form.slug !== organisation?.slug) {
        await apiRequest(`/v1/admin/organisations/${organisationId}/slug`, {
          method: 'PATCH',
          body: JSON.stringify({ slug: form.slug.trim() }),
        });
      }
      setDirty(false);
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!organisationId) return;
    setSaving(true);
    setError('');
    try {
      await saveProfile();
      await apiRequest(`/v1/admin/organisations/${organisationId}/publish`, { method: 'POST' });
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPublic = () => {
    if (form?.slug) window.open(`/o/${form.slug}`, '_blank');
  };

  const handleArchive = async () => {
    if (!organisationId) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/v1/admin/organisations/${organisationId}/archive`, { method: 'POST' });
      onBack?.();
    } catch (e) {
      setError(e.message || 'Failed to archive');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!organisationId || !window.confirm('Permanently delete this organisation? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/v1/admin/organisations/${organisationId}`, { method: 'DELETE' });
      onBack?.();
    } catch (e) {
      setError(e.message || 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading && !organisation) {
    return html`<div className="flex items-center justify-center py-16"><div className="animate-pulse" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div></div>`;
  }
  if (error && !organisation) {
    return html`<div className="p-6"><div className="p-4 bg-red-50 rounded-xl text-red-600">${error}</div><button onClick=${onBack} className="mt-4" style=${{ color: 'var(--app-accent)' }}>← Back</button></div>`;
  }
  if (!organisation) return null;

  const slug = form?.slug || organisation?.slug;

  return html`
    <div className="max-w-4xl pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button onClick=${onBack} className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>
          <${ArrowLeftIcon} />
          Back
        </button>
      </div>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 rounded-xl text-sm text-red-600">${error}</div>` : null}
      <${HeroPanel} organisation=${organisation} stats=${stats} onViewPublic=${handleViewPublic} onSaveDraft=${saveProfile} onPublish=${publish} />
      <div className="border-b border-[var(--app-border-soft)] mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          ${TABS.map((t) => html`
            <button
              key=${t.id}
              onClick=${() => setActiveTab(t.id)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style=${{ borderColor: activeTab === t.id ? 'var(--app-accent)' : 'transparent', color: activeTab === t.id ? 'var(--app-accent)' : 'var(--app-text-secondary)' }}
            >
              ${t.label}
            </button>
          `)}
        </nav>
      </div>
      <div>
        ${activeTab === 'overview' && html`<${OverviewTab} organisation=${organisation} stats=${stats} recentActivity=${activity} onAddBU=${() => setActiveTab('structure')} onAddFunction=${() => setActiveTab('structure')} onAddRole=${() => setActiveTab('roles')} />`}
        ${activeTab === 'profile' && html`<${ProfileTab} form=${form} onChange=${handleFormChange} />`}
        ${activeTab === 'structure' && html`<${StructureTab} organisation=${organisation} onRefresh=${refresh} />`}
        ${activeTab === 'roles' && html`<${RolesTab} organisation=${organisation} onRefresh=${refresh} />`}
        ${activeTab === 'people' && html`<${PeopleTab} people=${people} admins=${organisation?.admins} />`}
        ${activeTab === 'public' && html`<${PublicPageTab} form=${form} onChange=${handleFormChange} onPreview=${handleViewPublic} />`}
        ${activeTab === 'activity' && html`<${ActivityTab} organisationId=${organisationId} />`}
        ${activeTab === 'settings' && html`
          <${SettingsTab}
            form=${form}
            onChange=${handleFormChange}
            onArchive=${handleArchive}
            onDelete=${handleDelete}
            loading=${saving}
          />
        `}
      </div>
      ${(activeTab === 'profile' || activeTab === 'public' || activeTab === 'settings') && dirty && html`
        <${StickyActionBar} onSaveDraft=${saveProfile} onPublish=${publish} onCancel=${() => { setForm(organisation); setDirty(false); }} onViewPublic=${handleViewPublic} saving=${saving} slug=${slug} showDirty=${dirty} />
      `}
    </div>
  `;
};

export default OrganisationAdminBoard;
