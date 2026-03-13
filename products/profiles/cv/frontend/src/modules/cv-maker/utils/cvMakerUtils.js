export const initials = (name = '') =>
  name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('');

export const sectionHasData = (section, cvData) => {
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

export const countWords = (data) => {
  let words = 0;
  const visit = (value) => {
    if (value == null) return;
    if (typeof value === 'string') {
      words += value.trim().split(/\s+/).filter(Boolean).length;
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (typeof value === 'object') {
      Object.values(value).forEach(visit);
    }
  };
  visit(data);
  return words;
};

export const readingScore = (words) => {
  if (words < 120) return 'Needs depth';
  if (words < 300) return 'Good';
  if (words < 600) return 'Strong';
  return 'Detailed';
};
