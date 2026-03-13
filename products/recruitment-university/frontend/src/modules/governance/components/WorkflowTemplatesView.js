import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getWorkflowTemplates,
  getWorkflowTemplate,
  createWorkflowTemplate,
  updateWorkflowTemplate,
  deleteWorkflowTemplate,
  addWorkflowTemplateStage,
  applyWorkflowTemplate,
  getCompanies,
  getInstitutions,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import Modal from '/core/frontend/src/modules/shared/primitives/Modal.js';

const html = htm.bind(React.createElement);

const DEFAULT_STAGES = [
  { stage_number: 1, name: 'Application', stage_type: 'APPLICATION', is_approval_required: true },
  { stage_number: 2, name: 'Shortlist', stage_type: 'SHORTLIST', is_approval_required: true },
  { stage_number: 3, name: 'Interview Round 1', stage_type: 'INTERVIEW', is_approval_required: true },
  { stage_number: 4, name: 'Interview Round 2', stage_type: 'INTERVIEW', is_approval_required: true },
  { stage_number: 5, name: 'Offer', stage_type: 'OFFER', is_approval_required: true },
];

const WorkflowTemplatesView = ({ user }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [applyModal, setApplyModal] = useState(null);

  const formDefaults = {
    name: '',
    description: '',
    template_type: 'PLACEMENT_CYCLE',
    stages: [...DEFAULT_STAGES],
  };
  const [formData, setFormData] = useState(formDefaults);

  const fetchTemplates = async () => {
    try {
      const data = await getWorkflowTemplates();
      setTemplates(data || []);
    } catch (e) {
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchCompaniesAndInstitutions = async () => {
    try {
      const [cRes, iRes] = await Promise.all([
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
      ]);
      setCompanies(cRes?.items ?? []);
      setInstitutions(iRes?.items ?? []);
    } catch (e) {
      toast.error('Failed to load data');
    }
  };

  const handleCreate = async () => {
    if (!formData.name?.trim()) {
      toast.error('Name is required');
      return;
    }
    try {
      await createWorkflowTemplate({
        name: formData.name.trim(),
        description: formData.description?.trim() || null,
        template_type: formData.template_type,
        stages: formData.stages,
      });
      toast.success('Template created');
      setShowForm(false);
      setFormData(formDefaults);
      fetchTemplates();
    } catch (e) {
      toast.error('Failed to create: ' + (e.message || 'Unknown error'));
    }
  };

  const handleDelete = async (t) => {
    if (!(await confirm({ message: `Delete template "${t.name}"?` }))) return;
    try {
      await deleteWorkflowTemplate(t.id);
      toast.success('Template deleted');
      fetchTemplates();
      if (detailId === t.id) setDetailId(null);
    } catch (e) {
      toast.error('Failed to delete');
    }
  };

  const openApplyModal = (t) => {
    setApplyModal(t);
    fetchCompaniesAndInstitutions();
  };

  const handleApply = async (institutionId, companyId, jobId, workflowName) => {
    if (!applyModal) return;
    try {
      await applyWorkflowTemplate(applyModal.id, {
        institution_id: institutionId,
        company_id: companyId,
        job_id: jobId || null,
        created_by: user.id,
        workflow_name: workflowName || applyModal.name,
      });
      toast.success('Placement cycle created from template');
      setApplyModal(null);
    } catch (e) {
      toast.error('Failed to apply: ' + (e.message || 'Unknown error'));
    }
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div className="flex justify-end items-center">
        <button
          onClick=${() => { setShowForm(true); setEditingId(null); setFormData(formDefaults); }}
          className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] text-[11px] font-semibold uppercase tracking-widest shadow-[var(--app-shadow-card)] hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          + Create Template
        </button>
      </div>

      ${showForm && html`
        <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)]">
          <h3 className="text-lg font-semibold mb-4">New Template</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Name</label>
              <input
                type="text"
                value=${formData.name}
                onChange=${e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[var(--app-border-soft)]"
                placeholder="e.g. Standard Interview Pipeline"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Description</label>
              <input
                type="text"
                value=${formData.description}
                onChange=${e => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[var(--app-border-soft)]"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase mb-1">Type</label>
              <select
                value=${formData.template_type}
                onChange=${e => setFormData({ ...formData, template_type: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[var(--app-border-soft)]"
              >
                <option value="PLACEMENT_CYCLE">Placement Cycle</option>
                <option value="GOVERNANCE">Governance</option>
              </select>
            </div>
            <p className="text-xs text-[var(--app-text-secondary)]">Default stages: Application → Shortlist → Interview 1 → Interview 2 → Offer</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button onClick=${handleCreate} className="px-6 py-2 bg-[var(--app-accent)] text-white rounded-lg text-sm font-bold">Create</button>
            <button onClick=${() => setShowForm(false)} className="px-6 py-2 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-lg text-sm font-bold">Cancel</button>
          </div>
        </div>
      `}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${templates.map(t => html`
          <div key=${t.id} className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
            <h4 className="font-semibold text-[var(--app-text-primary)] mb-1">${t.name}</h4>
            <p className="text-xs text-[var(--app-text-secondary)] uppercase font-bold mb-2">${t.template_type}</p>
            ${t.description && html`<p className="text-sm text-[var(--app-text-secondary)] mb-4">${t.description}</p>`}
            <div className="flex flex-wrap gap-2 mb-4">
              ${(t.stages || []).slice(0, 5).map(s => html`
                <span key=${s.id} className="px-2 py-1 bg-[var(--app-surface-muted)] rounded text-[10px] font-bold text-[var(--app-text-secondary)]">${s.name}</span>
              `)}
            </div>
            <div className="flex gap-2">
              <button
                onClick=${() => openApplyModal(t)}
                className="flex-1 px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg text-xs font-semibold uppercase"
              >
                Apply
              </button>
              <button onClick=${() => handleDelete(t)} className="px-4 py-2 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.06)] rounded-lg text-xs font-bold">Delete</button>
            </div>
          </div>
        `)}
      </div>

      ${templates.length === 0 && !showForm && html`
        <p className="text-center text-[var(--app-text-secondary)] italic py-12">No templates yet. Create one to get started.</p>
      `}

      ${applyModal ? html`
        <${Modal} open=${true} onClose=${() => setApplyModal(null)} title=${`Apply Template: ${applyModal.name}`} size="md">
          <${ApplyForm}
            institutions=${institutions}
            companies=${companies}
            template=${applyModal}
            user=${user}
            onApply=${handleApply}
            onCancel=${() => setApplyModal(null)}
          />
        </${Modal}>
      ` : null}
    </div>
  `;
};

const ApplyForm = ({ institutions, companies, template, user, onApply, onCancel }) => {
  const [instId, setInstId] = useState(user?.institution_id || '');
  const [companyId, setCompanyId] = useState('');
  const [jobId, setJobId] = useState('');
  const [workflowName, setWorkflowName] = useState(template?.name || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!instId || !companyId) return;
    onApply(instId, companyId, jobId || null, workflowName || template.name);
  };

  return html`
    <form onSubmit=${handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--app-text-secondary)] uppercase mb-1">Institution</label>
        <select value=${instId} onChange=${e => setInstId(e.target.value)} className="w-full px-4 py-2 rounded-lg border" required>
          <option value="">Select...</option>
          ${institutions.map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--app-text-secondary)] uppercase mb-1">Company</label>
        <select value=${companyId} onChange=${e => setCompanyId(e.target.value)} className="w-full px-4 py-2 rounded-lg border" required>
          <option value="">Select...</option>
          ${companies.map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-semibold text-[var(--app-text-secondary)] uppercase mb-1">Placement Cycle Name</label>
        <input
          type="text"
          value=${workflowName}
          onChange=${e => setWorkflowName(e.target.value)}
          className="w-full px-4 py-2 rounded-lg border"
          placeholder=${template?.name}
        />
      </div>
      <div className="flex gap-3 pt-4">
        <button type="submit" className="flex-1 px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg font-bold">Create Placement Cycle</button>
        <button type="button" onClick=${onCancel} className="px-4 py-2 bg-[var(--app-surface-muted)] rounded-lg font-bold">Cancel</button>
      </div>
    </form>
  `;
};

export default WorkflowTemplatesView;
