import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import htm from 'htm';
import { getWorkflows, createWorkflow, updateWorkflow, getCompanies, getWorkflowStages, addWorkflowStage, deleteWorkflowStage } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog, useFetchWithTutorial } from '/core/frontend/src/modules/shared/index.js';
import Modal from '/core/frontend/src/modules/shared/primitives/Modal.js';

const html = htm.bind(React.createElement);

const WorkflowManager = ({ user }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const { data, loading, refetch } = useFetchWithTutorial({
    role: 'PLACEMENT_TEAM',
    getMockData: (mock) => ({ workflows: mock?.workflows || [], companies: mock?.companies || [] }),
    fetch: async () => {
      const [w, cRes] = await Promise.all([
        getWorkflows({ institution_id: user?.institution_id }),
        getCompanies({ limit: 500 }),
      ]);
      return { workflows: w || [], companies: cRes?.items ?? [] };
    },
    deps: [user?.institution_id],
    useDemoUser: false,
    enabled: !!user?.institution_id,
  });
  const workflows = data?.workflows ?? [];
  const companies = data?.companies ?? [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);

  const handleOpenApplications = async (workflow) => {
    try {
      await updateWorkflow(workflow.id, { status: 'ACTIVE' });
      toast.success(`Applications opened for ${workflow.name}`);
      refetch();
    } catch (e) {
      toast.error('Failed to open: ' + (e.message || 'Unknown error'));
    }
  };

  const handleCloseApplications = async (workflow) => {
    const ok = confirm ? await confirm({ message: `Close applications for ${workflow.name}? Students will no longer be able to apply.` }) : window.confirm(`Close applications for ${workflow.name}?`);
    if (!ok) return;
    try {
      await updateWorkflow(workflow.id, { status: 'COMPLETED' });
      toast.success(`Applications closed for ${workflow.name}`);
      refetch();
    } catch (e) {
      toast.error('Failed to close: ' + (e.message || 'Unknown error'));
    }
  };

  const handleCreateWorkflow = async (workflowData) => {
    try {
      // Create workflow first
      const workflow = await createWorkflow({
        company_id: workflowData.company_id,
        institution_id: user.institution_id,
        created_by: user.id,
        name: workflowData.name,
        description: workflowData.description,
        status: 'DRAFT'
      });
      
      // Then add stages
      for (let i = 0; i < workflowData.stages.length; i++) {
        await addWorkflowStage(workflow.id, {
          stage_number: i + 1,
          name: workflowData.stages[i].name,
          stage_type: workflowData.stages[i].stage_type,
          is_approval_required: true
        });
      }
      
      setShowCreateModal(false);
      refetch();
    } catch (error) {
      toast.error('Failed to create workflow: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div data-tour-id="workflow-manager-header" className="flex justify-end">
        <button
          onClick=${() => setShowCreateModal(true)}
          className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest shadow-xl hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          + Create Placement Cycle
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-tour-id="workflow-list">
        ${workflows.map(workflow => {
          const company = companies.find(c => c.id === workflow.company_id);
          return html`
            <div key=${workflow.id} className="bg-[var(--app-surface)] p-6 rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">${workflow.name}</h3>
              ${company && html`<p className="text-sm text-[var(--app-text-secondary)] mb-4">${company.name}</p>`}
              <div className="flex items-center gap-2 mb-4">
                <span className=${`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase ${
                  workflow.status === 'ACTIVE' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' :
                  workflow.status === 'COMPLETED' ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]' :
                  workflow.status === 'DRAFT' ? 'bg-amber-100 text-amber-700' :
                  'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                }`}>
                  ${workflow.status}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                ${workflow.status === 'DRAFT' && html`
                  <button onClick=${() => handleOpenApplications(workflow)} className="w-full px-4 py-2 bg-[var(--app-success)] text-white rounded-xl text-[10px] font-semibold uppercase hover:opacity-90">
                    Open Applications
                  </button>
                `}
                ${workflow.status === 'ACTIVE' && html`
                  <button onClick=${() => handleCloseApplications(workflow)} className="w-full px-4 py-2 bg-[var(--app-text-secondary)] text-white rounded-[var(--app-radius-sm)] text-[10px] font-semibold uppercase hover:opacity-90">
                    Close Applications
                  </button>
                `}
                <button
                  onClick=${() => setSelectedWorkflow(workflow)}
                  className="w-full px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-xl text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
                >
                  Manage Stages
                </button>
              </div>
            </div>
          `;
        })}
      </div>

      ${showCreateModal && html`
        <${CreateWorkflowModal}
          companies=${companies}
          onClose=${() => setShowCreateModal(false)}
          onCreate=${handleCreateWorkflow}
        />
      `}

      ${selectedWorkflow && html`
        <${WorkflowStagesModal}
          workflow=${selectedWorkflow}
          confirm=${confirm}
          toast=${toast}
          onClose=${() => setSelectedWorkflow(null)}
          onUpdate=${refetch}
        />
      `}
    </div>
  `;
};

const CreateWorkflowModal = ({ companies, onClose, onCreate }) => {
  const [formData, setFormData] = useState({
    company_id: '',
    name: '',
    description: '',
    stages: [{ name: 'Application', stage_type: 'APPLICATION' }]
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate(formData);
  };

  const addStage = () => {
    setFormData({
      ...formData,
      stages: [...formData.stages, { name: `Stage ${formData.stages.length + 1}`, stage_type: 'APPLICATION' }]
    });
  };

  const removeStage = (index) => {
    setFormData({
      ...formData,
      stages: formData.stages.filter((_, i) => i !== index)
    });
  };

  const updateStage = (index, field, value) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], [field]: value };
    setFormData({ ...formData, stages: newStages });
  };

  const modalContent = html`
    <${Modal} open=${true} onClose=${onClose} title="Create Placement Cycle" size="2xl">
        <form onSubmit=${handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Company</label>
            <select
              value=${formData.company_id}
              onChange=${(e) => setFormData({ ...formData, company_id: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              required
            >
              <option value="">Select Company</option>
              ${companies.map(company => html`<option key=${company.id} value=${company.id}>${company.name}</option>`)}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Placement Cycle Name</label>
            <input
              type="text"
              value=${formData.name}
              onChange=${(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              placeholder="e.g., Summer Internship 2025"
              required
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Description</label>
            <textarea
              value=${formData.description}
              onChange=${(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              rows="3"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest">Stages</label>
              <button
                type="button"
                onClick=${addStage}
                className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90"
              >
                + Add Stage
              </button>
            </div>
            <div className="space-y-3">
              ${formData.stages.map((stage, idx) => html`
                <div key=${idx} className="p-4 bg-[var(--app-surface-muted)] rounded-xl flex items-center gap-3">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      value=${stage.name}
                      onChange=${(e) => updateStage(idx, 'name', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-sm"
                      placeholder="Stage name"
                      required
                    />
                    <select
                      value=${stage.stage_type}
                      onChange=${(e) => updateStage(idx, 'stage_type', e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-sm"
                    >
                      <option value="APPLICATION">Application</option>
                      <option value="SHORTLIST">Shortlist</option>
                      <option value="INTERVIEW">Interview</option>
                      <option value="OFFER">Offer</option>
                    </select>
                  </div>
                  ${formData.stages.length > 1 && html`
                    <button
                      type="button"
                      onClick=${() => removeStage(idx)}
                      className="p-2 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.08)] rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  `}
                </div>
              `)}
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick=${onClose}
              className="flex-1 px-6 py-3 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-border-soft)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] transition-colors"
            >
              Create Placement Cycle
            </button>
          </div>
        </form>
    <//>
  `;

  return ReactDOM.createPortal(modalContent, document.body);
};

const WorkflowStagesModal = ({ workflow, confirm, toast, onClose, onUpdate }) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStages();
  }, [workflow.id]);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const data = await getWorkflowStages(workflow.id);
      setStages(data);
    } catch (error) {
      console.error('Failed to fetch stages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = async () => {
    try {
      await addWorkflowStage(workflow.id, {
        stage_number: stages.length + 1,
        name: `Stage ${stages.length + 1}`,
        stage_type: 'APPLICATION'
      });
      fetchStages();
    } catch (error) {
      toast.error('Failed to add stage: ' + (error.message || 'Unknown error'));
    }
  };

  const handleDeleteStage = async (stageId) => {
    const ok = confirm ? await confirm({ message: 'Are you sure you want to delete this stage?' }) : window.confirm('Are you sure you want to delete this stage?');
    if (!ok) return;
    try {
      await deleteWorkflowStage(workflow.id, stageId);
      fetchStages();
    } catch (error) {
      if (toast) toast.error('Failed to delete stage: ' + (error.message || 'Unknown error'));
    }
  };

  const modalContent = html`
    <${Modal} open=${true} onClose=${onClose} title=${`${workflow.name} - Stages`} size="2xl">
        ${loading ? html`
          <div className="p-8 text-center text-[var(--app-text-muted)]">Loading...</div>
        ` : html`
          <div className="space-y-3">
            ${stages.map(stage => html`
              <div key=${stage.id} className="p-4 bg-[var(--app-surface-muted)] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[var(--app-text-primary)]">${stage.stage_number}. ${stage.name}</p>
                  <p className="text-xs text-[var(--app-text-secondary)]">${stage.stage_type}</p>
                </div>
                <button
                  onClick=${() => handleDeleteStage(stage.id)}
                  className="p-2 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.08)] rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            `)}
            
            <button
              onClick=${handleAddStage}
              className="w-full p-4 border-2 border-dashed border-[var(--app-border-soft)] rounded-xl text-[var(--app-text-secondary)] hover:border-[var(--app-accent)] hover:text-[var(--app-accent)] transition-colors text-sm font-bold"
            >
              + Add Stage
            </button>
          </div>
        `}
    <//>
  `;

  return ReactDOM.createPortal(modalContent, document.body);
};

export default WorkflowManager;
