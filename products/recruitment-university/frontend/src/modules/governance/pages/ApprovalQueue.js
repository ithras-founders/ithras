import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import htm from 'htm';
import {
  getWorkflowApprovals,
  approveWorkflowRequest,
  rejectWorkflowRequest,
  getWorkflow,
  getJDSubmission,
  approveJDSubmission,
  getProfileChangeRequests,
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, SkeletonLoader } from '/core/frontend/src/modules/shared/index.js';
import Modal from '/core/frontend/src/modules/shared/primitives/Modal.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

const formatTimestamp = (value) => {
  if (!value) return 'N/A';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return 'N/A';
  return dt.toLocaleString();
};

const formatFieldLabel = (key = '') =>
  key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());

const fieldChangeSummary = (approval) => {
  const fields = Object.keys(approval?.requested_data || {});
  if (fields.length === 0) return 'No fields captured';
  const labels = fields.map(formatFieldLabel);
  if (labels.length <= 2) return labels.join(', ');
  return `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more`;
};

const displayPerson = (name, email, fallbackId) => {
  if (name && email) return `${name} (${email})`;
  if (name) return name;
  if (email) return email;
  return fallbackId || 'N/A';
};

const isProfileApproval = (approval) =>
  approval?._source === 'profile' || approval?.approval_type === 'STUDENT_PROFILE_UPDATE';

