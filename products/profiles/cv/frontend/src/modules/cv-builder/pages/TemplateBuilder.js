import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import { getCVTemplate } from '/core/frontend/src/modules/shared/services/api.js';
import SectionsManager from '../components/SectionsManager.js';
import HeaderFooterConfig from '../components/HeaderFooterConfig.js';
import BasicDetailsModal from '../components/BasicDetailsModal.js';
import TemplateVersions from '../components/TemplateVersions.js';
import VisualTemplateEditor from '../components/editor/VisualTemplateEditor.js';
import { DynamicCVPreview, deriveEditableSections, getDummyCVDataForTemplate } from '/core/frontend/src/modules/shared/cv/index.js';
import TemplateListView from './TemplateListView.js';
import {
  useTemplateBuilderHandlers,
  sanitizeConfig,
  getTemplateForPreview,
  DEFAULT_TEMPLATE_CONFIG,
} from './useTemplateBuilderHandlers.js';

const html = htm.bind(React.createElement);

const TemplateBuilder = ({ user, initialMode = 'list' }) => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialMode === 'create' ? 'builder' : 'list');
  const [templateConfig, setTemplateConfig] = useState({ ...DEFAULT_TEMPLATE_CONFIG });
  const [templateName, setTemplateName] = useState('');
  const [selectedInstitution, setSelectedInstitution] = useState(user.institution_id || '');
  const [programId, setProgramId] = useState('');
  const [department, setDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [makeCVTemplate, setMakeCVTemplate] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [allocations, setAllocations] = useState([]);
  const [allocatingFor, setAllocatingFor] = useState(null);
  const [allocatingToInstitution, setAllocatingToInstitution] = useState('');
  const [allocateAndPublish, setAllocateAndPublish] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [showBasicDetailsModal, setShowBasicDetailsModal] = useState(false);
  const [showPdfImportModal, setShowPdfImportModal] = useState(false);
  const [pdfImporting, setPdfImporting] = useState(false);
  const [pdfImportError, setPdfImportError] = useState('');
  const [pdfImportName, setPdfImportName] = useState('');
  const [pdfImportFile, setPdfImportFile] = useState(null);
  const visualEditorConfigRef = useRef(null);

  const handlers = useTemplateBuilderHandlers({
    user,
    page,
    pageSize,
    selectedInstitution,
    allocations,
    templateName,
    selectedTemplate,
    templateConfig,
    programId,
    department,
    setTemplates,
    setInstitutions,
    setLoading,
    setAllocations,
    setSelectedTemplate,
    setTemplateConfig,
    setSaving,
    setMakeCVTemplate,
    setEditingTemplateId,
    setAllocatingFor,
    setAllocatingToInstitution,
    setAllocateAndPublish,
    setTemplateName,
    setTotalCount,
  });

  const {
    isPlacementRole,
    isSystemAdmin,
    canManageTemplates,
    canPublish,
    getStatusForTemplate,
    fetchData,
    handleMakeCV,
    handleEditTemplate,
    handleDelete,
    handleAllocate,
    handlePublishToStudents,
    handleUnpublish,
    handleSave,
    handlePublish,
    handleDuplicate,
    handleCreateNewVersion,
  } = handlers;

  useEffect(() => {
    setPage(0);
  }, [selectedInstitution]);

  useEffect(() => {
    fetchData();
  }, [selectedInstitution, page, isPlacementRole, isSystemAdmin]);

  useEffect(() => {
    let editId = null;
    try {
      editId = sessionStorage.getItem('templateBuilder_editTemplateId');
    } catch (_) { /* sessionStorage may be unavailable */ }
    if (editId) {
      getCVTemplate(editId)
        .then((tpl) => {
          setSelectedTemplate(tpl);
          setActiveTab('builder');
          try { sessionStorage.removeItem('templateBuilder_editTemplateId'); } catch (_) { /* sessionStorage may be unavailable */ }
        })
        .catch((err) => {
          console.error('Failed to load template for edit:', err);
          handlers.toast.error('Failed to load template');
          try { sessionStorage.removeItem('templateBuilder_editTemplateId'); } catch (_) { /* sessionStorage may be unavailable */ }
        });
    }
  }, []);

  useEffect(() => {
    let editId = null;
    try {
      editId = sessionStorage.getItem('templateBuilder_editTemplateId');
    } catch (_) { /* sessionStorage may be unavailable */ }
    const isRestoringFromEdit = !!editId;
    if (initialMode === 'create' && activeTab === 'builder' && !selectedTemplate && !loading && !isRestoringFromEdit) {
      setSelectedTemplate(null);
      setTemplateName('');
      setTemplateConfig({ ...DEFAULT_TEMPLATE_CONFIG });
      setProgramId('');
      setDepartment('');
    }
  }, [initialMode, loading]);

  useEffect(() => {
    if (selectedTemplate) {
      const config = selectedTemplate.config || templateConfig;
      let incomingSections = Array.isArray(config.sections) ? config.sections : [];
      if (incomingSections.length === 0 && (selectedTemplate.sections?.length > 0 || (selectedTemplate.fields && Object.keys(selectedTemplate.fields).length > 0))) {
        const derived = deriveEditableSections(selectedTemplate);
        if (derived.length > 0) incomingSections = derived;
      }
      setTemplateName(selectedTemplate.name);
      setSelectedInstitution(selectedTemplate.institution_id || '');
      setProgramId(selectedTemplate.program_id || '');
      setDepartment(selectedTemplate.department || '');
      if (incomingSections.length === 0 && (templateConfig.sections || []).length > 0) {
        return;
      }
      const safeConfig = { ...config, sections: incomingSections };
      setTemplateConfig(safeConfig);
    }
  }, [selectedTemplate]);

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setTemplateName('');
    setTemplateConfig({ ...DEFAULT_TEMPLATE_CONFIG });
    setProgramId('');
    setDepartment('');
    setSelectedInstitution(user.institution_id || '');
    setShowBasicDetailsModal(true);
  };

  const handleBasicDetailsConfirm = (values) => {
    setTemplateName(values.name || '');
    setSelectedInstitution(values.institution || '');
    setProgramId(values.program || '');
    setDepartment(values.department || '');
    setShowBasicDetailsModal(false);
    setActiveTab('builder');
  };

  const handlePdfImport = async (e) => {
    e?.preventDefault?.();
    if (!pdfImportName?.trim() || !pdfImportFile) {
      setPdfImportError('Please enter template name and select a PDF file');
      return;
    }
    setPdfImportError('');
    setPdfImporting(true);
    try {
      const formData = new FormData();
      formData.append('pdf_file', pdfImportFile);
      formData.append('name', pdfImportName.trim());
      if (selectedInstitution) formData.append('institution_id', selectedInstitution);
      formData.append('created_by', user.id);
      formData.append('analyze', 'true');
      const { createCVTemplate } = await import('/core/frontend/src/modules/shared/services/api.js');
      const savedTemplate = await createCVTemplate(formData);
      setSelectedTemplate(savedTemplate);
      setTemplateName(savedTemplate.name || pdfImportName);
      setSelectedInstitution(savedTemplate.institution_id || '');
      setShowPdfImportModal(false);
      setPdfImportFile(null);
      setPdfImportName('');
      setActiveTab('builder');
      handlers.toast.success('PDF analyzed. You can now edit the template.');
      fetchData();
    } catch (err) {
      setPdfImportError(err.message || 'Failed to import PDF');
      handlers.toast.error('Failed to import PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setPdfImporting(false);
    }
  };

  const handleConfigChange = useCallback((newConfig) => {
    setTemplateConfig(sanitizeConfig(newConfig));
  }, []);

  if (loading && activeTab === 'list') {
    return html`<div className="p-8 text-center">Loading...</div>`;
  }

  const dummyUser = { name: 'Sample User', email: 'sample@example.com', institution: { name: 'Sample College' } };

  if (activeTab === 'list') {
    return html`
      <${TemplateListView}
        templates=${templates}
        institutions=${institutions}
        allocations=${allocations}
        selectedInstitution=${selectedInstitution}
        setSelectedInstitution=${setSelectedInstitution}
        page=${page}
        pageSize=${pageSize}
        totalCount=${totalCount}
        setPage=${setPage}
        isPlacementRole=${isPlacementRole}
        isSystemAdmin=${isSystemAdmin}
        canManageTemplates=${canManageTemplates}
        canPublish=${canPublish}
        makeCVTemplate=${makeCVTemplate}
        setMakeCVTemplate=${setMakeCVTemplate}
        allocatingFor=${allocatingFor}
        allocatingToInstitution=${allocatingToInstitution}
        allocateAndPublish=${allocateAndPublish}
        setAllocatingFor=${setAllocatingFor}
        setAllocatingToInstitution=${setAllocatingToInstitution}
        setAllocateAndPublish=${setAllocateAndPublish}
        showBasicDetailsModal=${showBasicDetailsModal}
        setShowBasicDetailsModal=${setShowBasicDetailsModal}
        showPdfImportModal=${showPdfImportModal}
        setShowPdfImportModal=${setShowPdfImportModal}
        pdfImportName=${pdfImportName}
        setPdfImportName=${setPdfImportName}
        pdfImportFile=${pdfImportFile}
        setPdfImportFile=${setPdfImportFile}
        pdfImportError=${pdfImportError}
        pdfImporting=${pdfImporting}
        setPdfImportError=${setPdfImportError}
        editingTemplateId=${editingTemplateId}
        dummyUser=${dummyUser}
        templateName=${templateName}
        programId=${programId}
        department=${department}
        handleCreateNew=${handleCreateNew}
        handlePdfImport=${handlePdfImport}
        handleBasicDetailsConfirm=${handleBasicDetailsConfirm}
        getStatusForTemplate=${getStatusForTemplate}
        handlePublishToStudents=${handlePublishToStudents}
        handleUnpublish=${handleUnpublish}
        handleAllocate=${handleAllocate}
        handleEditTemplate=${handleEditTemplate}
        handleMakeCV=${handleMakeCV}
        setActiveTab=${setActiveTab}
        setSelectedTemplate=${setSelectedTemplate}
        handleDuplicate=${handleDuplicate}
        handleDelete=${handleDelete}
        getTemplateForPreviewFn=${getTemplateForPreview}
      />
    `;
  }

  const builderTabs = ['builder', 'headerFooter', 'sections', 'preview'];
  if (builderTabs.includes(activeTab)) {
    const basicDetailsInitial = { name: templateName, institution: selectedInstitution, program: programId, department };
    return html`
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">${selectedTemplate ? 'Edit: ' + templateName : 'Create New Template'}</h1>
          <div className="flex gap-2">
            <button
              onClick=${() => setActiveTab('list')}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Back to List
            </button>
            ${(!selectedTemplate || selectedTemplate.status === 'DRAFT') ? html`
              <button
                onClick=${() => {
                  const configToSave = (activeTab === 'builder' ? visualEditorConfigRef.current : null) ?? templateConfig;
                  handleSave(configToSave);
                }}
                disabled=${saving}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                ${saving ? 'Saving...' : 'Save Draft'}
              </button>
            ` : (selectedTemplate?.status === 'PUBLISHED' || selectedTemplate?.status === 'RETIRED') ? html`
              <button
                onClick=${() => handleCreateNewVersion(setActiveTab)}
                className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700"
              >
                Create New Version
              </button>
            ` : html`
              <span className="px-4 py-2 text-sm text-slate-500 bg-slate-100 rounded">View only</span>
            `}
            ${selectedTemplate && selectedTemplate.status === 'DRAFT' ? html`
              <button
                onClick=${() => handlePublish(setActiveTab)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Publish
              </button>
            ` : ''}
            <button
              onClick=${() => setMakeCVTemplate(selectedTemplate ? { ...selectedTemplate, config: templateConfig } : { name: templateName, config: templateConfig })}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Make a CV
            </button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-end gap-4">
          <button
            onClick=${() => setShowBasicDetailsModal(true)}
            className="px-3 py-2 text-sm border border-blue-500 text-blue-600 rounded hover:bg-blue-50"
          >
            Edit basic details
          </button>
        </div>

        <div className="border-t pt-4">
          <div className="flex gap-2 mb-4 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick=${() => setActiveTab('builder')}
                className=${'px-4 py-2 ' + (activeTab === 'builder' ? 'bg-blue-600 text-white' : 'bg-gray-200') + ' rounded'}
              >
                Page & Typography
              </button>
              <button
                onClick=${() => setActiveTab('headerFooter')}
                className=${'px-4 py-2 ' + (activeTab === 'headerFooter' ? 'bg-blue-600 text-white' : 'bg-gray-200') + ' rounded'}
              >
                Header & Footer
              </button>
              <button
                onClick=${() => setActiveTab('sections')}
                className=${'px-4 py-2 ' + (activeTab === 'sections' ? 'bg-blue-600 text-white' : 'bg-gray-200') + ' rounded'}
              >
                Sections
              </button>
              <button
                onClick=${() => setActiveTab('preview')}
                className=${'px-4 py-2 ' + (activeTab === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-200') + ' rounded'}
              >
                Preview
              </button>
            </div>
          </div>

          ${activeTab === 'builder' ? html`
            <div className="min-h-[500px] h-[calc(100vh-220px)] overflow-y-auto">
              <${VisualTemplateEditor}
                key=${selectedTemplate?.id ?? 'new'}
                initialConfig=${templateConfig}
                onConfigChange=${handleConfigChange}
                onSave=${(config) => handleSave(config)}
                templateId=${selectedTemplate?.status === 'DRAFT' ? selectedTemplate?.id : null}
                configRef=${visualEditorConfigRef}
              />
            </div>
          ` : activeTab === 'headerFooter' ? html`
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 bg-white rounded-lg border border-gray-200 max-h-[calc(100vh-320px)] overflow-auto">
                <${HeaderFooterConfig}
                  config=${templateConfig}
                  onChange=${(newConfig) => setTemplateConfig(newConfig)}
                />
              </div>
              <div className="lg:sticky lg:top-4 self-start">
                <h3 className="text-sm font-medium text-slate-600 mb-2">Live preview</h3>
                <${DynamicCVPreview}
                  template=${{
                    config: templateConfig,
                    name: templateName || 'Preview'
                  }}
                  cvData=${getDummyCVDataForTemplate({ config: templateConfig })}
                  user=${dummyUser}
                />
              </div>
            </div>
          ` : activeTab === 'sections' ? html`
            <div className="h-[calc(100vh-220px)] overflow-y-auto">
              <${SectionsManager}
                sections=${templateConfig.sections || []}
                onChange=${(sections) => setTemplateConfig({ ...templateConfig, sections })}
              />
            </div>
          ` : activeTab === 'preview' ? html`
            <div className="h-[calc(100vh-220px)] overflow-y-auto">
              <${DynamicCVPreview}
                template=${{ config: templateConfig, name: templateName || 'Preview' }}
                cvData=${getDummyCVDataForTemplate({ config: templateConfig })}
                user=${dummyUser}
              />
            </div>
          ` : html`<div className="p-4 text-gray-500">Select a tab</div>`}
        </div>
        ${makeCVTemplate ? html`
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick=${() => setMakeCVTemplate(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick=${e => e.stopPropagation()}>
              <div className="flex justify-between items-center p-4 border-b">
                <h2 className="text-xl font-bold">Make a CV – ${makeCVTemplate.name || 'Preview'}</h2>
                <button onClick=${() => setMakeCVTemplate(null)} className="text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
              </div>
              <div className="p-4 overflow-auto">
                <${DynamicCVPreview}
                  template=${getTemplateForPreview(makeCVTemplate)}
                  cvData=${getDummyCVDataForTemplate(makeCVTemplate)}
                  user=${dummyUser}
                />
              </div>
            </div>
          </div>
        ` : ''}
        ${showBasicDetailsModal ? html`
          <${BasicDetailsModal}
            mode="template"
            institutions=${institutions}
            initialValues=${basicDetailsInitial}
            onConfirm=${handleBasicDetailsConfirm}
            onCancel=${() => setShowBasicDetailsModal(false)}
          />
        ` : ''}
      </div>
    `;
  }

  if (activeTab === 'versions') {
    return html`
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Template Versions</h1>
          <button
            onClick=${() => setActiveTab('list')}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Back to List
          </button>
        </div>
        ${selectedTemplate ? html`
          <${TemplateVersions} templateId=${selectedTemplate.id} />
        ` : html`<div>Please select a template to view versions</div>`}
      </div>
    `;
  }

  return null;
};

export default TemplateBuilder;
