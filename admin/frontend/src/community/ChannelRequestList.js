/**
 * Channel creation requests — admin approve / reject / request changes.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  listChannelRequests,
  approveChannelRequest,
  rejectChannelRequest,
  requestChangesChannelRequest,
} from './services/communityAdminApi.js';
import EmptyState from './components/EmptyState.js';

const html = htm.bind(React.createElement);

const ChannelRequestList = ({ onNavigateToCommunity }) => {
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [changesModal, setChangesModal] = useState(null);
  const [changesMessage, setChangesMessage] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    listChannelRequests({ status: filter || undefined })
      .then(({ items, total: t }) => {
        setRequests(items);
        setTotal(t);
      })
      .catch((e) => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [filter]);

  const handleApprove = async (req) => {
    try {
      await approveChannelRequest(req.id);
      load();
    } catch (e) {
      setError(e.message || 'Failed to approve');
    }
  };

  const handleReject = async (req) => {
    if (!confirm(`Reject channel request "${req.name}" in ${req.communityName}?`)) return;
    try {
      await rejectChannelRequest(req.id);
      load();
    } catch (e) {
      setError(e.message || 'Failed to reject');
    }
  };

  const handleRequestChanges = (req) => {
    setChangesModal(req);
    setChangesMessage('');
  };

  const submitChanges = async () => {
    if (!changesModal) return;
    try {
      await requestChangesChannelRequest(changesModal.id, changesMessage);
      setChangesModal(null);
      load();
    } catch (e) {
      setError(e.message || 'Failed to request changes');
    }
  };

  return html`
    <div>
      <h1 className="text-2xl font-bold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Channel requests</h1>
      <p className="text-sm mb-6 max-w-2xl" style=${{ color: 'var(--app-text-muted)' }}>
        Members can propose new channels inside communities that use channels. Approve to create the channel, or send
        feedback so they can resubmit.
      </p>
      ${error ? html`<div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">${error}</div>` : null}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--app-surface)] border border-[var(--app-border-soft)] w-fit mb-6">
        <button
          onClick=${() => setFilter('pending')}
          className=${`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${filter === 'pending' ? 'bg-white text-[var(--app-text-primary)] shadow-sm' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Pending
        </button>
        <button
          onClick=${() => setFilter('approved')}
          className=${`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${filter === 'approved' ? 'bg-white text-[var(--app-text-primary)] shadow-sm' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Approved
        </button>
        <button
          onClick=${() => setFilter('rejected')}
          className=${`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${filter === 'rejected' ? 'bg-white text-[var(--app-text-primary)] shadow-sm' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Rejected
        </button>
        <button
          onClick=${() => setFilter('')}
          className=${`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all ${!filter ? 'bg-white text-[var(--app-text-primary)] shadow-sm' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          All
        </button>
      </div>
      ${loading
        ? html`
            <div className="flex items-center gap-2 py-12 text-[var(--app-text-muted)]">
              <div className="animate-spin h-5 w-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full"></div>
              Loading...
            </div>
          `
        : requests.length === 0
          ? html`
              <${EmptyState}
                heading="No channel requests"
                description=${filter ? `No ${filter} requests.` : 'No requests have been submitted.'}
              />
            `
          : html`
              <div className="overflow-x-auto rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)' }}>
                <table className="w-full text-sm">
                  <thead style=${{ background: 'var(--app-surface-subtle)' }}>
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Channel</th>
                      <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Community</th>
                      <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Description</th>
                      <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Requester</th>
                      <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Status</th>
                      <th className="text-left px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Created</th>
                      <th className="text-right px-4 py-3 font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${requests.map(
                      (req) => html`
                        <tr key=${req.id} className="border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>
                          <td className="px-4 py-3 font-medium" style=${{ color: 'var(--app-text-primary)' }}>${req.name}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              className="text-left hover:underline"
                              style=${{ color: 'var(--app-accent)' }}
                              onClick=${() => {
                                if (onNavigateToCommunity) onNavigateToCommunity(req.communityId);
                              }}
                            >
                              ${req.communityName}
                            </button>
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate" style=${{ color: 'var(--app-text-secondary)' }}>
                            ${req.description || '—'}
                          </td>
                          <td className="px-4 py-3" style=${{ color: 'var(--app-text-secondary)' }}>${req.requesterName || '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex px-2 py-0.5 rounded text-xs font-medium ${req.status === 'pending'
                                ? 'bg-amber-100 text-amber-800'
                                : req.status === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : req.status === 'rejected'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-100 text-gray-700'}"
                            >
                              ${req.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs" style=${{ color: 'var(--app-text-muted)' }}>
                            ${req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            ${req.status === 'pending'
                              ? html`
                                  <div className="flex gap-1 justify-end flex-wrap">
                                    <button
                                      onClick=${() => handleApprove(req)}
                                      className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 hover:bg-green-200"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick=${() => handleRequestChanges(req)}
                                      className="px-2 py-1 rounded text-xs font-medium hover:bg-[var(--app-surface-hover)]"
                                      style=${{ color: 'var(--app-text-secondary)' }}
                                    >
                                      Request changes
                                    </button>
                                    <button
                                      onClick=${() => handleReject(req)}
                                      className="px-2 py-1 rounded text-xs font-medium hover:bg-red-50"
                                      style=${{ color: 'var(--app-danger)' }}
                                    >
                                      Reject
                                    </button>
                                  </div>
                                `
                              : html`<span className="text-xs" style=${{ color: 'var(--app-text-muted)' }}>—</span>`}
                          </td>
                        </tr>
                      `,
                    )}
                  </tbody>
                </table>
              </div>
            `}
      ${!loading && total > requests.length
        ? html`<p className="mt-4 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Showing ${requests.length} of ${total}</p>`
        : null}

      ${changesModal
        ? html`
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style=${{ background: 'rgba(0,0,0,0.4)' }}
              onClick=${() => setChangesModal(null)}
            >
              <div
                className="rounded-xl border bg-white shadow-xl max-w-md w-full p-6"
                style=${{ borderColor: 'var(--app-border-soft)' }}
                onClick=${(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>
                  Request changes: ${changesModal.name}
                </h3>
                <textarea
                  value=${changesMessage}
                  onChange=${(e) => setChangesMessage(e.target.value)}
                  placeholder="Message to requester..."
                  rows=${4}
                  className="w-full px-3 py-2 border rounded-lg text-sm mb-4"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick=${() => setChangesModal(null)}
                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                    style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick=${submitChanges}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                    style=${{ background: 'var(--app-accent)' }}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          `
        : null}
    </div>
  `;
};

export default ChannelRequestList;
