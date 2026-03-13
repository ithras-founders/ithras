import React, { useEffect, useMemo, useState } from 'react';
import htm from 'htm';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { getApiBaseUrl, saveCVPdf } from '/core/frontend/src/modules/shared/services/api.js';
import { DynamicCVPreview, exportToPDF, generatePDFBlob } from '/core/frontend/src/modules/shared/cv/index.js';

const html = htm.bind(React.createElement);

const CVGeneratorView = ({
  template,
  templates = [],
  user,
  cv,
  onBack,
  onPickTemplate,
  onOpenEditModal,
  onCVUpdated,
}) => {
  const toast = useToast();
  const [pdfFilename, setPdfFilename] = useState('');
  const [exporting, setExporting] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
  const [pdfBlob, setPdfBlob] = useState(null);
  const [preparingPreview, setPreparingPreview] = useState(false);
  const [savingPdf, setSavingPdf] = useState(false);
  const [sectionsState, setSectionsState] = useState(() => {
    const sections = template?.config?.sections || [];
    return sections.map((s, idx) => ({ ...s, _index: idx, _hidden: false }));
  });

  const cvData = useMemo(() => (cv?.data && typeof cv.data === 'object' ? cv.data : {}), [cv]);
  const canExport = !!cv;
  const baseUrl = getApiBaseUrl().replace(/\/api$/, '');

  useEffect(() => {
    const sections = template?.config?.sections || [];
    setSectionsState(sections.map((s, idx) => ({ ...s, _index: idx, _hidden: false })));
  }, [template?.id]);

  useEffect(() => {
    return () => {
      if (pdfPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(pdfPreviewUrl);
    };
  }, [pdfPreviewUrl]);

  const previewTemplate = useMemo(() => {
    const config = template?.config || {};
    const visibleSections = (sectionsState || [])
      .filter((s) => !s._hidden)
      .map(({ _index, _hidden, ...s }) => s);
    return {
      ...template,
      config: {
        ...config,
        sections: visibleSections,
      },
    };
  }, [template, sectionsState]);

  const reorderSection = (idx, dir) => {
    setSectionsState((prev) => {
      const nextIdx = idx + dir;
      if (nextIdx < 0 || nextIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[nextIdx]] = [next[nextIdx], next[idx]];
      return next;
    });
  };

  const toggleSection = (idx) => {
    setSectionsState((prev) => prev.map((s, i) => (i === idx ? { ...s, _hidden: !s._hidden } : s)));
  };

  const handleExportPDF = async () => {
    if (!canExport) {
      toast.error('No saved profile data found. Add profile details first.');
      return;
    }
    setExporting(true);
    try {
      await exportToPDF(previewTemplate, cvData, user, pdfFilename || null);
      toast.success('PDF exported');
    } catch (err) {
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handlePreparePreview = async () => {
    if (!canExport) {
      toast.error('No saved profile data found. Add profile details first.');
      return;
    }
    setPreparingPreview(true);
    try {
      const blob = await generatePDFBlob(previewTemplate, user, pdfFilename || null);
      if (pdfPreviewUrl?.startsWith('blob:')) URL.revokeObjectURL(pdfPreviewUrl);
      const url = URL.createObjectURL(blob);
      setPdfBlob(blob);
      setPdfPreviewUrl(url);
      setPdfPreviewOpen(true);
    } catch (err) {
      toast.error('Failed to prepare PDF preview');
    } finally {
      setPreparingPreview(false);
    }
  };

  const handleSavePdf = async () => {
    if (!cv?.id) {
      toast.error('Save your CV profile first to store PDF');
      return;
    }
    setSavingPdf(true);
    try {
      let blob = pdfBlob;
      if (!blob) {
        blob = await generatePDFBlob(previewTemplate, user, pdfFilename || null);
        setPdfBlob(blob);
      }
      const filename = (pdfFilename || `CV_${user?.name || user?.id || 'candidate'}`).replace(/\s+/g, '_') + '.pdf';
      const file = new File([blob], filename, { type: 'application/pdf' });
      const updated = await saveCVPdf(cv.id, file);
      onCVUpdated?.(updated);
      toast.success('PDF saved to your CV');
    } catch (err) {
      toast.error(err?.message || 'Failed to save PDF');
    } finally {
      setSavingPdf(false);
    }
  };

  return html`
    <div className="min-h-screen bg-[var(--app-surface-muted)]">
      <div className="bg-[var(--app-surface)] border-b border-[var(--app-border-soft)] sticky top-0 z-30 px-4 py-2">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick=${onBack}
              className="p-1.5 rounded-[var(--app-radius-sm)] hover:bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)] transition-colors"
              title="Back to Profile"
            >
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7"/>
              </svg>
            </button>
            <div>
              <h1 className="text-base font-bold text-[var(--app-text-primary)]">CV Generator</h1>
              <p className="text-xs text-[var(--app-text-muted)]">${template?.name || 'Template'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick=${handlePreparePreview}
              disabled=${!canExport || preparingPreview}
              className=${'px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] transition-colors '
                + (canExport && !preparingPreview
                  ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent-hover)] border border-[rgba(0,113,227,0.24)] hover:bg-[rgba(0,113,227,0.14)]'
                  : 'bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)] cursor-not-allowed')}
            >
              ${preparingPreview ? 'Preparing...' : 'Preview PDF'}
            </button>
            ${templates.length > 1 ? html`
              <button
                onClick=${onPickTemplate}
                className="px-3 py-1.5 text-sm font-medium bg-[var(--app-surface)] text-[var(--app-text-primary)] border border-[var(--app-border-strong)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-bg-elevated)] transition-colors"
              >
                Change Template
              </button>
            ` : ''}
            <button
              onClick=${() => onOpenEditModal?.()}
              className="px-3 py-1.5 text-sm font-medium bg-[var(--app-surface)] text-[var(--app-text-primary)] border border-[var(--app-border-strong)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-bg-elevated)] transition-colors"
              title="Edit bullets, buckets and entries"
            >
              Advanced Edit
            </button>
            <input
              type="text"
              placeholder="Filename (optional)"
              value=${pdfFilename}
              onChange=${(e) => setPdfFilename(e.target.value)}
              className="w-48 px-2.5 py-1.5 text-sm border border-[var(--app-border-strong)] rounded-[var(--app-radius-sm)]"
            />
            <button
              onClick=${handleExportPDF}
              disabled=${!canExport || exporting}
              className=${'px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] transition-colors '
                + (canExport && !exporting
                  ? 'bg-[var(--app-text-primary)] text-white hover:bg-[var(--app-text-secondary)]'
                  : 'bg-[var(--app-bg-elevated)] text-[var(--app-text-muted)] cursor-not-allowed')}
            >
              ${exporting ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-4 py-4">
        ${!canExport ? html`
          <div className="bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-[var(--app-radius-md)] p-8 text-center text-[var(--app-text-muted)]">
            Complete your profile sections first, then return to generate your CV PDF.
          </div>
        ` : html`
          <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-4">
            <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--app-text-muted)] mb-3">Section Layout</h3>
              <p className="text-xs text-[var(--app-text-secondary)] mb-3">
                Reorder/hide sections before generating. Use Advanced Edit for buckets and bullet points.
              </p>
              <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                ${sectionsState.map((section, idx) => html`
                  <div key=${section.id || idx} className="border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)] p-2 bg-[var(--app-bg-elevated)]">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className=${`text-sm font-medium truncate ${section._hidden ? 'line-through text-[var(--app-text-muted)]' : 'text-[var(--app-text-primary)]'}`}>
                          ${section.title || section.id || `Section ${idx + 1}`}
                        </p>
                        <p className="text-[11px] text-[var(--app-text-muted)]">${section._hidden ? 'Hidden from output' : 'Included in output'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick=${() => reorderSection(idx, -1)} disabled=${idx === 0} className="px-2 py-1 text-xs border border-[var(--app-border-soft)] rounded disabled:opacity-40">↑</button>
                        <button onClick=${() => reorderSection(idx, 1)} disabled=${idx === sectionsState.length - 1} className="px-2 py-1 text-xs border border-[var(--app-border-soft)] rounded disabled:opacity-40">↓</button>
                        <button onClick=${() => toggleSection(idx)} className="px-2 py-1 text-xs border border-[var(--app-border-soft)] rounded">
                          ${section._hidden ? 'Show' : 'Hide'}
                        </button>
                      </div>
                    </div>
                  </div>
                `)}
              </div>
            </div>

            <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-auto">
              <div className="px-3 py-2 border-b border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] text-xs font-medium text-[var(--app-text-secondary)] uppercase tracking-wide">
                Template Preview
              </div>
              <div className="overflow-auto max-h-[calc(100vh-150px)]" style=${{ transform: 'scale(0.7)', transformOrigin: 'top left', width: '142.9%' }}>
                <${DynamicCVPreview}
                  template=${previewTemplate}
                  cvData=${cvData}
                  user=${user}
                />
              </div>
            </div>
          </div>
        `}
      </div>

      ${pdfPreviewOpen ? html`
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4" onClick=${() => setPdfPreviewOpen(false)}>
          <div className="w-full max-w-6xl h-[88vh] bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] overflow-hidden flex flex-col" onClick=${(e) => e.stopPropagation()}>
            <div className="px-4 py-3 border-b border-[var(--app-border-soft)] flex items-center justify-between">
              <h3 className="font-semibold text-[var(--app-text-primary)]">PDF Preview</h3>
              <div className="flex items-center gap-2">
                <button onClick=${handleSavePdf} disabled=${savingPdf} className="px-3 py-1.5 text-sm font-medium text-white bg-[var(--app-accent)] rounded-[var(--app-radius-sm)] disabled:opacity-60">
                  ${savingPdf ? 'Saving...' : 'Save PDF'}
                </button>
                <a href=${pdfPreviewUrl || (cv?.pdf_url ? (cv.pdf_url.startsWith('http') ? cv.pdf_url : `${baseUrl}${cv.pdf_url}`) : '#')} download className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)]">Download</a>
                <button onClick=${() => setPdfPreviewOpen(false)} className="px-3 py-1.5 text-sm border border-[var(--app-border-soft)] rounded-[var(--app-radius-sm)]">Close</button>
              </div>
            </div>
            <div className="flex-1 bg-[var(--app-bg-elevated)]">
              <iframe title="CV PDF Preview" src=${pdfPreviewUrl} className="w-full h-full"></iframe>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default CVGeneratorView;
