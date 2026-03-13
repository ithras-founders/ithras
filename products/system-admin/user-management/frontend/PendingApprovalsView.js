import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getPendingInstitutions,
  getPendingCompanies,
  approveInstitution,
  rejectInstitution,
  approveCompany,
  rejectCompany,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import { SectionCard } from '/core/frontend/src/modules/shared/primitives/index.js';
import { EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const StatusBadge = ({ status }) => {
  const c = status === 'PARTNER' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]'
    : status === 'LISTED' ? 'bg-indigo-50 text-indigo-700'
    : 'bg-amber-100 text-amber-700';
  return html`<span className="px-2 py-0.5 rounded text-xs font-bold ${c}">${status}</span>`;
};

const PendingApprovalsView = ({ onBack, navigate }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [pendingInstitutions, setPendingInstitutions] = useState([]);
  const [pendingCompanies, setPendingCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [showApprovalForm, setShowApprovalForm] = useState(null); // { type: 'institution'|'company', id, entity }

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [instRes, compRes] = await Promise.all([
        getPendingInstitutions().catch(() => []),
        getPendingCompanies().catch(() => []),
      ]);
      setPendingInstitutions(Array.isArray(instRes) ? instRes : []);
      setPendingCompanies(Array.isArray(compRes) ? compRes : []);
    } catch (err) {
      console.error('Failed to fetch pending:', err);
      setPendingInstitutions([]);
      setPendingCompanies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApprove = async (type, id, status, details) => {
    setApprovingId(id);
    try {
      if (type === 'institution') {
        await approveInstitution(id, { status, ...details });
        toast.success(`Institution approved as ${status}`);
      } else {
        await approveCompany(id, { status, ...details });
        toast.success(`Company approved as ${status}`);
      }
      setShowApprovalForm(null);
      fetchData();
      if (navigate) navigate(`system-admin/${type === 'institution' ? 'institutions' : 'companies'}/${id}`);
    } catch (err) {
      toast.error('Approval failed: ' + (err.message || ''));
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (type, id) => {
    if (!(await confirm({ message: `Reject and remove this ${type}?` }))) return;
    setApprovingId(id);
    try {
      if (type === 'institution') {
        await rejectInstitution(id, {});
        toast.success('Institution rejected');
      } else {
        await rejectCompany(id, {});
        toast.success('Company rejected');
      }
      setShowApprovalForm(null);
      fetchData();
    } catch (err) {
      toast.error('Reject failed: ' + (err.message || ''));
    } finally {
      setApprovingId(null);
    }
  };

  const total = pendingInstitutions.length + pendingCompanies.length;

  if (loading) {
    return html`
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          ${onBack ? html`<button onClick=${onBack} className="p-1 rounded-lg hover:bg-[var(--app-surface-muted)]">←</button>` : ''}
          <h2 className="text-xl font-bold text-[var(--app-text-primary)]">Pending Approvals</h2>
        </div>
        <div className="animate-pulse space-y-2 py-12"><div className="h-12 bg-[var(--app-surface-muted)] rounded-xl" /></div>
      </div>
    `;
  }

  if (total === 0) {
    return html`
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          ${onBack ? html`<button onClick=${onBack} className="p-1 rounded-lg hover:bg-[var(--app-surface-muted)]">←</button>` : ''}
          <h2 className="text-xl font-bold text-[var(--app-text-primary)]">Pending Approvals</h2>
        </div>
        <${SectionCard} padding=${true}>
          <${EmptyState} title="No pending approvals" message="Institutions and companies with status PENDING will appear here for review." />
        </${SectionCard}>
      </div>
    `;
  }

  return html`
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        ${onBack ? html`<button onClick=${onBack} className="p-1 rounded-lg hover:bg-[var(--app-surface-muted)]">←</button>` : ''}
        <h2 className="text-xl font-bold text-[var(--app-text-primary)]">Pending Approvals</h2>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-sm font-bold">${total} pending</span>
      </div>

      ${pendingInstitutions.length > 0 ? html`
        <${SectionCard} title="Institutions (${pendingInstitutions.length})" padding=${true}>
          <div className="overflow-hidden rounded-xl border border-[var(--app-border-soft)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                  <th className="text-left p-3 text-[10px] font-semibold uppercase">Name</th>
                  <th className="text-left p-3 text-[10px] font-semibold uppercase">ID</th>
                  <th className="text-right p-3 text-[10px] font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pendingInstitutions.map((i) => html`
                  <tr key=${i.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 font-bold">${i.name}</td>
                    <td className="p-3 font-mono text-xs">${i.id}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick=${() => navigate && navigate('system-admin/institutions/' + i.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]"
                      >Review & Approve</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </${SectionCard}>
      ` : ''}

      ${pendingCompanies.length > 0 ? html`
        <${SectionCard} title="Companies (${pendingCompanies.length})" padding=${true}>
          <div className="overflow-hidden rounded-xl border border-[var(--app-border-soft)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                  <th className="text-left p-3 text-[10px] font-semibold uppercase">Name</th>
                  <th className="text-left p-3 text-[10px] font-semibold uppercase">ID</th>
                  <th className="text-right p-3 text-[10px] font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${pendingCompanies.map((c) => html`
                  <tr key=${c.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 font-bold">${c.name}</td>
                    <td className="p-3 font-mono text-xs">${c.id}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick=${() => navigate && navigate('system-admin/companies/' + c.id)}
                        className="px-3 py-1 rounded-lg text-xs font-bold border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]"
                      >Review & Approve</button>
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        </${SectionCard}>
      ` : ''}
    </div>
  `;
};

export default PendingApprovalsView;
