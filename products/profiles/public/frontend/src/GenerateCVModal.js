import React, { useState } from 'react';
import htm from 'htm';
import { FileDown, FileText, X } from 'lucide-react';
import { getApiBaseUrl, getCV } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { migrateCVData, exportToPDF } from '/core/frontend/src/modules/shared/cv/index.js';

const html = htm.bind(React.createElement);

const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Modal for generating CV: choose template or use a saved CV.
 * - Template section: pick a template and generate PDF
 * - Saved CVs: list of previously generated CVs; download if pdf_url, else generate
 */
const GenerateCVModal = ({
  isOpen,
  onClose,
  templates = [],
  savedCVs = [],
  cvRecord,
  cvData,
  user,
  onCVRefreshed,
}) => {
  const toast = useToast();
  const [exportingPdf, setExportingPdf] = useState(false);

  const cvList = (Array.isArray(savedCVs) ? savedCVs : savedCVs?.items ?? [])
    .filter(Boolean)
    .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

  const baseUrl = getApiBaseUrl().replace(/\/api$/, '');
  const resolvePdfUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url}`;
  };

  const handleGenerateWithTemplate = async (template) => {
    if (!template) return;
    setExportingPdf(true);
    try {
      const dataForExport = (cvRecord?.data ?? cvData?.data) || {};
      const filename = `${user?.name || 'CV'}-${template?.name || 'CV'}.pdf`.replace(/\s+/g, '-');
      await exportToPDF(template, dataForExport, user, filename);
      toast.success('PDF exported');
      onClose();
      onCVRefreshed?.();
    } catch (err) {
      toast.error('Failed to export PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSavedCVAction = async (cv, template) => {
    if (cv.pdf_url) {
      const url = resolvePdfUrl(cv.pdf_url);
      if (url) window.open(url, '_blank', 'noopener');
      onClose();
      return;
    }
    if (!template) return;
    setExportingPdf(true);
    try {
      const full = await getCV(cv.id).catch(() => cv);
      const rawData = full?.data && typeof full.data === 'object' ? { ...full.data } : {};
      const dataForExport = migrateCVData(rawData, template);
      const filename = `${user?.name || 'CV'}-${template?.name || 'CV'}.pdf`.replace(/\s+/g, '-');
      await exportToPDF(template, dataForExport, user, filename);
      toast.success('PDF exported');
      onClose();
      onCVRefreshed?.();
    } catch (err) {
      toast.error('Failed to export PDF: ' + (err?.message || 'Unknown error'));
    } finally {
      setExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  return html`
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick=${onClose}>
      <div
        className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-card)] w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick=${(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b border-[var(--app-border-soft)] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--app-text-primary)]">Generate CV</h2>
          <button
            onClick=${onClose}
            className="p-1.5 text-[var(--app-text-muted)] hover:bg-[var(--app-surface-muted)] rounded-[var(--app-radius-sm)]"
            title="Close"
          >
            <${X} className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          ${cvList.length > 0 ? html`
            <section>
              <h3 className="text-sm font-medium text-[var(--app-text-secondary)] mb-2">Saved CVs</h3>
              <div className="space-y-1.5">
                ${cvList.map((cv) => {
                  const tpl = templates.find((t) => t.id === cv.template_id);
                  const tplName = tpl?.name || 'Unknown template';
                  const hasPdf = !!cv.pdf_url;
                  return html`
                    <div
                      key=${cv.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] hover:bg-[var(--app-bg-elevated)] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--app-text-primary)] truncate">${tplName}</p>
                        <p className="text-xs text-[var(--app-text-muted)]">${formatDate(cv.updated_at || cv.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick=${() => handleSavedCVAction(cv, tpl)}
                        disabled=${exportingPdf || !tpl}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[var(--app-radius-sm)] bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ${hasPdf ? html`<${FileDown} className="w-4 h-4" />` : html`<${FileText} className="w-4 h-4" />`}
                        ${hasPdf ? 'Download' : 'Export PDF'}
                      </button>
                    </div>
                  `;
                })}
              </div>
            </section>
          ` : null}
          <section>
            <h3 className="text-sm font-medium text-[var(--app-text-secondary)] mb-2">
              ${cvList.length > 0 ? 'Or generate with a template' : 'Choose template'}
            </h3>
            ${templates.length === 0 ? html`
              <p className="text-sm text-[var(--app-text-muted)]">No templates available.</p>
            ` : html`
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                ${templates.map((tpl) => html`
                  <button
                    key=${tpl.id}
                    type="button"
                    onClick=${() => handleGenerateWithTemplate(tpl)}
                    disabled=${exportingPdf}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)] hover:bg-[var(--app-bg-elevated)] hover:border-[var(--app-accent)] transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[var(--app-accent-soft)] flex items-center justify-center flex-shrink-0">
                      <${FileText} className="w-5 h-5 text-[var(--app-accent)]" strokeWidth={1.5} />
                    </div>
                    <span className="text-sm font-medium text-[var(--app-text-primary)] truncate">${tpl.name || tpl.id || 'Template'}</span>
                  </button>
                `)}
              </div>
            `}
          </section>
        </div>
      </div>
    </div>
  `;
};

export default GenerateCVModal;
