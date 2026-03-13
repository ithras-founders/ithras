/**
 * Migrates legacy CV data format to the new dynamic bucket format.
 * - label_left_content_right with subCategories: entry[fieldId] -> entry.buckets
 * - industry_experience: entry.achievements (flat) -> entry.achievementBuckets
 */

function migrateEntryToBuckets(entry, subCategories) {
  if (!entry || !Array.isArray(subCategories) || subCategories.length === 0) return entry;
  if (Array.isArray(entry.buckets) && entry.buckets.length > 0) return entry;

  const buckets = subCategories.map((sub) => {
    const raw = entry[sub.fieldId];
    const bullets = Array.isArray(raw)
      ? raw.map((it) => (it && typeof it === 'object' && 'text' in it ? it : { text: String(it || ''), proofUrl: '' }))
      : [];
    return { label: sub.label, bullets };
  });
  const excludeKeys = new Set(subCategories.map((s) => s.fieldId).filter(Boolean));
  const rest = Object.fromEntries(Object.entries(entry).filter(([k]) => !excludeKeys.has(k)));
  return { ...rest, buckets };
}

function migrateAchievementsToBuckets(entry) {
  if (!entry) return entry;
  if (Array.isArray(entry.achievementBuckets) && entry.achievementBuckets.length > 0) return entry;

  const raw = entry.achievements;
  if (!Array.isArray(raw) || raw.length === 0) return entry;

  const bullets = raw.map((it) =>
    it && typeof it === 'object' && 'text' in it ? it : { text: String(it || ''), proofUrl: '' }
  );
  const { achievements, ...rest } = entry;
  return { ...rest, achievementBuckets: [{ label: 'Key Achievements', bullets }] };
}

/**
 * Migrates cvData to the new format.
 * @param {Object} cvData - Raw CV data from API
 * @param {Object} template - Full template with config.sections
 * @returns {Object} Migrated cvData
 */
export function migrateCVData(cvData, template) {
  if (!cvData || typeof cvData !== 'object') return cvData;

  const sections = Array.isArray(template?.config?.sections) ? template.config.sections : [];
  const result = { ...cvData };

  sections.forEach((section) => {
    const sectionId = section.id;
    const sectionData = result[sectionId];
    if (!sectionData || !sectionData.entries) return;

    if (section.layoutStyle === 'label_left_content_right' && section.useDynamicBuckets) {
      const subs = section.subCategories || [];
      result[sectionId] = {
        ...sectionData,
        entries: sectionData.entries.map((entry) => migrateEntryToBuckets(entry, subs)),
      };
    }

    if (section.layoutStyle === 'vertical_label_grouped' && section.verticalLabelFieldId) {
      result[sectionId] = {
        ...sectionData,
        entries: sectionData.entries.map((entry) => migrateAchievementsToBuckets(entry)),
      };
    }
  });

  return result;
}