const ApprovalQueue = ({ user }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [activeTab, setActiveTab] = useState('pending');
  const [approvals, setApprovals] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM');
      setApprovals(mock.approvals || []);
      setLoading(false);
      return;
    }
    fetchApprovals();
  }, [isTutorialMode, getTutorialData, user?.institution_id]);

  useEffect(() => {
    if (activeTab === 'history' && historyItems.length === 0 && !isTutorialMode) {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const [workflowApprovals, profileApprovals] = await Promise.all([
        getWorkflowApprovals({ status: 'PENDING' }).catch(() => []),
        getProfileChangeRequests({ status: 'PENDING', institution_id: user?.institution_id || '' }).catch(() => []),
      ]);
      const merged = [
        ...(Array.isArray(workflowApprovals) ? workflowApprovals.map((a) => ({ ...a, _source: 'workflow' })) : []),
        ...(Array.isArray(profileApprovals)
          ? profileApprovals.map((a) => ({
              ...a,
              _source: 'profile',
              approval_type: 'STUDENT_PROFILE_UPDATE',
              workflow_id: `profile-${a.user_id || a.id}`,
              requested_data: a.requested_changes || {},
            }))
          : []),
      ];
      merged.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      setApprovals(merged);
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const [approvedWf, rejectedWf, approvedPr, rejectedPr] = await Promise.all([
        getWorkflowApprovals({ status: 'APPROVED' }).catch(() => []),
        getWorkflowApprovals({ status: 'REJECTED' }).catch(() => []),
        getProfileChangeRequests({ status: 'APPROVED', institution_id: user?.institution_id || '' }).catch(() => []),
        getProfileChangeRequests({ status: 'REJECTED', institution_id: user?.institution_id || '' }).catch(() => []),
      ]);
      const merged = [
        ...[...approvedWf, ...rejectedWf].map(a => ({ ...a, _source: 'workflow' })),
        ...[...approvedPr, ...rejectedPr].map(a => ({
          ...a, _source: 'profile', approval_type: 'STUDENT_PROFILE_UPDATE',
          workflow_id: `profile-${a.user_id || a.id}`,
          requested_data: a.requested_changes || {},
        })),
      ];
      merged.sort((a, b) => {
        const da = a.approved_at || a.reviewed_at || a.updated_at || a.created_at || 0;
        const db2 = b.approved_at || b.reviewed_at || b.updated_at || b.created_at || 0;
        return new Date(db2) - new Date(da);
      });
      setHistoryItems(merged);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleApprove = async (approval) => {
    try {
      if (approval?._source === 'profile') {
        await approveProfileChangeRequest(approval.id, user.id);
      } else {
        await approveWorkflowRequest(approval.id, user.id);
      }
      toast.success('Approved successfully!');
      fetchApprovals();
      setSelectedApproval(null);
    } catch (error) {
      toast.error('Failed to approve: ' + (error.message || 'Unknown error'));
    }
  };

  const handleReject = async (approval) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      if (approval?._source === 'profile') {
        await rejectProfileChangeRequest(approval.id, user.id, rejectionReason);
      } else {
        await rejectWorkflowRequest(approval.id, user.id, rejectionReason);
      }
      toast.success('Rejected');
      fetchApprovals();
      setSelectedApproval(null);
      setRejectionReason('');
    } catch (error) {
      toast.error('Failed to reject: ' + (error.message || 'Unknown error'));
    }
  };

  const handleJDApprove = async (submissionId) => {
    try {
      await approveJDSubmission(submissionId, user.id);
      toast.success('JD approved and applications opened!');
      fetchApprovals();
      setSelectedApproval(null);
    } catch (error) {
      toast.error('Failed to approve JD: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return html`<div className="p-6"><${SkeletonLoader} variant="listRows" lines=${5} /></div>`;
  }

  const renderPendingTab = () => html`
    ${approvals.length === 0 ? html`
      <div className="bg-[var(--app-surface)] p-12 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] text-center">
        <p className="text-[var(--app-text-muted)] text-lg">No pending approvals</p>
      </div>
    ` : html`
      <div className="space-y-4" data-tour-id="approval-items">
        ${approvals.map(approval => html`
          <div key=${approval.id} className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">${formatFieldLabel(approval.approval_type)}</h3>
                ${isProfileApproval(approval) ? html`
                  <p className="text-sm text-[var(--app-text-secondary)] mt-1">
                    ${displayPerson(approval.user_name, approval.user_email, approval.user_id)}
                  </p>
                  <p className="text-xs text-[var(--app-text-secondary)] mt-1">
                    Requested: ${formatTimestamp(approval.created_at)} · Fields: ${fieldChangeSummary(approval)}
                  </p>
                ` : html`
                  <p className="text-sm text-[var(--app-text-secondary)] mt-1">
                    Workflow ID: ${(approval.workflow_id || '').slice(-12) || 'N/A'}
                  </p>
                `}
              </div>
              <button
                onClick=${() => setSelectedApproval(approval)}
                className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-xl text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        `)}
      </div>
    `}
  `;

  const renderHistoryTab = () => html`
    ${historyLoading ? html`
      <div className="py-12 text-center text-[var(--app-text-muted)] animate-pulse">Loading history...</div>
    ` : historyItems.length === 0 ? html`
      <div className="bg-[var(--app-surface)] p-12 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] text-center">
        <p className="text-[var(--app-text-muted)] text-lg">No approval history yet</p>
      </div>
    ` : html`
      <div className="space-y-3">
        ${historyItems.map(item => {
          const isApproved = item.status === 'APPROVED';
          const reviewedAt = item.approved_at || item.reviewed_at || item.updated_at;
          const reviewerName = item.approved_by_name || item.reviewed_by_name || item.approved_by || item.reviewed_by || 'N/A';
          return html`
            <div key=${item.id} className="bg-[var(--app-surface)] p-5 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className=${'px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase ' + (isApproved ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]')}>
                      ${item.status}
                    </span>
                    <span className="px-2 py-0.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded text-[10px] font-bold uppercase">
                      ${formatFieldLabel(item.approval_type || '')}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-[var(--app-text-secondary)]">
                    ${isProfileApproval(item) ? html`
                      <span>Student: ${displayPerson(item.user_name, item.user_email, item.user_id)}</span>
                    ` : html`
                      <span>Workflow: ${(item.workflow_id || '').slice(-12) || 'N/A'}</span>
                    `}
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[var(--app-text-muted)]">
                    <span>Reviewed by: ${reviewerName}</span>
                    <span>${formatTimestamp(reviewedAt)}</span>
                  </div>
                  ${item.rejection_reason ? html`
                    <p className="mt-1 text-xs text-[var(--app-danger)] italic">Reason: ${item.rejection_reason}</p>
                  ` : ''}
                </div>
                <button
                  onClick=${() => setSelectedApproval(item)}
                  className="px-3 py-1.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-[var(--app-radius-sm)] text-[10px] font-semibold uppercase hover:bg-[var(--app-surface)]/80 transition-colors shrink-0"
                >
                  Details
                </button>
              </div>
            </div>
          `;
        })}
      </div>
    `}
  `;

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div className="flex gap-1 bg-[var(--app-surface-muted)] p-1 rounded-[var(--app-radius-md)] max-w-md" data-tour-id="approval-queue-header">
        <button
          onClick=${() => setActiveTab('pending')}
          className=${'flex-1 py-2 px-4 text-sm font-bold rounded-xl transition-all ' + (activeTab === 'pending' ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]')}
        >
          Pending${approvals.length > 0 ? ` (${approvals.length})` : ''}
        </button>
        <button
          onClick=${() => setActiveTab('history')}
          className=${'flex-1 py-2 px-4 text-sm font-bold rounded-xl transition-all ' + (activeTab === 'history' ? 'bg-[var(--app-surface)] text-[var(--app-text-primary)] shadow-[var(--app-shadow-subtle)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]')}
        >
          History
        </button>
      </div>

      ${activeTab === 'pending' ? renderPendingTab() : renderHistoryTab()}

      ${selectedApproval && html`
        <${ApprovalDetailModal}
          approval=${selectedApproval}
          onClose=${() => { setSelectedApproval(null); setRejectionReason(''); }}
          onApprove=${handleApprove}
          onReject=${handleReject}
          onJDApprove=${handleJDApprove}
          rejectionReason=${rejectionReason}
          onRejectionReasonChange=${setRejectionReason}
        />
      `}
    </div>
  `;
};

const ApprovalDetailModal = ({ approval, onClose, onApprove, onReject, onJDApprove, rejectionReason, onRejectionReasonChange }) => {
  const [workflow, setWorkflow] = useState(null);
  const [jdSubmission, setJdSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [approval]);

  const fetchDetails = async () => {
    if (isProfileApproval(approval)) {
      setWorkflow(null);
      setJdSubmission(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const workflowData = await getWorkflow(approval.workflow_id);
      setWorkflow(workflowData);
      
      if (approval.approval_type === 'JD_SUBMISSION') {
        const submissionId = approval.requested_data?.submission_id;
        if (submissionId) {
          try {
            const jdData = await getJDSubmission(submissionId);
            setJdSubmission(jdData);
          } catch (error) {
            console.error('Failed to fetch JD submission:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const modalContent = html`
    <${Modal} open=${true} onClose=${onClose} title="Approval Details" size="3xl">
        ${loading ? html`
          <div className="p-8"><${SkeletonLoader} lines=${4} /></div>
        ` : html`
          <div className="space-y-6">
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Type</p>
              <p className="text-lg font-bold text-[var(--app-text-primary)]">${formatFieldLabel(approval.approval_type)}</p>
            </div>
            
            ${workflow && html`
              <div>
                <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Workflow</p>
                <p className="text-lg font-bold text-[var(--app-text-primary)]">${workflow.name}</p>
              </div>
            `}
            
            ${approval.approval_type === 'JD_SUBMISSION' && jdSubmission && html`
              <div className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] space-y-4">
                <h4 className="text-sm font-semibold text-[var(--app-text-primary)]">JD & Compensation Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--app-text-secondary)]">Job Title</p>
                    <p className="text-sm font-bold">${jdSubmission.job_title}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--app-text-secondary)]">Sector</p>
                    <p className="text-sm font-bold">${jdSubmission.sector || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--app-text-secondary)]">Fixed Compensation</p>
                    <p className="text-sm font-bold">${jdSubmission.fixed_comp ? `₹${jdSubmission.fixed_comp.toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--app-text-secondary)]">Variable Compensation</p>
                    <p className="text-sm font-bold">${jdSubmission.variable_comp ? `₹${jdSubmission.variable_comp.toLocaleString()}` : 'N/A'}</p>
                  </div>
                </div>
                ${jdSubmission.job_description && html`
                  <div>
                    <p className="text-xs text-[var(--app-text-secondary)] mb-1">Description</p>
                    <p className="text-sm text-[var(--app-text-secondary)]">${jdSubmission.job_description}</p>
                  </div>
                `}
              </div>
            `}
            
            ${approval.approval_type === 'STAGE_PROGRESSION' && html`
              <div className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)]">
                <p className="text-xs text-[var(--app-text-secondary)] mb-2">Students to Progress</p>
                <p className="text-sm font-bold text-[var(--app-text-primary)]">${approval.requested_data?.student_ids?.length || 0} students</p>
              </div>
            `}

            ${approval.approval_type === 'STUDENT_PROFILE_UPDATE' && html`
              <div className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] space-y-3">
                <h4 className="text-sm font-semibold text-[var(--app-text-primary)]">Student Profile Update Request</h4>
                <p className="text-xs text-[var(--app-text-secondary)]">
                  Student: ${displayPerson(approval.user_name, approval.user_email, approval.user_id)}
                </p>
                <div className="space-y-2">
                  ${Object.entries(approval.requested_data || {}).map(([k, v]) => html`
                    <div key=${k} className="flex items-start justify-between gap-3 text-sm">
                      <span className="font-semibold text-[var(--app-text-secondary)]">${formatFieldLabel(k)}</span>
                      <span className="text-[var(--app-text-primary)] text-right break-all">${Array.isArray(v) ? v.join(', ') : String(v ?? '')}</span>
                    </div>
                  `)}
                </div>
              </div>
            `}

            ${approval.approval_type === 'STUDENT_PROFILE_UPDATE' && html`
              <div className="p-6 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-2xl space-y-2">
                <h4 className="text-sm font-semibold text-[var(--app-text-primary)]">Audit</h4>
                <p className="text-sm text-[var(--app-text-secondary)]">
                  <span className="font-semibold">Requested by:</span>
                  ${' '}
                  ${displayPerson(approval.requested_by_name, approval.requested_by_email, approval.requested_by)}
                </p>
                <p className="text-sm text-[var(--app-text-secondary)]">
                  <span className="font-semibold">Requested at:</span>
                  ${' '}
                  ${formatTimestamp(approval.created_at)}
                </p>
                ${approval.reviewed_by || approval.reviewed_by_name || approval.reviewed_by_email ? html`
                  <p className="text-sm text-[var(--app-text-secondary)]">
                    <span className="font-semibold">Reviewed by:</span>
                    ${' '}
                    ${displayPerson(approval.reviewed_by_name, approval.reviewed_by_email, approval.reviewed_by)}
                  </p>
                ` : ''}
                ${approval.reviewed_at ? html`
                  <p className="text-sm text-[var(--app-text-secondary)]">
                    <span className="font-semibold">Reviewed at:</span>
                    ${' '}
                    ${formatTimestamp(approval.reviewed_at)}
                  </p>
                ` : ''}
                ${approval.rejection_reason ? html`
                  <p className="text-sm text-[var(--app-danger)]">
                    <span className="font-semibold">Rejection reason:</span>
                    ${' '}
                    ${approval.rejection_reason}
                  </p>
                ` : ''}
              </div>
            `}
            
            <div className="space-y-4 pt-4">
              ${approval.approval_type === 'STUDENT_PROFILE_UPDATE' ? html`
                <p className="text-xs text-[var(--app-text-secondary)]">
                  Approving this request immediately applies these profile changes to the student account.
                </p>
              ` : ''}
              <input
                type="text"
                value=${rejectionReason}
                onChange=${(e) => onRejectionReasonChange(e.target.value)}
                placeholder="Rejection reason (required to reject)..."
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              />
              <div className="flex gap-3">
                <button
                  onClick=${() => approval.approval_type === 'JD_SUBMISSION' && jdSubmission 
                    ? onJDApprove(jdSubmission.id)
                    : onApprove(approval)
                  }
                  className="flex-1 px-6 py-3 bg-[var(--app-success)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:opacity-90 transition-colors"
                >
                  Approve
                </button>
                <button
                  onClick=${() => onReject(approval)}
                  disabled=${!rejectionReason.trim()}
                  className="flex-1 px-6 py-3 bg-[var(--app-danger)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        `}
    <//>
  `;

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ApprovalQueue;
