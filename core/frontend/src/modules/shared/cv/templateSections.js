/**
 * Utilities to derive editable sections from template config or legacy top-level sections/fields.
 * Used by CVEditor (cv-maker) and CV preview.
 */

const slugify = (s) => String(s || '').replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'section';

const DEFAULT_FIELD = { id: 'content', type: 'text', label: 'Content', required: false };

/**
 * Ensures a section has at least one entry type with at least one field so it's editable.
 * For label_left_content_right with subCategories, derives bullet_list fields from subCategories (LHS buckets).
 */
function ensureEditableSection(section, idx) {
  const subs = Array.isArray(section.subCategories) ? section.subCategories : [];
  const isLabelLeft = section.layoutStyle === 'label_left_content_right';
  const hasDynamicBuckets = isLabelLeft && section.useDynamicBuckets;
  const hasStaticSubs = isLabelLeft && subs.length > 0;

  let entryTypes = section.entryTypes || [];
  if (entryTypes.length === 0) {
    entryTypes = [{
      id: 'default',
      name: 'Entry',
      repeatable: false,
      fields: [{ ...DEFAULT_FIELD, id: `field_${section.id || idx}_0` }]
    }];
  } else {
    entryTypes = entryTypes.map((et, etIdx) => {
      const fields = et.fields || [];
      if (fields.length === 0) {
        if (hasDynamicBuckets) {
          return {
            ...et,
            fields: [{
              id: 'buckets',
              type: 'bucket_list',
              label: 'Categories',
              richText: true,
              bulletDateFormat: 'trailing_year',
              allowProofPerItem: true,
              labelWidth: section.sectionHeaderStyle?.labelWidth || '1.5in',
            }]
          };
        }
        if (hasStaticSubs) {
          const syntheticFields = subs.map((sub) => ({
            id: sub.fieldId || `sub_${sub.label?.replace(/\s+/g, '_').toLowerCase() || etIdx}`,
            type: 'bullet_list',
            label: sub.label || 'Bullets',
            richText: sub.richText ?? true,
            bulletDateFormat: sub.bulletDateFormat || 'trailing_year',
            allowProofPerItem: true,
          }));
          return { ...et, fields: syntheticFields };
        }
        return {
          ...et,
          fields: [{ ...DEFAULT_FIELD, id: `field_${section.id || idx}_${et.id || etIdx}` }]
        };
      }
      return et;
    });
  }
  return { ...section, entryTypes };
}

/**
 * Derives editable sections from a template. Handles both:
 * - config.sections (new format with entryTypes and fields)
 * - top-level sections + fields (legacy format from PDF analysis)
 *
 * Returns config.sections whenever they exist, even with empty entryTypes/fields.
 * Injects minimal default structure so students always see editable sections.
 */
export function deriveEditableSections(template) {
  if (!template) return [];

  const raw = template?.config?.sections;
  const configSections = Array.isArray(raw)
    ? raw
    : typeof raw === 'object' && raw !== null
      ? Object.values(raw)
      : [];
  if (configSections.length > 0) {
    return configSections.map((s, idx) => ensureEditableSection(s, idx));
  }

  const legacySections = Array.isArray(template?.sections) ? template.sections : [];
  const legacyFields = template?.fields && typeof template.fields === 'object' ? template.fields : {};
  if (legacySections.length > 0) {
    return legacySections.map((name, idx) => {
      const id = slugify(name) || `section_${idx}`;
      const fieldNames = Array.isArray(legacyFields[name])
        ? legacyFields[name]
        : (typeof legacyFields[name] === 'string' ? [legacyFields[name]] : []);
      const fields = fieldNames.length > 0
        ? fieldNames.map((fn, fi) => ({
            id: slugify(fn) || `field_${fi}`,
            type: 'text',
            label: fn
          }))
        : [{ ...DEFAULT_FIELD, id: `field_${id}_0` }];
      return {
        id,
        title: name,
        mandatory: false,
        entryTypes: [
          { id: 'default', name: 'Entry', repeatable: false, fields }
        ]
      };
    });
  }

  const tsSections = template?.template_structure?.sections;
  if (Array.isArray(tsSections) && tsSections.length > 0) {
    return tsSections.map((s, idx) => {
      const id = s.id || slugify(s.title) || `section_${idx}`;
      const title = s.title || s.id || `Section ${idx + 1}`;
      return { id, title, mandatory: false, entryTypes: [{ id: 'default', name: 'Entry', repeatable: false, fields: [{ ...DEFAULT_FIELD, id: `field_${id}_0` }] }] };
    }).map((s, idx) => ensureEditableSection(s, idx));
  }
  return [];
}

