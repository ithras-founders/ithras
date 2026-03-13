import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getActiveTemplate, getCVs, createCV, updateCV } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import { DynamicCVPreview, EntryTypeRenderer, exportToPDF, migrateCVData } from '/core/frontend/src/modules/shared/cv/index.js';
import AutoVariables from '../components/AutoVariables.js';
import BasicDetailsModal from '../components/BasicDetailsModal.js';

const html = htm.bind(React.createElement);

const DynamicCVBuilder = ({ user }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [template, setTemplate] = useState(null);
  const [cvData, setCvData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [existingCV, setExistingCV] = useState(null);
  const [allCVs, setAllCVs] = useState([]);
  const [pdfFilename, setPdfFilename] = useState('');
  const [showBasicDetailsModal, setShowBasicDetailsModal] = useState(false);
  const [pendingNewCV, setPendingNewCV] = useState(false);

  useEffect(() => {
    loadTemplateAndCV();
  }, [user]);

  const loadTemplateAndCV = async () => {
    try {
      setLoading(true);
      const activeTemplate = await getActiveTemplate(
        user.institution_id,
        user.program_id || null,
        user.department || null,
        user.batch_id || null
      );
      
      if (!activeTemplate) {
        toast.error('No active template found for your institution/program');
        return;
      }

      setTemplate(activeTemplate);

      try {
        const cvs = await getCVs({ candidate_id: user.id, template_id: activeTemplate.id });
        setAllCVs(cvs || []);
        if (cvs && cvs.length > 0) {
          setExistingCV(cvs[0]);
          const raw = cvs[0].data || {};
          setCvData(migrateCVData(raw, activeTemplate));
        } else {
          setExistingCV(null);
          setCvData({});
        }
      } catch (error) {
        setAllCVs([]);
        setExistingCV(null);
        setCvData({});
      }
    } catch (error) {
      console.error('Failed to load template:', error);
      toast.error('Failed to load template: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const cvPayload = {
        candidate_id: user.id,
        template_id: template.id,
        data: cvData,
        status: 'DRAFT'
      };

      if (existingCV) {
        await updateCV(existingCV.id, cvPayload);
      } else {
        await createCV(cvPayload);
      }

      toast.success('CV saved successfully');
      const cvs = await getCVs({ candidate_id: user.id, template_id: template.id });
      setAllCVs(cvs || []);
      const updated = existingCV ? cvs?.find(c => c.id === existingCV.id) : cvs?.[cvs.length - 1];
      if (updated) {
        setExistingCV(updated);
        setCvData(updated.data || {});
      }
    } catch (error) {
      console.error('Failed to save CV:', error);
      toast.error('Failed to save CV: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if (!(await confirm({ message: 'Submit this CV for verification? It will be sent to the placement team for review.' }))) {
      return;
    }

    setSaving(true);
    try {
      const cvPayload = {
        candidate_id: user.id,
        template_id: template.id,
        data: cvData,
        status: 'SUBMITTED'
      };

      if (existingCV) {
        await updateCV(existingCV.id, cvPayload);
      } else {
        await createCV(cvPayload);
      }

      toast.success('CV submitted for verification successfully');
      const cvs = await getCVs({ candidate_id: user.id, template_id: template.id });
      setAllCVs(cvs || []);
      const updated = existingCV ? cvs?.find(c => c.id === existingCV.id) : cvs?.[cvs.length - 1];
      if (updated) {
        setExistingCV(updated);
        setCvData(updated.data || {});
      }
    } catch (error) {
      console.error('Failed to finalize CV:', error);
      toast.error('Failed to finalize CV: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      await exportToPDF(template, cvData, user, pdfFilename || null);
      toast.success('PDF exported successfully');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to export PDF: ' + (error.message || 'Unknown error'));
    }
  };

  const updateSectionData = (sectionId, data) => {
    setCvData({
      ...cvData,
      [sectionId]: data
    });
  };

  if (loading) {
    return html`<div className="p-8 text-center">Loading template...</div>`;
  }

  if (!template) {
    return html`<div className="p-8 text-center">No active template found</div>`;
  }

  const config = template.config || {};
  const sections = config.sections || [];

  const selectCV = (cv) => {
    if (!cv) {
      setPendingNewCV(true);
      setShowBasicDetailsModal(true);
    } else {
      setExistingCV(cv);
      setCvData(cv.data || {});
    }
  };

  const handleBasicDetailsConfirm = (values) => {
    setShowBasicDetailsModal(false);
    if (pendingNewCV) {
      setPendingNewCV(false);
      setExistingCV(null);
      setCvData({ display_name: values.displayName || '' });
    } else {
      setCvData(prev => ({ ...prev, display_name: values.displayName || '' }));
    }
  };

  const formatCVLabel = (cv) => {
    const d = cv.created_at ? new Date(cv.created_at).toLocaleDateString() : '';
    return cv.data?.display_name || `CV ${d || cv.id?.slice(-6) || ''}`;
  };

  const btnBase = 'px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200';
  const btnPrimary = `${btnBase} bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] shadow-[var(--app-shadow-subtle)] hover:shadow`;
  const btnSecondary = `${btnBase} bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] hover:bg-[var(--app-border-soft)]`;
  const btnSuccess = `${btnBase} bg-emerald-600 text-white hover:bg-emerald-700 shadow-[var(--app-shadow-subtle)]`;
  const btnGhost = `${btnBase} bg-transparent text-[var(--app-text-secondary)] hover:bg-[var(--app-surface-muted)] border border-[var(--app-border-soft)]`;

  return html`
    <div className="p-6 w-full max-w-none">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick=${() => {
              setPendingNewCV(false);
              setShowBasicDetailsModal(true);
            }}
            className="px-3 py-2 text-sm border border-[var(--app-border-soft)] text-[var(--app-text-secondary)] rounded-xl hover:bg-[var(--app-surface-muted)]"
          >
            Edit basic details
          </button>
          ${allCVs.length > 0 || existingCV ? html`
            <select
              value=${existingCV?.id || '_new'}
              onChange=${e => {
                const v = e.target.value;
                if (v === '_new') selectCV(null);
                else selectCV(allCVs.find(c => c.id === v));
              }}
              className="px-4 py-2.5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 transition-shadow"
            >
              <option value="_new">+ New CV</option>
              ${allCVs.map(cv => html`
                <option key=${cv.id} value=${cv.id}>
                  ${formatCVLabel(cv)} (${cv.status})
                </option>
              `)}
            </select>
          ` : ''}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick=${() => setShowPreview(!showPreview)} className=${btnGhost}>
            ${showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <input
            type="text"
            placeholder="PDF filename (optional)"
            value=${pdfFilename}
            onChange=${e => setPdfFilename(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-[var(--app-border-soft)] w-40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button onClick=${handleExportPDF} className=${btnSecondary}>
            Export PDF
          </button>
          <button
            onClick=${handleSave}
            disabled=${saving}
            className=${`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ${saving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick=${handleSubmitForVerification}
            disabled=${saving}
            className=${`${btnSuccess} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Submit for Verification
          </button>
        </div>
      </div>

      <div className="grid grid-cols-${showPreview ? '1 lg:grid-cols-2' : '1'} gap-8">
        <div className="space-y-6">
          <${AutoVariables} user=${user} template=${template} />
          
          ${sections.map((section) => html`
            <div key=${section.id} className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-6">
              <h2 className="text-lg font-semibold text-[var(--app-text-primary)] mb-4">
                ${section.title}
                ${section.mandatory ? html`<span className="text-[var(--app-danger)] ml-1">*</span>` : ''}
              </h2>
              
              ${section.entryTypes.map(entryType => html`
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
          `)}
        </div>

        ${showPreview ? html`
          <div className="lg:sticky lg:top-6 self-start">
            <${DynamicCVPreview}
              template=${template}
              cvData=${cvData}
              user=${user}
            />
          </div>
        ` : ''}
      </div>
      ${showBasicDetailsModal ? html`
        <${BasicDetailsModal}
          mode="cv"
          initialValues=${{ displayName: cvData?.display_name ?? '' }}
          onConfirm=${handleBasicDetailsConfirm}
          onCancel=${() => {
            setShowBasicDetailsModal(false);
            setPendingNewCV(false);
          }}
        />
      ` : ''}
    </div>
  `;
};

export default DynamicCVBuilder;
