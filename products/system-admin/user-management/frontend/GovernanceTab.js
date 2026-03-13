import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getPolicyTemplates,
  getPolicies,
  createPolicy,
  assignTemplateToInstitution,
} from '/core/frontend/src/modules/shared/services/api/governance.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const GovernanceTab = ({ institutions, programsByInstitution, isSystemAdmin, toast, confirm, onRefresh }) => {
  const [templates, setTemplates] = useState([]);
  const [institutionPolicies, setInstitutionPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [assigningFor, setAssigningFor] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    template_name: '',
    maxShortlists: 12,
    sectorDistribution: '6, 4, 2',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [tpls, policies] = await Promise.all([
        getPolicyTemplates().catch(() => []),
        getPolicies({ is_template: false }).catch(() => []),
      ]);
      setTemplates(Array.isArray(tpls) ? tpls : []);
      setInstitutionPolicies(Array.isArray(policies) ? policies : []);
    } catch (err) {
      toast.error('Failed to load governance data');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCreateTemplate = async () => {
    if (!newTemplate.template_name?.trim()) {
      toast.error('Template name is required');
      return;
    }
    const dist = (newTemplate.sectorDistribution || '6,4,2')
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    if (dist.length === 0) {
      toast.error('Sector distribution must be comma-separated numbers (e.g. 6, 4, 2)');
      return;
    }
    try {
      const id = `gov_tpl_${Date.now().toString(36)}`;
      await createPolicy({
        id,
        status: 'ACTIVE',
        is_template: true,
        template_name: newTemplate.template_name.trim(),
        governance_type: 'UNIVERSAL',
        global_caps: {
          maxShortlists: newTemplate.maxShortlists || 12,
          sectorDistribution: dist,
          distribution: dist,
          topDecileExempt: true,
        },
        levels: [],
        stages: [],
        student_statuses: [],
        stage_restrictions: {},
      });
      toast.success('Governance template created');
      setShowCreateForm(false);
      setNewTemplate({ template_name: '', maxShortlists: 12, sectorDistribution: '6, 4, 2' });
      loadData();
      onRefresh?.();
    } catch (e) {
      toast.error('Failed to create template: ' + (e.message || ''));
    }
  };

  const handleAssign = async (templateId, institutionId, programId = null, name = null) => {
    try {
      await assignTemplateToInstitution(templateId, {
        institution_id: institutionId,
        program_id: programId,
        name: name || null,
      });
      toast.success('Template assigned to institution');
      setAssigningFor(null);
      loadData();
      onRefresh?.();
    } catch (e) {
      toast.error('Failed to assign: ' + (e.message || ''));
    }
  };

  const getInstName = (id) => institutions?.find((i) => i.id === id)?.name || id || '-';

  if (loading) {
    return html`
      <div className="space-y-6">
        <div className="h-10 bg-[var(--app-surface-muted)] rounded-2xl w-64 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${[1, 2, 3].map((i) => html`<div key=${i} className="h-32 bg-[var(--app-surface-muted)] rounded-2xl animate-pulse" />`)}
        </div>
      </div>
    `;
  }

  if (showCreateForm) {
    return html`
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button onClick=${() => setShowCreateForm(false)} className="p-2 hover:bg-[var(--app-surface-muted)] rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-bold text-[var(--app-text-primary)]">Create Governance Template</h2>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-2xl border border-[var(--app-border-soft)] space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--app-text-secondary)] mb-1">Template Name *</label>
            <input
              type="text"
              value=${newTemplate.template_name}
              onChange=${(e) => setNewTemplate((t) => ({ ...t, template_name: e.target.value }))}
              placeholder="e.g. Standard Placement Rules"
              className="w-full px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--app-text-secondary)] mb-1">Max Shortlists</label>
            <input
              type="number"
              value=${newTemplate.maxShortlists}
              onChange=${(e) => setNewTemplate((t) => ({ ...t, maxShortlists: parseInt(e.target.value, 10) || 12 }))}
              min="1"
              className="w-full px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--app-text-secondary)] mb-1">Sector Distribution (comma-separated)</label>
            <input
              type="text"
              value=${newTemplate.sectorDistribution}
              onChange=${(e) => setNewTemplate((t) => ({ ...t, sectorDistribution: e.target.value }))}
              placeholder="e.g. 6, 4, 2"
              className="w-full px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm"
            />
            <p className="text-xs text-[var(--app-text-muted)] mt-1">Limits per sector (primary, secondary, tertiary). E.g. 6, 4, 2 means max 6 in top sector, 4 in second, 2 in third.</p>
          </div>
          <div className="flex gap-2">
            <button onClick=${handleCreateTemplate} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
              Create Template
            </button>
            <button onClick=${() => setShowCreateForm(false)} className="px-5 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm font-bold">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;
  }

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--app-text-secondary)]">${templates.length} governance template${templates.length !== 1 ? 's' : ''}</p>
        ${isSystemAdmin ? html`
          <button
            onClick=${() => setShowCreateForm(true)}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
          >
            + Create Template
          </button>
        ` : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${templates.length === 0 ? html`
          <div className="col-span-full bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">
            No governance templates yet. ${isSystemAdmin ? 'Create one to define shortlist caps and sector distribution rules for institutions.' : ''}
          </div>
        ` : templates.map((tpl) => {
          const caps = tpl.global_caps || {};
          const dist = caps.sectorDistribution || caps.distribution || [];
          const distStr = Array.isArray(dist) ? dist.join(', ') : '';
          return html`
            <div key=${tpl.id} className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6">
              <h4 className="text-lg font-semibold text-[var(--app-text-primary)]">${tpl.template_name || tpl.id}</h4>
              <div className="mt-3 space-y-1 text-sm text-[var(--app-text-secondary)]">
                <p>Max shortlists: <strong>${caps.maxShortlists ?? 12}</strong></p>
                <p>Sector distribution: <strong>${distStr || 'Not set'}</strong></p>
              </div>
              ${isSystemAdmin ? html`
                <div className="mt-4">
                  ${assigningFor === tpl.id ? html`
                    <div className="space-y-2 p-3 bg-[var(--app-surface-muted)] rounded-xl">
                      <label className="block text-xs font-bold">Assign to institution</label>
                      <select
                        id="assign-inst"
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">Select institution...</option>
                        ${(institutions || []).map((i) => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
                      </select>
                      <div className="flex gap-2">
                        <button
                          onClick=${() => {
                            const sel = document.getElementById('assign-inst');
                            const instId = sel?.value;
                            if (instId) handleAssign(tpl.id, instId, null, null);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                        >
                          Assign
                        </button>
                        <button onClick=${() => setAssigningFor(null)} className="px-3 py-1.5 border rounded-lg text-xs font-bold">
                          Cancel
                        </button>
                      </div>
                    </div>
                  ` : html`
                    <button
                      onClick=${() => setAssigningFor(tpl.id)}
                      className="px-4 py-2 border border-indigo-200 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-50"
                    >
                      Map to Institution
                    </button>
                  `}
                </div>
              ` : null}
            </div>
          `;
        })}
      </div>

      ${institutionPolicies.length > 0 ? html`
        <div className="mt-8">
          <h3 className="text-sm font-bold text-[var(--app-text-secondary)] uppercase tracking-wider mb-3">Institution Assignments</h3>
          <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--app-border-soft)]">
                  <th className="text-left p-3 font-bold">Institution</th>
                  <th className="text-left p-3 font-bold">Template</th>
                  <th className="text-left p-3 font-bold">Max Shortlists</th>
                  <th className="text-left p-3 font-bold">Sector Distribution</th>
                </tr>
              </thead>
              <tbody>
                ${institutionPolicies.map((p) => {
                  const caps = p.global_caps || {};
                  const dist = caps.sectorDistribution || caps.distribution || [];
                  const tpl = templates.find((t) => t.id === p.id) || { template_name: p.template_name || '-' };
                  return html`
                    <tr key=${p.id} className="border-b border-[var(--app-border-soft)] last:border-0">
                      <td className="p-3">${getInstName(p.institution_id)}</td>
                      <td className="p-3">${p.template_name || tpl.template_name || '-'}</td>
                      <td className="p-3">${caps.maxShortlists ?? '-'}</td>
                      <td className="p-3">${Array.isArray(dist) ? dist.join(', ') : '-'}</td>
                    </tr>
                  `;
                })}
              </tbody>
            </table>
          </div>
        </div>
      ` : null}
    </div>
  `;
};

export default GovernanceTab;