/**
 * Generic placeholder pools -- institution-agnostic.
 * Keyed by common field id/label patterns so any template structure gets realistic data.
 */
const PLACEHOLDER_POOLS = {
  degree:      ['MBA', 'B.Tech Computer Science', 'Class XII', 'Class X'],
  institute:   ['Sample University', 'Institute of Technology', 'State Board', 'CBSE'],
  percentage:  ['8.2/10', '9.04/10', '92.4%', '95.6%'],
  cgpa:        ['8.2/10', '9.04/10', '7.5/10', '8.8/10'],
  rank:        ['12/180', '8/120', '99%ile', '3/45'],
  year:        ['2026', '2024', '2022', '2020'],
  company:     ['Acme Corp', 'TechVentures Inc', 'Global Analytics'],
  organization:['Acme Corp', 'TechVentures Inc', 'Global Analytics'],
  role:        ['Business Analyst', 'Software Engineer Intern', 'Marketing Lead'],
  title:       ['Business Analyst', 'Software Engineer Intern', 'Marketing Lead'],
  designation: ['Business Analyst', 'Software Engineer Intern', 'Marketing Lead'],
  position:    ['President', 'Vice President', 'Secretary'],
  duration:    ['Jun 2023 - May 2024', 'Jan 2022 - Jun 2022', 'May 2021 - Jul 2021'],
  period:      ['Jun 2023 - May 2024', 'Jan 2022 - Jun 2022', 'May 2021 - Jul 2021'],
  location:    ['Mumbai', 'Bangalore', 'New Delhi'],
  city:        ['Mumbai', 'Bangalore', 'New Delhi'],
  skill:       ['Python, SQL, Tableau', 'Financial Modelling, Valuation', 'Strategic Planning, Market Research'],
  language:    ['English (Fluent)', 'Hindi (Native)', 'French (Intermediate)'],
  interest:    ['Cricket, Badminton', 'Music, Public Speaking', 'Trekking, Photography'],
  score:       ['720', '95.4%', '8.8/10', '335'],
  board:       ['CBSE', 'ICSE', 'State Board', 'IB'],
};

const BULLET_POOLS = [
  [
    'Led cross-functional team of **12** to deliver revenue growth of **15% YoY** 2024',
    'Built automated reporting pipeline reducing manual effort by **40+ hours/month** 2024',
    'Conducted market analysis across **5 segments** to identify **$2M** growth opportunity 2023',
  ],
  [
    'Designed and launched customer engagement program increasing retention by **18%** 2024',
    'Managed end-to-end product roadmap for **3 features** with **50K+** monthly active users 2023',
    'Reduced operational costs by **22%** through process re-engineering and automation 2023',
  ],
  [
    'Received **merit scholarship** for scoring in top 5% of batch 2023',
    'National finalist in inter-college business case competition 2022',
    'Selected for prestigious leadership exchange program 2022',
  ],
];

function getPlaceholder(fieldId, fieldLabel, fieldType, entryIdx) {
  const id = (fieldId || '').toLowerCase();
  const label = (fieldLabel || '').toLowerCase();

  if (fieldType === 'bullet_list') {
    return BULLET_POOLS[entryIdx % BULLET_POOLS.length];
  }

  for (const [key, values] of Object.entries(PLACEHOLDER_POOLS)) {
    if (id.includes(key) || label.includes(key)) {
      return values[entryIdx % values.length];
    }
  }

  if (id.includes('name') || label.includes('name')) return PLACEHOLDER_POOLS.company[entryIdx % PLACEHOLDER_POOLS.company.length];
  if (id.includes('date') || label.includes('date')) return PLACEHOLDER_POOLS.duration[entryIdx % PLACEHOLDER_POOLS.duration.length];
  if (id.includes('type') || label.includes('type')) return ['Full Time', 'Part Time', 'Intern'][entryIdx % 3];

  return `Sample ${fieldLabel || fieldId}`;
}

/**
 * Generates bullet placeholders for a subcategory.
 * Uses the subcategory label to pick a contextually reasonable pool,
 * then falls back to a generic achievement pool.
 */
function getSubcategoryBullets(sub, subIdx) {
  return BULLET_POOLS[subIdx % BULLET_POOLS.length];
}

/**
 * Infer sensible group labels for vertical_label_grouped sections
 * by examining the verticalLabelFieldId name.
 */
function inferGroupLabels(fieldId) {
  const id = (fieldId || '').toLowerCase();
  if (id.includes('employ') || id.includes('type') || id.includes('category'))
    return ['Full Time', 'Intern'];
  if (id.includes('level') || id.includes('tier'))
    return ['Senior', 'Junior'];
  return ['Group A', 'Group B'];
}

