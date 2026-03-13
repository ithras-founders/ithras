import React from 'react';
import htm from 'htm';
import { formatDateRange, formatYearsMonths, calculateDurationMonths } from '/core/frontend/src/modules/shared/cv/index.js';

const html = htm.bind(React.createElement);

const sectionHasData = (section, cvData) => {
  const sectionData = cvData[section.id] || {};
  const entries = sectionData.entries || [];
  if (entries.length === 0) return false;
  return entries.some((entry) =>
    Object.entries(entry).some(([k, v]) => {
      if (k.startsWith('_')) return false;
      if (v == null || v === '') return false;
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object') return Object.keys(v).length > 0;
      return true;
    })
  );
};

const formatDateValue = (v) => {
  if (!v) return '';
  if (v instanceof Date) return v.toLocaleDateString();
  if (typeof v === 'object' && (v.year != null || v.month != null)) {
    if (v.month != null && v.year != null) return `${v.month}/${v.year}`;
    return String(v.year ?? v.month ?? '');
  }
  if (typeof v === 'string') return v;
  return '';
};

const extractDisplayText = (v, fieldType) => {
  if (v == null || v === '') return [];
  if (typeof v === 'string' && v.trim()) return [v.slice(0, 80)];
  if (typeof v === 'number') return [String(v)];
  if (v instanceof Date) return [formatDateValue(v)];
  if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
    const str = formatDateValue(v);
    if (str) return [str];
    if (typeof v.text === 'string' && v.text.trim()) return [v.text.slice(0, 60)];
    if (typeof v.label === 'string' && v.label.trim()) return [v.label.slice(0, 60)];
    if (fieldType === 'table' || !fieldType) {
      const vals = Object.values(v).filter((x) => (typeof x === 'string' && x.trim()) || typeof x === 'number');
      return vals.map((x) => String(x).slice(0, 60));
    }
  }
  if (Array.isArray(v)) {
    const texts = [];
    v.slice(0, 5).forEach((x) => {
      if (x == null) return;
      if (typeof x === 'string' && x.trim()) texts.push(x.slice(0, 60));
      else if (x instanceof Date) texts.push(formatDateValue(x));
      else if (typeof x === 'object') {
        if (fieldType === 'table') {
          Object.values(x).filter((val) => (typeof val === 'string' && val.trim()) || typeof val === 'number').forEach((val) => texts.push(String(val).slice(0, 60)));
        } else {
          if (typeof x.text === 'string' && x.text.trim()) texts.push(x.text.slice(0, 60));
          if (typeof x.label === 'string' && x.label.trim()) texts.push(x.label.slice(0, 60));
          if (Array.isArray(x.bullets)) {
            x.bullets.slice(0, 2).forEach((b) => {
              const t = typeof b === 'object' && b?.text ? b.text : (typeof b === 'string' ? b : '');
              if (t && typeof t === 'string') texts.push(t.slice(0, 60));
            });
          }
        }
      }
    });
    return texts;
  }
  return [];
};

const getFieldsForSection = (section) => {
  const fields = (section.entryTypes || [])
    .flatMap((et) => (et.fields || []).filter((f) => f.id && !f.id.startsWith('_')))
    .slice(0, 8);
  if (fields.length > 0) return fields;
  if (section.useDynamicBuckets || section.layoutStyle === 'label_left_content_right') {
    return [{ id: 'buckets', type: 'bucket_list' }];
  }
  if (section.layoutStyle === 'vertical_label_grouped') {
    return [
      { id: 'company', type: 'text' },
      { id: 'role', type: 'text' },
      { id: 'employment_type', type: 'dropdown' },
      { id: 'duration', type: 'text' },
      { id: 'achievementBuckets', type: 'bucket_list' },
    ];
  }
  const tableField = (section.entryTypes || [])[0]?.fields?.find((f) => f.type === 'table');
  if (tableField) return [tableField];
  return [];
};

