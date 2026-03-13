import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getApplicationRequests,
  createApplicationRequest,
  getWorkflows,
  getCompanies,
  getInstitutions,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const RequestApplicationsView = ({ user }) => {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ workflow_id: '', company_id: '', institution_id: user?.institution_id || '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqs, wfs, compsRes, instsRes] = await Promise.all([
        getApplicationRequests({ institution_id: user?.institution_id }).catch(() => []),
        getWorkflows({ institution_id: user?.institution_id }).catch(() => []),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
      ]);
      setRequests(reqs || []);
      setWorkflows(wfs || []);
      setCompanies(compsRes?.items ?? []);
      setInstitutions(instsRes?.items ?? []);
    } catch (e) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.institution_id]);

  const handleCreate = async () => {
    if (!formData.workflow_id || !formData.company_id || !formData.institution_id) {
      toast.error('Please select workflow, company, and institution');
      return;
    }
    try {
      await createApplicationRequest({
        workflow_id: formData.workflow_id,
        company_id: formData.company_id,
        institution_id: formData.institution_id,
        requested_by: user.id,
      });
      toast.success('Request created. Recruiter will review.');
      setShowForm(false);
      setFormData({ workflow_id: '', company_id: '', institution_id: user?.institution_id || '' });
      fetchData();
    } catch (e) {
      toast.error('Failed to create: ' + (e.message || 'Unknown error'));
    }
  };

  const formatDate = (v) => (v ? new Date(v).toLocaleString() : '-');
  const statusBadge = (s) => {
    const cls = s === 'APPROVED' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : s === 'REJECTED' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' : 'bg-amber-100 text-amber-700';
    return html`<span className=${`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${cls}`}>${s}</span>`;
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div className="flex justify-end items-center">
        <button
          onClick=${() => setShowForm(true)}
          className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-card)] hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          + New Request
        </button>
      </div>

      <p className="text-sm text-[var(--app-text-secondary)] max-w-2xl">
        Request to open a placement cycle for student applications. The company recruiter must approve before applications can be submitted.
      </p>

      ${showForm && html`
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)]">
          <h3 className="text-lg font-semibold mb-4">New Application Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] uppercase mb-1">Institution</label>
              <select
                value=${formData.institution_id}
                onChange=${e => setFormData({ ...formData, institution_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
              >
                <option value="">Select...</option>
                ${institutions.map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] uppercase mb-1">Company</label>
              <select
                value=${formData.company_id}
                onChange=${e => setFormData({ ...formData, company_id: e.target.value, workflow_id: '' })}
                className="w-full px-4 py-2 rounded-lg border"
              >
                <option value="">Select...</option>
                ${companies.map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-[var(--app-text-secondary)] uppercase mb-1">Placement Cycle</label>
              <select
                value=${formData.workflow_id}
                onChange=${e => setFormData({ ...formData, workflow_id: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border"
              >
                <option value="">Select...</option>
                ${workflows
                  .filter(w => !formData.company_id || w.company_id === formData.company_id)
                  .map(w => html`<option key=${w.id} value=${w.id}>${w.name}</option>`)}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick=${handleCreate} className="px-6 py-2 bg-[var(--app-accent)] text-white rounded-lg text-sm font-bold">Submit Request</button>
            <button onClick=${() => setShowForm(false)} className="px-6 py-2 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-lg text-sm font-bold">Cancel</button>
          </div>
        </div>
      `}

      <div className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)]">
        <h4 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-4">Your Requests</h4>
        ${requests.length === 0 ? html`
          <p className="text-[var(--app-text-secondary)] italic py-8">No requests yet.</p>
        ` : html`
          <div className="space-y-3">
            ${requests.map(r => {
              const wf = workflows.find(w => w.id === r.workflow_id);
              const comp = companies.find(c => c.id === r.company_id);
              return html`
                <div key=${r.id} className="flex items-center justify-between p-4 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]">
                  <div>
                    <p className="font-bold text-[var(--app-text-primary)]">${wf?.name || r.workflow_id}</p>
                    <p className="text-xs text-[var(--app-text-secondary)]">${comp?.name || r.company_id} · ${formatDate(r.created_at)}</p>
                  </div>
                  ${statusBadge(r.status)}
                </div>
              `;
            })}
          </div>
        `}
      </div>
    </div>
  `;
};

export default RequestApplicationsView;
