import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const TrashIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    apiRequest('/v1/admin/users')
      .then((res) => setUsers(res?.users || []))
      .catch((e) => setError(e.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const deleteUser = (u) => {
    setDeleteConfirm(u);
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    apiRequest(`/v1/admin/users/${deleteConfirm.id}`, { method: 'DELETE' })
      .then(() => { setDeleteConfirm(null); load(); })
      .catch((e) => setError(e.message || 'Delete failed'));
  };

  const initials = (name) => (name || 'U').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  if (loading) return html`<div><h1 className="text-2xl font-bold text-[var(--app-text-primary)] mb-6">User Management</h1><div className="flex items-center gap-2 text-[var(--app-text-muted)]"><div className="animate-spin h-5 w-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full"></div>Loading...</div></div>`;

  return html`
    <div>
      <h1 className="text-2xl font-bold text-[var(--app-text-primary)] mb-6">User Management</h1>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">${error}</div>` : null}
      <div className="grid gap-4">
        ${users.map((u) => html`
          <div key=${u.id} className="app-card p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex-shrink-0">
              ${initials(u.full_name || u.username)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[var(--app-text-primary)]">${u.full_name || u.username || u.email || '—'}</p>
              <p className="text-sm text-[var(--app-text-secondary)]">${u.email}</p>
              ${u.headline ? html`<p className="text-sm text-[var(--app-text-muted)] mt-1">${u.headline}</p>` : null}
              <div className="flex gap-2 mt-2">
                <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">${u.user_type || 'general'}</span>
                ${u.profile_slug ? html`<a href="/p/${u.profile_slug}" target="_blank" rel="noopener" className="text-xs text-[var(--app-accent)] hover:underline">View profile</a>` : null}
              </div>
            </div>
            ${(u.email || '').toLowerCase() !== 'founders@ithras.com' ? html`
              <button
                onClick=${() => deleteUser(u)}
                className="p-2 rounded-lg text-[var(--app-danger)] hover:bg-red-50"
                title="Delete user"
              >
                <${TrashIcon} />
              </button>
            ` : null}
          </div>
        `)}
      </div>
      ${deleteConfirm ? html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick=${() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick=${(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete user?</h3>
            <p className="text-[var(--app-text-secondary)] mb-4">This will permanently delete ${deleteConfirm.full_name || deleteConfirm.email}. This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick=${confirmDelete} className="px-4 py-2 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700">Delete</button>
              <button onClick=${() => setDeleteConfirm(null)} className="px-4 py-2 rounded-lg border">Cancel</button>
            </div>
          </div>
        </div>
      ` : null}
    </div>
  `;
};

export default UserManagement;
