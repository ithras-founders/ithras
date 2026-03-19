import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const TrashIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;
const CheckIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
const XIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

const STATUS_STYLES = {
  pending:  { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', label: 'Pending' },
  approved: { bg: '#ECFDF5', border: '#A7F3D0', color: '#065F46', label: 'Approved' },
  rejected: { bg: '#FEF2F2', border: '#FECACA', color: '#991B1B', label: 'Rejected' },
};

const StatusBadge = ({ status }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.approved;
  return html`
    <span style=${{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 9px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.02em',
      background: s.bg,
      border: '1px solid ' + s.border,
      color: s.color,
    }}>
      ${s.label}
    </span>
  `;
};

const TABS = [
  { key: 'pending',  label: 'Pending' },
  { key: 'all',      label: 'All users' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState({});

  const load = () => {
    setLoading(true);
    setError('');
    apiRequest('/v1/admin/users')
      .then((res) => {
        setUsers(res?.users || []);
        setPendingCount(res?.pending_count || 0);
      })
      .catch((e) => setError(e.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const approve = (u) => {
    setActionLoading((prev) => ({ ...prev, [u.id]: 'approving' }));
    apiRequest(`/v1/admin/users/${u.id}/approve`, { method: 'PATCH' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Approve failed'))
      .finally(() => setActionLoading((prev) => { const n = { ...prev }; delete n[u.id]; return n; }));
  };

  const reject = (u) => {
    setActionLoading((prev) => ({ ...prev, [u.id]: 'rejecting' }));
    apiRequest(`/v1/admin/users/${u.id}/reject`, { method: 'PATCH' })
      .then(() => load())
      .catch((e) => setError(e.message || 'Reject failed'))
      .finally(() => setActionLoading((prev) => { const n = { ...prev }; delete n[u.id]; return n; }));
  };

  const deleteUser = (u) => setDeleteConfirm(u);

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    apiRequest(`/v1/admin/users/${deleteConfirm.id}`, { method: 'DELETE' })
      .then(() => { setDeleteConfirm(null); load(); })
      .catch((e) => setError(e.message || 'Delete failed'));
  };

  const initials = (name) => (name || 'U').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

  const filtered = activeTab === 'all' ? users : users.filter((u) => u.account_status === activeTab);

  if (loading) return html`
    <div>
      <h1 className="text-2xl font-bold text-[var(--app-text-primary)] mb-6">User Management</h1>
      <div className="flex items-center gap-2 text-[var(--app-text-muted)]">
        <div className="animate-spin h-5 w-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full"></div>
        Loading...
      </div>
    </div>
  `;

  return html`
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--app-text-primary)]">User Management</h1>
        ${pendingCount > 0 ? html`
          <span style=${{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 12px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#92400E',
          }}>
            ⏳ ${pendingCount} awaiting approval
          </span>
        ` : null}
      </div>

      ${error ? html`<div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">${error}</div>` : null}

      <div className="flex gap-1 mb-6 border-b border-[var(--app-border-soft)]">
        ${TABS.map((tab) => {
          const count = tab.key === 'all' ? users.length : users.filter((u) => u.account_status === tab.key).length;
          const isActive = activeTab === tab.key;
          return html`
            <button
              key=${tab.key}
              onClick=${() => setActiveTab(tab.key)}
              style=${{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--app-accent)' : 'var(--app-text-muted)',
                borderBottom: isActive ? '2px solid var(--app-accent)' : '2px solid transparent',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '2px solid var(--app-accent)' : '2px solid transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              ${tab.label}
              ${count > 0 ? html`
                <span style=${{
                  background: isActive ? 'var(--app-accent)' : '#E5E7EB',
                  color: isActive ? '#fff' : '#6B7280',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '0 6px',
                  minWidth: '18px',
                  textAlign: 'center',
                }}>
                  ${count}
                </span>
              ` : null}
            </button>
          `;
        })}
      </div>

      ${filtered.length === 0 ? html`
        <div className="text-center py-12 text-[var(--app-text-muted)]">
          No ${activeTab === 'all' ? '' : activeTab} users.
        </div>
      ` : null}

      <div className="grid gap-3">
        ${filtered.map((u) => {
          const isActioning = !!actionLoading[u.id];
          const isPending = u.account_status === 'pending';
          return html`
            <div key=${u.id} className="app-card p-4 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] flex items-center gap-4">
              <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex-shrink-0">
                ${initials(u.full_name || u.username)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-[var(--app-text-primary)]">${u.full_name || u.username || u.email || '—'}</p>
                  <${StatusBadge} status=${u.account_status || 'approved'} />
                </div>
                <p className="text-sm text-[var(--app-text-secondary)]">${u.email}</p>
                ${u.headline ? html`<p className="text-sm text-[var(--app-text-muted)] mt-0.5">${u.headline}</p>` : null}
                <div className="flex gap-2 mt-1.5 flex-wrap">
                  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">${u.user_type || 'general'}</span>
                  ${u.created_at ? html`<span className="text-xs text-[var(--app-text-muted)]">Joined ${new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : null}
                  ${u.profile_slug ? html`<a href="/p/${u.profile_slug}" target="_blank" rel="noopener" className="text-xs text-[var(--app-accent)] hover:underline">View profile</a>` : null}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                ${isPending ? html`
                  <button
                    onClick=${() => approve(u)}
                    disabled=${isActioning}
                    style=${{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: isActioning ? '#D1FAE5' : '#ECFDF5',
                      border: '1px solid #A7F3D0',
                      color: '#065F46',
                      cursor: isActioning ? 'not-allowed' : 'pointer',
                      opacity: isActioning ? 0.7 : 1,
                      transition: 'background 150ms',
                    }}
                    title="Approve account"
                  >
                    <${CheckIcon} />
                    ${actionLoading[u.id] === 'approving' ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick=${() => reject(u)}
                    disabled=${isActioning}
                    style=${{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#FEF2F2',
                      border: '1px solid #FECACA',
                      color: '#991B1B',
                      cursor: isActioning ? 'not-allowed' : 'pointer',
                      opacity: isActioning ? 0.7 : 1,
                      transition: 'background 150ms',
                    }}
                    title="Reject account"
                  >
                    <${XIcon} />
                    ${actionLoading[u.id] === 'rejecting' ? 'Rejecting...' : 'Reject'}
                  </button>
                ` : null}
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
            </div>
          `;
        })}
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
