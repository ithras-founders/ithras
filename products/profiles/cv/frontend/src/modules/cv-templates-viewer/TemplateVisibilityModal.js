import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getTemplateVisibility,
  updateTemplateVisibility,
  getPrograms,
  getBatches,
} from '/core/frontend/src/modules/shared/services/api.js';

const html = htm.bind(React.createElement);

/** Multi-select for visibility fields. Empty = visible to all. */
const TemplateVisibilityModal = ({
  template,
  institutions,
  onClose,
  onSaved,
}) => {
  const [institutionIds, setInstitutionIds] = useState([]);
  const [programIds, setProgramIds] = useState([]);
  const [batchIds, setBatchIds] = useState([]);
  const [programOptions, setProgramOptions] = useState([]);
  const [batchOptions, setBatchOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!template?.id) return;
    getTemplateVisibility(template.id)
      .then((r) => {
        setInstitutionIds(Array.isArray(r?.institution_ids) ? r.institution_ids : []);
        setProgramIds(Array.isArray(r?.program_ids) ? r.program_ids : []);
        setBatchIds(Array.isArray(r?.batch_ids) ? r.batch_ids : []);
      })
      .catch(() => {
        setInstitutionIds([]);
        setProgramIds([]);
        setBatchIds([]);
      })
      .finally(() => setLoading(false));
  }, [template?.id]);

  useEffect(() => {
    if (!institutionIds.length) {
      setProgramOptions([]);
      return;
    }
    Promise.all(institutionIds.map((id) => getPrograms(id).catch(() => [])))
      .then((results) => {
        const merged = [];
        const seen = new Set();
        for (const arr of results) {
          const list = Array.isArray(arr) ? arr : arr?.programs || [];
          for (const p of list) {
            const id = p.id || p;
            if (!seen.has(id)) {
              seen.add(id);
              merged.push({ id, name: p.name || p.id || id });
            }
          }
        }
        setProgramOptions(merged);
      })
      .catch(() => setProgramOptions([]));
  }, [institutionIds]);

  useEffect(() => {
    if (!programIds.length) {
      setBatchOptions([]);
      return;
    }
    Promise.all(programIds.map((pid) => getBatches({ program_id: pid }).catch(() => [])))
      .then((results) => {
        const merged = [];
        const seen = new Set();
        for (const arr of results) {
          const list = Array.isArray(arr) ? arr : [];
          for (const b of list) {
            const id = b.id || b;
            if (!seen.has(id)) {
              seen.add(id);
              merged.push({ id, name: b.name || b.id || id });
            }
          }
        }
        setBatchOptions(merged);
      })
      .catch(() => setBatchOptions([]));
  }, [programIds]);

  const toggle = (setter, id) => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTemplateVisibility(template.id, {
        institution_ids: institutionIds,
        program_ids: programIds,
        batch_ids: batchIds,
      });
      onSaved?.({ institution_ids: institutionIds, program_ids: programIds, batch_ids: batchIds });
      onClose?.();
    } catch (err) {
      console.error('Failed to update template visibility', err);
    } finally {
      setSaving(false);
    }
  };

  if (!template) return null;

  return html`
    <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex items-center justify-center p-4">
      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] max-w-md w-full shadow-[var(--app-shadow-floating)]">
        <div className="p-4 border-b border-[var(--app-border-soft)] flex justify-between items-center">
          <h3 className="text-lg font-semibold">Visibility – ${template.name || template.id}</h3>
          <button
            onClick=${onClose}
            className="p-2 rounded hover:bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          ${loading
            ? html`<div className="text-center py-6 text-[var(--app-text-muted)]">Loading…</div>`
            : html`
                <p className="text-sm text-[var(--app-text-muted)]">Empty = visible to all.</p>
                <div>
                  <label className="block text-sm font-medium mb-2">Institutions</label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-auto border rounded p-2">
                    ${(institutions || []).map((i) => {
                      const id = i.id || i;
                      const checked = institutionIds.includes(id);
                      return html`
                        <label key=${id} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked=${checked}
                            onChange=${() => toggle(setInstitutionIds, id)}
                          />
                          <span className="text-sm">${i.name || id}</span>
                        </label>
                      `;
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Programs</label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-auto border rounded p-2">
                    ${programOptions.map((p) => {
                      const checked = programIds.includes(p.id);
                      return html`
                        <label key=${p.id} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked=${checked}
                            onChange=${() => toggle(setProgramIds, p.id)}
                          />
                          <span className="text-sm">${p.name}</span>
                        </label>
                      `;
                    })}
                    ${programOptions.length === 0 && institutionIds.length > 0
                      ? html`<span className="text-sm text-[var(--app-text-muted)]">Select institutions to load programs</span>`
                      : null}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Batches</label>
                  <div className="flex flex-wrap gap-2 max-h-28 overflow-auto border rounded p-2">
                    ${batchOptions.map((b) => {
                      const checked = batchIds.includes(b.id);
                      return html`
                        <label key=${b.id} className="flex items-center gap-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked=${checked}
                            onChange=${() => toggle(setBatchIds, b.id)}
                          />
                          <span className="text-sm">${b.name}</span>
                        </label>
                      `;
                    })}
                    ${batchOptions.length === 0 && programIds.length > 0
                      ? html`<span className="text-sm text-[var(--app-text-muted)]">Loading…</span>`
                      : null}
                  </div>
                </div>
              `}
        </div>
        <div className="p-4 border-t border-[var(--app-border-soft)] flex justify-end gap-2">
          <button
            onClick=${onClose}
            className="px-4 py-2 text-sm rounded-[var(--app-radius-sm)] bg-[var(--app-bg-elevated)] hover:bg-[var(--app-border-soft)]"
          >
            Cancel
          </button>
          <button
            onClick=${handleSave}
            disabled=${loading || saving}
            className="px-4 py-2 text-sm font-medium bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
          >
            ${saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  `;
};

export default TemplateVisibilityModal;