const getSectionSummary = (section, cvData) => {
  const sectionData = cvData[section.id] || {};
  const entries = sectionData.entries || [];
  if (entries.length === 0) return { count: 0, excerpts: [] };
  const excerpts = [];
  const fields = getFieldsForSection(section);
  entries.slice(0, 3).forEach((entry) => {
    fields.forEach((f) => {
      const v = entry[f.id];
      const texts = extractDisplayText(v, f.type);
      excerpts.push(...texts);
    });
  });
  return { count: entries.length, excerpts: excerpts.slice(0, 4) };
};

const buildRichEntries = (section, cvData) => {
  const sectionData = cvData[section.id] || {};
  const entries = sectionData.entries || [];

  if (section.layoutStyle === 'vertical_label_grouped') {
    return entries.map((entry) => {
      const header = [entry.company, entry.role].filter(Boolean).join(' · ') || entry.employment_type || 'Experience';
      const rangeStr = entry.start_date ? formatDateRange(entry.start_date, entry.end_date) : '';
      const months = rangeStr ? calculateDurationMonths(entry.start_date, entry.end_date) : null;
      const durText = months != null ? formatYearsMonths(months) : '';
      const subheader = entry.duration || rangeStr || '';
      const durationRow = !entry.duration && durText ? durText : '';
      const bullets = [];
      (entry.achievementBuckets || []).forEach((b) => {
        if (typeof b.label === 'string' && b.label.trim()) bullets.push(b.label);
        (b.bullets || []).forEach((item) => {
          const t = typeof item === 'object' && item?.text ? item.text : (typeof item === 'string' ? item : '');
          if (t && typeof t === 'string') bullets.push(t);
        });
      });
      return { header, subheader, durationRow, bullets };
    });
  }

  if (section.useDynamicBuckets || section.layoutStyle === 'label_left_content_right') {
    return entries.map((entry) => {
      const buckets = entry.buckets || [];
      return buckets.map((b) => {
        const header = typeof b.label === 'string' && b.label.trim() ? b.label : 'Category';
        const bullets = (b.bullets || []).map((item) => {
          const t = typeof item === 'object' && item?.text ? item.text : (typeof item === 'string' ? item : '');
          return typeof t === 'string' ? t : '';
        }).filter(Boolean);
        return { header, subheader: '', bullets };
      });
    }).flat();
  }

  const tableField = (section.entryTypes || [])[0]?.fields?.find((f) => f.type === 'table');
  if (tableField) {
    const rows = entries[0]?.[tableField.id] || [];
    return rows.map((row) => {
      const parts = [];
      (tableField.columns || []).forEach((col) => {
        const val = row[col.id];
        if (val != null && val !== '') parts.push(String(val));
      });
      return { header: parts.join(' · '), subheader: '', bullets: [] };
    });
  }

  return entries.map((entry) => {
    const fields = getFieldsForSection(section);
    const header = fields.slice(0, 2).map((f) => entry[f.id]).filter(Boolean).map(String).join(' · ') || 'Entry';
    const bullets = [];
    fields.forEach((f) => {
      const texts = extractDisplayText(entry[f.id], f.type);
      bullets.push(...texts);
    });
    return { header, subheader: '', bullets };
  });
};

const IconGraduation = () => html`<svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>`;
const IconBriefcase = () => html`<svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>`;
const IconTrophy = () => html`<svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806M3 6h18M5 6v6a3 3 0 003 3h8a3 3 0 003-3V6M8 21h8M10 21v-4M14 21v-4"/></svg>`;
const IconMedal = () => html`<svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806M3 6h18M5 6v6a3 3 0 003 3h8a3 3 0 003-3V6"/></svg>`;
const IconBadge = () => html`<svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806M3 6h18M5 6v6a3 3 0 003 3h8a3 3 0 003-3V6m0 4a3 3 0 01-3-3"/></svg>`;
const IconDocument = () => html`<svg className="w-5 h-5 text-[var(--app-accent)]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`;

const SECTION_ICON_MAP = {
  education: IconGraduation,
  experience: IconBriefcase,
  skills: IconBriefcase,
  projects: IconBriefcase,
  achievements: IconTrophy,
  summary: IconDocument,
  academic_qualifications: IconGraduation,
  academic_distinctions: IconMedal,
  extra_curricular: IconTrophy,
  positions_of_responsibility: IconBadge,
  industry_experience: IconBriefcase,
};

