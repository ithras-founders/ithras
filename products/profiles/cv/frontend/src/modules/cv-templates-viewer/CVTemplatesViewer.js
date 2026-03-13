import React, { useState, useEffect, useMemo } from 'react';
import htm from 'htm';
import {
  getCVTemplates,
  getCVTemplate,
  getInstitutionStructure,
  getPrograms,
  getBatches,
  getInstitutions,
} from '/core/frontend/src/modules/shared/services/api.js';
import TemplateVisibilitySettingsPage from './TemplateVisibilitySettingsPage.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import {
  DynamicCVPreview,
  getDummyCVDataForTemplate,
} from '/core/frontend/src/modules/shared/cv/index.js';
import { useTutorialContext } from '/core/frontend/src/modules/tutorials/index.js';
import { getTutorialMockData } from '/core/frontend/src/modules/tutorials/context/tutorialMockData.js';

const html = htm.bind(React.createElement);

/** Group templates by Global vs Institutional, then by group_label */
function groupTemplates(templates) {
  const global = [];
  const institutional = {};
  for (const t of templates) {
    const group = t.group || (t.institution_id ? 'institutional' : 'global');
    const label = t.group_label || (t.institution_id ? (t.college_slug || t.institution_id) : 'Global');
    if (group === 'global') {
      global.push(t);
    } else {
      if (!institutional[label]) institutional[label] = [];
      institutional[label].push(t);
    }
  }
  return { global, institutional };
}

