import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { Lock, BadgeCheck, Mail, Pencil, FileDown, UserPlus, UserCheck } from 'lucide-react';
import {
  getFeedEngagement,
  getApplications,
  getShortlists,
  getOffers,
} from '/core/frontend/src/modules/shared/services/api.js';
import ProfileCalendarSection from './ProfileCalendarSection.js';
import { useNetworkStatus } from '/core/frontend/src/modules/shared/hooks/useNetworkStatus.js';
import {
  getInstitutionLogoUrl,
  getInstitutionLogoFallback,
  getCompanyLogoUrl,
  getCompanyLogoFallback,
} from '/core/frontend/src/modules/shared/utils/logoUtils.js';
import { formatDateRange, formatYearsMonths, calculateDurationMonths } from '/core/frontend/src/modules/shared/cv/index.js';

const html = htm.bind(React.createElement);

const formatDate = (d) => {
  if (!d) return '';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const extractSection = (cvData, sectionKeys) => {
  if (!cvData || typeof cvData !== 'object') return null;
  const data = cvData.data || cvData;
  for (const key of sectionKeys) {
    const val = data[key] ?? data[key?.toLowerCase?.()];
    if (val !== undefined && val !== null) return val;
  }
  return null;
};

const normalizeSectionEntries = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val.entries && Array.isArray(val.entries)) {
    const flattened = [];
    for (const entry of val.entries) {
      const tableKey = Object.keys(entry || {}).find((k) => k && (k.includes('table') || k.includes('qualifications')));
      const rows = tableKey && entry[tableKey];
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
            flattened.push({
              degree: row.degree,
              institution: row.institution || row.institute,
              institute: row.institute || row.institution,
              percentage: row.percentage,
              year: row.year,
            });
          } else if (Array.isArray(row) && row.length >= 2) {
            flattened.push({
              degree: row[0],
              institute: row[1],
              institution: row[1],
              percentage: row[2],
              year: row[4],
            });
          }
        }
      } else {
        flattened.push(entry);
      }
    }
    return flattened.length ? flattened : val.entries;
  }
  if (val.default && typeof val.default === 'object') {
    const d = val.default;
    if (Array.isArray(d)) return d;
    if (d.entries && Array.isArray(d.entries)) return d.entries;
    const tableKey = Object.keys(d).find((k) => k && (k.includes('table') || k.includes('qualifications')));
    if (tableKey && d[tableKey]) {
      const t = d[tableKey];
      if (Array.isArray(t) && t.length > 0) {
        const first = t[0];
        if (Array.isArray(first)) return t.map((row) => ({ degree: row[0], institute: row[1], percentage: row[2], year: row[4] }));
        if (typeof first === 'object') return Array.isArray(t) ? t : [t];
      }
    }
  }
  return [val];
};

/** Normalize bucket_list sections (positions, extra-curricular) to flat { label, bullets }[]. */
const normalizeBucketSection = (val) => {
  if (!val) return [];
  const entries = val.entries || (Array.isArray(val) ? val : [val]);
  const out = [];
  for (const entry of entries) {
    const buckets = entry.buckets || [];
    for (const b of buckets) {
      const bullets = Array.isArray(b.bullets) ? b.bullets : [];
      const label = b.label || b.title || '';
      if (label || bullets.length > 0) out.push({ label, bullets });
    }
  }
  return out;
};

/** Visibility pill: Public | Private | Restricted */
const VisibilityPill = ({ visibility }) => {
  if (!visibility || visibility === 'public') return null;
  const classes = visibility === 'private'
    ? 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'
    : 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] border border-[var(--app-border-soft)]';
  return html`
    <span className=${`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider ${classes}`}>
      ${visibility === 'private' ? html`<${Lock} className="w-3 h-3" strokeWidth={2} />` : null}
      ${typeof visibility === 'string' ? visibility : (visibility?.label || visibility?.id || String(visibility ?? ''))}
    </span>
  `;
};

/** Section header with optional edit button when own profile. */
const SectionHeader = ({ title, visibility, onEdit, showVisPill = true }) => html`
  <div className="flex items-center justify-between gap-2 mb-4">
    <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider min-w-0">${title}</h2>
    <div className="flex items-center gap-2 flex-shrink-0">
      ${showVisPill && visibility && visibility !== 'public' ? html`<${VisibilityPill} visibility=${visibility} />` : null}
      ${onEdit ? html`
        <button
          onClick=${onEdit}
          aria-label="Edit ${title}"
          className="p-2 rounded-[var(--app-radius-sm)] text-[var(--app-text-secondary)] hover:text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] transition-colors"
          title="Edit"
        >
          <${Pencil} className="w-4 h-4" strokeWidth={1.5} />
        </button>
      ` : null}
    </div>
  </div>
`;