const getSectionIcon = (section) => {
  const id = (section.id || '').toLowerCase().replace(/-/g, '_');
  return SECTION_ICON_MAP[id] || IconDocument;
};

const VisualSectionCard = ({ section, cvData, onEdit }) => {
  const hasData = sectionHasData(section, cvData);
  const includedSections = cvData._includedSections || {};
  const isIncluded = section.optional ? includedSections[section.id] !== false : true;

  if (section.optional && !isIncluded) {
    return html`
      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--app-text-muted)] flex items-center gap-2">
            <span className="flex items-center justify-center shrink-0">${getSectionIcon(section)()}</span>${section.title}
          </span>
          <button onClick=${onEdit} className="text-xs text-[var(--app-accent)] hover:text-[var(--app-accent-hover)] font-medium">+ Add</button>
        </div>
      </div>
    `;
  }

  if (!hasData) {
    return html`
      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border-2 border-dashed border-[var(--app-border-soft)] overflow-hidden hover:border-[rgba(0,113,227,0.25)] transition-colors">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center shrink-0">${getSectionIcon(section)()}</span>
            <div>
              <p className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wide">${section.title}</p>
              <p className="text-xs text-[var(--app-text-muted)] mt-0.5">No information added yet</p>
            </div>
          </div>
          <button onClick=${onEdit} className="app-button-ghost px-3 py-2 text-xs font-medium flex items-center gap-1.5">
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add
          </button>
        </div>
      </div>
    `;
  }

  const summary = getSectionSummary(section, cvData);
  const richEntries = buildRichEntries(section, cvData);

  return html`
    <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] overflow-hidden hover:shadow-[var(--app-shadow-subtle)] transition-shadow">
      <div className="px-4 py-3 flex items-center justify-between border-b border-[var(--app-border-soft)] bg-[var(--app-surface-muted)]">
        <div className="flex items-center gap-2">
          <span className="flex items-center justify-center shrink-0">${getSectionIcon(section)()}</span>
          <h3 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wide">${section.title}</h3>
          <span className="text-xs text-[var(--app-text-muted)] bg-[var(--app-bg-elevated)] px-2 py-0.5 rounded-full">${summary.count} ${summary.count === 1 ? 'entry' : 'entries'}</span>
        </div>
        <button onClick=${onEdit} className="app-button-secondary px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </button>
      </div>
      <div className="px-4 py-3 space-y-3">
        ${richEntries.length > 0 ? richEntries.map((entry, i) => html`
          <div key=${i} className="border-l-2 border-[var(--app-accent-soft)] pl-3">
            <div className="text-sm font-semibold text-[var(--app-text-primary)]">${entry.header || 'Entry'}</div>
            ${entry.subheader ? html`<div className="text-xs text-[var(--app-text-muted)] mt-0.5">${entry.subheader}</div>` : ''}
            ${entry.durationRow ? html`<div className="text-xs text-[var(--app-text-muted)] mt-0.5">${entry.durationRow}</div>` : ''}
            ${entry.bullets && entry.bullets.length > 0 ? html`
              <ul className="list-disc list-inside text-xs text-[var(--app-text-secondary)] mt-1 space-y-0.5">
                ${entry.bullets.slice(0, 3).map((b, j) => html`<li key=${j} className="truncate max-w-full" title=${b}>${b.length > 80 ? b.slice(0, 80) + '…' : b}</li>`)}
              </ul>
            ` : ''}
          </div>
        `) : html`
          <div className="flex flex-wrap gap-1.5">
            ${summary.excerpts.filter((e) => typeof e === 'string' && e.length > 0).map((excerpt, i) => html`
              <span key=${i} className="text-xs text-[var(--app-text-secondary)] bg-[var(--app-surface-muted)] px-2 py-1 rounded-[var(--app-radius-sm)] truncate max-w-[200px]" title=${excerpt}>
                ${excerpt.length > 50 ? excerpt.slice(0, 50) + '…' : excerpt}
              </span>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
};

export default VisualSectionCard;
