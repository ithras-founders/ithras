import React, { useState, useEffect } from 'react';
import htm from 'htm';
import PolicyEditor from '../components/PolicyEditor.js';
import { getPolicyTemplates, getPolicies, getCycles, applyPolicyTemplate } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const GovernanceFlow = ({ user }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [showPolicyEditor, setShowPolicyEditor] = useState(false);
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    fetchData();
  }, [user?.institution_id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesData, policiesData, cyclesData] = await Promise.all([
        getPolicyTemplates(user.institution_id).catch(() => []),
        getPolicies({ institution_id: user.institution_id, is_template: false }).catch(() => []),
        getCycles().catch(() => [])
      ]);
      setTemplates(templatesData);
      setPolicies(policiesData);
      setCycles(cyclesData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyTemplate = async (templateId, cycleId) => {
    try {
      await applyPolicyTemplate(templateId, cycleId, null);
      toast.success('Policy template applied successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to apply template: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSaveTemplate = () => {
    setShowTemplateEditor(false);
    fetchData();
  };

  const handleSavePolicy = () => {
    setShowPolicyEditor(false);
    fetchData();
  };

  if (loading) {
    return html`<div className="p-20 text-center font-semibold text-[var(--app-text-muted)] text-3xl italic">Loading...</div>`;
  }

  const isPlacementAdmin = user.role === UserRole.PLACEMENT_ADMIN;

  return html`
    <div className="space-y-8 animate-in pb-20">
      <div data-tour-id="governance-flow-header" className="flex justify-end">
        ${isPlacementAdmin && html`
          <div className="flex gap-3">
            <button 
              onClick=${() => { setSelectedTemplate(null); setShowTemplateEditor(true); }}
              className="px-8 py-3 bg-purple-600 text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-colors"
            >
              + Create Template
            </button>
            <button 
              onClick=${() => { setSelectedCycle(null); setShowPolicyEditor(true); }}
              className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest shadow-xl hover:bg-[var(--app-accent-hover)] transition-colors"
            >
              + Create Policy
            </button>
          </div>
        `}
      </div>

      ${showTemplateEditor && html`
        <div className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <${PolicyEditor}
            policy=${selectedTemplate}
            institutionId=${user.institution_id}
            saveAsTemplate=${true}
            onSave=${handleSaveTemplate}
            onCancel=${() => { setShowTemplateEditor(false); setSelectedTemplate(null); }}
          />
        </div>
      `}

      ${showPolicyEditor && html`
        <div className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <${PolicyEditor}
            policy=${null}
            institutionId=${user.institution_id}
            cycleId=${selectedCycle}
            saveAsTemplate=${false}
            onSave=${handleSavePolicy}
            onCancel=${() => { setShowPolicyEditor(false); setSelectedCycle(null); }}
          />
        </div>
      `}

      <!-- Policy Templates Section -->
      <section className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]" data-tour-id="policy-templates">
        <h3 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6">Policy Templates</h3>
        <p className="text-sm text-[var(--app-text-secondary)] mb-6">Reusable governance templates that can be applied to any placement cycle</p>
        
        ${templates.length === 0 ? html`
          <div className="text-center py-10">
            <p className="text-[var(--app-text-muted)]">No templates found. Create your first template above.</p>
          </div>
        ` : html`
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            ${templates.map(template => html`
              <div key=${template.id} className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
                <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">${template.template_name || 'Unnamed Template'}</h4>
                <div className="space-y-2 mb-4">
                  ${template.levels && template.levels.length > 0 && html`
                    <p className="text-xs text-[var(--app-text-secondary)]">
                      <span className="font-bold">${template.levels.length}</span> company level${template.levels.length !== 1 ? 's' : ''}
                    </p>
                  `}
                  ${template.stages && template.stages.length > 0 && html`
                    <p className="text-xs text-[var(--app-text-secondary)]">
                      <span className="font-bold">${template.stages.length}</span> placement stage${template.stages.length !== 1 ? 's' : ''}
                    </p>
                  `}
                  ${template.student_statuses && template.student_statuses.length > 0 && html`
                    <p className="text-xs text-[var(--app-text-secondary)]">
                      <span className="font-bold">${template.student_statuses.length}</span> student status${template.student_statuses.length !== 1 ? 'es' : ''}
                    </p>
                  `}
                </div>
                ${isPlacementAdmin && html`
                  <div className="flex gap-2">
                    <button
                      onClick=${() => { setSelectedTemplate(template); setShowTemplateEditor(true); }}
                      className="flex-1 px-4 py-2 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-surface-muted)] transition-colors"
                    >
                      Edit
                    </button>
                    <select
                      onChange=${(e) => {
                        if (e.target.value) {
                          handleApplyTemplate(template.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-accent-hover)] transition-colors border-none"
                    >
                      <option value="">Apply to Cycle</option>
                      ${cycles.map(cycle => html`
                        <option key=${cycle.id} value=${cycle.id}>${cycle.name}</option>
                      `)}
                    </select>
                  </div>
                `}
              </div>
            `)}
          </div>
        `}
      </section>

      <!-- Active Policies Section -->
      <section className="bg-[var(--app-surface)] p-10 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
        <h3 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6">Active Policies</h3>
        <p className="text-sm text-[var(--app-text-secondary)] mb-6">Policies currently applied to placement cycles</p>
        
        ${policies.length === 0 ? html`
          <div className="text-center py-10">
            <p className="text-[var(--app-text-muted)]">No active policies. Apply a template to a cycle or create a new policy.</p>
          </div>
        ` : html`
          <div className="space-y-4">
            ${policies.map(policy => {
              const cycle = cycles.find(c => c.id === policy.cycle_id);
              return html`
                <div key=${policy.id} className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-lg font-semibold text-[var(--app-text-primary)]">${policy.template_name || 'Policy'}</h4>
                      ${cycle && html`<p className="text-sm text-[var(--app-text-secondary)] mt-1">Cycle: ${cycle.name}</p>`}
                      <span className=${`inline-block mt-2 px-3 py-1 rounded-lg text-[10px] font-semibold uppercase ${
                        policy.status === 'ACTIVE' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' :
                        policy.status === 'DRAFT' ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]' :
                        'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                      }`}>
                        ${policy.status}
                      </span>
                    </div>
                    ${isPlacementAdmin && html`
                      <button
                        onClick=${() => { setSelectedCycle(policy.cycle_id); setShowPolicyEditor(true); }}
                        className="px-4 py-2 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-surface-muted)] transition-colors"
                      >
                        Edit
                      </button>
                    `}
                  </div>
                </div>
              `;
            })}
          </div>
        `}
      </section>
    </div>
  `;
};

export default GovernanceFlow;
