import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getApplicationRequests,
  approveApplicationRequest,
  rejectApplicationRequest,
  getWorkflow,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { Modal, StatusBadge } from '/core/frontend/src/modules/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const ApplicationRequestsApprovalQueue = ({ user }) => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    if (!user?.company_id) return;
    try {
      setLoading(true);
      const data = await getApplicationRequests({ company_id: user.company_id });
      setRequests(data || []);
    } catch (e) {
      toast.error('Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user?.company_id]);

  const pending = requests.filter(r => r.status === 'PENDING');

  const handleApprove = async (req) => {
    try {
      await approveApplicationRequest(req.id, user.id);
      toast.success('Request approved. Placement team can now open applications.');
      fetchRequests();
      setSelectedRequest(null);
    } catch (e) {
      toast.error('Failed to approve: ' + (e.message || 'Unknown error'));
    }
  };

  const handleReject = async (req) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    try {
      await rejectApplicationRequest(req.id, user.id, rejectionReason);
      toast.success('Request rejected');
      fetchRequests();
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (e) {
      toast.error('Failed to reject: ' + (e.message || 'Unknown error'));
    }
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      <h2 className="text-xl font-semibold text-[var(--app-text-primary)]">Application Requests</h2>
      <p className="text-sm text-[var(--app-text-secondary)] max-w-2xl">
        The placement team has requested to open placement cycles for student applications. Review and approve or reject each request.
      </p>

      ${pending.length === 0 ? html`
        <div className="bg-[var(--app-surface)] p-12 rounded-2xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] text-center">
          <p className="text-[var(--app-text-muted)]">No pending application requests</p>
        </div>
      ` : html`
        <div className="space-y-4">
          ${pending.map(req => html`
            <div key=${req.id} className="bg-[var(--app-surface)] p-6 rounded-2xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-[var(--app-text-primary)]">Request to open applications</h4>
                  <p className="text-sm text-[var(--app-text-secondary)] mt-1">Workflow ID: ${(req.workflow_id || '').slice(-12)}</p>
                  <p className="text-xs text-[var(--app-text-muted)] mt-1">Requested: ${req.created_at ? new Date(req.created_at).toLocaleString() : '-'}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick=${() => setSelectedRequest(req)}
                    className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-xl text-xs font-bold uppercase"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          `)}
        </div>
      `}

      ${requests.filter(r => r.status !== 'PENDING').length > 0 && html`
        <div className="mt-12">
          <h4 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-4">History</h4>
          <div className="space-y-2">
            ${requests.filter(r => r.status !== 'PENDING').map(req => html`
              <div key=${req.id} className="flex items-center justify-between p-4 bg-[var(--app-surface-muted)] rounded-xl">
                <span>${req.workflow_id?.slice(-12)}</span>
                <${StatusBadge} status=${req.status} />
              </div>
            `)}
          </div>
        </div>
      `}

      ${selectedRequest ? html`
        <${Modal} open=${true} onClose=${() => setSelectedRequest(null)} title="Application Request" size="lg">
          <p className="text-sm text-[var(--app-text-secondary)] mb-6">
            Placement team has requested to open this placement cycle for student applications.
          </p>
          <div className="flex gap-3">
            <button
              onClick=${() => handleApprove(selectedRequest)}
              className="flex-1 px-4 py-3 bg-[var(--app-success)] text-white rounded-xl font-bold"
            >
              Approve
            </button>
            <div className="flex-1">
              <input
                type="text"
                value=${rejectionReason}
                onChange=${e => setRejectionReason(e.target.value)}
                placeholder="Rejection reason..."
                className="w-full px-4 py-2 rounded-xl border mb-2"
              />
              <button
                onClick=${() => handleReject(selectedRequest)}
                disabled=${!rejectionReason.trim()}
                className="w-full px-4 py-3 bg-[var(--app-danger)] text-white rounded-xl font-bold disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
          <button onClick=${() => setSelectedRequest(null)} className="mt-4 text-sm text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]">Cancel</button>
        </${Modal}>
      ` : null}
    </div>
  `;
};

export default ApplicationRequestsApprovalQueue;
