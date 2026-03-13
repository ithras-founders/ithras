import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getPolicies, createPolicy, updatePolicy } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const GOVERNANCE_TYPES = [
  { value: 'UNIVERSAL', label: 'Universal' },
  { value: 'CLUSTER_COHORT', label: 'Cluster Cohort' },
  { value: 'DAY_PROCESS', label: 'Day Process' },
  { value: 'ROLLING', label: 'Rolling' }
];

const ProgramPolicyConfig = ({ program, institutionId, onPolicyUpdated }) => {
  const toast = useToast();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('UNIVERSAL');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const list = await getPolicies({ program_id: program.id });
        if (!cancelled) {
          setPolicies(list || []);
          const activeOrFirst = (list || []).find(p => p.status === 'ACTIVE') || (list || [])[0];
          if (activeOrFirst?.governance_type) {
            setSelectedType(activeOrFirst.governance_type);
          }
        }
      } catch {
        if (!cancelled) setPolicies([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [program.id]);

  const handleGovernanceTypeChange = async (e) => {
    const newType = e.target.value;
    setSaving(true);
    try {
      const existing = policies.find(p => p.program_id === program.id);
      if (existing) {
        await updatePolicy(existing.id, { governance_type: newType });
        toast.success(`Policy updated to ${GOVERNANCE_TYPES.find(t => t.value === newType)?.label || newType}`);
      } else {
        const policyId = `policy_${program.id}_${Date.now()}`;
        await createPolicy({
          id: policyId,
          institution_id: institutionId,
          program_id: program.id,
          governance_type: newType,
          status: 'DRAFT',
          levels: [],
          stages: [],
          global_caps: {},
          student_statuses: [],
          stage_restrictions: {}
        });
        toast.success(`Policy created with ${GOVERNANCE_TYPES.find(t => t.value === newType)?.label || newType}`);
      }
      setSelectedType(newType);
      onPolicyUpdated?.();
    } catch (error) {
      toast.error('Failed to update policy: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return html`<span className="text-xs text-[var(--app-text-muted)] italic">Loading...</span>`;
  }

  return html`
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Policy:</span>
      <select
        value=${selectedType}
        onChange=${handleGovernanceTypeChange}
        disabled=${saving}
        className="px-2 py-1 text-[10px] font-bold border border-[var(--app-border-soft)] rounded-lg bg-[var(--app-surface)] focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:opacity-50"
      >
        ${GOVERNANCE_TYPES.map(t => html`
          <option key=${t.value} value=${t.value}>${t.label}</option>
        `)}
      </select>
      ${saving && html`<span className="text-[10px] text-[var(--app-text-muted)]">Saving...</span>`}
    </div>
  `;
};

export default ProgramPolicyConfig;
