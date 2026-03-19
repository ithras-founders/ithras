/**
 * Full-page organisation edit: used at /admin/organisations/:id
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const ArrowLeftIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`;
const ExternalLinkIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>`;

const ListEditor = ({ items, onItemsChange, placeholder, addLabel }) => {
  const add = () => onItemsChange([...(items || []), '']);
  const remove = (i) => {
    const next = (items || []).filter((_, idx) => idx !== i);
    onItemsChange(next.length ? next : ['']);
  };
  const change = (i, v) => onItemsChange((items || []).map((it, idx) => (idx === i ? v : it)));
  const displayItems = (items && items.length) ? items : [''];
  return html`
    <div>
      ${displayItems.map((item, i) => html`
        <div key=${i} className="flex gap-2 mb-2">
          <input type="text" value=${item} onChange=${(e) => change(i, e.target.value)} placeholder=${placeholder} className="flex-1 px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl bg-white text-[var(--app-text-primary)] focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent" />
          ${displayItems.length > 1 ? html`<button type="button" onClick=${() => remove(i)} className="px-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors">✕</button>` : null}
        </div>
      `)}
      <button type="button" onClick=${add} className="text-sm font-medium text-[var(--app-accent)] hover:underline mt-1">+ ${addLabel}</button>
    </div>
  `;
};

const OrganisationEditPage = ({ organisationId, onBack }) => {
  const [form, setForm] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!organisationId) return;
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest(`/v1/admin/organisations/${organisationId}`),
      apiRequest(`/v1/admin/organisations/${organisationId}/stats`).catch(() => null),
    ])
      .then(([data, st]) => {
        setForm(data);
        setStats(st);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [organisationId]);

  const save = () => {
    if (!form) return;
    setSaving(true);
    setError('');
    apiRequest(`/v1/admin/organisations/${organisationId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: form.name,
        logo_url: form.logo_url,
        description: form.description,
        website: form.website,
        status: form.status,
        business_units: form.business_units,
        functions: form.functions,
        titles: form.titles,
      }),
    })
      .then(() => { setSaving(false); onBack?.(); })
      .catch((e) => { setError(e.message || 'Failed to save'); setSaving(false); });
  };

  const goToPage = () => {
    if (form?.slug) window.open(`/o/${form.slug}`, '_blank');
  };

  if (loading) return html`<div className="flex items-center justify-center py-16"><div className="animate-pulse text-[var(--app-text-muted)]">Loading...</div></div>`;
  if (error && !form) return html`<div className="p-6"><div className="p-4 bg-red-50 rounded-xl text-red-600">${error}</div><button onClick=${onBack} className="mt-4 text-[var(--app-accent)] hover:underline">← Back</button></div>`;
  if (!form) return null;

  return html`
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick=${onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-hover)] transition-colors font-medium"
        >
          <${ArrowLeftIcon} />
          Back
        </button>
      </div>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 rounded-xl text-sm text-red-600">${error}</div>` : null}
      <div className="rounded-2xl border border-[var(--app-border-soft)] bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[var(--app-border-soft)]" style=${{ background: 'var(--app-surface-subtle)' }}>
          <div className="flex items-start gap-4">
            ${form.logo_url ? html`<img src=${form.logo_url} alt="" className="h-16 w-16 rounded-xl object-cover flex-shrink-0" />` : html`
              <div className="h-16 w-16 rounded-xl flex items-center justify-center text-2xl font-semibold flex-shrink-0" style=${{ background: 'var(--app-surface)', color: 'var(--app-text-muted)' }}>
                ${(form.name || '?').slice(0, 2).toUpperCase()}
              </div>
            `}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>${form.name}</h1>
              ${stats ? html`
                <div className="flex gap-6 mt-2 text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
                  <span>${stats.current_count} current</span>
                  <span>${stats.alumni_count} alumni</span>
                  <span>${stats.total_count} total</span>
                </div>
              ` : null}
              ${form.status === 'placeholder' ? html`<span className="inline-block mt-2 px-2.5 py-0.5 text-xs font-medium rounded-lg bg-amber-100 text-amber-800">Placeholder</span>` : null}
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Name</label>
            <input type="text" value=${form.name || ''} onChange=${(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Logo URL</label>
            <input type="text" value=${form.logo_url || ''} onChange=${(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Description</label>
            <textarea value=${form.description || ''} onChange=${(e) => setForm({ ...form, description: e.target.value })} rows=${4} className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] resize-y" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Website</label>
            <input type="text" value=${form.website || ''} onChange=${(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)]" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Status</label>
            <select value=${form.status || 'listed'} onChange=${(e) => setForm({ ...form, status: e.target.value })} className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)]">
              <option value="listed">Listed</option>
              <option value="placeholder">Placeholder</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Allowed business units</label>
            <${ListEditor} items=${form.business_units || []} onItemsChange=${(b) => setForm({ ...form, business_units: b })} placeholder="e.g. Engineering" addLabel="Add business unit" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Allowed functions</label>
            <${ListEditor} items=${form.functions || []} onItemsChange=${(f) => setForm({ ...form, functions: f })} placeholder="e.g. Product" addLabel="Add function" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style=${{ color: 'var(--app-text-primary)' }}>Allowed titles</label>
            <${ListEditor} items=${form.titles || []} onItemsChange=${(t) => setForm({ ...form, titles: t })} placeholder="e.g. Software Engineer" addLabel="Add title" />
          </div>
        </div>
        <div className="p-6 border-t border-[var(--app-border-soft)] flex flex-wrap gap-3">
          <button onClick=${save} disabled=${saving} className="px-5 py-2.5 rounded-xl font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70" style=${{ background: 'var(--app-accent)' }}>${saving ? 'Saving...' : 'Save changes'}</button>
          <button onClick=${onBack} disabled=${saving} className="px-5 py-2.5 rounded-xl font-medium border border-[var(--app-border-soft)]" style=${{ color: 'var(--app-text-secondary)' }}>Cancel</button>
          <button onClick=${goToPage} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)] transition-colors" style=${{ color: 'var(--app-text-secondary)' }}>
            View public page
            <${ExternalLinkIcon} />
          </button>
        </div>
      </div>
    </div>
  `;
};

export default OrganisationEditPage;