/** Empty section placeholder when viewing own profile - allows add/edit. */
const EmptySectionPlaceholder = ({ title, onEdit }) => html`
  <div className="flex flex-col items-center justify-center py-8 px-6 border border-dashed border-[var(--app-border-soft)] rounded-lg bg-[var(--app-surface-muted)]/30">
    <p className="text-sm text-[var(--app-text-muted)]">No ${title.toLowerCase()} yet</p>
    ${onEdit ? html`
      <button
        onClick=${onEdit}
        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] rounded-lg transition-colors"
      >
        <${Pencil} className="w-3.5 h-3.5" strokeWidth={1.5} />
        Add
      </button>
    ` : null}
  </div>
`;

/** Placeholder for hidden/restricted content. Preserves layout rhythm. */
const LockedSectionPlaceholder = ({ title, visibility }) => html`
  <div className="flex flex-col items-center justify-center py-12 px-6 border border-[var(--app-border-soft)] rounded-lg bg-[var(--app-surface-muted)]/50">
    <${Lock} className="w-8 h-8 text-[var(--app-text-muted)] mb-3" strokeWidth={1.5} />
    <p className="text-sm font-medium text-[var(--app-text-secondary)]">${title} is ${visibility === 'private' ? 'private' : 'restricted'}</p>
    <p className="text-xs text-[var(--app-text-muted)] mt-1">Only visible to approved viewers</p>
  </div>
`;

/**
 * Premium Digital CV profile view.
 * Professional dossier aesthetic: executive, high-trust, refined.
 * Supports visibility (public | private | restricted) per section.
 */
