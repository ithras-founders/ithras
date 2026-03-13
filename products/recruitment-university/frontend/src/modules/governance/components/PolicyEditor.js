import React, { useState } from 'react';
import htm from 'htm';
import { createPolicy, updatePolicy } from '/core/frontend/src/modules/shared/services/api.js';
import { PolicyStatus, RestrictionLevel } from '/core/frontend/src/modules/shared/types.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const PolicyEditor = ({ policy, institutionId, cycleId, onSave, onCancel, saveAsTemplate = false }) => {
  const toast = useToast();
  // Map backend format (snake_case) to frontend format (camelCase)
  const policyData = policy ? {
    levels: policy.levels || [],
    stages: policy.stages || [],
    globalCaps: policy.global_caps || policy.globalCaps || { maxShortlists: 10, distribution: [5, 3, 2] },
    studentStatuses: policy.student_statuses || policy.studentStatuses || [{ name: 'Active', restrictions: {} }],
    stageRestrictions: policy.stage_restrictions || policy.stageRestrictions || {},
    status: policy.status || PolicyStatus.DRAFT,
    isTemplate: policy.is_template || false,
    templateName: policy.template_name || ''
  } : null;

  const [formData, setFormData] = useState({
    levels: policyData?.levels.length > 0 ? policyData.levels : [{ name: 'Tier 1', restrictions: [] }],
    stages: policyData?.stages.length > 0 ? policyData.stages : [{ id: 'S1', name: 'Stage 1', rules: '' }],
    globalCaps: policyData?.globalCaps || { maxShortlists: 10, distribution: [5, 3, 2] },
    studentStatuses: policyData?.studentStatuses.length > 0 ? policyData.studentStatuses : [{ name: 'Active', restrictions: {} }],
    stageRestrictions: policyData?.stageRestrictions || {}, // { stageId: { levelName: { offers: [], shortlists: [] } } }
    status: policyData?.status || PolicyStatus.DRAFT,
    isTemplate: saveAsTemplate || policyData?.isTemplate || false,
    templateName: policyData?.templateName || ''
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const handleAddLevel = () => {
    const levelNum = formData.levels.length + 1;
    setFormData({
      ...formData,
      levels: [...formData.levels, { name: `Tier ${levelNum}`, restrictions: [] }]
    });
  };

  const handleRemoveLevel = (index) => {
    if (formData.levels.length <= 1) {
      toast.error('At least one level is required');
      return;
    }
    const newLevels = formData.levels.filter((_, i) => i !== index);
    setFormData({ ...formData, levels: newLevels });
  };

  const handleLevelNameChange = (index, name) => {
    const newLevels = [...formData.levels];
    newLevels[index] = { ...newLevels[index], name };
    setFormData({ ...formData, levels: newLevels });
  };

  const handleAddStage = () => {
    const stageNum = formData.stages.length + 1;
    const newStage = { id: `S${stageNum}`, name: `Stage ${stageNum}`, rules: '' };
    const newStages = [...formData.stages, newStage];
    
    // Initialize restrictions for this stage
    const newStageRestrictions = { ...formData.stageRestrictions };
    newStageRestrictions[newStage.id] = {};
    formData.levels.forEach(level => {
      newStageRestrictions[newStage.id][level.name] = { offers: [], shortlists: [] };
    });
    
    setFormData({ ...formData, stages: newStages, stageRestrictions: newStageRestrictions });
  };

  const handleRemoveStage = (index) => {
    if (formData.stages.length <= 1) {
      toast.error('At least one stage is required');
      return;
    }
    const stageToRemove = formData.stages[index];
    const newStages = formData.stages.filter((_, i) => i !== index);
    const newStageRestrictions = { ...formData.stageRestrictions };
    delete newStageRestrictions[stageToRemove.id];
    
    setFormData({ ...formData, stages: newStages, stageRestrictions: newStageRestrictions });
  };

  const handleStageNameChange = (index, name) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], name };
    setFormData({ ...formData, stages: newStages });
  };

  const handleStageRulesChange = (index, rules) => {
    const newStages = [...formData.stages];
    newStages[index] = { ...newStages[index], rules };
    setFormData({ ...formData, stages: newStages });
  };

  const handleAddStudentStatus = () => {
    const newStatus = { name: `Status ${formData.studentStatuses.length + 1}`, restrictions: {} };
    setFormData({
      ...formData,
      studentStatuses: [...formData.studentStatuses, newStatus]
    });
  };

  const handleRemoveStudentStatus = (index) => {
    if (formData.studentStatuses.length <= 1) {
      toast.error('At least one student status is required');
      return;
    }
    const newStatuses = formData.studentStatuses.filter((_, i) => i !== index);
    setFormData({ ...formData, studentStatuses: newStatuses });
  };

  const handleStudentStatusNameChange = (index, name) => {
    const newStatuses = [...formData.studentStatuses];
    newStatuses[index] = { ...newStatuses[index], name };
    setFormData({ ...formData, studentStatuses: newStatuses });
  };

  const handleStageRestrictionChange = (stageId, levelName, restrictionType, value) => {
    const newStageRestrictions = { ...formData.stageRestrictions };
    if (!newStageRestrictions[stageId]) {
      newStageRestrictions[stageId] = {};
    }
    if (!newStageRestrictions[stageId][levelName]) {
      newStageRestrictions[stageId][levelName] = { offers: [], shortlists: [] };
    }
    
    // Parse comma-separated values or use array
    const restrictionArray = Array.isArray(value) ? value : 
      (value ? value.split(',').map(v => v.trim()).filter(v => v) : []);
    
    newStageRestrictions[stageId][levelName][restrictionType] = restrictionArray;
    setFormData({ ...formData, stageRestrictions: newStageRestrictions });
  };

  const handleStudentStatusRestrictionChange = (statusIndex, stageId, levelName, restrictionType, value) => {
    const newStatuses = [...formData.studentStatuses];
    const status = newStatuses[statusIndex];
    if (!status.restrictions[stageId]) {
      status.restrictions[stageId] = {};
    }
    if (!status.restrictions[stageId][levelName]) {
      status.restrictions[stageId][levelName] = { offers: [], shortlists: [] };
    }
    
    const restrictionArray = Array.isArray(value) ? value : 
      (value ? value.split(',').map(v => v.trim()).filter(v => v) : []);
    
    status.restrictions[stageId][levelName][restrictionType] = restrictionArray;
    setFormData({ ...formData, studentStatuses: newStatuses });
  };

  const handleGlobalCapsChange = (field, value) => {
    setFormData({
      ...formData,
      globalCaps: {
        ...formData.globalCaps,
        [field]: field === 'distribution' ? 
          (Array.isArray(value) ? value : value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))) :
          parseInt(value) || 0
      }
    });
  };

  const validate = () => {
    const newErrors = {};
    if (formData.levels.length === 0) {
      newErrors.levels = 'At least one level is required';
    }
    if (formData.stages.length === 0) {
      newErrors.stages = 'At least one stage is required';
    }
    if (!formData.globalCaps.maxShortlists || formData.globalCaps.maxShortlists <= 0) {
      newErrors.maxShortlists = 'Max shortlists must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const policyData = {
        id: policy?.id || `policy_${Date.now()}`,
        institution_id: institutionId,
        status: formData.isTemplate ? PolicyStatus.DRAFT : formData.status,
        is_template: formData.isTemplate,
        template_name: formData.isTemplate ? formData.templateName : null,
        cycle_id: formData.isTemplate ? null : (cycleId || null),
        levels: formData.levels,
        stages: formData.stages,
        global_caps: formData.globalCaps,
        student_statuses: formData.studentStatuses,
        stage_restrictions: formData.stageRestrictions
      };

      let savedPolicy;
      if (policy) {
        savedPolicy = await updatePolicy(policy.id, policyData);
      } else {
        savedPolicy = await createPolicy(policyData);
      }
      
      // If saving as DRAFT, refresh to get the updated policy
      if (policyData.status === PolicyStatus.DRAFT) {
        onSave();
      } else {
        // If activating, refresh to show active policy
        onSave();
      }
    } catch (error) {
      console.error('Failed to save policy:', error);
      toast.error('Failed to save policy: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return html`
    <form onSubmit=${handleSubmit} className="space-y-10">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-semibold text-[var(--app-text-primary)]">${formData.isTemplate ? 'Policy Template Editor' : 'Governance Policy Editor'}</h3>
        <div className="flex gap-3">
          <button
            type="button"
            onClick=${onCancel}
            className="px-6 py-2 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-border-soft)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled=${saving}
            className="px-8 py-2 bg-[var(--app-accent)] text-white rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-accent-hover)] disabled:opacity-50 transition-colors"
          >
            ${saving ? 'Saving...' : formData.isTemplate ? (policy ? 'Update Template' : 'Create Template') : (policy ? 'Update Policy' : 'Create Policy')}
          </button>
        </div>
      </div>

      <!-- Company Levels Section -->
      <section className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-[var(--app-text-primary)]">Company Classification Levels</h4>
          <button
            type="button"
            onClick=${handleAddLevel}
            className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
          >
            + Add Level
          </button>
        </div>
        <div className="space-y-4">
          ${formData.levels.map((level, index) => html`
            <div key=${index} className="flex items-center gap-4 p-4 bg-[var(--app-surface-muted)] rounded-2xl border border-[var(--app-border-soft)]">
              <input
                type="text"
                value=${level.name}
                onChange=${(e) => handleLevelNameChange(index, e.target.value)}
                className="flex-1 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] font-bold text-[var(--app-text-primary)]"
                placeholder="Level name (e.g., Tier 1, Premium)"
              />
              ${formData.levels.length > 1 ? html`
                <button
                  type="button"
                  onClick=${() => handleRemoveLevel(index)}
                  className="px-4 py-2 bg-[rgba(255,59,48,0.08)] text-[var(--app-danger)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
                >
                  Remove
                </button>
              ` : ''}
            </div>
          `)}
        </div>
        ${errors.levels && html`<p className="text-[var(--app-danger)] text-xs mt-2">${errors.levels}</p>`}
      </section>

      <!-- Placement Stages Section -->
      <section className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-[var(--app-text-primary)]">Placement Stages</h4>
          <button
            type="button"
            onClick=${handleAddStage}
            className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
          >
            + Add Stage
          </button>
        </div>
        <div className="space-y-4">
          ${formData.stages.map((stage, index) => html`
            <div key=${stage.id} className="p-6 bg-[var(--app-surface-muted)] rounded-2xl border border-[var(--app-border-soft)]">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 space-y-3">
                  <input
                    type="text"
                    value=${stage.name}
                    onChange=${(e) => handleStageNameChange(index, e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] font-semibold text-[var(--app-text-primary)]"
                    placeholder="Stage name (e.g., Application, Shortlist, Interview)"
                  />
                  <textarea
                    value=${stage.rules || ''}
                    onChange=${(e) => handleStageRulesChange(index, e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] text-sm text-[var(--app-text-secondary)]"
                    placeholder="Stage rules/description"
                    rows="2"
                  />
                </div>
                ${formData.stages.length > 1 ? html`
                  <button
                    type="button"
                    onClick=${() => handleRemoveStage(index)}
                    className="ml-4 px-4 py-2 bg-[rgba(255,59,48,0.08)] text-[var(--app-danger)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
                  >
                    Remove
                  </button>
                ` : ''}
              </div>
              
              <!-- Stage Restrictions per Level -->
              <div className="mt-4 space-y-3">
                <p className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Restrictions by Company Level</p>
                ${formData.levels.map(level => {
                  const restrictions = formData.stageRestrictions[stage.id]?.[level.name] || { offers: [], shortlists: [] };
                  return html`
                    <div key=${level.name} className="p-4 bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)]">
                      <p className="text-xs font-bold text-[var(--app-text-secondary)] mb-3">${level.name}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase mb-1">Offer Restrictions</label>
                          <input
                            type="text"
                            value=${restrictions.offers.join(', ')}
                            onChange=${(e) => handleStageRestrictionChange(stage.id, level.name, 'offers', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] text-xs"
                            placeholder="e.g., Max 1, No same-day"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase mb-1">Shortlist Restrictions</label>
                          <input
                            type="text"
                            value=${restrictions.shortlists.join(', ')}
                            onChange=${(e) => handleStageRestrictionChange(stage.id, level.name, 'shortlists', e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] text-xs"
                            placeholder="e.g., Max 2, Priority only"
                          />
                        </div>
                      </div>
                    </div>
                  `;
                })}
              </div>
            </div>
          `)}
        </div>
        ${errors.stages && html`<p className="text-[var(--app-danger)] text-xs mt-2">${errors.stages}</p>`}
      </section>

      <!-- Student Statuses Section -->
      <section className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-semibold text-[var(--app-text-primary)]">Student Statuses</h4>
          <button
            type="button"
            onClick=${handleAddStudentStatus}
            className="px-4 py-2 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
          >
            + Add Status
          </button>
        </div>
        <div className="space-y-6">
          ${formData.studentStatuses.map((status, statusIndex) => html`
            <div key=${statusIndex} className="p-6 bg-[var(--app-surface-muted)] rounded-2xl border border-[var(--app-border-soft)]">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value=${status.name}
                  onChange=${(e) => handleStudentStatusNameChange(statusIndex, e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)] font-bold text-[var(--app-text-primary)]"
                  placeholder="Status name (e.g., Active, Placed, On Hold)"
                />
                ${formData.studentStatuses.length > 1 ? html`
                  <button
                    type="button"
                    onClick=${() => handleRemoveStudentStatus(statusIndex)}
                    className="ml-4 px-4 py-2 bg-[rgba(255,59,48,0.08)] text-[var(--app-danger)] rounded-lg text-[10px] font-semibold uppercase hover:opacity-90 transition-colors"
                  >
                    Remove
                  </button>
                ` : ''}
              </div>
              
              <!-- Status-specific restrictions per stage and level -->
              <div className="mt-4 space-y-4">
                <p className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Status-Specific Restrictions</p>
                ${formData.stages.map(stage => html`
                  <div key=${stage.id} className="p-4 bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)]">
                    <p className="text-xs font-bold text-[var(--app-text-secondary)] mb-3">${stage.name}</p>
                    ${formData.levels.map(level => {
                      const restrictions = status.restrictions[stage.id]?.[level.name] || { offers: [], shortlists: [] };
                      return html`
                        <div key=${level.name} className="mb-3 p-3 bg-[var(--app-surface-muted)] rounded-lg">
                          <p className="text-[10px] font-bold text-[var(--app-text-secondary)] mb-2">${level.name}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-semibold text-[var(--app-text-muted)] uppercase mb-1">Offers</label>
                              <input
                                type="text"
                                value=${restrictions.offers.join(', ')}
                                onChange=${(e) => handleStudentStatusRestrictionChange(statusIndex, stage.id, level.name, 'offers', e.target.value)}
                                className="w-full px-2 py-1 rounded border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] text-xs"
                                placeholder="Restrictions"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-semibold text-[var(--app-text-muted)] uppercase mb-1">Shortlists</label>
                              <input
                                type="text"
                                value=${restrictions.shortlists.join(', ')}
                                onChange=${(e) => handleStudentStatusRestrictionChange(statusIndex, stage.id, level.name, 'shortlists', e.target.value)}
                                className="w-full px-2 py-1 rounded border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] text-xs"
                                placeholder="Restrictions"
                              />
                            </div>
                          </div>
                        </div>
                      `;
                    })}
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>
      </section>

      <!-- Template Options -->
      <section className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-sm">
        <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-6">Save Options</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="saveAsTemplate"
              checked=${formData.isTemplate}
              onChange=${(e) => setFormData({ ...formData, isTemplate: e.target.checked })}
              className="w-4 h-4 rounded border-[var(--app-border-soft)] text-[var(--app-accent)] focus:ring-[var(--app-accent)]"
            />
            <label htmlFor="saveAsTemplate" className="text-sm font-bold text-[var(--app-text-secondary)]">
              Save as reusable template
            </label>
          </div>
          ${formData.isTemplate && html`
            <div>
              <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
                Template Name
              </label>
              <input
                type="text"
                value=${formData.templateName}
                onChange=${(e) => setFormData({ ...formData, templateName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)]"
                placeholder="e.g., Standard Placement Policy 2025"
                required
              />
            </div>
          `}
          ${!formData.isTemplate && html`
            <div>
              <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
                Policy Status
              </label>
              <select
                value=${formData.status}
                onChange=${(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)]"
              >
                <option value=${PolicyStatus.DRAFT}>Draft</option>
                <option value=${PolicyStatus.ACTIVE}>Active</option>
                <option value=${PolicyStatus.PROPOSED}>Proposed</option>
              </select>
              <p className="text-xs text-[var(--app-text-muted)] mt-2">
                ${formData.status === PolicyStatus.ACTIVE ? 'This policy will be activated immediately' : 
                  formData.status === PolicyStatus.DRAFT ? 'Save as draft for later activation' : 
                  'Propose this policy for approval'}
              </p>
            </div>
          `}
        </div>
      </section>

      <!-- Global Caps Section -->
      <section className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-sm">
        <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-6">Global Enforcement Caps</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
              Max Shortlists
            </label>
            <input
              type="number"
              value=${formData.globalCaps.maxShortlists || 0}
              onChange=${(e) => handleGlobalCapsChange('maxShortlists', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)]"
              min="1"
              required
            />
            ${errors.maxShortlists && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.maxShortlists}</p>`}
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
              Distribution (comma-separated)
            </label>
            <input
              type="text"
              value=${formData.globalCaps.distribution?.join(', ') || ''}
              onChange=${(e) => handleGlobalCapsChange('distribution', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[var(--app-accent-soft)]"
              placeholder="e.g., 5, 3, 2"
            />
          </div>
        </div>
      </section>
    </form>
  `;
};

export default PolicyEditor;
