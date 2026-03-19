/**
 * Institution Admin Board: full multi-tab management console.
 * Replaces InstitutionEditPage at /admin/institutions/:id
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import HeroPanel from './institution/HeroPanel.js';
import StickyActionBar from './institution/components/StickyActionBar.js';
import OverviewTab from './institution/tabs/OverviewTab.js';
import ProfileTab from './institution/tabs/ProfileTab.js';
import ProgramsTab from './institution/tabs/ProgramsTab.js';
import PeopleTab from './institution/tabs/PeopleTab.js';
import PublicPageTab from './institution/tabs/PublicPageTab.js';
import ActivityTab from './institution/tabs/ActivityTab.js';
import SettingsTab from './institution/tabs/SettingsTab.js';

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
  { id: 'programs', label: 'Programs' },
  { id: 'people', label: 'People' },
  { id: 'public', label: 'Public Page' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
];

const InstitutionAdminBoard = ({ institutionId, onBack }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [institution, setInstitution] = useState(null);
  const [form, setForm] = useState(null);
  const [stats, setStats] = useState(null);
  const [people, setPeople] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);

  const refresh = () => {
    if (!institutionId) return;
    setLoading(true);
    Promise.all([
      apiRequest(`/v1/admin/institutions/${institutionId}`),
      apiRequest(`/v1/admin/institutions/${institutionId}/stats`).catch(() => null),
      apiRequest(`/v1/admin/institutions/${institutionId}/people`).catch(() => null),
      apiRequest(`/v1/admin/institutions/${institutionId}/activity?limit=10`).catch(() => ({ items: [] })),
    ])
      .then(([inst, st, ppl, act]) => {
        setInstitution(inst);
        setForm(inst);
        setStats(st);
        setPeople(ppl);
        setActivity(act?.items ?? []);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
  }, [institutionId]);

  const handleFormChange = (next) => {
    setForm(next);
    setDirty(true);
  };

  const saveProfile = async () => {
    if (!form || !institutionId) return;
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
        institution_type: form.institution_type,
        founded_year: form.founded_year,
        country: form.country,
        state: form.state,
        city: form.city,
        campus_type: form.campus_type,
        cover_image_url: form.cover_image_url,
        brand_colors_json: form.brand_colors_json,
        linkedin_url: form.linkedin_url,
        twitter_url: form.twitter_url,
        facebook_url: form.facebook_url,
        wikipedia_url: form.wikipedia_url,
        is_public: form.is_public,
      };
      await apiRequest(`/v1/admin/institutions/${institutionId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      if (form.slug && form.slug.trim() && form.slug !== institution?.slug) {
        await apiRequest(`/v1/admin/institutions/${institutionId}/slug`, {
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
    if (!institutionId) return;
    setSaving(true);
    setError('');
    try {
      await saveProfile();
      await apiRequest(`/v1/admin/institutions/${institutionId}/publish`, { method: 'POST' });
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to publish');
    } finally {
      setSaving(false);
    }
  };

  const updateSlug = async () => {
    if (!form?.slug?.trim() || !institutionId) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/v1/admin/institutions/${institutionId}/slug`, {
        method: 'PATCH',
        body: JSON.stringify({ slug: form.slug.trim() }),
      });
      setDirty(false);
      refresh();
    } catch (e) {
      setError(e.message || 'Failed to update slug');
    } finally {
      setSaving(false);
    }
  };

  const handleViewPublic = () => {
    if (form?.slug) window.open(`/i/${form.slug}`, '_blank');
  };

  const handleArchive = async () => {
    if (!institutionId) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/v1/admin/institutions/${institutionId}/archive`, { method: 'POST' });
      onBack?.();
    } catch (e) {
      setError(e.message || 'Failed to archive');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!institutionId || !window.confirm('Permanently delete this institution? This cannot be undone.')) return;
    setSaving(true);
    setError('');
    try {
      await apiRequest(`/v1/admin/institutions/${institutionId}`, { method: 'DELETE' });
      onBack?.();
    } catch (e) {
      setError(e.message || 'Failed to delete');
      setSaving(false);
    }
  };

  if (loading && !institution) {
    return html`
      <div className="flex items-center justify-center py-16">
        <div className="animate-pulse" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      </div>
    `;
  }
  if (error && !institution) {
    return html`
      <div className="p-6">
        <div className="p-4 bg-red-50 rounded-xl text-red-600">${error}</div>
        <button onClick=${onBack} className="mt-4" style=${{ color: 'var(--app-accent)' }}>← Back</button>
      </div>
    `;
  }
  if (!institution) return null;

  const slug = form?.slug || institution?.slug;

  return html`
    <div className="max-w-4xl pb-24">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick=${onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-colors hover:bg-[var(--app-surface-hover)]"
          style=${{ color: 'var(--app-text-secondary)' }}
        >
          <${ArrowLeftIcon} />
          Back
        </button>
      </div>
      ${error ? html`
        <div className="mb-6 p-4 bg-red-50 rounded-xl text-sm text-red-600">${error}</div>
      ` : null}
      <${HeroPanel}
        institution=${institution}
        stats=${stats}
        onViewPublic=${handleViewPublic}
        onSaveDraft=${saveProfile}
        onPublish=${publish}
      />
      <div className="border-b border-[var(--app-border-soft)] mb-6">
        <nav className="flex gap-1 overflow-x-auto">
          ${TABS.map((t) => html`
            <button
              key=${t.id}
              onClick=${() => setActiveTab(t.id)}
              className="px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors"
              style=${{
                borderColor: activeTab === t.id ? 'var(--app-accent)' : 'transparent',
                color: activeTab === t.id ? 'var(--app-accent)' : 'var(--app-text-secondary)',
              }}
            >
              ${t.label}
            </button>
          `)}
        </nav>
      </div>
      <div>
        ${activeTab === 'overview' && html`
          <${OverviewTab}
            institution=${institution}
            stats=${stats}
            recentActivity=${activity}
            onAddDegree=${() => setActiveTab('programs')}
            onAddMajor=${() => setActiveTab('programs')}
          />
        `}
        ${activeTab === 'profile' && html`
          <${ProfileTab} form=${form} onChange=${handleFormChange} />
        `}
        ${activeTab === 'programs' && html`
          <${ProgramsTab} institution=${institution} onRefresh=${refresh} />
        `}
        ${activeTab === 'people' && html`
          <${PeopleTab} people=${people} admins=${institution?.admins} />
        `}
        ${activeTab === 'public' && html`
          <${PublicPageTab}
            form=${form}
            onChange=${handleFormChange}
            onPreview=${handleViewPublic}
          />
        `}
        ${activeTab === 'activity' && html`
          <${ActivityTab} institutionId=${institutionId} />
        `}
        ${activeTab === 'settings' && html`
          <${SettingsTab}
            form=${form}
            onChange=${handleFormChange}
            institutionId=${institutionId}
            onArchive=${handleArchive}
            onDelete=${handleDelete}
            loading=${saving}
          />
        `}
      </div>
      ${(activeTab === 'profile' || activeTab === 'public' || activeTab === 'settings') && dirty && html`
        <${StickyActionBar}
          onSaveDraft=${saveProfile}
          onPublish=${publish}
          onCancel=${() => { setForm(institution); setDirty(false); }}
          onViewPublic=${handleViewPublic}
          saving=${saving}
          slug=${slug}
          showDirty=${dirty}
        />
      `}
    </div>
  `;
};

export default InstitutionAdminBoard;