const UnifiedProfileView = ({
  profileData,
  profile: legacyProfile,
  cvData: legacyCvData,
  onBack,
  viewer,
  backLabel = 'Back',
  visibility = {},
  navigate,
  onEditSection,
  onGenerateCV,
  exportingPdf = false,
  emailHidden = false,
  onMessage,
}) => {
  const user = profileData?.user || legacyProfile;
  const institutionLinks = profileData?.institution_links || [];
  const organizationLinks = profileData?.organization_links || [];
  const profileType = profileData?.profile_type || 'public';

  const cvData = profileData?.user ? legacyCvData : (legacyCvData || {});
  const cvDataResolved = cvData?.data ? { ...cvData, data: cvData.data } : cvData;

  const name = user?.name || user?.email || 'User';
  const toStr = (v) => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v !== null) return v.name || v.label || v.id || v.text || v.range || '';
    return String(v);
  };
  /** Safe for React children - never returns object */
  const safeDisplay = (v) => {
    if (v == null || v === false) return '';
    if (typeof v === 'string' || typeof v === 'number') return String(v);
    if (typeof v === 'object') return toStr(v) || '';
    return String(v);
  };
  const headline = toStr(user?.headline || user?.student_subtype || user?.role) || 'Professional';
  const photoUrl = user?.profile_photo_url || null;
  const initial = name.trim().charAt(0).toUpperCase();
  const isVerified = user?.is_verified === true;
  const email = user?.email || null;

  const isRecruiter = viewer?.role === 'RECRUITER';
  const isOwnProfile = viewer?.id && user?.id && viewer.id === user.id;
  const showNetworkButton = viewer && user?.id && !isOwnProfile;
  const showPlacementStats = isRecruiter && profileType === 'student';

  const [engagement, setEngagement] = useState(null);
  const { loading: networkLoading, toggle: handleNetworkClick, label: networkButtonLabel, status: networkStatus } = useNetworkStatus(user?.id, viewer);
  const [applicationsCount, setApplicationsCount] = useState(0);
  const [shortlistsCount, setShortlistsCount] = useState(0);
  const [offersCount, setOffersCount] = useState(0);

  useEffect(() => {
    if (isRecruiter && user?.id) {
      getFeedEngagement(user.id).then(setEngagement).catch(() => setEngagement(null));
    }
  }, [isRecruiter, user?.id]);

  useEffect(() => {
    if (showPlacementStats && user?.id) {
      Promise.all([
        getApplications({ student_id: user.id }).catch(() => []),
        getShortlists({ candidate_id: user.id }).catch(() => []),
        getOffers().catch(() => []),
      ]).then(([apps, shorts, offs]) => {
        const appsList = Array.isArray(apps) ? apps : apps?.items ?? [];
        const shortsList = Array.isArray(shorts) ? shorts : shorts?.items ?? [];
        const offsList = Array.isArray(offs) ? offs : offs?.items ?? [];
        setApplicationsCount(appsList.length);
        setShortlistsCount(shortsList.length);
        setOffersCount(offsList.filter((o) => o.candidate_id === user.id).length);
      });
    }
  }, [showPlacementStats, user?.id]);

  const summary = extractSection(cvDataResolved, ['summary', 'about', 'objective', 'profile']);
  const educationCv = extractSection(cvDataResolved, ['education', 'academic_qualifications', 'academic']);
  const experienceCv = extractSection(cvDataResolved, ['experience', 'work_experience', 'industry_experience']);
  const skills = extractSection(cvDataResolved, ['skills', 'technical_skills', 'competencies']);
  const positionsCv = extractSection(cvDataResolved, ['positions_of_responsibility', 'positions', 'positionsOfResponsibility']);
  const extraCurricularCv = extractSection(cvDataResolved, ['extra_curricular', 'extra_curricular_achievements', 'extraCurricular']);
  const sections = cvDataResolved?.sections || [];

  const educationEntries = normalizeSectionEntries(educationCv);
  const experienceEntries = normalizeSectionEntries(experienceCv);
  const usableInstLinks = institutionLinks.filter((l) => l.institution_name || l.institution_id || l.program_name);
  const usableOrgLinks = organizationLinks.filter((l) => l.company_name || l.company_id);

  const norm = (s) => (s || '').toString().toLowerCase().trim();
  const eduLinkKey = (l) => `${norm(l.institution_name || l.institution_id)}|${norm(l.program_name)}`;
  const eduCvKey = (e) => `${norm(e.institution || e.institute || e.school || e.name)}|${norm(e.degree || e.program)}`;
  const dupEdu = (e) => {
    const key = eduCvKey(e);
    if (key === '|') return false;
    return usableInstLinks.some((l) => eduLinkKey(l) === key);
  };
  const mergedEducation = [
    ...usableInstLinks.map((l) => ({ type: 'link', link: l })),
    ...educationEntries.filter((e) => !dupEdu(e)).map((e) => ({ type: 'cv', entry: e })),
  ];

  const expLinkKey = (l) => `${norm(l.company_name || l.company_id)}|${norm(l.role_name || l.role_id)}`;
  const expCvKey = (e) => `${norm(e.company || e.organization)}|${norm(e.role || e.title)}`;
  const dupExp = (e) => {
    const key = expCvKey(e);
    if (key === '|') return false;
    return usableOrgLinks.some((l) => expLinkKey(l) === key);
  };
  const mergedExperience = [
    ...usableOrgLinks.map((l) => ({ type: 'link', link: l })),
    ...experienceEntries.filter((e) => !dupExp(e)).map((e) => ({ type: 'cv', entry: e })),
  ];

  const positionsEntries = normalizeBucketSection(positionsCv);
  const extraCurricularEntries = normalizeBucketSection(extraCurricularCv);

  const hasEducation = mergedEducation.length > 0;
  const hasExperience = mergedExperience.length > 0;
  const hasSkills = skills && (Array.isArray(skills) ? skills.length > 0 : (typeof skills === 'string' ? skills.trim().length > 0 : true));
  const hasPositions = positionsEntries.length > 0;
  const hasExtraCurricular = extraCurricularEntries.length > 0;

  const vis = (key) => visibility[key] || 'public';
  const isVisible = (key) => vis(key) === 'public';
  const showLocked = (key) => vis(key) === 'private' || vis(key) === 'restricted';

  const trustSignals = [
    { key: 'verified_profile', label: 'Verified Profile', ok: !!isVerified },
    { key: 'verified_institution', label: 'Institution Linked', ok: usableInstLinks.length > 0 },
    { key: 'verified_program', label: 'Program Mapped', ok: usableInstLinks.some((l) => !!l.program_id || !!l.program_name) },
    { key: 'verified_org', label: 'Organization Linked', ok: usableOrgLinks.length > 0 },
  ];
  const trustStrength = trustSignals.filter((s) => s.ok).length;

  // Last college (most recent: Current first, then Alumni by end_date desc)
  const lastCollege = (() => {
    const current = mergedEducation.find((e) => e.type === 'link' && e.link.tag === 'Current');
    if (current) return current;
    const alumni = [...mergedEducation].filter((e) => e.type === 'link' && e.link.tag === 'Alumni');
    alumni.sort((a, b) => new Date(b.link.end_date || 0) - new Date(a.link.end_date || 0));
    return alumni[0] || mergedEducation[0];
  })();

  // Current company (tag Current or end_date null)
  const currentCompany = mergedExperience.find(
    (e) => e.type === 'link' && (e.link.tag === 'Current' || !e.link.end_date)
  ) || mergedExperience[0];

  // Unique roles and companies/industries for tags (from experience). Ensure strings for React.
  const roleTags = [...new Set(
    mergedExperience.flatMap((e) => {
      if (e.type === 'link' && (e.link.role_name || e.link.role_id)) return [toStr(e.link.role_name || e.link.role_id)];
      if (e.type === 'cv' && (e.entry.role || e.entry.title)) return [toStr(e.entry.role || e.entry.title)];
      return [];
    })
  )].filter(Boolean);
  const industryTags = [...new Set(
    mergedExperience.flatMap((e) => {
      if (e.type === 'link' && (e.link.company_name || e.link.company_id)) return [toStr(e.link.company_name || e.link.company_id)];
      if (e.type === 'cv' && (e.entry.company || e.entry.organization)) return [toStr(e.entry.company || e.entry.organization)];
      return [];
    })
  )].filter(Boolean);

  const metaParts = [];
  if (lastCollege) {
    const eduName = lastCollege.type === 'link'
      ? toStr(lastCollege.link.institution_name || lastCollege.link.institution_id)
      : toStr(lastCollege.entry.institution || lastCollege.entry.institute || lastCollege.entry.school);
    const eduDetail = lastCollege.type === 'link'
      ? lastCollege.link.program_name ? toStr(lastCollege.link.program_name) : null
      : lastCollege.entry.degree ? toStr(lastCollege.entry.degree) : null;
    metaParts.push(eduDetail ? `${eduName} · ${eduDetail}` : eduName);
  }
  if (currentCompany) {
    const coName = currentCompany.type === 'link'
      ? toStr(currentCompany.link.company_name || currentCompany.link.company_id)
      : toStr(currentCompany.entry.company || currentCompany.entry.organization);
    const coRole = currentCompany.type === 'link'
      ? (currentCompany.link.role_name || currentCompany.link.role_id) ? toStr(currentCompany.link.role_name || currentCompany.link.role_id) : null
      : currentCompany.entry.role ? toStr(currentCompany.entry.role) : null;
    metaParts.push(coRole ? `${coName} · ${coRole}` : coName);
  }
  const metaLine = metaParts.join(' · ');

  return html`
    <div className="w-full min-h-screen bg-[var(--app-bg)]">
      <div className="w-full py-4 sm:py-6">
        <header className="mb-8">
          <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] shadow-sm overflow-hidden">
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="flex items-start sm:items-center gap-5">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[var(--app-surface-muted)] flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-[var(--app-border-soft)]">
                    ${photoUrl
                      ? html`<img src=${photoUrl} alt=${name} className="w-full h-full object-cover" />`
                      : html`<span className="text-2xl sm:text-3xl font-semibold text-[var(--app-text-muted)]">${initial}</span>`}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl font-bold text-[var(--app-text-primary)] tracking-tight">${name}</h1>
                      ${isVerified
                        ? html`
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                            <${BadgeCheck} className="w-3 h-3" strokeWidth={2} />
                            Verified
                          </span>
                        `
                        : null}
                      ${vis('identity') !== 'public' ? html`<${VisibilityPill} visibility=${vis('identity')} />` : null}
                    </div>
                    ${metaLine ? html`<p className="text-sm text-[var(--app-text-muted)] mt-0.5 truncate max-w-md">${metaLine}</p>` : null}
                    ${headline ? html`<p className="text-[15px] text-[var(--app-text-secondary)] mt-1 font-medium">${headline}</p>` : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]">
                        Trust ${trustStrength}/${trustSignals.length}
                      </span>
                      ${trustSignals.map((s) => html`
                        <span key=${s.key} className=${`px-2 py-0.5 rounded-full text-[10px] font-medium ${s.ok ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'}`}>
                          ${s.label}
                        </span>
                      `)}
                    </div>
                    ${(roleTags.length > 0 || industryTags.length > 0) ? html`
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        ${roleTags.map((r) => html`<span key=${`role-${r}`} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--app-accent-soft)] text-[var(--app-accent)]">${toStr(r)}</span>`)}
                        ${industryTags.map((i) => html`<span key=${`ind-${i}`} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]">${toStr(i)}</span>`)}
                      </div>
                    ` : null}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  ${isOwnProfile && onGenerateCV ? html`
                    <button
                      type="button"
                      onClick=${onGenerateCV}
                      disabled=${exportingPdf}
                      title=${exportingPdf ? 'Exporting...' : 'Generate CV'}
                      className="p-2.5 rounded-xl bg-[var(--app-accent)] text-white hover:bg-[var(--app-accent-hover)] transition-colors disabled:opacity-50"
                    >
                      <${FileDown} className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  ` : null}
                  ${showNetworkButton ? html`
                    <button
                      type="button"
                      onClick=${handleNetworkClick}
                      disabled=${networkLoading}
                      title=${networkButtonLabel}
                      className="p-2.5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-muted)] transition-colors disabled:opacity-50"
                    >
                      ${networkStatus?.in_network || networkStatus?.following
                        ? html`<${UserCheck} className="w-5 h-5" strokeWidth={1.5} />`
                        : html`<${UserPlus} className="w-5 h-5" strokeWidth={1.5} />`}
                    </button>
                  ` : null}
                  ${email && isVisible('contact') && (isOwnProfile || !emailHidden) ? html`
                    <a href=${`mailto:${email}`} title="Contact" className="p-2.5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-muted)] transition-colors">
                      <${Mail} className="w-5 h-5" strokeWidth={1.5} />
                    </a>
                  ` : null}
                  ${!isOwnProfile && onMessage && user?.id ? html`
                    <button
                      type="button"
                      onClick=${() => onMessage(user.id)}
                      title="Message"
                      className="p-2.5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-[var(--app-text-primary)] hover:bg-[var(--app-surface-muted)] transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    </button>
                  ` : null}
                </div>
              </div>
              ${isRecruiter && engagement ? html`
                <div className="mt-6 pt-6 border-t border-[var(--app-border-soft)] flex flex-wrap gap-4">
                  <div className="text-sm">
                    <span className="text-[var(--app-text-muted)]">Trust</span>
                    <span className="font-semibold text-[var(--app-text-primary)] ml-2">${engagement.trust_score ?? '—'}</span>
                  </div>
                  <div className="text-sm text-[var(--app-text-secondary)]">${engagement.posts_this_week ?? 0} posts this week</div>
                </div>
              ` : null}
              ${(summary && isVisible('about')) || (isOwnProfile && !showLocked('about')) || showLocked('about') ? html`
                <div className="mt-6 pt-6 border-t border-[var(--app-border-soft)]">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">About</span>
                    ${vis('about') !== 'public' ? html`<${VisibilityPill} visibility=${vis('about')} />` : null}
                    ${isOwnProfile && onEditSection && !showLocked('about') ? html`
                      <button
                        onClick=${() => onEditSection('about')}
                        className="p-1.5 rounded text-[var(--app-text-secondary)] hover:text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] transition-colors"
                        title="Edit About"
                      >
                        <${Pencil} className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    ` : null}
                  </div>
                  ${summary && isVisible('about') ? html`<p className="text-[15px] text-[var(--app-text-primary)] leading-relaxed">${typeof summary === 'string' ? summary : JSON.stringify(summary)}</p>` : null}
                  ${isOwnProfile && !summary && !showLocked('about') ? html`<${EmptySectionPlaceholder} title="About" onEdit=${onEditSection ? () => onEditSection('about') : null} />` : null}
                  ${showLocked('about') ? html`<${LockedSectionPlaceholder} title="About" visibility=${vis('about')} />` : null}
                </div>
              ` : null}
            </div>
          </div>
        </header>

        <!-- Sections -->
        <div className="space-y-6">
          ${showPlacementStats && isVisible('placement') ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider">Placement Activity</h2>
                ${vis('placement') !== 'public' ? html`<${VisibilityPill} visibility=${vis('placement')} />` : null}
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div><p className="text-2xl font-semibold text-[var(--app-text-primary)]">${applicationsCount}</p><p className="text-xs text-[var(--app-text-muted)] mt-0.5 uppercase tracking-wider">Applications</p></div>
                <div><p className="text-2xl font-semibold text-[var(--app-text-primary)]">${shortlistsCount}</p><p className="text-xs text-[var(--app-text-muted)] mt-0.5 uppercase tracking-wider">Shortlists</p></div>
                <div><p className="text-2xl font-semibold text-[var(--app-text-primary)]">${offersCount}</p><p className="text-xs text-[var(--app-text-muted)] mt-0.5 uppercase tracking-wider">Offers</p></div>
              </div>
            </section>
          ` : showPlacementStats && showLocked('placement') ? html`
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider">Placement Activity</h2>
                <${VisibilityPill} visibility=${vis('placement')} />
              </div>
              <${LockedSectionPlaceholder} title="Placement activity" visibility=${vis('placement')} />
            </section>
          ` : null}

          ${(hasEducation && isVisible('education')) || (isOwnProfile && !showLocked('education')) ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <${SectionHeader} title="Education" visibility=${vis('education')} onEdit=${isOwnProfile && onEditSection ? () => onEditSection('education') : null} showVisPill=${vis('education') !== 'public'} />
              ${hasEducation && isVisible('education') ? html`<div className="space-y-6">
                ${mergedEducation.map((item, i) => item.type === 'link' ? (() => {
                  const link = item.link;
                  const logoUrl = getInstitutionLogoUrl({ logo_url: link.institution_logo_url }) || link.institution_logo_url || getInstitutionLogoFallback({ name: toStr(link.institution_name || link.institution_id) });
                  const isClickable = navigate && link.institution_id;
                  const content = html`
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[var(--app-surface-muted)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--app-border-soft)]">
                        <img src=${logoUrl} alt="" className="w-full h-full object-contain" onError=${(e) => { e.target.onerror = null; e.target.src = getInstitutionLogoFallback({ name: toStr(link.institution_name || link.institution_id) }); }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-[var(--app-text-primary)]">${toStr(link.institution_name || link.institution_id) || '—'}</p>
                        ${link.program_name ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${toStr(link.program_name)}</p>` : null}
                        ${(link.start_date || link.end_date) ? html`<p className="text-xs text-[var(--app-text-muted)] mt-1">${formatDate(link.start_date) || '—'} – ${formatDate(link.end_date) || 'Present'}</p>` : null}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--app-text-muted)] shrink-0">${link.tag || '—'}</span>
                    </div>
                  `;
                  return html`<div key=${link.id} className="pb-6 last:pb-0 border-b border-[var(--app-border-soft)] last:border-0">
                    ${isClickable ? html`<button onClick=${() => navigate('institution/' + link.institution_id)} className="w-full text-left rounded-lg -m-2 p-2 hover:bg-[var(--app-surface-muted)]/50 transition-colors cursor-pointer">${content}</button>` : content}
                  </div>`;
                })() : html`
                  <div key=${`cv-${i}`} className="pb-6 last:pb-0 border-b border-[var(--app-border-soft)] last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[var(--app-surface-muted)] flex items-center justify-center flex-shrink-0 border border-[var(--app-border-soft)]">
                        <span className="text-lg font-semibold text-[var(--app-text-muted)]">${toStr(item.entry.institution || item.entry.institute || item.entry.school || item.entry.name || '?').charAt(0).toUpperCase() || '?'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-[var(--app-text-primary)]">${toStr(item.entry.institution || item.entry.institute || item.entry.school || item.entry.name) || '—'}</p>
                        ${(item.entry.degree || item.entry.program) ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${toStr(item.entry.degree || item.entry.program)}</p>` : null}
                        ${(item.entry.year || item.entry.graduation) ? html`<p className="text-xs text-[var(--app-text-muted)] mt-1">${safeDisplay(item.entry.year || item.entry.graduation)}</p>` : null}
                      </div>
                    </div>
                  </div>
                `)}
              </div>` : null}
              ${isOwnProfile && !hasEducation ? html`<${EmptySectionPlaceholder} title="Education" onEdit=${onEditSection ? () => onEditSection('education') : null} />` : null}
            </section>
          ` : showLocked('education') ? html`
            <section>
              <${SectionHeader} title="Education" visibility=${vis('education')} />
              <${LockedSectionPlaceholder} title="Education" visibility=${vis('education')} />
            </section>
          ` : null}

          ${(hasExperience && isVisible('experience')) || (isOwnProfile && !showLocked('experience')) ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <${SectionHeader} title="Experience" visibility=${vis('experience')} onEdit=${isOwnProfile && onEditSection ? () => onEditSection('experience') : null} showVisPill=${vis('experience') !== 'public'} />
              ${hasExperience && isVisible('experience') ? html`<div className="space-y-6">
                ${mergedExperience.map((item, i) => item.type === 'link' ? (() => {
                  const link = item.link;
                  const logoUrl = getCompanyLogoUrl({ logo_url: link.company_logo_url }) || link.company_logo_url || getCompanyLogoFallback({ name: toStr(link.company_name || link.company_id) });
                  const isClickable = navigate && link.company_id;
                  const content = html`
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[var(--app-surface-muted)] flex items-center justify-center overflow-hidden flex-shrink-0 border border-[var(--app-border-soft)]">
                        <img src=${logoUrl} alt="" className="w-full h-full object-contain" onError=${(e) => { e.target.onerror = null; e.target.src = getCompanyLogoFallback({ name: toStr(link.company_name || link.company_id) }); }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold text-[var(--app-text-primary)]">${toStr(link.company_name || link.company_id) || '—'}</p>
                        ${(link.role_name || link.role_id) ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${toStr(link.role_name || link.role_id)}</p>` : null}
                        ${(link.start_date || link.end_date) ? html`<p className="text-xs text-[var(--app-text-muted)] mt-1">${formatDate(link.start_date) || '—'} – ${formatDate(link.end_date) || 'Present'}</p>` : null}
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--app-text-muted)] shrink-0">${link.tag || '—'}</span>
                    </div>
                  `;
                  return html`<div key=${link.id} className="pb-6 last:pb-0 border-b border-[var(--app-border-soft)] last:border-0">
                    ${isClickable ? html`<button onClick=${() => navigate('company/' + link.company_id)} className="w-full text-left rounded-lg -m-2 p-2 hover:bg-[var(--app-surface-muted)]/50 transition-colors cursor-pointer">${content}</button>` : content}
                  </div>`;
                })() : html`
                  <div key=${`cv-${i}`} className="pb-6 last:pb-0 border-b border-[var(--app-border-soft)] last:border-0">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-[var(--app-surface-muted)] flex items-center justify-center flex-shrink-0 border border-[var(--app-border-soft)]">
                        <span className="text-lg font-semibold text-[var(--app-text-muted)]">${toStr(item.entry.company || item.entry.organization || item.entry.role || '?').charAt(0).toUpperCase() || '?'}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        ${(() => {
                          const e = item.entry;
                          const rangeStr = e.start_date ? formatDateRange(e.start_date, e.end_date) : '';
                          const months = rangeStr ? calculateDurationMonths(e.start_date, e.end_date) : null;
                          const durText = months != null ? formatYearsMonths(months) : '';
                          const hasLegacy = e.duration || e.dates;
                          const dateRow = hasLegacy ? safeDisplay(e.duration || e.dates) : rangeStr;
                          const durationRow = !hasLegacy && durText ? durText : '';
                          return html`
                            <p className="text-base font-semibold text-[var(--app-text-primary)]">${toStr(e.company || e.organization || e.role) || '—'}</p>
                            ${(e.role || e.title) ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${toStr(e.role || e.title)}</p>` : null}
                            ${dateRow ? html`<p className="text-xs text-[var(--app-text-muted)] mt-1">${dateRow}</p>` : null}
                            ${durationRow ? html`<p className="text-xs text-[var(--app-text-muted)] mt-0.5">${durationRow}</p>` : null}
                          `;
                        })()}
                      </div>
                    </div>
                  </div>
                `)}
              </div>` : null}
              ${isOwnProfile && !hasExperience ? html`<${EmptySectionPlaceholder} title="Experience" onEdit=${onEditSection ? () => onEditSection('experience') : null} />` : null}
            </section>
          ` : showLocked('experience') ? html`
            <section>
              <${SectionHeader} title="Experience" visibility=${vis('experience')} />
              <${LockedSectionPlaceholder} title="Experience" visibility=${vis('experience')} />
            </section>
          ` : null}

          ${(hasPositions && isVisible('positions')) || (isOwnProfile && !showLocked('positions')) ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <${SectionHeader} title="Positions of Responsibility" visibility=${vis('positions')} onEdit=${isOwnProfile && onEditSection ? () => onEditSection('positions') : null} showVisPill=${vis('positions') !== 'public'} />
              ${hasPositions && isVisible('positions') ? html`<div className="space-y-6">
                ${positionsEntries.map((item, i) => html`
                  <div key=${i} className="pb-6 last:pb-0 border-b border-[var(--app-border-soft)] last:border-0">
                    <p className="text-base font-semibold text-[var(--app-text-primary)]">${toStr(item.label) || '—'}</p>
                    ${item.bullets && item.bullets.length > 0 ? html`
                      <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-[var(--app-text-secondary)]">
                        ${item.bullets.map((b, bi) => html`<li key=${bi}>${typeof b === 'object' ? (b.text || b.content || '') : String(b)}</li>`)}
                      </ul>
                    ` : null}
                  </div>
                `)}
              </div>` : null}
              ${isOwnProfile && !hasPositions ? html`<${EmptySectionPlaceholder} title="Positions of responsibility" onEdit=${onEditSection ? () => onEditSection('positions') : null} />` : null}
            </section>
          ` : showLocked('positions') ? html`
            <section>
              <${SectionHeader} title="Positions of Responsibility" visibility=${vis('positions')} />
              <${LockedSectionPlaceholder} title="Positions of responsibility" visibility=${vis('positions')} />
            </section>
          ` : null}

          ${(hasExtraCurricular && isVisible('extra_curricular')) || (isOwnProfile && !showLocked('extra_curricular')) ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <${SectionHeader} title="Extra Curricular Activities" visibility=${vis('extra_curricular')} onEdit=${isOwnProfile && onEditSection ? () => onEditSection('extra_curricular') : null} showVisPill=${vis('extra_curricular') !== 'public'} />
              ${hasExtraCurricular && isVisible('extra_curricular') ? html`<div className="space-y-6">
                ${extraCurricularEntries.map((item, i) => html`
                  <div key=${i} className="pb-6 last:pb-0 border-b border-[var(--app-border-soft)] last:border-0">
                    <p className="text-base font-semibold text-[var(--app-text-primary)]">${toStr(item.label) || '—'}</p>
                    ${item.bullets && item.bullets.length > 0 ? html`
                      <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-[var(--app-text-secondary)]">
                        ${item.bullets.map((b, bi) => html`<li key=${bi}>${typeof b === 'object' ? (b.text || b.content || '') : String(b)}</li>`)}
                      </ul>
                    ` : null}
                  </div>
                `)}
              </div>` : null}
              ${isOwnProfile && !hasExtraCurricular ? html`<${EmptySectionPlaceholder} title="Extra curricular activities" onEdit=${onEditSection ? () => onEditSection('extra_curricular') : null} />` : null}
            </section>
          ` : showLocked('extra_curricular') ? html`
            <section>
              <${SectionHeader} title="Extra Curricular Activities" visibility=${vis('extra_curricular')} />
              <${LockedSectionPlaceholder} title="Extra curricular activities" visibility=${vis('extra_curricular')} />
            </section>
          ` : null}

          ${(hasSkills && isVisible('skills')) || (isOwnProfile && !showLocked('skills')) ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <${SectionHeader} title="Skills" visibility=${vis('skills')} onEdit=${isOwnProfile && onEditSection ? () => onEditSection('skills') : null} showVisPill=${vis('skills') !== 'public'} />
              ${hasSkills && isVisible('skills') ? html`<div className="flex flex-wrap gap-2">
                ${(Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(/[,;]/) : [skills])).map((s, i) => html`
                  <span key=${i} className="px-3 py-1.5 rounded-md text-sm font-medium bg-[var(--app-surface-muted)] text-[var(--app-text-primary)] border border-[var(--app-border-soft)]">
                    ${typeof s === 'object' ? (s.name || s.skill || JSON.stringify(s)) : String(s).trim()}
                  </span>
                `)}
              </div>` : null}
              ${isOwnProfile && !hasSkills ? html`<${EmptySectionPlaceholder} title="Skills" onEdit=${onEditSection ? () => onEditSection('skills') : null} />` : null}
            </section>
          ` : showLocked('skills') ? html`
            <section>
              <${SectionHeader} title="Skills" visibility=${vis('skills')} />
              <${LockedSectionPlaceholder} title="Skills" visibility=${vis('skills')} />
            </section>
          ` : null}

          ${showLocked('calendar') ? html`
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider">Availability</h2>
                <${VisibilityPill} visibility=${vis('calendar')} />
              </div>
              <${LockedSectionPlaceholder} title="Availability" visibility=${vis('calendar')} />
            </section>
          ` : html`
            <${ProfileCalendarSection}
              profileUserId=${user?.id}
              isOwnProfile=${isOwnProfile}
              navigate=${navigate}
              visibility=${vis('calendar')}
            />
          `}

          ${sections.map((s, i) => html`
            <section key=${i} className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-6 shadow-[var(--app-shadow-subtle)]">
              <h2 className="text-sm font-semibold text-[var(--app-text-primary)] uppercase tracking-wider mb-4">${s.title || 'Section'}</h2>
              <div className="text-[15px] text-[var(--app-text-primary)] leading-relaxed">
                ${typeof s.content === 'string' ? html`<p>${s.content}</p>` : html`<pre className="whitespace-pre-wrap text-sm font-sans">${JSON.stringify(s.content, null, 2)}</pre>`}
              </div>
            </section>
          `)}

          ${!isOwnProfile && !summary && !hasEducation && !hasExperience && !hasSkills && !hasPositions && !hasExtraCurricular && sections.length === 0 ? html`
            <section className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] p-12 text-center">
              <p className="text-sm text-[var(--app-text-muted)]">No profile content yet.</p>
            </section>
          ` : null}
        </div>
      </div>
    </div>
  `;
};

export default UnifiedProfileView;
