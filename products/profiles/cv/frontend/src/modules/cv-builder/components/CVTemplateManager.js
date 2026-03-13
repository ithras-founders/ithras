import React, { useState, useEffect } from 'react';
import htm from 'htm';
import {
  getCVTemplates,
  getCVTemplate,
  createCVTemplate,
  deleteCVTemplate,
  duplicateCVTemplate,
  getInstitutions,
  getTemplateAllocations,
  allocateTemplateToInstitution,
  publishTemplateForInstitution,
  unpublishTemplateForInstitution,
} from '/core/frontend/src/modules/shared/services/api.js';
import { DynamicCVPreview, deriveEditableSections, getDummyCVDataForTemplate } from '/core/frontend/src/modules/shared/cv/index.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const CVTemplateManager = ({ user, setView }) => {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [institutions, setInstitutions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState(user.institution_id || '');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [allocatingFor, setAllocatingFor] = useState(null);
  const [allocatingToInstitution, setAllocatingToInstitution] = useState('');
  const [allocateAndPublish, setAllocateAndPublish] = useState(false);
  const [makeCVTemplate, setMakeCVTemplate] = useState(null);
  const [page, setPage] = useState(0);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showCreateFromTemplate, setShowCreateFromTemplate] = useState(false);

  const handleMakeCV = async (template) => {
    if (!template?.id) return;
    try {
      const full = await getCVTemplate(template.id);
      setMakeCVTemplate(full);
    } catch {
      toast.error('Could not load template');
    }
  };

  const getTemplateForPreview = (tpl) => {
    if (!tpl) return null;
    const sections = deriveEditableSections(tpl);
    if (sections.length === 0) return tpl;
    const config = tpl.config || {};
    const hasConfigSections = (config.sections || []).some(s => (s.entryTypes || []).some(et => (et.fields || []).length > 0));
    if (hasConfigSections) return tpl;
    return { ...tpl, config: { ...config, sections } };
  };

  const isSystemAdmin = user.role === UserRole.SYSTEM_ADMIN;
  const isPlacementRole = [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(user.role);

  useEffect(() => {
    setPage(0);
  }, [selectedInstitution]);

  useEffect(() => {
    fetchData();
  }, [selectedInstitution, isSystemAdmin, isPlacementRole, page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesResponse, institutionsData] = await Promise.all([
        isPlacementRole
          ? getCVTemplates(null, user.institution_id, { limit: pageSize, offset: page * pageSize })
          : getCVTemplates(selectedInstitution || null, null, { limit: pageSize, offset: page * pageSize }),
        getInstitutions({ limit: 500 }),
      ]);
      const items = Array.isArray(templatesResponse) ? templatesResponse : (templatesResponse?.items ?? []);
      const total = Array.isArray(templatesResponse) ? templatesResponse.length : (templatesResponse?.total ?? 0);
      setTemplates(items);
      setTotalCount(total);
      setInstitutions(institutionsData?.items ?? []);

      if (isPlacementRole) {
        const allocs = await getTemplateAllocations(user.institution_id).catch(() => []);
        setAllocations(allocs);
      } else if (isSystemAdmin && selectedInstitution) {
        const allocs = await getTemplateAllocations(selectedInstitution).catch(() => []);
        setAllocations(allocs);
      } else {
        setAllocations([]);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusForTemplate = (templateId) => {
    const a = allocations.find(x => x.template_id === templateId);
    return a ? a.status : null;
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const file = formData.get('pdf_file');
    const name = formData.get('name');
    const institutionId = formData.get('institution_id'); // Can be empty for system admin
    const analyze = formData.get('analyze') === 'on';

    if (!file || !name) {
      toast.error('Please fill template name and PDF');
      return;
    }

    setUploading(true);
    setAnalyzing(analyze);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('pdf_file', file);
      uploadFormData.append('name', name);
      if (institutionId) uploadFormData.append('institution_id', institutionId);
      uploadFormData.append('created_by', user.id);
      uploadFormData.append('analyze', analyze.toString());

      await createCVTemplate(uploadFormData);
      toast.success('CV template uploaded successfully!');
      setShowUploadForm(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to upload template: ' + (error.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirm({ message: 'This will permanently delete this template and all CVs created with it. This cannot be undone. Continue?' }))) return;
    try {
      await deleteCVTemplate(id);
      fetchData();
    } catch (error) {
      toast.error('Failed to delete template: ' + (error.message || 'Unknown error'));
    }
  };

  const handleAllocate = async (templateId, institutionId, publishNow = false) => {
    if (!institutionId) return;
    try {
      await allocateTemplateToInstitution(templateId, institutionId);
      if (publishNow) {
        await publishTemplateForInstitution(templateId, institutionId);
      }
      setAllocatingFor(null);
      setAllocatingToInstitution('');
      setAllocateAndPublish(false);
      fetchData();
      toast.success(publishNow ? 'Allocated and published' : 'Allocated');
    } catch (error) {
      toast.error('Failed: ' + (error.message || 'Unknown error'));
    }
  };

  const handlePublish = async (templateId) => {
    try {
      await publishTemplateForInstitution(templateId, user.institution_id);
      fetchData();
    } catch (error) {
      toast.error('Failed to publish: ' + (error.message || 'Unknown error'));
    }
  };

  const handleUnpublish = async (templateId) => {
    try {
      await unpublishTemplateForInstitution(templateId, user.institution_id);
      fetchData();
    } catch (error) {
      toast.error('Failed to unpublish: ' + (error.message || 'Unknown error'));
    }
  };

  if (loading) {
    return html`<div className="p-20 text-center font-black text-slate-200 text-3xl italic">Loading...</div>`;
  }

  const canManageTemplates = isSystemAdmin;
  const canPublish = isPlacementRole;

  const CATEGORIES = [
    { id: '', label: 'All categories' },
    { id: 'institutional', label: 'Institutional' },
    { id: 'canva_modern', label: 'Modern' },
    { id: 'canva_minimal', label: 'Minimal' },
    { id: 'canva_creative', label: 'Creative' },
  ];

  const filteredTemplates = categoryFilter
    ? templates.filter((t) => (t.config?.template_category || '') === categoryFilter)
    : templates;

  const handleCreateFromTemplate = async (sourceTemplate) => {
    try {
      const newTemplate = await duplicateCVTemplate(sourceTemplate.id);
      setShowCreateFromTemplate(false);
      try {
        sessionStorage.setItem('templateBuilder_editTemplateId', newTemplate.id);
      } catch (_) { /* sessionStorage may be unavailable */ }
      setView && setView('cv-templates');
      toast.success(`Created "${newTemplate.name}" - ready to edit`);
    } catch (e) {
      toast.error('Failed to create: ' + (e.message || 'Unknown error'));
    }
  };

  return html`
    <div className="space-y-10 animate-in pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
            ${isPlacementRole ? 'Allocated Templates' : 'CV Template Management'}
          </h2>
          <p className="text-slate-500 font-medium italic mt-2">
            ${isPlacementRole
              ? 'Templates allocated to your institution. Publish to make them available to students.'
              : 'Create and allocate CV templates to colleges'}
          </p>
        </div>
        ${canManageTemplates && html`
          <div className="flex flex-wrap gap-3">
            <button
              onClick=${() => setView && setView('cv-templates')}
              className="px-8 py-3 bg-green-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-green-700 transition-colors"
            >
              + Create Blank
            </button>
            <button
              onClick=${() => setShowCreateFromTemplate(true)}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-colors"
            >
              + Create from Template
            </button>
            <button
              onClick=${() => setShowUploadForm(true)}
              className="px-8 py-3 bg-blue-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-blue-700 transition-colors"
            >
              + Upload PDF
            </button>
          </div>
        `}
      </header>

      ${canManageTemplates && !isPlacementRole && html`
        <div className="mb-6 flex flex-wrap gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Filter by Institution
            </label>
            <select
              value=${selectedInstitution}
              onChange=${(e) => setSelectedInstitution(e.target.value)}
              className="w-full md:w-auto px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="">All Templates</option>
              ${institutions.map(inst => html`
                <option key=${inst.id} value=${inst.id}>${inst.name}</option>
              `)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              Category
            </label>
            <select
              value=${categoryFilter}
              onChange=${(e) => setCategoryFilter(e.target.value)}
              className="w-full md:w-auto px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              ${CATEGORIES.map(c => html`<option key=${c.id} value=${c.id}>${c.label}</option>`)}
            </select>
          </div>
        </div>
      `}

      ${showUploadForm && canManageTemplates && html`
        <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-black text-slate-900 mb-6">Upload CV Template</h3>
          <form onSubmit=${handleFileUpload} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Template Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="e.g., Standard CV Template"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                Institution (optional – leave empty for global template)
              </label>
              <select
                name="institution_id"
                value=${selectedInstitution}
                onChange=${(e) => setSelectedInstitution(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Global (allocate to colleges later)</option>
                ${institutions.map(inst => html`
                  <option key=${inst.id} value=${inst.id}>${inst.name}</option>
                `)}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                PDF Template <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                name="pdf_file"
                accept=".pdf"
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                name="analyze"
                id="analyze"
                defaultChecked
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="analyze" className="text-sm text-slate-700">
                Analyze PDF structure using AI
              </label>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled=${uploading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ${uploading ? (analyzing ? 'Analyzing PDF...' : 'Uploading...') : 'Upload Template'}
              </button>
              <button
                type="button"
                onClick=${() => setShowUploadForm(false)}
                className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      `}

      ${showCreateFromTemplate && canManageTemplates && html`
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick=${() => setShowCreateFromTemplate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-auto p-8" onClick=${e => e.stopPropagation()}>
            <h3 className="text-2xl font-black text-slate-900 mb-6">Create from Template</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              ${templates.filter(t => t.config?.sections?.length > 0).map(tpl => html`
                <div key=${tpl.id} className="border border-slate-200 rounded-xl p-4 hover:border-indigo-400 hover:shadow-lg transition-all cursor-pointer"
                  onClick=${() => handleCreateFromTemplate(tpl)}>
                  <div className="h-24 bg-slate-50 rounded-lg mb-3 flex items-center justify-center">
                    <span className="text-4xl text-slate-300">📄</span>
                  </div>
                  <h4 className="font-bold text-slate-900">${tpl.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">${tpl.config?.template_category || 'Generic'}</p>
                </div>
              `)}
            </div>
            ${templates.filter(t => t.config?.sections?.length > 0).length === 0 && html`
              <p className="text-slate-500 py-8 text-center">No templates with config available. Create a blank template first.</p>
            `}
            <button onClick=${() => setShowCreateFromTemplate(false)} className="mt-6 px-6 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
          </div>
        </div>
      `}

      <div className="space-y-6">
        ${(filteredTemplates || []).length === 0 ? html`
          <div className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
            <p className="text-center text-slate-400 py-10">
              ${isPlacementRole
                ? 'No templates allocated to your institution yet.'
                : categoryFilter
                  ? 'No templates in this category.'
                  : selectedInstitution
                    ? 'No templates found for this institution.'
                    : 'No CV templates found. Create your first template above.'}
            </p>
          </div>
        ` : (filteredTemplates || []).map(template => {
          const allocStatus = getStatusForTemplate(template.id);
          return html`
          <div key=${template.id} className="bg-white p-10 rounded-[50px] border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h4 className="text-2xl font-black text-slate-900">${template.name}</h4>
                <div className="flex gap-4 mt-2 flex-wrap items-center">
                  ${template.institution_id && institutions.find(i => i.id === template.institution_id) && html`
                    <span className="text-sm text-slate-500">${institutions.find(i => i.id === template.institution_id).name}</span>
                  `}
                  ${!template.institution_id && html`
                    <span className="text-sm text-slate-500">Global template</span>
                  `}
                  ${template.config?.template_category && html`
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600">${template.config.template_category.replace(/_/g, ' ')}</span>
                  `}
                  <span className=${`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                    allocStatus === 'PUBLISHED' ? 'bg-green-100 text-green-600'
                    : allocStatus === 'ALLOCATED' ? 'bg-amber-100 text-amber-600'
                    : 'bg-slate-100 text-slate-600'
                  }`}>
                    ${allocStatus === 'PUBLISHED' ? 'Published' : allocStatus === 'ALLOCATED' ? 'Allocated' : 'Not allocated'}
                  </span>
                </div>
                ${template.sections && template.sections.length > 0 && html`
                  <div className="mt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2">Sections</p>
                    <div className="flex flex-wrap gap-2">
                      ${template.sections.map(section => html`
                        <span key=${section} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                          ${section}
                        </span>
                      `)}
                    </div>
                  </div>
                `}
              </div>
              <div className="flex gap-3 flex-wrap">
                ${canPublish && allocStatus === 'ALLOCATED' && html`
                  <button
                    onClick=${() => handlePublish(template.id)}
                    className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase hover:bg-green-100 transition-colors"
                  >
                    Publish to Students
                  </button>
                `}
                ${canPublish && allocStatus === 'PUBLISHED' && html`
                  <button
                    onClick=${() => handleUnpublish(template.id)}
                    className="px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-[10px] font-black uppercase hover:bg-amber-100 transition-colors"
                  >
                    Unpublish
                  </button>
                `}
                <button
                  onClick=${() => handleMakeCV(template)}
                  className="px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-[10px] font-black uppercase hover:bg-purple-100 transition-colors"
                >
                  Make a CV
                </button>
                ${canManageTemplates && html`
                  <button
                    onClick=${() => {
                      try { sessionStorage.setItem('templateBuilder_editTemplateId', template.id); } catch (_) { /* sessionStorage may be unavailable */ }
                      setView && setView('cv-templates');
                    }}
                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
                  >
                    Edit Template
                  </button>
                  ${template.pdf_url && html`
                    <a
                      href=${`${window.location.origin}${template.pdf_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-100 transition-colors"
                    >
                      View PDF
                    </a>
                  `}
                  ${allocatingFor === template.id ? html`
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        value=${allocatingToInstitution}
                        onChange=${e => setAllocatingToInstitution(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      >
                        <option value="">Select college</option>
                        ${institutions.map(inst => html`
                          <option key=${inst.id} value=${inst.id}>${inst.name}</option>
                        `)}
                      </select>
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked=${allocateAndPublish}
                          onChange=${e => setAllocateAndPublish(e.target.checked)}
                          className="rounded"
                        />
                        <span>Publish now</span>
                      </label>
                      <button
                        onClick=${() => allocatingToInstitution && handleAllocate(template.id, allocatingToInstitution, allocateAndPublish)}
                        disabled=${!allocatingToInstitution}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 disabled:opacity-50"
                      >
                        ${allocateAndPublish ? 'Allocate & Publish' : 'Allocate'}
                      </button>
                      <button onClick=${() => { setAllocatingFor(null); setAllocatingToInstitution(''); setAllocateAndPublish(false); }} className="text-slate-500 text-xs">Cancel</button>
                    </div>
                  ` : html`
                    <button
                      onClick=${() => { setAllocatingFor(template.id); setAllocatingToInstitution(''); setAllocateAndPublish(false); }}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors"
                    >
                      Allocate to College
                    </button>
                  `}
                  <button
                    onClick=${() => handleDelete(template.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-colors"
                  >
                    Delete
                  </button>
                `}
              </div>
            </div>
          </div>
        `})}
        ${totalCount > pageSize ? html`
          <div className="flex items-center justify-between py-4 px-2">
            <span className="text-sm text-slate-500">
              Showing ${page * pageSize + 1}–${Math.min((page + 1) * pageSize, totalCount)} of ${totalCount}
            </span>
            <div className="flex gap-2">
              <button
                onClick=${() => setPage(p => Math.max(0, p - 1))}
                disabled=${page === 0}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick=${() => setPage(p => p + 1)}
                disabled=${(page + 1) * pageSize >= totalCount}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        ` : ''}
      </div>
      ${makeCVTemplate ? html`
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick=${() => setMakeCVTemplate(null)}>
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto" onClick=${e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-bold">Make a CV – ${makeCVTemplate.name}</h2>
              <button onClick=${() => setMakeCVTemplate(null)} className="text-slate-500 hover:text-slate-700 text-2xl">&times;</button>
            </div>
            <div className="p-4 overflow-auto">
              <${DynamicCVPreview}
                template=${getTemplateForPreview(makeCVTemplate)}
                cvData=${getDummyCVDataForTemplate(makeCVTemplate)}
                user=${{ name: 'Sample User', email: 'sample@example.com', institution: { name: 'Sample College' } }}
              />
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default CVTemplateManager;
