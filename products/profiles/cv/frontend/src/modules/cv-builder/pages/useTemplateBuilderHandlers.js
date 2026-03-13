import { useCallback } from 'react';
import {
  getCVTemplates,
  getCVTemplate,
  createCVTemplate,
  updateCVTemplate,
  publishCVTemplate,
  duplicateCVTemplate,
  deleteCVTemplate,
  allocateTemplateToInstitution,
  publishTemplateForInstitution,
  unpublishTemplateForInstitution,
  getTemplateAllocations,
  getInstitutions,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import { deriveEditableSections } from '/core/frontend/src/modules/shared/cv/index.js';

/**
 * Sanitize config to remove React elements, functions, and circular references.
 * Sections are always extracted first and preserved - never dropped.
 */
export function sanitizeConfig(config) {
  if (!config || typeof config !== 'object') return { sections: [] };

  let sections = [];
  try {
    sections = Array.isArray(config?.sections)
      ? JSON.parse(JSON.stringify(config.sections))
      : [];
  } catch (_) {
    // defensive: config may have circular refs or non-serializable values
    sections = Array.isArray(config?.sections) ? [...config.sections] : [];
  }

  try {
    const plain = JSON.stringify(config);
    if (plain !== undefined && plain !== 'undefined') {
      const parsed = JSON.parse(plain);
      return { ...parsed, sections };
    }
  } catch (_) { /* defensive: config may have circular refs */ }

  try {
    const seen = new WeakSet();
    const stringified = JSON.stringify(config, (key, value) => {
      if (key === '') return value;
      if (value && typeof value === 'object') {
        if (seen.has(value)) return undefined;
        seen.add(value);
      }
      if (typeof value === 'function') return undefined;
      if (typeof value === 'symbol') return undefined;
      if (value && typeof value === 'object') {
        if (value.$$typeof === Symbol.for('react.element') || value.$$typeof === Symbol.for('react.portal')) return undefined;
        if (value instanceof HTMLElement || value instanceof SVGElement || value instanceof Event || value instanceof Node) return undefined;
        if (typeof window !== 'undefined' && (value === window || value === document)) return undefined;
        if (value instanceof Date) return value.toISOString();
        if (value instanceof RegExp) return value.toString();
      }
      return value;
    });

    if (stringified !== undefined && stringified !== 'undefined') {
      const parsed = JSON.parse(stringified);
      return { ...parsed, sections };
    }
  } catch (_) { /* defensive: config may have circular refs */ }

  return {
    page: config?.page,
    typography: config?.typography,
    spacing: config?.spacing,
    overflowPolicy: config?.overflowPolicy,
    fixedElements: config?.fixedElements,
    autoVariables: config?.autoVariables,
    sections
  };
}

export function getTemplateForPreview(tpl, deriveEditableSectionsFn = deriveEditableSections) {
  if (!tpl) return null;
  const sections = deriveEditableSectionsFn(tpl);
  if (sections.length === 0) return tpl;
  const config = tpl.config || {};
  const hasConfigSections = (config.sections || []).some(s => (s.entryTypes || []).some(et => (et.fields || []).length > 0));
  if (hasConfigSections) return tpl;
  return { ...tpl, config: { ...config, sections } };
}

export const DEFAULT_TEMPLATE_CONFIG = {
  page: {
    size: "A4",
    margins: { top: 20, bottom: 20, left: 20, right: 20 }
  },
  typography: {
    baseFont: { family: "serif", size: 10.5, lineHeight: 1.2 },
    headerFont: { sizes: { h1: 14, h2: 12, h3: 10 }, weights: { h1: 900, h2: 700, h3: 600 } },
    bulletStyle: "disc",
    bulletIndentation: 4.0
  },
  spacing: {
    lineSpacing: 1.2,
    bulletSpacing: 0.5,
    sectionTitleBefore: 6.0,
    sectionTitleAfter: 3.0,
    sectionSpacing: 8.0,
    rowSpacing: 4.0
  },
  overflowPolicy: {
    allowOverflow: true,
    restrictOverflow: false,
    limitType: null,
    limitValue: null
  },
  sections: [],
  fixedElements: {},
  autoVariables: []
};

export function useTemplateBuilderHandlers(opts) {
  const {
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
    setTotalCount,
    setEditingTemplateId,
    setAllocatingFor,
    setAllocatingToInstitution,
    setAllocateAndPublish,
    setTemplateName,
  } = opts;

  const toast = useToast();
  const { confirm } = useDialog();

  const isPlacementRole = [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN].includes(user?.role);
  const isSystemAdmin = user?.role === UserRole.SYSTEM_ADMIN;
  const canManageTemplates = isSystemAdmin || user?.role === UserRole.PLACEMENT_ADMIN;
  const canPublish = isPlacementRole;

  const getStatusForTemplate = useCallback((templateId) => {
    const a = allocations.find(x => x.template_id === templateId);
    return a ? a.status : null;
  }, [allocations]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [templatesResponse, institutionsData] = await Promise.all([
        isPlacementRole
          ? getCVTemplates(null, user.institution_id, { limit: pageSize, offset: page * pageSize })
          : getCVTemplates(selectedInstitution || undefined, null, { limit: pageSize, offset: page * pageSize }),
        getInstitutions({ limit: 500 })
      ]);
      const items = Array.isArray(templatesResponse) ? templatesResponse : (templatesResponse?.items ?? []);
      const total = Array.isArray(templatesResponse) ? templatesResponse.length : (templatesResponse?.total ?? 0);
      setTemplates(items);
      if (setTotalCount) setTotalCount(total);
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
      return { items, total };
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [isPlacementRole, isSystemAdmin, user, selectedInstitution, page, pageSize, setTemplates, setInstitutions, setAllocations, setLoading]);

  const handleMakeCV = useCallback(async (template) => {
    if (!template?.id) {
      setMakeCVTemplate(template);
      return;
    }
    try {
      const full = await getCVTemplate(template.id);
      setMakeCVTemplate(full);
    } catch {
      toast.error('Could not load template');
      setMakeCVTemplate(template);
    }
  }, [toast, setMakeCVTemplate]);

  const handleEditTemplate = useCallback(async (template, setActiveTab) => {
    if (!template?.id || template.status !== 'DRAFT') return;
    setEditingTemplateId(template.id);
    try {
      const full = await getCVTemplate(template.id);
      setSelectedTemplate(full);
      setActiveTab('builder');
    } catch (e) {
      toast.error('Failed to load template');
    } finally {
      setEditingTemplateId(null);
    }
  }, [toast, setEditingTemplateId, setSelectedTemplate]);

  const handleDelete = useCallback(async (id) => {
    if (!(await confirm({ message: 'This will permanently delete this template and all CVs created with it. This cannot be undone. Continue?' }))) return;
    try {
      await deleteCVTemplate(id);
      toast.success('Template deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete template: ' + (error.message || 'Unknown error'));
    }
  }, [toast, confirm, fetchData]);

  const handleAllocate = useCallback(async (templateId, institutionId, publishNow = false) => {
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
  }, [toast, setAllocatingFor, setAllocatingToInstitution, setAllocateAndPublish, fetchData]);

  const handlePublishToStudents = useCallback(async (templateId) => {
    try {
      await publishTemplateForInstitution(templateId, user.institution_id);
      toast.success('Published to students');
      fetchData();
    } catch (error) {
      toast.error('Failed to publish: ' + (error.message || 'Unknown error'));
    }
  }, [toast, user, fetchData]);

  const handleUnpublish = useCallback(async (templateId) => {
    try {
      await unpublishTemplateForInstitution(templateId, user.institution_id);
      toast.success('Unpublished');
      fetchData();
    } catch (error) {
      toast.error('Failed to unpublish: ' + (error.message || 'Unknown error'));
    }
  }, [toast, user, fetchData]);

  const handleSave = useCallback(async (configToSave = null) => {
    if (!templateName) {
      toast.error('Please fill in template name');
      return;
    }

    setSaving(true);
    try {
      const configToUse = configToSave ?? templateConfig;
      const sanitizedConfig = sanitizeConfig(configToUse);
      try {
        sanitizedConfig.sections = JSON.parse(JSON.stringify(sanitizedConfig?.sections || []));
      } catch (_) {
        // defensive: sections may have circular refs
        sanitizedConfig.sections = Array.isArray(sanitizedConfig?.sections) ? sanitizedConfig.sections : [];
      }

      const isDraft = selectedTemplate && selectedTemplate.status === 'DRAFT';
      let savedTemplate;

      if (isDraft) {
        const updatePayload = {
          institution_id: selectedInstitution || null,
          name: templateName,
          program_id: programId || null,
          department: department || null,
          config: sanitizedConfig
        };
        savedTemplate = await updateCVTemplate(selectedTemplate.id, updatePayload);
      } else {
        const createPayload = {
          institution_id: selectedInstitution || null,
          name: templateName,
          program_id: programId || null,
          department: department || null,
          config: sanitizedConfig,
          created_by: user.id
        };
        savedTemplate = await createCVTemplate(createPayload);
        if (savedTemplate) {
          setSelectedTemplate({ ...savedTemplate, status: savedTemplate.status || 'DRAFT' });
        } else {
          toast.error('Template created but no response received. Please refresh the list.');
          return;
        }
      }

      if (!savedTemplate) {
        toast.error('Save completed but no template data was returned. Please refresh the list.');
        return;
      }

      setSelectedTemplate(savedTemplate);
      const configToDisplay = (sanitizedConfig?.sections?.length ?? 0) > 0
        ? sanitizedConfig
        : (savedTemplate.config || {});
      setTemplateConfig({
        ...configToDisplay,
        sections: Array.isArray(configToDisplay.sections) ? configToDisplay.sections : []
      });
      fetchData();
      if (!configToSave) {
        toast.success('Template saved successfully');
      }
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template: ' + (error.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }, [toast, user, templateName, selectedTemplate, templateConfig, selectedInstitution, programId, department, setSelectedTemplate, setTemplateConfig, setSaving, fetchData]);

  const handlePublish = useCallback(async (setActiveTab) => {
    if (!selectedTemplate || selectedTemplate.status !== 'DRAFT') {
      toast.error('Only DRAFT templates can be published');
      return;
    }
    if (!(await confirm({ message: 'Publishing will create a new immutable version. Continue?' }))) return;
    try {
      await publishCVTemplate(selectedTemplate.id);
      fetchData();
      toast.success('Template published successfully');
      setActiveTab('versions');
    } catch (error) {
      console.error('Failed to publish template:', error);
      toast.error('Failed to publish template: ' + (error.message || 'Unknown error'));
    }
  }, [toast, confirm, selectedTemplate, fetchData]);

  const handleDuplicate = useCallback(async (template) => {
    try {
      const newTemplate = await duplicateCVTemplate(template.id);
      fetchData();
      toast.success('Template duplicated successfully');
      return newTemplate;
    } catch (error) {
      console.error('Failed to duplicate template:', error);
      toast.error('Failed to duplicate template: ' + (error.message || 'Unknown error'));
      return null;
    }
  }, [toast, fetchData]);

  const handleCreateNewVersion = useCallback(async (setActiveTab) => {
    if (!selectedTemplate || selectedTemplate.status === 'DRAFT') return;
    if (!(await confirm({ message: 'Create an editable copy of this published template? You can then save and publish it as a new version.' }))) return;
    try {
      const newTemplate = await duplicateCVTemplate(selectedTemplate.id);
      if (newTemplate) {
        setSelectedTemplate({ ...newTemplate, status: 'DRAFT' });
        if (setTemplateName) setTemplateName(newTemplate.name || templateName);
        setTemplateConfig(newTemplate.config || templateConfig);
        setActiveTab('builder');
        toast.success('Editable copy created. Edit and use Publish to create a new version.');
      }
      fetchData();
    } catch (err) {
      console.error('Create new version failed:', err);
    }
  }, [toast, confirm, selectedTemplate, templateName, templateConfig, setSelectedTemplate, setTemplateConfig, setTemplateName, fetchData]);

  return {
    toast,
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
  };
}
