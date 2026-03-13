import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import { createCV, updateCV } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { EntryTypeRenderer, migrateCVData } from '/core/frontend/src/modules/shared/cv/index.js';

const html = htm.bind(React.createElement);

const SectionEditModal = ({
  template,
  user,
  initialCV,
  sectionId,
  onClose,
  onSaved,
}) => {
  const toast = useToast();
  const [cvData, setCvData] = useState({});
  const [existingCV, setExistingCV] = useState(null);
  const [saving, setSaving] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const savedDataRef = useRef(null);

  useEffect(() => {
    const configSections = template?.config?.sections || [];
    const tpl = template;
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
  }, [initialCV?.id, initialCV, template?.id]);

  useEffect(() => {
    const current = JSON.stringify(cvData);
    setHasUnsaved(current !== savedDataRef.current);
  }, [cvData]);

  const updateSectionData = useCallback((sid, data) => {
    setCvData(prev => ({ ...prev, [sid]: data }));
  }, []);

  const setSectionIncluded = useCallback((sid, included) => {
    setCvData(prev => ({
      ...prev,
      _includedSections: { ...(prev._includedSections || {}), [sid]: included },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const tplId = template?.id;
      if (existingCV) {
        await updateCV(existingCV.id, { data: cvData, status: existingCV?.status || 'DRAFT' });
      } else {
        const created = await createCV({
          candidate_id: user.id,
          template_id: tplId,
          data: cvData,
          status: 'DRAFT'
        });
        setExistingCV(created);
      }
      savedDataRef.current = JSON.stringify(cvData);
      setHasUnsaved(false);
      toast.success('Saved');
      onSaved?.();
    } catch (err) {
      console.error('Save failed:', err);
      toast.error('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [cvData, existingCV, template?.id, user.id, onSaved, toast]);

  const handleDone = useCallback(async () => {
    if (hasUnsaved) await handleSave();
    onClose();
  }, [hasUnsaved, handleSave, onClose]);

  const section = (template?.config?.sections || []).find(s => s.id === sectionId);
  const includedSections = cvData._includedSections || {};
  const isIncluded = section?.optional ? (includedSections[sectionId] !== false) : true;

  if (!section) {
    return html`
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick=${onClose}>
        <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] p-4 max-w-md" onClick=${(e) => e.stopPropagation()}>
          <p className="text-[var(--app-text-muted)]">Section not found</p>
          <button onClick=${onClose} className="mt-2 px-3 py-1.5 text-sm border rounded-[var(--app-radius-sm)]">Close</button>
        </div>
      </div>
    `;
  }

  return html`
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick=${onClose}>
      <div
        className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-card)] w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick=${(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[var(--app-border-soft)] flex items-center justify-between bg-[var(--app-surface-muted)]">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-[var(--app-text-primary)]">${section.title}</h2>
            ${section.optional ? html`
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked=${isIncluded}
                  onChange=${(e) => setSectionIncluded(sectionId, e.target.checked)}
                  className="rounded border-[var(--app-border-soft)]"
                />
                <span className="text-xs text-[var(--app-text-muted)]">Include in CV</span>
              </label>
            ` : ''}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick=${handleSave}
              disabled=${saving || !hasUnsaved}
              className=${'px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] ' +
                (hasUnsaved ? 'bg-[var(--app-accent)] text-white' : 'bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)] cursor-not-allowed')}
            >
              ${saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick=${handleDone}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-[var(--app-accent)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-accent-hover)]"
            >
              Done
            </button>
            <button
              onClick=${onClose}
              className="p-1.5 text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)]"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4 pt-3">
          ${(section.entryTypes || []).map(entryType => html`
            <${EntryTypeRenderer}
              key=${entryType.id}
              entryType=${entryType}
              section=${section}
              sectionId=${sectionId}
              data=${cvData[sectionId] || {}}
              onChange=${(data) => updateSectionData(sectionId, data)}
            />
          `)}
        </div>
      </div>
    </div>
  `;
};

export default SectionEditModal;
