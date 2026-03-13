import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getTemplateVisibility,
  updateTemplateVisibility,
  getInstitutions,
  getInstitutionStructure,
} from '/core/frontend/src/modules/shared/services/api.js';

const html = htm.bind(React.createElement);

/**
 * Full-page visibility settings with College → Program → Batch hierarchy.
 * Empty = visible to all. Full pick-and-choose at each level.
 */
const TemplateVisibilitySettingsPage = ({ template, onBack, onSaved }) => {
  const [institutionIds, setInstitutionIds] = useState(new Set());
  const [programIds, setProgramIds] = useState(new Set());
  const [batchIds, setBatchIds] = useState(new Set());
  const [institutions, setInstitutions] = useState([]);
  const [structure, setStructure] = useState({}); // institutionId -> { programs, batches_by_program }
  const [expandedInstitutions, setExpandedInstitutions] = useState(new Set());
  const [expandedPrograms, setExpandedPrograms] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingStructure, setLoadingStructure] = useState(new Set());
  const [instSearch, setInstSearch] = useState('');

  const toggleInstitution = (id) =>
    setExpandedInstitutions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleProgram = (id) =>
    setExpandedPrograms((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSet = (setter, id) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadStructure = useCallback(async (instId) => {
    setLoadingStructure((prev) => new Set(prev).add(instId));
    try {
      const s = await getInstitutionStructure(instId);
      setStructure((prev) => ({
        ...prev,
        [instId]: {
          programs: s?.programs ?? [],
          batches_by_program: s?.batches_by_program ?? {},
        },
      }));
    } catch (err) {
      console.error('Failed to load structure for', instId, err);
    } finally {
      setLoadingStructure((prev) => {
        const next = new Set(prev);
        next.delete(instId);
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (!template?.id) return;
    setLoading(true);
    getTemplateVisibility(template.id)
      .then((r) => {
        setInstitutionIds(new Set(Array.isArray(r?.institution_ids) ? r.institution_ids : []));
        setProgramIds(new Set(Array.isArray(r?.program_ids) ? r.program_ids : []));
        setBatchIds(new Set(Array.isArray(r?.batch_ids) ? r.batch_ids : []));
      })
      .catch(() => {
        setInstitutionIds(new Set());
        setProgramIds(new Set());
        setBatchIds(new Set());
      })
      .finally(() => setLoading(false));
  }, [template?.id]);

  useEffect(() => {
    getInstitutions({ limit: 500 })
      .then((r) => setInstitutions(r?.items ?? []))
      .catch(() => setInstitutions([]));
  }, []);

  useEffect(() => {
    expandedInstitutions.forEach((id) => loadStructure(id));
  }, [expandedInstitutions, loadStructure]);

  const allLoaded = institutions.length > 0;
  const loadingVis = !allLoaded;

  const handleVisibleToAll = () => {
    setInstitutionIds(new Set());
    setProgramIds(new Set());
    setBatchIds(new Set());
  };

  const isVisibleToAll =
    institutionIds.size === 0 && programIds.size === 0 && batchIds.size === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateTemplateVisibility(template.id, {
        institution_ids: [...institutionIds],
        program_ids: [...programIds],
        batch_ids: [...batchIds],
      });
      onSaved?.({
        institution_ids: [...institutionIds],
        program_ids: [...programIds],
        batch_ids: [...batchIds],
      });
      onBack?.();
    } catch (err) {
      console.error('Failed to update template visibility', err);
    } finally {
      setSaving(false);
    }
  };

  const clearInstitution = (instId) => {
    const s = structure[instId];
    setInstitutionIds((prev) => {
      const next = new Set(prev);
      next.delete(instId);
      return next;
    });
    if (s?.programs) {
      s.programs.forEach((p) =>
        setProgramIds((prev) => {
          const next = new Set(prev);
          next.delete(p.id);
          return next;
        })
      );
      Object.values(s.batches_by_program || {}).flat().forEach((b) =>
        setBatchIds((prev) => {
          const next = new Set(prev);
          next.delete(b.id);
          return next;
        })
      );
    }
  };

  if (!template) return null;

  return html`
    <div className="min-h-screen bg-[var(--app-bg)]">
      <header className="sticky top-0 z-10 border-b border-[var(--app-border-soft)] bg-[var(--app-surface)] px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick=${onBack}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] hover:text-[var(--app-text-primary)]"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back
            </button>
            <div className="h-6 w-px bg-[var(--app-border-soft)]" />
            <div>
              <h1 className="text-xl font-semibold text-[var(--app-text-primary)]">
                Visibility settings
              </h1>
              <p className="text-sm text-[var(--app-text-muted)] mt-0.5">
                ${template.name || template.id} • Control who can see this template
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick=${handleVisibleToAll}
              className=${`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                isVisibleToAll
                  ? 'border-[var(--app-accent)] bg-[var(--app-accent)]/10 text-[var(--app-accent)]'
                  : 'border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)]'
              }`}
            >
              Visible to all
            </button>
            <button
              onClick=${handleSave}
              disabled=${saving}
              className="px-5 py-2 text-sm font-medium bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
            >
              ${saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 p-4 rounded-xl bg-[var(--app-surface-muted)] border border-[var(--app-border-soft)]">
          <p className="text-sm text-[var(--app-text-secondary)]">
            <strong>Empty selection</strong> = visible to everyone. Select specific institutions, programs, or batches to restrict access.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--app-text-muted)]">
              Institutions & programs & batches
            </h2>
            ${institutions.length > 8 ? html`
              <input
                type="search"
                placeholder="Search institutions…"
                value=${instSearch}
                onChange=${(e) => setInstSearch(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-primary)] w-64"
              />
            ` : null}
          </div>

          ${loadingVis
            ? html`
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin" />
                  <span className="ml-3 text-[var(--app-text-muted)]">Loading institutions…</span>
                </div>
              `
            : institutions.length === 0
              ? html`
                  <div className="py-12 text-center text-[var(--app-text-muted)] rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)]">
                    No institutions found. Add institutions in system admin first.
                  </div>
                `
              : (() => {
                  const q = (instSearch || '').toLowerCase().trim();
                  const filtered = q
                    ? institutions.filter(
                        (i) =>
                          (i.name || '').toLowerCase().includes(q) ||
                          (i.id || '').toLowerCase().includes(q)
                      )
                    : institutions;
                  return filtered.map((inst) => {
                  const instId = inst.id || inst;
                  const instName = inst.name || instId;
                  const isExpanded = expandedInstitutions.has(instId);
                  const st = structure[instId];
                  const isLoadingStruct = loadingStructure.has(instId);
                  const programs = st?.programs ?? [];
                  const batchesByProgram = st?.batches_by_program ?? {};
                  const instSelected = institutionIds.has(instId);

                  return html`
                    <div
                      key=${instId}
                      className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] overflow-hidden"
                    >
                      <div
                        className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-[var(--app-surface-muted)] transition-colors"
                        onClick=${() => toggleInstitution(instId)}
                      >
                        <button
                          className="p-1 rounded text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]"
                          onClick=${(e) => {
                            e.stopPropagation();
                            toggleInstitution(instId);
                          }}
                        >
                          <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style=${{ transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                          >
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                        <label
                          className="flex-1 cursor-pointer flex items-center gap-3"
                          onClick=${(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked=${instSelected}
                            onChange=${() => {
                              if (instSelected) clearInstitution(instId);
                              else {
                                setInstitutionIds((prev) => new Set(prev).add(instId));
                                setExpandedInstitutions((p) => new Set(p).add(instId));
                                loadStructure(instId);
                              }
                            }}
                            className="w-5 h-5 rounded border-[var(--app-border-soft)] text-[var(--app-accent)]"
                          />
                          <span className="font-medium text-[var(--app-text-primary)]">${instName}</span>
                          ${instSelected ? html`
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--app-accent)]/15 text-[var(--app-accent)]">
                              Selected
                            </span>
                          ` : null}
                        </label>
                        ${isLoadingStruct
                          ? html`<span className="text-xs text-[var(--app-text-muted)]">Loading…</span>`
                          : null}
                      </div>

                      ${isExpanded &&
                        (st ? html`
                          <div className="border-t border-[var(--app-border-soft)] bg-[var(--app-bg)]">
                            <div className="px-5 py-3 pl-12 space-y-3">
                              ${programs.map((prog) => {
                                const progId = prog.id || prog;
                                const progName = prog.name || progId;
                                const progExpanded = expandedPrograms.has(progId);
                                const batches = batchesByProgram[progId] ?? [];
                                const progSelected = programIds.has(progId);

                                return html`
                                  <div key=${progId} className="rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface)] overflow-hidden">
                                    <div
                                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[var(--app-surface-muted)]"
                                      onClick=${() => toggleProgram(progId)}
                                    >
                                      <button
                                        className="p-1 rounded text-[var(--app-text-muted)] hover:text-[var(--app-text-primary)]"
                                        onClick=${(e) => {
                                          e.stopPropagation();
                                          toggleProgram(progId);
                                        }}
                                      >
                                        <svg
                                          width="18"
                                          height="18"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          style=${{ transform: progExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
                                        >
                                          <path d="M9 18l6-6-6-6" />
                                        </svg>
                                      </button>
                                      <label
                                        className="flex-1 cursor-pointer flex items-center gap-2"
                                        onClick=${(e) => e.stopPropagation()}
                                      >
                                        <input
                                          type="checkbox"
                                          checked=${progSelected}
                                          onChange=${() => toggleSet(setProgramIds, progId)}
                                          className="w-4 h-4 rounded border-[var(--app-border-soft)] text-[var(--app-accent)]"
                                        />
                                        <span className="text-sm font-medium text-[var(--app-text-primary)]">${progName}</span>
                                      </label>
                                    </div>
                                    ${progExpanded &&
                                      html`
                                        <div className="border-t border-[var(--app-border-soft)] px-4 py-3 pl-10 space-y-2">
                                          ${batches.length === 0
                                            ? html`<p className="text-xs text-[var(--app-text-muted)]">No batches</p>`
                                            : batches.map((batch) => {
                                                const batchId = batch.id || batch;
                                                const batchName = batch.name || batchId;
                                                const batchSelected = batchIds.has(batchId);
                                                return html`
                                                  <label
                                                    key=${batchId}
                                                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-[var(--app-surface-muted)] cursor-pointer"
                                                  >
                                                    <input
                                                      type="checkbox"
                                                      checked=${batchSelected}
                                                      onChange=${() => toggleSet(setBatchIds, batchId)}
                                                      className="w-4 h-4 rounded border-[var(--app-border-soft)] text-[var(--app-accent)]"
                                                    />
                                                    <span className="text-sm text-[var(--app-text-primary)]">${batchName}</span>
                                                  </label>
                                                `;
                                              })}
                                        </div>
                                      `}
                                  </div>
                                `;
                              })}
                              ${programs.length === 0 &&
                                html`<p className="text-sm text-[var(--app-text-muted)] py-2">No programs in this institution</p>`}
                            </div>
                          </div>
                        ` : html`
                          <div className="px-5 py-6 pl-12 border-t border-[var(--app-border-soft)]">
                            ${isLoadingStruct
                              ? html`
                                  <div className="flex items-center gap-3 text-[var(--app-text-muted)]">
                                    <div className="w-5 h-5 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin" />
                                    <span className="text-sm">Loading programs & batches…</span>
                                  </div>
                                `
                              : html`
                                  <button
                                    onClick=${() => loadStructure(instId)}
                                    className="text-sm font-medium text-[var(--app-accent)] hover:underline"
                                  >
                                    Load programs & batches
                                  </button>
                                `}
                          </div>
                        `)}
                    </div>
                  `;
                  });
                })()}
        </div>
      </main>
    </div>
  `;
};

export default TemplateVisibilitySettingsPage;
