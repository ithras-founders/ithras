import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import AdminPageHeader from '/shared/components/admin/AdminPageHeader.js';

const html = htm.bind(React.createElement);

const OrganisationManagement = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [listed, setListed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestModal, setSuggestModal] = useState(null);
  const [suggestOrg, setSuggestOrg] = useState('');
  const [suggestBu, setSuggestBu] = useState('');
  const [suggestFn, setSuggestFn] = useState('');
  const [suggestTitle, setSuggestTitle] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest('/v1/admin/organisations/pending').catch(() => ({ pending: [] })),
      apiRequest('/v1/admin/organisations/listed').catch(() => ({ listed: [] })),
    ])
      .then(([p, l]) => {
        setPending(p?.pending || []);
        setListed(l?.listed || []);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = (id) => {
    apiRequest(`/v1/admin/organisations/${id}/approve`, { method: 'POST' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Approve failed'));
  };

  const reject = (id) => {
    apiRequest(`/v1/admin/organisations/${id}/reject`, { method: 'POST' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Reject failed'));
  };

  const disapproveCombo = (comboId) => {
    apiRequest(`/v1/admin/organisations/combos/${comboId}/disapprove`, { method: 'POST' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Disapprove failed'));
  };

  const suggestEdit = (item) => {
    setSuggestModal(item);
    setSuggestOrg(item.organisation_name || '');
    setSuggestBu(item.business_unit || '');
    setSuggestFn(item.function || '');
    setSuggestTitle(item.title || '');
  };

  const submitSuggest = () => {
    if (!suggestModal) return;
    apiRequest(`/v1/admin/organisations/${suggestModal.id}/suggest-edit`, {
      method: 'POST',
      body: JSON.stringify({
        organisation_name: suggestOrg,
        business_unit: suggestBu,
        function: suggestFn,
        title: suggestTitle,
      }),
    })
      .then(() => { setSuggestModal(null); load(); })
      .catch((e) => setError(e.message || 'Failed'));
  };

  const navigateToEdit = (org) => {
    window.history.pushState(null, '', `/admin/organisations/${org.id}`);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <div>
      <${AdminPageHeader}
        title="Organisation Management"
        subtitle="Approve organisation + role combinations and curate the listed directory."
      />
      ${error
        ? html`<div
            className="mb-6 p-4 rounded-[var(--radius-lg)] text-sm border"
            style=${{
              color: 'var(--status-danger-text)',
              background: 'var(--app-danger-soft)',
              borderColor: 'var(--app-border-soft)',
            }}
          >
            ${error}
          </div>`
        : null}
      <div className="flex gap-1 p-1 rounded-[var(--app-radius-card)] bg-[var(--app-surface-subtle)] border border-[var(--app-border-soft)] w-fit mb-6">
        <button
          type="button"
          onClick=${() => setTab('pending')}
          className=${`ith-focus-ring px-5 py-2.5 rounded-[var(--radius-lg)] font-semibold text-sm transition-all ${tab === 'pending' ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Pending Approval
          ${pending.length > 0 ? html`<span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">${pending.length}</span>` : null}
        </button>
        <button
          type="button"
          onClick=${() => setTab('listed')}
          className=${`ith-focus-ring px-5 py-2.5 rounded-[var(--radius-lg)] font-semibold text-sm transition-all ${tab === 'listed' ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Listed
        </button>
      </div>
      ${loading ? html`<div className="flex items-center gap-2 text-[var(--app-text-muted)]"><div className="animate-spin h-5 w-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full"></div>Loading...</div>` : null}
      ${!loading && tab === 'pending' ? html`
        <div className="space-y-3">
          ${pending.length === 0 ? html`
            <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-12 text-center">
              <p className="text-[var(--app-text-muted)] font-medium">No pending organisations.</p>
            </div>
          ` : pending.map((p) => html`
            <div key=${p.id} className="app-card p-5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-[var(--app-text-primary)]">${p.organisation_name}</p>
                <p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${p.business_unit ? `${p.business_unit} · ` : ''}${p.function ? `${p.function} · ` : ''}${p.title}</p>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Submitted by user #${p.submitted_by}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick=${() => approve(p.id)} className="px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">Approve</button>
                <button onClick=${() => reject(p.id)} className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Reject</button>
                <button onClick=${() => suggestEdit(p)} className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--app-surface-hover)] text-[var(--app-text-primary)] hover:bg-gray-200 transition-colors">Suggest edit</button>
              </div>
            </div>
          `)}
        </div>
      ` : null}
      ${!loading && tab === 'listed' ? html`
        <div className="space-y-3">
          ${listed.length === 0 ? html`
            <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-12 text-center">
              <p className="text-[var(--app-text-muted)] font-medium">No listed organisations.</p>
            </div>
          ` : listed.map((org) => html`
            <div
              key=${org.id}
              onClick=${() => navigateToEdit(org)}
              role="button"
              tabIndex=${0}
              onKeyDown=${(e) => e.key === 'Enter' && navigateToEdit(org)}
              className="app-card p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] hover:border-[var(--app-accent)]/40 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-[var(--app-text-primary)] group-hover:text-[var(--app-accent)] transition-colors">${org.name}</p>
                  ${org.status === 'placeholder' ? html`<span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Placeholder</span>` : null}
                </div>
                <span className="text-sm text-[var(--app-text-muted)] group-hover:text-[var(--app-accent)] transition-colors flex-shrink-0">View →</span>
              </div>
              ${(org.combos || []).map((c) => html`
                <div key=${c.id} className="flex justify-between items-start gap-4 mt-3 pt-2 border-t border-[var(--app-border-soft)]" onClick=${(e) => e.stopPropagation()}>
                  <p className="text-sm text-[var(--app-text-secondary)]">${c.business_unit ? `${c.business_unit} · ` : ''}${c.function ? `${c.function} · ` : ''}${c.title}</p>
                  <button onClick=${() => disapproveCombo(c.id)} className="px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 flex-shrink-0">Disapprove</button>
                </div>
              `)}
            </div>
          `)}
        </div>
      ` : null}
      ${suggestModal ? html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick=${() => setSuggestModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick=${(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Suggest edits</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Organisation</label>
                <input type="text" value=${suggestOrg} onChange=${(e) => setSuggestOrg(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Business unit</label>
                <input type="text" value=${suggestBu} onChange=${(e) => setSuggestBu(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Function</label>
                <input type="text" value=${suggestFn} onChange=${(e) => setSuggestFn(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input type="text" value=${suggestTitle} onChange=${(e) => setSuggestTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick=${submitSuggest} className="px-4 py-2 rounded-lg font-medium bg-[var(--app-accent)] text-white">Save suggestion</button>
              <button onClick=${() => setSuggestModal(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
            </div>
          </div>
        </div>
      ` : null}
    </div>
  `;
};

export default OrganisationManagement;
