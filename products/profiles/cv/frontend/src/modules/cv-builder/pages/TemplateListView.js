import React from 'react';
import htm from 'htm';
import { DynamicCVPreview, getDummyCVDataForTemplate } from '/core/frontend/src/modules/shared/cv/index.js';
import BasicDetailsModal from '../components/BasicDetailsModal.js';
import { getTemplateForPreview } from './useTemplateBuilderHandlers.js';

const html = htm.bind(React.createElement);

const TemplateListView = ({
  templates,
  institutions,
  allocations,
  selectedInstitution,
  setSelectedInstitution,
  page,
  pageSize,
  totalCount,
  setPage,
  isPlacementRole,
  isSystemAdmin,
  canManageTemplates,
  canPublish,
  makeCVTemplate,
  setMakeCVTemplate,
  allocatingFor,
  allocatingToInstitution,
  allocateAndPublish,
  setAllocatingFor,
  setAllocatingToInstitution,
  setAllocateAndPublish,
  showBasicDetailsModal,
  setShowBasicDetailsModal,
  showPdfImportModal,
  setShowPdfImportModal,
  pdfImportName,
  setPdfImportName,
  pdfImportFile,
  setPdfImportFile,
  pdfImportError,
  pdfImporting,
  setPdfImportError,
  editingTemplateId,
  handleBasicDetailsConfirm,
  dummyUser,
  templateName,
  programId,
  department,
  handleCreateNew,
  handlePdfImport,
  getStatusForTemplate,
  handlePublishToStudents,
  handleUnpublish,
  handleAllocate,
  handleEditTemplate,
  handleMakeCV,
  setActiveTab,
  setSelectedTemplate,
  handleDuplicate,
  handleDelete,
  getTemplateForPreviewFn,
}) => {
  const getTplForPreview = getTemplateForPreviewFn || getTemplateForPreview;

  return html`
    <div className="p-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex gap-4 items-center">
          ${!isPlacementRole ? html`
            <div>
              <label className="block text-xs text-gray-500 mb-1">Institution</label>
              <select
                value=${selectedInstitution || ''}
                onChange=${e => setSelectedInstitution(e.target.value)}
                className="px-3 py-2 border rounded text-sm"
              >
                <option value="">All</option>
                ${institutions.map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
              </select>
            </div>
          ` : ''}
          <button
            onClick=${handleCreateNew}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Create New Template
          </button>
          ${canManageTemplates ? html`
          <button
            onClick=${() => { setPdfImportFile(null); setPdfImportName(''); if (setPdfImportError) setPdfImportError(''); setShowPdfImportModal(true); }}
            className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
          >
            Import from PDF
          </button>
          ` : ''}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        ${(templates || []).map(template => {
          const allocStatus = getStatusForTemplate(template.id);
          const allocBadgeClass = allocStatus === 'PUBLISHED' ? 'bg-green-100 text-green-700' :
            allocStatus === 'ALLOCATED' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600';
          return html`
          <div key=${template.id} className="border rounded-lg p-4 shadow">
            <h3 className="font-bold text-lg mb-2">${template.name}</h3>
            <div className="text-sm text-gray-600 mb-2">
              <div>Status: <span className="font-semibold">${template.status}</span></div>
              <div>Version: ${template.version}</div>
              <div>Institution: ${institutions.find(i => i.id === template.institution_id)?.name || template.institution_id}</div>
              ${allocations.length > 0 ? html`
                <div className="mt-1">
                  <span className=${'inline-block px-2 py-0.5 rounded text-xs font-semibold ' + allocBadgeClass}>
                    ${allocStatus === 'PUBLISHED' ? 'Published' : allocStatus === 'ALLOCATED' ? 'Allocated' : 'Not allocated'}
                  </span>
                </div>
              ` : ''}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              ${canPublish && allocStatus === 'ALLOCATED' ? html`
                <button
                  onClick=${() => handlePublishToStudents(template.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                >
                  Publish to Students
                </button>
              ` : ''}
              ${canPublish && allocStatus === 'PUBLISHED' ? html`
                <button
                  onClick=${() => handleUnpublish(template.id)}
                  className="px-3 py-1 bg-amber-500 text-white rounded text-sm hover:bg-amber-600"
                >
                  Unpublish
                </button>
              ` : ''}
              ${isSystemAdmin && (allocatingFor === template.id ? html`
                <div className="flex flex-wrap gap-2 items-center">
                  <select
                    value=${allocatingToInstitution}
                    onChange=${e => setAllocatingToInstitution(e.target.value)}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Select college</option>
                    ${institutions.map(inst => html`<option key=${inst.id} value=${inst.id}>${inst.name}</option>`)}
                  </select>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked=${allocateAndPublish} onChange=${e => setAllocateAndPublish(e.target.checked)} />
                    Publish now
                  </label>
                  <button
                    onClick=${() => allocatingToInstitution && handleAllocate(template.id, allocatingToInstitution, allocateAndPublish)}
                    disabled=${!allocatingToInstitution}
                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
                  >
                    ${allocateAndPublish ? 'Allocate & Publish' : 'Allocate'}
                  </button>
                  <button onClick=${() => { setAllocatingFor(null); setAllocatingToInstitution(''); setAllocateAndPublish(false); }} className="text-gray-500 text-xs">Cancel</button>
                </div>
              ` : html`
                <button
                  onClick=${() => { setAllocatingFor(template.id); setAllocatingToInstitution(''); setAllocateAndPublish(false); }}
                  className="px-3 py-1 bg-indigo-500 text-white rounded text-sm hover:bg-indigo-600"
                >
                  Allocate to College
                </button>
              `)}
              <button
                onClick=${() => handleEditTemplate(template, setActiveTab)}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                disabled=${template.status !== 'DRAFT' || editingTemplateId === template.id}
              >
                ${editingTemplateId === template.id ? 'Loading...' : (template.status === 'DRAFT' ? 'Edit' : 'View')}
              </button>
              <button
                onClick=${() => handleMakeCV(template)}
                className="px-3 py-1 bg-purple-500 text-white rounded text-sm hover:bg-purple-600"
              >
                Make a CV
              </button>
              <button
                onClick=${() => { setSelectedTemplate(template); setActiveTab('versions'); }}
                className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
              >
                Versions
              </button>
              <button
                onClick=${() => handleDuplicate(template)}
                className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
              >
                Duplicate
              </button>
              ${canManageTemplates ? html`
                <button
                  onClick=${() => handleDelete(template.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete
                </button>
              ` : ''}
            </div>
          </div>
        `})}
      </div>
      ${totalCount > pageSize ? html`
        <div className="flex items-center justify-between py-4 mt-4">
          <span className="text-sm text-gray-500">
            Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalCount)} of ${totalCount}
          </span>
          <div className="flex gap-2">
            <button
              onClick=${() => setPage(p => Math.max(0, p - 1))}
              disabled=${page === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick=${() => setPage(p => p + 1)}
              disabled=${(page + 1) * pageSize >= totalCount}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      ` : ''}
      ${makeCVTemplate ? html`
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick=${() => setMakeCVTemplate(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick=${e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Make a CV – ${makeCVTemplate.name}</h2>
              <button onClick=${() => setMakeCVTemplate(null)} className="text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
            </div>
            <div className="p-4 overflow-auto">
              <${DynamicCVPreview}
                template=${getTplForPreview(makeCVTemplate)}
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
          initialValues=${{
            name: templateName,
            institution: selectedInstitution,
            program: programId,
            department
          }}
          onConfirm=${handleBasicDetailsConfirm}
          onCancel=${() => setShowBasicDetailsModal(false)}
        />
      ` : ''}
      ${showPdfImportModal ? html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick=${e => e.target === e.currentTarget && !pdfImporting && setShowPdfImportModal(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full" onClick=${e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Import from PDF</h2>
            <form onSubmit=${handlePdfImport}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Template name</label>
                <input
                  type="text"
                  value=${pdfImportName}
                  onChange=${e => setPdfImportName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g. Academic CV"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institution (optional)</label>
                <select
                  value=${selectedInstitution || ''}
                  onChange=${e => setSelectedInstitution(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">None</option>
                  ${institutions.map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF file</label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange=${e => setPdfImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
              ${pdfImportError ? html`<p className="text-red-600 text-sm mb-4">${pdfImportError}</p>` : ''}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick=${() => !pdfImporting && setShowPdfImportModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  disabled=${pdfImporting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  disabled=${pdfImporting}
                >
                  ${pdfImporting ? 'Analyzing…' : 'Analyze and Edit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default TemplateListView;