/**
 * Generates dummy CV data for preview, given sections (from deriveEditableSections).
 * All placeholder data is generic and institution-agnostic so it works
 * for any template structure from any college.
 */
export function getDummyCVDataFromSections(sections) {
  const data = {};
  (sections || []).forEach(section => {
    const subs = Array.isArray(section.subCategories) ? section.subCategories : [];
    const isLabelContent = section.layoutStyle === 'label_left_content_right';
    const isGrouped = section.layoutStyle === 'vertical_label_grouped' && section.verticalLabelFieldId;

    if (isLabelContent) {
      if (section.useDynamicBuckets) {
        const dummyLabels = subs.length > 0
          ? subs.map(s => s.label)
          : ['Category A', 'Category B', 'Category C'];
        const buckets = dummyLabels.map((label, subIdx) => ({
          label,
          bullets: BULLET_POOLS[subIdx % BULLET_POOLS.length].map(b => (typeof b === 'object' && b?.text != null ? b : { text: String(b || ''), proofUrl: '' }))
        }));
        data[section.id] = { entries: [{ buckets }] };
      } else if (subs.length > 0) {
        const entry = {};
        subs.forEach((sub, subIdx) => {
          entry[sub.fieldId] = getSubcategoryBullets(sub, subIdx);
        });
        data[section.id] = { entries: [entry] };
      }
      return;
    }

    if (isGrouped) {
      const groupField = section.verticalLabelFieldId;
      const hdrFields = Array.isArray(section.headerFields) ? section.headerFields : [];
      const groupLabels = inferGroupLabels(groupField);
      const defaultAchievementBuckets = section.defaultAchievementBuckets || ['Achievement Area A', 'Achievement Area B'];
      const entries = [];

      groupLabels.forEach((groupLabel, gIdx) => {
        const et = (section.entryTypes || [])[0];
        const fields = et ? (et.fields || []) : [];
        const entry = { [groupField]: groupLabel };
        fields.forEach(f => {
          if (f.id === 'achievementBuckets') {
            const bucketLabels = defaultAchievementBuckets;
            entry.achievementBuckets = bucketLabels.map((label, bIdx) => ({
              label: typeof label === 'string' ? label : label?.label || 'Category',
              bullets: BULLET_POOLS[(gIdx + bIdx) % BULLET_POOLS.length].map(b =>
                typeof b === 'object' && b?.text != null ? b : { text: String(b || ''), proofUrl: '' }
              )
            }));
          } else if (f.type === 'table') {
            const cols = f.columns || [{ id: 'col1', label: 'Column' }];
            const rows = [];
            for (let r = 0; r < Math.min(cols.length > 3 ? 4 : 2, 4); r++) {
              const row = {};
              cols.forEach(col => { row[col.id] = getPlaceholder(col.id, col.label, 'text', r); });
              rows.push(row);
            }
            entry[f.id] = rows;
          } else if (f.type === 'toggle') {
            entry[f.id] = true;
          } else if (f.id !== 'achievements') {
            entry[f.id] = getPlaceholder(f.id, f.label, f.type, gIdx);
          }
        });
        entries.push(entry);
      });

      data[section.id] = { entries };
      return;
    }

    const entries = [];
    let globalEntryIdx = 0;
    (section.entryTypes || []).forEach(et => {
      const fillEntry = (idx) => {
        const entry = {};
        (et.fields || []).forEach(f => {
          if (f.type === 'table') {
            const cols = f.columns || [{ id: 'col1', label: 'Column' }];
            const rowCount = Math.min(cols.length > 3 ? 4 : 2, 4);
            const rows = [];
            for (let r = 0; r < rowCount; r++) {
              const row = {};
              cols.forEach(col => { row[col.id] = getPlaceholder(col.id, col.label, 'text', r); });
              rows.push(row);
            }
            entry[f.id] = rows;
          } else if (f.type === 'toggle') {
            entry[f.id] = true;
          } else {
            entry[f.id] = getPlaceholder(f.id, f.label, f.type, idx);
          }
        });
        return entry;
      };
      if (et.repeatable) {
        const count = Math.min(et.maxEntries || 2, 2);
        for (let i = 0; i < count; i++) {
          entries.push(fillEntry(globalEntryIdx++));
        }
      } else {
        const s = fillEntry(globalEntryIdx++);
        if (entries.length === 0) entries.push(s);
        else Object.assign(entries[0], s);
      }
    });
    data[section.id] = { entries: entries.length ? entries : [{}] };
  });
  return data;
}

/**
 * Convenience: derive sections from template, then get dummy data.
 */
export function getDummyCVDataForTemplate(template) {
  const sections = deriveEditableSections(template);
  return getDummyCVDataFromSections(sections);
}
