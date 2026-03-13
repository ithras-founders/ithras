import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import htm from 'htm';
import { getCVTemplate, createCV, updateCV, getCVVersions, restoreCVVersion } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import { DynamicCVPreview, EntryTypeRenderer, deriveEditableSections, migrateCVData } from '/core/frontend/src/modules/shared/cv/index.js';
import AutoVariables from '../components/AutoVariables.js';

const html = htm.bind(React.createElement);

const AUTOSAVE_MS = 30000;

const sectionCompleteness = (section, cvData) => {
  const sectionData = cvData[section.id] || {};
  const entries = sectionData.entries || [];
  if (entries.length === 0) return 0;
  let filled = 0, total = 0;
  (section.entryTypes || []).forEach(et => {
    (et.fields || []).forEach(f => {
      entries.forEach(entry => {
        total++;
        const v = entry[f.id];
        if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) filled++;
      });
    });
  });
  return total === 0 ? 0 : Math.round((filled / total) * 100);
};

const sectionHasData = (section, cvData) => {
  const sectionData = cvData[section.id] || {};
  const entries = sectionData.entries || [];
  if (entries.length === 0) return false;
  return entries.some(entry => {
    return Object.entries(entry).some(([k, v]) => {
      if (k.startsWith('_')) return false;
      if (v == null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    });
  });
};

const CVEditor = ({
  template,
  user,
  initialCV,
  onBack,
  onCVSaved,
  initialSectionId = null,
}) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [fullTemplate, setFullTemplate] = useState(template);
  const [cvData, setCvData] = useState(initialCV?.data || {});
  const [existingCV, setExistingCV] = useState(initialCV || null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [versions, setVersions] = useState([]);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const savedDataRef = useRef(null);

  useEffect(() => {
    if (!template?.id) {
      setFullTemplate(template);
      setTemplateLoading(false);
      return;
    }
    setTemplateLoading(true);
    getCVTemplate(template.id)
      .then((t) => setFullTemplate(t))
      .catch(() => setFullTemplate(template))
      .finally(() => setTemplateLoading(false));
  }, [template?.id]);

  useEffect(() => {
    const configSections = template?.config?.sections || [];
    const tpl = fullTemplate || template;
    if (initialCV) {
      setExistingCV(initialCV);
      const data = initialCV.data;
      let parsed = data != null && typeof data === 'object' ? { ...data } : {};
      if (!parsed._includedSections || Object.keys(parsed._includedSections).length === 0) {
        parsed._includedSections = {};
        configSections.forEach(s => { if (s.optional) parsed._includedSections[s.id] = true; });
      }
      parsed = migrateCVData(parsed, tpl);
      setCvData(parsed);
      savedDataRef.current = JSON.stringify(parsed);
    } else {
      setExistingCV(null);
      const defaultIncluded = {};
      configSections.forEach(s => { if (s.optional) defaultIncluded[s.id] = true; });
      setCvData({ _includedSections: defaultIncluded });
      savedDataRef.current = JSON.stringify({ _includedSections: defaultIncluded });
    }
  }, [initialCV?.id, initialCV, template?.id, fullTemplate?.id]);

  useEffect(() => {
    if (existingCV?.id) {
      getCVVersions(existingCV.id)
        .then((v) => setVersions(Array.isArray(v) ? v : []))
        .catch(() => setVersions([]));
    } else {
      setVersions([]);
    }
  }, [existingCV?.id]);

  useEffect(() => {
    if (!initialSectionId) return;
    setEditingSection(initialSectionId);
    setCollapsedSections(prev => ({ ...prev, [initialSectionId]: false }));
  }, [initialSectionId]);

  useEffect(() => {
    const current = JSON.stringify(cvData);
    setHasUnsaved(current !== savedDataRef.current);
  }, [cvData]);

  const handleSave = useCallback(async (silent = false) => {
    setSaving(true);
    try {
      const cvPayload = {
        candidate_id: user.id,
        template_id: fullTemplate?.id || template?.id,
        data: cvData,
        status: existingCV?.status || 'DRAFT'
      };
      if (existingCV) {
        await updateCV(existingCV.id, { data: cvData, status: existingCV?.status || 'DRAFT' });
      } else {
        const created = await createCV(cvPayload);
        setExistingCV(created);
        if (onCVSaved) onCVSaved();
      }
      savedDataRef.current = JSON.stringify(cvData);
      setHasUnsaved(false);
      setLastSaved(new Date());
      if (!silent) toast.success('Saved');
    } catch (err) {
      console.error('Save failed:', err);
      if (!silent) toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [cvData, existingCV, fullTemplate?.id, template?.id, user.id, onCVSaved]);

  useEffect(() => {
    if (!template || !user) return;
    const t = setTimeout(() => {
      if (hasUnsaved) handleSave(true);
    }, AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [cvData, hasUnsaved]);

  const updateSectionData = (sectionId, data) => {
    setCvData(prev => ({ ...prev, [sectionId]: data }));
  };

  const setSectionIncluded = (sectionId, included) => {
    setCvData(prev => ({
      ...prev,
      _includedSections: { ...(prev._includedSections || {}), [sectionId]: included },
    }));
  };

  const handleSummaryChange = (varName, value) => {
    setCvData(prev => ({ ...prev, [varName]: value }));
  };

  const handleSubmitForVerification = async () => {
    if (!(await confirm({ message: 'Submit this CV for verification? You can still edit it after submission.' }))) return;
    setSaving(true);
    try {
      const cvPayload = {
        candidate_id: user.id,
        template_id: fullTemplate?.id || template?.id,
        data: cvData,
        status: 'SUBMITTED'
      };
      if (existingCV) {
        await updateCV(existingCV.id, cvPayload);
        setExistingCV({ ...existingCV, status: 'SUBMITTED' });
      } else {
        const created = await createCV(cvPayload);
        setExistingCV(created);
        if (onCVSaved) onCVSaved();
      }
      savedDataRef.current = JSON.stringify(cvData);
      setHasUnsaved(false);
      toast.success('CV submitted for verification');
    } catch (err) {
      toast.error('Failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleRestore = async (versionId) => {
    if (!existingCV?.id) return;
    if (!(await confirm({ message: 'Restore this version? Your current edits will be replaced.' }))) return;
    setSaving(true);
    try {
      const restored = await restoreCVVersion(existingCV.id, versionId);
      const tpl = fullTemplate || template;
      const migrated = migrateCVData(restored.data || {}, tpl);
      setCvData(migrated);
      setExistingCV(restored);
      savedDataRef.current = JSON.stringify(migrated);
      setHasUnsaved(false);
      setLastSaved(new Date());
      setShowVersionPanel(false);
      const v = await getCVVersions(existingCV.id);
      setVersions(Array.isArray(v) ? v : []);
      toast.success('Version restored');
    } catch (err) {
      toast.error('Failed to restore: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const handleEditSection = (sectionId) => {
    setEditingSection(sectionId);
    setCollapsedSections(prev => ({ ...prev, [sectionId]: false }));
  };

  const handleDoneEditing = async () => {
    if (hasUnsaved) await handleSave(false);
    setEditingSection(null);
  };

  const sections = useMemo(() => deriveEditableSections(fullTemplate), [fullTemplate]);
  const hasEditableSections = sections.some(s => (s.entryTypes || []).some(et => (et.fields || []).length > 0));
  const templateForPreview = useMemo(() => {
    const t = fullTemplate || template;
    if (!t) return t;
    const config = t.config || {};
    const configSections = config.sections || [];
    const hasRichConfig = configSections.length > 0 &&
      configSections.some(s => (s.entryTypes || []).some(et => (et.fields || []).length > 0));
    if (sections.length > 0 && !hasRichConfig) {
      return { ...t, config: { ...config, sections, page: config.page || {}, fixedElements: config.fixedElements || {}, typography: config.typography || {} } };
    }
    return t;
  }, [fullTemplate, template, sections]);

  const overallProgress = useMemo(() => {
    if (sections.length === 0) return 0;
    const total = sections.reduce((sum, s) => sum + sectionCompleteness(s, cvData), 0);
    return Math.round(total / sections.length);
  }, [sections, cvData]);

  if (templateLoading) {
    return html`
      <div className="min-h-screen flex items-center justify-center bg-[var(--app-surface-muted)]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-[var(--app-text-secondary)]">Loading template...</p>
        </div>
      </div>
    `;
  }

  const statusBadge = existingCV?.status
    ? html`<span className=${'ml-2 text-xs px-2 py-0.5 rounded-full font-medium '
        + (existingCV.status === 'VERIFIED' ? 'bg-[rgba(5,150,105,0.14)] text-[var(--app-success)]' :
           existingCV.status === 'SUBMITTED' ? 'bg-[rgba(0,113,227,0.14)] text-[var(--app-accent-hover)]' :
           'bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)]')}>${existingCV.status}</span>`
    : '';

  const isProfileMode = editingSection === null;

  const renderProfileSectionCard = (section) => {
    const hasData = sectionHasData(section, cvData);
    const includedSections = cvData._includedSections || {};
    const isIncluded = section.optional ? (includedSections[section.id] !== false) : true;
    const pct = sectionCompleteness(section, cvData);

    if (section.optional && !isIncluded) {
      return html`
        <div key=${section.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden opacity-60">
          <div className="px-4 py-3 flex items-center justify-between bg-[var(--app-surface-muted)]">
            <h2 className="text-sm font-semibold text-[var(--app-text-muted)]">${section.title}</h2>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked=${false} onChange=${e => setSectionIncluded(section.id, e.target.checked)} className="rounded border-[var(--app-border-strong)]" />
              <span className="text-xs text-[var(--app-text-muted)]">Include</span>
            </label>
          </div>
        </div>
      `;
    }

    if (!hasData) {
      return html`
        <div key=${section.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-dashed border-[var(--app-border-strong)] overflow-hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-sm font-semibold text-[var(--app-text-primary)]">${section.title}</h2>
              ${section.optional ? html`
                <label onClick=${e => e.stopPropagation()} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked=${isIncluded} onChange=${e => setSectionIncluded(section.id, e.target.checked)} className="rounded border-[var(--app-border-strong)]" />
                  <span className="text-xs text-[var(--app-text-muted)]">Include</span>
                </label>
              ` : ''}
            </div>
            <button onClick=${() => handleEditSection(section.id)} className="px-3 py-1.5 text-xs font-medium text-[var(--app-accent)] bg-[var(--app-accent-soft)] rounded-[var(--app-radius-sm)] hover:bg-[rgba(0,113,227,0.14)] transition-colors">
              + Add
            </button>
          </div>
          <div className="px-4 pb-4 text-center text-[var(--app-text-muted)] text-sm py-6">
            No data added yet
          </div>
        </div>
      `;
    }

    const singleSectionData = { ...cvData, _renderSectionOnly: section.id };
    return html`
      <div key=${section.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden hover:shadow-[var(--app-shadow-subtle)] transition-shadow">
        <div className="px-4 py-2.5 flex items-center justify-between bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--app-text-primary)]">${section.title}</h2>
            ${section.optional ? html`
              <label onClick=${e => e.stopPropagation()} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked=${isIncluded} onChange=${e => setSectionIncluded(section.id, e.target.checked)} className="rounded border-[var(--app-border-strong)]" />
                <span className="text-xs text-[var(--app-text-muted)]">Include</span>
              </label>
            ` : ''}
            ${pct === 100 ? html`<svg width="14" height="14" fill="none" stroke="#16a34a" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>` : ''}
          </div>
          <button onClick=${() => handleEditSection(section.id)} className="px-3 py-1.5 text-xs font-medium text-[var(--app-text-secondary)] bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-bg-elevated)] transition-colors flex items-center gap-1">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
        </div>
        <div className="p-3 overflow-hidden" style=${{ maxHeight: '300px', overflowY: 'auto' }}>
          <div style=${{ transform: 'scale(0.85)', transformOrigin: 'top left', width: '117.6%' }}>
            <${DynamicCVPreview}
              template=${templateForPreview || fullTemplate || template}
              cvData=${cvData}
              user=${user}
              renderSectionOnly=${section.id}
            />
          </div>
        </div>
      </div>
    `;
  };

  const renderEditingSection = (section) => {
    const includedSections = cvData._includedSections || {};
    const isIncluded = section.optional ? (includedSections[section.id] !== false) : true;

    return html`
      <div key=${section.id} id=${'section-' + section.id} className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border-2 border-[rgba(0,113,227,0.35)] overflow-hidden shadow-[var(--app-shadow-card)]">
        <div className="px-4 py-3 flex items-center justify-between bg-[var(--app-accent-soft)] border-b border-[rgba(0,113,227,0.25)]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--app-accent-hover)]">${section.title}</h2>
            ${section.optional ? html`
              <label onClick=${e => e.stopPropagation()} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked=${isIncluded} onChange=${e => setSectionIncluded(section.id, e.target.checked)} className="rounded border-[rgba(0,113,227,0.35)]" />
                <span className="text-xs text-[var(--app-accent)]">Include</span>
              </label>
            ` : ''}
          </div>
          <button onClick=${handleDoneEditing} className="px-4 py-1.5 text-xs font-semibold text-white bg-[var(--app-accent)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-accent-hover)] transition-colors">
            Done
          </button>
        </div>
        <div className="px-4 pb-4 border-t border-[var(--app-border-soft)]">
          ${(section.entryTypes || []).map(entryType => html`
            <${EntryTypeRenderer}
              key=${entryType.id}
              entryType=${entryType}
              section=${section}
              sectionId=${section.id}
              data=${cvData[section.id] || {}}
              onChange=${(data) => updateSectionData(section.id, data)}
            />
          `)}
        </div>
      </div>
    `;
  };

  return html`
    <div className="min-h-screen bg-[var(--app-surface-muted)]">
      <div className="bg-[var(--app-surface)] border-b border-[var(--app-border-soft)] sticky top-0 z-30 px-4 py-2">
        <div className="flex items-center justify-between max-w-[1800px] mx-auto">
          <div className="flex items-center gap-3">
            <button onClick=${onBack} className="p-1.5 rounded-[var(--app-radius-sm)] hover:bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)] transition-colors" title="Back">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-[var(--app-text-primary)]">${fullTemplate?.name || 'My Profile'}${statusBadge}</h1>
              <div className="flex items-center gap-2 text-xs text-[var(--app-text-muted)]">
                ${hasUnsaved ? html`<span className="text-[rgb(146,64,14)] font-medium">Unsaved changes</span>` : ''}
                ${lastSaved ? html`<span>Saved ${lastSaved.toLocaleTimeString()}</span>` : ''}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-3 px-3 py-1 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)]">
              <div className="w-20 h-1.5 bg-[var(--app-bg-elevated)] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style=${{
                  width: `${overallProgress}%`,
                  backgroundColor: overallProgress === 100 ? '#16a34a' : overallProgress > 50 ? '#0071e3' : '#f59e0b',
                }}></div>
              </div>
              <span className="text-xs font-medium text-[var(--app-text-secondary)]">${overallProgress}%</span>
            </div>

            <button
              onClick=${() => handleSave(false)}
              disabled=${saving || !hasUnsaved}
              className=${'px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] transition-all '
                + (hasUnsaved ? 'bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] shadow-[var(--app-shadow-subtle)]' : 'bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)]')}
            >
              ${saving ? 'Saving...' : 'Save'}
            </button>

            <button
              onClick=${() => setShowPreview(!showPreview)}
              className=${'px-3 py-1.5 text-xs font-medium rounded-[var(--app-radius-sm)] transition-all flex items-center gap-1.5 '
                + (showPreview ? 'bg-[var(--app-accent)] text-white' : 'bg-[var(--app-bg-elevated)] text-[var(--app-text-secondary)] hover:bg-[var(--app-bg-elevated)]')}
              title=${showPreview ? 'Hide preview' : 'Show preview'}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              ${showPreview ? 'Hide Preview' : 'Preview'}
            </button>

            <button
              onClick=${handleSubmitForVerification}
              disabled=${saving}
              className="px-3 py-1.5 text-sm font-medium bg-[var(--app-success)] text-white rounded-[var(--app-radius-sm)] hover:opacity-90 transition-opacity"
            >
              Submit
            </button>

            ${existingCV?.id ? html`
              <button
                onClick=${() => setShowVersionPanel(!showVersionPanel)}
                className="px-3 py-1.5 text-sm font-medium bg-[var(--app-text-primary)] text-white rounded-[var(--app-radius-sm)] hover:bg-[var(--app-text-secondary)] transition-colors"
              >
                Versions ${versions.length > 0 ? `(${versions.length})` : ''}
              </button>
            ` : ''}
          </div>
        </div>
      </div>

      ${showVersionPanel && existingCV?.id ? html`
        <div className="bg-[var(--app-surface)] border-b border-[var(--app-border-soft)] px-4 py-3">
          <div className="max-w-[1800px] mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[var(--app-text-primary)]">Version history</h3>
              <button onClick=${() => setShowVersionPanel(false)} className="text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] text-sm">Close</button>
            </div>
            ${versions.length === 0 ? html`<p className="text-xs text-[var(--app-text-muted)]">No previous versions.</p>` : html`
              <div className="flex gap-2 overflow-x-auto pb-1">
                ${versions.map((v) => html`
                  <div key=${v.id} className="flex-shrink-0 px-3 py-2 border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] bg-[var(--app-surface-muted)] text-xs">
                    <div className="font-medium">v${v.version}</div>
                    <div className="text-[var(--app-text-muted)]">${v.created_at ? new Date(v.created_at).toLocaleDateString() : ''}</div>
                    <button onClick=${() => handleRestore(v.id)} disabled=${saving} className="mt-1 text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] font-medium">Restore</button>
                  </div>
                `)}
              </div>
            `}
          </div>
        </div>
      ` : ''}

      <div className="max-w-[1800px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          <div className=${'transition-all duration-300 ease-in-out ' + (showPreview ? 'flex-1 min-w-0' : 'flex-1')}>
            <div className="space-y-3">
              <${AutoVariables} user=${user} template=${fullTemplate || template} cvData=${cvData} onSummaryChange=${handleSummaryChange} />

              ${!hasEditableSections ? html`
                <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-8 text-center">
                  <p className="text-[var(--app-text-muted)]">No editable sections. Contact your placement team.</p>
                </div>
              ` : ''}

              ${isProfileMode ? html`
                <div className="space-y-3">
                  ${sections.map(section => renderProfileSectionCard(section))}
                </div>
              ` : html`
                <div className="space-y-3">
                  ${sections.map(section => {
                    if (section.id === editingSection) {
                      return renderEditingSection(section);
                    }
                    return renderProfileSectionCard(section);
                  })}
                </div>
              `}
            </div>
          </div>

          <div className=${'transition-all duration-300 ease-in-out overflow-hidden lg:block hidden '
            + (showPreview ? 'w-[45%] opacity-100' : 'w-0 opacity-0')}>
            ${showPreview ? html`
              <div className="lg:sticky lg:top-14 self-start">
                <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden">
                  <div className="px-3 py-2 border-b border-[var(--app-border-soft)] flex items-center justify-between bg-[var(--app-surface-muted)]">
                    <span className="text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wide">Live Preview</span>
                    <div className="flex items-center gap-2">
                      <button onClick=${() => setShowPreview(false)} className="text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)]">
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>
                  <div className="overflow-auto max-h-[calc(100vh-100px)]" style=${{ transform: 'scale(0.65)', transformOrigin: 'top left', width: '153.8%' }}>
                    <${DynamicCVPreview}
                      template=${templateForPreview || fullTemplate || template}
                      cvData=${cvData}
                      user=${user}
                    />
                  </div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
};

export default CVEditor;
