import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { apiRequest } from '/shared/services/apiBase.js';
import AdminPageHeader from '/shared/components/admin/AdminPageHeader.js';
import Button from '/shared/components/ui/Button.js';
import Card from '/shared/components/ui/Card.js';

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

  const notifyPendingCountChanged = () => {
    window.dispatchEvent(new CustomEvent('ithras:admin:pending-count-changed'));
  };

  const approve = (u) => {
    setActionLoading((prev) => ({ ...prev, [u.id]: 'approving' }));
    apiRequest(`/v1/admin/users/${u.id}/approve`, { method: 'PATCH' })
      .then(() => { load(); notifyPendingCountChanged(); })
      .catch((e) => setError(e.message || 'Approve failed'))
      .finally(() => setActionLoading((prev) => { const n = { ...prev }; delete n[u.id]; return n; }));
  };

  const reject = (u) => {
    setActionLoading((prev) => ({ ...prev, [u.id]: 'rejecting' }));
    apiRequest(`/v1/admin/users/${u.id}/reject`, { method: 'PATCH' })
      .then(() => { load(); notifyPendingCountChanged(); })
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
      <${AdminPageHeader} title="User Management" subtitle="Review signups, approve or reject accounts, and manage access." />
      <div className="flex items-center gap-2 text-[var(--app-text-muted)]">
        <div className="animate-spin h-5 w-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full"></div>
        Loading...
      </div>
    </div>
  `;

  return html`
    <div>
      <${AdminPageHeader}
        title="User Management"
        subtitle="Review signups, approve or reject accounts, and manage access."
        actions=${pendingCount > 0
          ? html`<span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-pill)] text-sm font-medium"
              style=${{
                background: 'var(--app-warning-soft)',
                color: 'var(--status-warning-text)',
                border: '1px solid var(--app-border-soft)',
              }}
            >
              ⏳ ${pendingCount} awaiting approval
            </span>`
          : null}
      />

      ${error
        ? html`<div
            className="mb-4 p-4 rounded-[var(--radius-lg)] text-sm border"
            style=${{
              color: 'var(--status-danger-text)',
              background: 'var(--app-danger-soft)',
              borderColor: 'var(--app-border-soft)',
            }}
          >
            ${error}
          </div>`
        : null}

      <div className="flex flex-wrap gap-1 mb-6 pb-1 border-b border-[var(--app-border-soft)]">
        ${TABS.map((tab) => {
          const count = tab.key === 'all' ? users.length : users.filter((u) => u.account_status === tab.key).length;
          const isActive = activeTab === tab.key;
          return html`
            <button
              key=${tab.key}
              type="button"
              className="ith-focus-ring flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius-md)] text-sm font-medium transition-colors"
              style=${{
                color: isActive ? 'var(--app-accent)' : 'var(--app-text-muted)',
                background: isActive ? 'var(--app-accent-soft)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--app-accent)' : '2px solid transparent',
                marginBottom: '-2px',
              }}
              onClick=${() => setActiveTab(tab.key)}
            >
              ${tab.label}
              ${count > 0
                ? html`<span
                    className="tabular-nums text-[11px] font-bold px-1.5 py-0.5 rounded-[var(--radius-pill)]"
                    style=${{
                      background: isActive ? 'var(--app-accent)' : 'var(--app-surface-subtle)',
                      color: isActive ? '#fff' : 'var(--app-text-secondary)',
                    }}
                  >
                    ${count}
                  </span>`
                : null}
            </button>
          `;
        })}
      </div>

      ${filtered.length === 0
        ? html`
            <div className="ith-admin-list-shell items-center text-center py-12 text-[var(--app-text-muted)]">
              No ${activeTab === 'all' ? '' : activeTab} users.
            </div>
          `
        : html`
            <div className="flex flex-col gap-3">
              ${filtered.map((u) => {
          const isActioning = !!actionLoading[u.id];
          const isPending = u.account_status === 'pending';
          return html`
            <div
              key=${u.id}
              className="flex items-center gap-4 p-4 rounded-[var(--app-radius-lg)] border bg-[var(--app-surface)] transition-shadow hover:shadow-[var(--app-shadow-card)]"
              style=${{ borderColor: 'var(--app-border-soft)' }}
            >
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
                  <span
                    className="inline-flex px-2 py-0.5 rounded-[var(--radius-sm)] text-xs font-medium"
                    style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}
                    >${u.user_type || 'general'}</span>
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
                    className="p-2 rounded-lg text-[var(--app-danger)] hover:bg-[var(--app-danger-soft)] ith-focus-ring"
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
          `}

      ${deleteConfirm
        ? html`
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style=${{ background: 'var(--backdrop-scrim)' }}
              onClick=${() => setDeleteConfirm(null)}
            >
              <div onClick=${(e) => e.stopPropagation()} className="max-w-md w-full">
                <${Card} elevated=${true} padding="lg">
                  <h3 className="text-lg font-semibold mb-2 text-[var(--app-text-primary)]">Delete user?</h3>
                  <p className="text-[var(--app-text-secondary)] text-sm mb-6">
                    This will permanently delete ${deleteConfirm.full_name || deleteConfirm.email}. This action cannot be undone.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <${Button} variant="danger" onClick=${confirmDelete}>Delete</${Button}>
                    <${Button} variant="secondary" onClick=${() => setDeleteConfirm(null)}>Cancel</${Button}>
                  </div>
                </${Card}>
              </div>
            </div>
          `
        : null}
    </div>
  `;
};

export default UserManagement;
