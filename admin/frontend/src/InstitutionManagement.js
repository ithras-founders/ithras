import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import AdminPageHeader from '/shared/components/admin/AdminPageHeader.js';

const html = htm.bind(React.createElement);

const InstitutionManagement = () => {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [listed, setListed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [suggestModal, setSuggestModal] = useState(null);
  const [approveEditModal, setApproveEditModal] = useState(null);
  const [suggestDegree, setSuggestDegree] = useState('');
  const [suggestMajors, setSuggestMajors] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    Promise.all([
      apiRequest('/v1/admin/institutions/pending').catch(() => ({ pending: [] })),
      apiRequest('/v1/admin/institutions/listed').catch(() => ({ listed: [] })),
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
    apiRequest(`/v1/admin/institutions/${id}/approve`, { method: 'POST' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Approve failed'));
  };

  const reject = (id) => {
    apiRequest(`/v1/admin/institutions/${id}/reject`, { method: 'POST' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Reject failed'));
  };

  const disapproveCombo = (comboId) => {
    apiRequest(`/v1/admin/institutions/combos/${comboId}/disapprove`, { method: 'POST' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Disapprove failed'));
  };

  const suggestEdit = (id) => {
    const item = pending.find((x) => x.id === id);
    if (!item) return;
    setSuggestModal(id);
    setSuggestDegree(item.degree);
    setSuggestMajors((item.majors || []).join(', '));
  };

  const submitSuggest = () => {
    if (!suggestModal) return;
    const majors = suggestMajors.split(',').map((s) => s.trim()).filter(Boolean);
    apiRequest(`/v1/admin/institutions/${suggestModal}/suggest-edit`, {
      method: 'POST',
      body: JSON.stringify({ degree: suggestDegree, majors }),
    })
      .then(() => { setSuggestModal(null); load(); })
      .catch((e) => setError(e.message || 'Failed'));
  };

  const approveWithEdit = (id) => {
    const item = pending.find((x) => x.id === id);
    if (!item) return;
    setApproveEditModal({ id, degree: item.degree, majors: (item.majors || []).join(', ') });
  };

  const submitApproveWithEdit = () => {
    if (!approveEditModal) return;
    const majors = approveEditModal.majors.split(',').map((s) => s.trim()).filter(Boolean);
    apiRequest(`/v1/admin/institutions/${approveEditModal.id}/approve-with-edit`, {
      method: 'POST',
      body: JSON.stringify({ degree: approveEditModal.degree, majors }),
    })
      .then(() => { setApproveEditModal(null); load(); })
      .catch((e) => setError(e.message || 'Failed'));
  };

  const navigateToEdit = (inst) => {
    window.history.pushState(null, '', `/admin/institutions/${inst.id}`);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <div>
      <${AdminPageHeader}
        title="Institution Management"
        subtitle="Approve new institution + degree combinations and manage listed programs."
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
              <p className="text-[var(--app-text-muted)] font-medium">No pending institutions.</p>
            </div>
          ` : pending.map((p) => html`
            <div key=${p.id} className="app-card p-5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] flex justify-between items-start gap-4">
              <div>
                <p className="font-semibold text-[var(--app-text-primary)]">${p.institution_name}</p>
                <p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${p.degree}${(p.majors || []).length ? ` — ${p.majors.join(', ')}` : ''}</p>
                <p className="text-xs text-[var(--app-text-muted)] mt-1">Submitted by user #${p.submitted_by}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick=${() => approve(p.id)} className="px-3 py-2 rounded-lg text-sm font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors">Approve</button>
                <button onClick=${() => reject(p.id)} className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Reject</button>
                <button onClick=${() => suggestEdit(p.id)} className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--app-surface-hover)] text-[var(--app-text-primary)] hover:bg-gray-200 transition-colors">Suggest edit</button>
                <button onClick=${() => approveWithEdit(p.id)} className="px-3 py-2 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">Approve with edit</button>
              </div>
            </div>
          `)}
        </div>
      ` : null}
      ${!loading && tab === 'listed' ? html`
        <div className="space-y-3">
          ${listed.length === 0 ? html`
            <div className="rounded-2xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-12 text-center">
              <p className="text-[var(--app-text-muted)] font-medium">No listed institutions.</p>
            </div>
          ` : listed.map((inst) => html`
            <div
              key=${inst.id}
              onClick=${() => navigateToEdit(inst)}
              role="button"
              tabIndex=${0}
              onKeyDown=${(e) => e.key === 'Enter' && navigateToEdit(inst)}
              className="app-card p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] hover:border-[var(--app-accent)]/40 hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-[var(--app-text-primary)] group-hover:text-[var(--app-accent)] transition-colors">${inst.name}</p>
                  ${inst.status === 'placeholder' ? html`<span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Placeholder</span>` : null}
                </div>
                <span className="text-sm text-[var(--app-text-muted)] group-hover:text-[var(--app-accent)] transition-colors flex-shrink-0">View →</span>
              </div>
              ${(inst.combos || []).map((c) => html`
                <div key=${c.id} className="flex justify-between items-start gap-4 mt-3 pt-2 border-t border-[var(--app-border-soft)]" onClick=${(e) => e.stopPropagation()}>
                  <p className="text-sm text-[var(--app-text-secondary)]">${c.degree}${(c.majors || []).length ? ` — ${c.majors.join(', ')}` : ''}</p>
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
                <label className="block text-sm font-medium mb-1">Degree</label>
                <input type="text" value=${suggestDegree} onChange=${(e) => setSuggestDegree(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Majors (comma-separated)</label>
                <input type="text" value=${suggestMajors} onChange=${(e) => setSuggestMajors(e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick=${submitSuggest} className="px-4 py-2 rounded-lg font-medium bg-[var(--app-accent)] text-white">Save suggestion</button>
              <button onClick=${() => setSuggestModal(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
            </div>
          </div>
        </div>
      ` : null}
      ${approveEditModal ? html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick=${() => setApproveEditModal(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick=${(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Approve with corrected values</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Degree</label>
                <input
                  type="text"
                  value=${approveEditModal.degree}
                  onChange=${(e) => setApproveEditModal({ ...approveEditModal, degree: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Majors</label>
                <input
                  type="text"
                  value=${approveEditModal.majors}
                  onChange=${(e) => setApproveEditModal({ ...approveEditModal, majors: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button onClick=${submitApproveWithEdit} className="px-4 py-2 rounded-lg font-medium bg-green-600 text-white">Approve</button>
              <button onClick=${() => setApproveEditModal(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
            </div>
          </div>
        </div>
      ` : null}
    </div>
  `;
};

export default InstitutionManagement;