const CVTemplatesViewer = ({ user }) => {
  const toast = useToast();
  const { isTutorialMode, getTutorialData } = useTutorialContext();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [programMap, setProgramMap] = useState({});
  const [batchMap, setBatchMap] = useState({});
  const [activeTab, setActiveTab] = useState('global');
  const [institutions, setInstitutions] = useState([]);
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [visibilitySettingsTemplate, setVisibilitySettingsTemplate] = useState(null);
  const [visibilityOverrides, setVisibilityOverrides] = useState({});

  useEffect(() => {
    if (isTutorialMode) {
      const mock = getTutorialData('PLACEMENT_TEAM') ?? getTutorialMockData('PLACEMENT_TEAM');
      setTemplates((mock.cvTemplates || []).filter((t) => t.status === 'PUBLISHED'));
      setLoading(false);
      return;
    }
    loadTemplates();
  }, [isTutorialMode]);

  useEffect(() => {
    if (!isTutorialMode) {
      getInstitutions({ limit: 100 })
        .then((r) => setInstitutions(r?.items ?? []))
        .catch(() => setInstitutions([]));
    }
  }, [isTutorialMode]);

  useEffect(() => {
    async function loadStructure() {
      if (templates.length === 0) return;
      const instIds = [...new Set(templates.map((t) => t.institution_id).filter(Boolean))];
      const pm = {};
      const bm = {};
      for (const instId of instIds) {
        try {
          const structure = await getInstitutionStructure(instId);
          if (structure?.programs) {
            for (const p of structure.programs) pm[p.id] = p.name;
          }
          if (structure?.batches_by_program) {
            for (const batches of Object.values(structure.batches_by_program)) {
              for (const b of batches) bm[b.id] = b.name;
            }
          }
        } catch {
          try {
            const progs = await getPrograms(instId);
            for (const p of progs || []) pm[p.id] = p.name;
            for (const p of progs || []) {
              const batches = await getBatches({ program_id: p.id }).catch(() => []);
              for (const b of batches || []) bm[b.id] = b.name;
            }
          } catch {}
        }
      }
      setProgramMap((prev) => ({ ...prev, ...pm }));
      setBatchMap((prev) => ({ ...prev, ...bm }));
    }
    loadStructure();
  }, [templates]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const resp = await getCVTemplates(null, null, { limit: 100, include_visibility: true }).catch(() => ({ items: [] }));
      const items = resp?.items ?? resp;
      const list = Array.isArray(items) ? items : (items?.items || []);
      const published = list.filter((t) => t.status === 'PUBLISHED');
      setTemplates(published);
    } catch (err) {
      console.error('CVTemplatesViewer load:', err);
      toast.error('Failed to load templates');
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (template) => {
    if (isTutorialMode) {
      setPreviewTemplate(template);
      return;
    }
    try {
      const full = await getCVTemplate(template.id);
      setPreviewTemplate(full);
    } catch (err) {
      toast.error('Failed to load template');
    }
  };

  const { global: globalTemplates, institutional: institutionalGroups } = useMemo(
    () => groupTemplates(templates),
    [templates]
  );

  const institutionalTemplatesFiltered = useMemo(() => {
    const all = Object.entries(institutionalGroups).flatMap(([, items]) => items);
    if (!institutionFilter) return all;
    const inst = institutions.find((i) => i.id === institutionFilter || i.name === institutionFilter);
    const instId = inst?.id || institutionFilter;
    return all.filter((t) => t.institution_id === instId || t.college_slug === instId);
  }, [institutionalGroups, institutionFilter, institutions]);

  const VisibilityBadge = ({ template, override }) => {
    const batchIds = (override?.batch_ids != null ? override.batch_ids : template.batch_ids) || [];
    const programIds = (override?.program_ids != null ? override.program_ids : template.program_ids) || [];
    const institutionIds = override?.institution_ids;
    const allBatches = batchIds.length === 0;
    const allPrograms = programIds.length === 0;
    const allInstitutions = institutionIds == null || institutionIds.length === 0;
    if (allBatches && allPrograms && allInstitutions)
      return html`<span className="text-xs text-[var(--app-text-muted)]">Visible to all</span>`;
    const parts = [];
    if (!allInstitutions)
      parts.push(`Institutions: ${(institutionIds || []).map((id) => institutions.find((i) => i.id === id)?.name || id).join(', ')}`);
    if (allBatches) parts.push('All batches');
    else parts.push(`Batches: ${batchIds.map((id) => batchMap[id] || id).join(', ')}`);
    if (allPrograms) parts.push('All programs');
    else parts.push(`Programs: ${programIds.map((id) => programMap[id] || id).join(', ')}`);
    return html`<span className="text-xs text-[var(--app-text-muted)]">${parts.join(' • ')}</span>`;
  };

  const TemplateCard = ({ tpl }) => html`
    <div
      key=${tpl.id}
      className="border rounded-[var(--app-radius-sm)] p-4 bg-[var(--app-surface)] hover:bg-[var(--app-surface-muted)] transition-colors flex justify-between items-start gap-4"
    >
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-[var(--app-text-primary)]">${tpl.name || tpl.id}</h3>
        <div className="mt-1">
          <${VisibilityBadge} template=${tpl} override=${visibilityOverrides[tpl.id]} />
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        ${!isTutorialMode ? html`
          <button
            onClick=${() => setVisibilitySettingsTemplate(tpl)}
            className="p-2 rounded-[var(--app-radius-sm)] hover:bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]"
            title="Visibility settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-1.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h1.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v1.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-1.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        ` : null}
        <button
          onClick=${() => handlePreview(tpl)}
          className="px-4 py-2 text-sm font-medium bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] hover:bg-[var(--app-accent-hover)]"
        >
          Preview
        </button>
      </div>
    </div>
  `;

  const GroupSection = ({ title, items }) =>
    items.length === 0
      ? null
      : html`
          <div className="space-y-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--app-text-muted)]">${title}</h3>
            <div className="space-y-4">
              ${items.map((tpl) => html`<${TemplateCard} key=${tpl.id} tpl=${tpl} />`)}
            </div>
          </div>
        `;

  if (loading) {
    return html`
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-2 border-[var(--app-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-[var(--app-text-secondary)]">Loading templates...</p>
      </div>
    `;
  }

  const hasContent = globalTemplates.length > 0 || Object.keys(institutionalGroups).length > 0;
  const instOptions = institutions.map((i) => ({ id: i.id, name: i.name }));

  if (visibilitySettingsTemplate) {
    return html`
      <${TemplateVisibilitySettingsPage}
        template=${visibilitySettingsTemplate}
        onBack=${() => setVisibilitySettingsTemplate(null)}
        onSaved=${(override) => {
          setVisibilityOverrides((prev) => ({
            ...prev,
            [visibilitySettingsTemplate.id]: override,
          }));
          toast.success('Visibility updated');
          setVisibilitySettingsTemplate(null);
        }}
      />
    `;
  }

  return html`
    <div className="p-6 w-full max-w-none">
      <div className="flex items-center gap-6 mb-6 border-b border-[var(--app-border-soft)]">
        <button
          onClick=${() => setActiveTab('global')}
          className=${`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'global' ? 'border-[var(--app-accent)] text-[var(--app-accent)]' : 'border-transparent text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Global
        </button>
        <button
          onClick=${() => setActiveTab('institutional')}
          className=${`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === 'institutional' ? 'border-[var(--app-accent)] text-[var(--app-accent)]' : 'border-transparent text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
        >
          Institutional
        </button>
        ${activeTab === 'institutional' && instOptions.length > 0 ? html`
          <div className="ml-auto flex items-center gap-2">
            <label htmlFor="inst-filter" className="text-sm text-[var(--app-text-muted)]">Institution</label>
            <select
              id="inst-filter"
              value=${institutionFilter}
              onChange=${(e) => setInstitutionFilter(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-[var(--app-radius-sm)] border border-[var(--app-border-soft)] bg-[var(--app-bg)] text-[var(--app-text-primary)]"
            >
              <option value="">All institutions</option>
              ${instOptions.map((o) => html`<option key=${o.id} value=${o.id}>${o.name}</option>`)}
            </select>
          </div>
        ` : null}
      </div>

      ${!hasContent
        ? html`
            <div
              className="border rounded-[var(--app-radius-sm)] p-12 text-center text-[var(--app-text-muted)] bg-[var(--app-surface-muted)]"
            >
              No published templates available.
            </div>
          `
        : activeTab === 'global'
          ? html`<div className="space-y-4"><${GroupSection} title="" items=${globalTemplates} /></div>`
          : html`
              <div className="space-y-4">
                ${institutionalTemplatesFiltered.length === 0
                  ? html`<div className="p-8 text-center text-[var(--app-text-muted)]">No templates for selected institution.</div>`
                  : institutionalTemplatesFiltered.map((tpl) => html`<${TemplateCard} key=${tpl.id} tpl=${tpl} />`)}
              </div>
            `}

      ${previewTemplate &&
      html`
        <div className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex items-center justify-center p-4 overflow-auto">
          <div
            className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] max-w-4xl w-full max-h-[90vh] overflow-auto shadow-[var(--app-shadow-floating)]"
          >
            <div
              className="p-4 border-b border-[var(--app-border-soft)] flex justify-between items-center sticky top-0 bg-[var(--app-surface)] z-10"
            >
              <h3 className="text-lg font-semibold">${previewTemplate.name || previewTemplate.id}</h3>
              <button
                onClick=${() => setPreviewTemplate(null)}
                className="px-4 py-2 text-sm font-medium bg-[var(--app-bg-elevated)] rounded-[var(--app-radius-sm)] hover:bg-[var(--app-border-soft)]"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <${DynamicCVPreview}
                template=${previewTemplate}
                cvData=${getDummyCVDataForTemplate(previewTemplate)}
                user=${{ name: 'Preview User', email: 'preview@example.com', roll_number: 'MBA/0188/61' }}
              />
            </div>
          </div>
        </div>
      `}
    </div>
  `;
};

export default CVTemplatesViewer;
