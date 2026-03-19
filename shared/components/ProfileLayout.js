/**
 * Shared profile page layout: sidebar (hero + about) + main (education + experience).
 * Matches the Ithras profile template design.
 */
import React from 'react';
import htm from 'htm';
import StatusChip from '/shared/components/StatusChip.js';

const html = htm.bind(React.createElement);

const ACCENT = '#1E6EF2';

const GraduationCapIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`;
const Building2Icon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/></svg>`;
const ClipboardListIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`;
const TrophyIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M6 2h12v4a6 6 0 0 1-6 6v0a6 6 0 0 1-6-6V2Z"/><path d="M6 22v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M12 11v2"/><path d="M8 15h8"/></svg>`;
const MapPinIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const CalendarIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`;
const MailIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`;
const LinkIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;
const BadgeCheckIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`;
const ArrowRightIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`;

function formatMonth(value) {
  if (!value) return 'Present';
  const parts = value.split('-');
  if (parts.length < 2) return value;
  const [year, month] = parts;
  const d = new Date(Number(year), Number(month) - 1);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function rangeLabel(start, end) {
  return `${formatMonth(start)} - ${formatMonth(end)}`;
}

/** Calculate duration between start_month and end_month (yyyymm strings). Returns e.g. "2 years 1 month". */
function formatDuration(startMonth, endMonth) {
  const parse = (val) => {
    if (!val) return null;
    const parts = String(val).split('-');
    if (parts.length < 2) return null;
    return { year: parseInt(parts[0], 10), month: parseInt(parts[1], 10) };
  };
  const start = parse(startMonth);
  if (!start) return null;
  let end = parse(endMonth);
  if (!end) {
    const now = new Date();
    end = { year: now.getFullYear(), month: now.getMonth() + 1 };
  }
  let months = (end.year - start.year) * 12 + (end.month - start.month);
  if (months < 0) return null;
  if (months === 0) return 'Less than 1 month';
  const y = Math.floor(months / 12);
  const m = months % 12;
  const parts = [];
  if (y > 0) parts.push(y === 1 ? '1 year' : `${y} years`);
  if (m > 0) parts.push(m === 1 ? '1 month' : `${m} months`);
  return parts.join(' ');
}

function educationStatusTag(entry) {
  const end = entry.end_month;
  const now = new Date();
  const yyyymm = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  if (!end || end >= yyyymm) return 'current';
  return 'alumni';
}

/** Time-based: current (still employed) vs alumni (past employment). */
function experienceStatusTag(org) {
  const movements = org.movements || [];
  if (movements.length === 0) return 'alumni';
  const sorted = [...movements].sort((a, b) => (b.end_month || '9999-12').localeCompare(a.end_month || '9999-12'));
  const mostRecent = sorted[0];
  const end = mostRecent?.end_month;
  const yyyymm = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
  if (!end || end >= yyyymm) return 'current';
  return 'alumni';
}

/** Approval-based: listed (all roles approved) vs pending (any role pending). */
function experienceApprovalTag(org) {
  const movements = org.movements || [];
  if (movements.length === 0) return 'pending';
  const allListed = movements.every((m) => (m.status || 'pending') === 'listed');
  return allListed ? 'listed' : 'pending';
}

function getInitials(name) {
  return (name || 'U').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();
}

const StatusBadge = ({ children, variant = 'secondary' }) => html`
  <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-[var(--app-surface-subtle)] text-[var(--app-text-secondary)] border border-[var(--app-border-soft)]">
    ${children}
  </span>
`;

const PencilIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>`;
const PlusIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
const TrashIcon = () => html`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>`;

/**
 * ProfileLayout - reusable profile page template
 * @param {Object} props
 * @param {Object} props.profile - { full_name, headline, summary, email, profile_slug }
 * @param {Array} props.education - education entries
 * @param {Array} props.experience - experience groups with movements
 * @param {boolean} [props.isOwnProfile] - hide Connect for own profile
 * @param {boolean} [props.editable] - show Edit/Add buttons
 * @param {Function} [props.onEditEducation] - (entry) => void
 * @param {Function} [props.onAddEducation] - () => void
 * @param {Function} [props.onDeleteEducation] - (entry) => void
 * @param {Function} [props.onEditExperience] - (org) => void
 * @param {Function} [props.onAddExperience] - () => void
 * @param {Function} [props.onDeleteExperience] - (org) => void
 * @param {ReactNode} [props.educationFormOverride] - when editing, render this instead of list
 * @param {ReactNode} [props.experienceFormOverride] - when editing, render this instead of list
 * @param {string} [props.location] - optional location (not in API yet)
 * @param {ReactNode} [props.profileConnectSlot] - custom Connect/Follow actions (replaces default Connect button)
 * @param {Array} [props.overlapBadges] - overlap badges [{ type, label }]
 * @param {Array} [props.mutualConnections] - mutual connection users
 * @param {number} [props.mutualCount] - total mutual connections count
 * @param {string} [props.summary] - about text (profile.summary)
 * @param {boolean} [props.editingAbout] - show about edit form
 * @param {Function} [props.onEditAbout] - () => void, enter edit mode
 * @param {ReactNode} [props.aboutFormOverride] - when editing about, render this
 * @param {Array} [props.additionalResponsibilities] - list items
 * @param {Function} [props.onEditResponsibility] - (item) => void
 * @param {Function} [props.onAddResponsibility] - () => void
 * @param {Function} [props.onDeleteResponsibility] - (item) => void
 * @param {ReactNode} [props.responsibilityFormOverride] - edit form
 * @param {number|null} [props.editingResponsibilityId] - id being edited
 * @param {boolean} [props.addingResponsibility] - adding new
 * @param {Array} [props.otherAchievements] - list items
 * @param {Function} [props.onEditAchievement] - (item) => void
 * @param {Function} [props.onAddAchievement] - () => void
 * @param {Function} [props.onDeleteAchievement] - (item) => void
 * @param {ReactNode} [props.achievementFormOverride] - edit form
 * @param {number|null} [props.editingAchievementId] - id being edited
 * @param {boolean} [props.addingAchievement] - adding new
 * @param {boolean} [props.reduceParentPadding] - use negative margin to reduce parent's padding by ~50% (when inside AppShell)
 */
const ProfileLayout = ({
  profile,
  education = [],
  experience = [],
  isOwnProfile = false,
  editable = false,
  onEditEducation,
  onAddEducation,
  onDeleteEducation,
  onEditExperience,
  onAddExperience,
  onDeleteExperience,
  educationFormOverride,
  experienceFormOverride,
  editingEducationId,
  addingEducation,
  editingExperienceId,
  addingExperience,
  location,
  profileConnectSlot,
  overlapBadges = [],
  mutualConnections = [],
  mutualCount = 0,
  summary: summaryProp,
  editingAbout = false,
  onEditAbout,
  aboutFormOverride,
  additionalResponsibilities = [],
  onEditResponsibility,
  onAddResponsibility,
  onDeleteResponsibility,
  responsibilityFormOverride,
  editingResponsibilityId = null,
  addingResponsibility = false,
  otherAchievements = [],
  onEditAchievement,
  onAddAchievement,
  onDeleteAchievement,
  achievementFormOverride,
  editingAchievementId = null,
  addingAchievement = false,
  reduceParentPadding = false,
}) => {
  const summary = summaryProp ?? profile?.summary ?? '';
  const displayName = profile?.full_name || 'Profile';
  const initials = getInitials(displayName);
  const profileUrl = profile?.profile_slug ? `ithras.com/p/${profile.profile_slug}` : null;

  const hasCurrentEducation = education.some((e) => educationStatusTag(e) === 'current');
  const hasCurrentExperience = experience.some((o) => experienceStatusTag(o) === 'current');
  const showExperienceFirst = hasCurrentExperience && !hasCurrentEducation ? true : hasCurrentEducation && !hasCurrentExperience ? false : true;
  const showEducationFirst = !showExperienceFirst;

  return html`
    <div className=${`min-h-screen ${reduceParentPadding ? '-mx-3' : ''}`} style=${{ background: 'var(--app-bg)' }}>
      <div className="mx-auto max-w-[1600px] w-full py-6 px-1 md:px-1.5 lg:px-2">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-[1fr_3fr_2fr]">
          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start order-1">
            <div className="overflow-hidden rounded-3xl border-0 shadow-sm bg-[var(--app-surface)]">
              <div className="h-28" style=${{ background: ACCENT }} />
              <div className="relative px-6 pb-6 pt-0">
                <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-white bg-white text-3xl font-semibold shadow-sm" style=${{ color: 'var(--app-text-primary)' }}>
                  ${initials}
                </div>
                <div className="mt-4 space-y-3">
                  <div>
                    <h1 className="text-2xl font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>${displayName}</h1>
                    ${profile?.headline ? html`<p className="mt-1 text-sm leading-6" style=${{ color: 'var(--app-text-secondary)' }}>${profile.headline}</p>` : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <${StatusBadge} key="badge-public">Public</${StatusBadge}>
                    <${StatusBadge} key="badge-network">Trusted Network</${StatusBadge}>
                    ${overlapBadges.length > 0 ? overlapBadges.slice(0, 4).map((b, bi) => React.createElement(React.Fragment, { key: b.type || `badge-${bi}` }, html`
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}>${b.label}</span>
                    `)) : null}
                  </div>
                  ${mutualCount > 0 ? html`
                    <div className="pt-2">
                      <p className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
                        ${mutualCount} mutual connection${mutualCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  ` : null}
                  <div className="space-y-2 pt-2 text-sm flex flex-col gap-2" style=${{ color: 'var(--app-text-secondary)' }}>
                    ${location ? html`<div key="loc" className="flex items-center gap-2"><span style=${{ color: 'var(--app-text-muted)' }}><${MapPinIcon} /></span><span>${location}</span></div>` : null}
                    ${profile?.email ? html`<div key="email" className="flex items-center gap-2"><span style=${{ color: 'var(--app-text-muted)' }}><${MailIcon} /></span><span>${profile.email}</span></div>` : null}
                    ${profileUrl ? html`<div key="url" className="flex items-center gap-2"><span style=${{ color: 'var(--app-text-muted)' }}><${LinkIcon} /></span><span className="truncate">${profileUrl}</span></div>` : null}
                  </div>
                  ${!isOwnProfile ? (profileConnectSlot != null ? html`
                    <div className="mt-3">${profileConnectSlot}</div>
                  ` : html`
                    <button
                      className="mt-3 w-full rounded-xl py-2.5 font-medium text-white transition-opacity hover:opacity-90"
                      style=${{ background: ACCENT }}
                    >
                      Connect
                    </button>
                  `) : null}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border-0 shadow-sm bg-[var(--app-surface)] p-6">
              <h2 className="text-base font-semibold mb-3" style=${{ color: 'var(--app-text-primary)' }}>About</h2>
              ${editingAbout && aboutFormOverride ? html`<div>${aboutFormOverride}</div>` : html`
                ${summary ? html`
                  <p className="text-sm leading-7" style=${{ color: 'var(--app-text-secondary)' }}>${summary}</p>
                  ${editable && onEditAbout ? html`
                    <button type="button" onClick=${onEditAbout} className="mt-3 flex items-center gap-1.5 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>
                      <${PencilIcon} /> Edit
                    </button>
                  ` : null}
                ` : html`
                  <p className="text-sm leading-6" style=${{ color: 'var(--app-text-muted)' }}>${editable && onEditAbout ? 'Add a short bio...' : 'No bio yet.'}</p>
                  ${editable && onEditAbout ? html`
                    <button type="button" onClick=${onEditAbout} className="mt-3 flex items-center gap-1.5 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>
                      <${PlusIcon} /> Add bio
                    </button>
                  ` : null}
                `}
              `}
            </div>
          </aside>

          <main className="flex flex-col gap-6 order-2" style=${{ background: 'var(--app-bg)' }}>
            <div key="education-section" className=${`rounded-xl border p-6 ${showEducationFirst ? 'order-1' : 'order-2'}`} style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-surface-subtle)]" style=${{ color: 'var(--app-text-secondary)' }}>
                    <${GraduationCapIcon} />
                  </div>
                  <h2 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Education</h2>
                </div>
                ${editable && onAddEducation && !editingEducationId ? html`
                  <button type="button" onClick=${onAddEducation} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style=${{ color: 'var(--app-accent)', background: 'var(--app-accent-soft)' }}>
                    <${PlusIcon} /> Add education
                  </button>
                ` : null}
              </div>
              <div className="pt-0 space-y-5">
                ${addingEducation && educationFormOverride ? html`<div key="edu-form" className="mb-5">${educationFormOverride}</div>` : null}
                ${education.length === 0 && !addingEducation
                  ? html`<div key="edu-empty" className="text-sm py-4" style=${{ color: 'var(--app-text-muted)' }}>No education added yet. ${editable && onAddEducation ? html`<button type="button" onClick=${onAddEducation} className="ml-2 text-[var(--app-accent)] hover:underline">Add your first</button>` : null}</div>`
                  : education.map((entry, eduIdx) => {
                      if (editingEducationId && entry.id === editingEducationId && educationFormOverride) {
                        return React.createElement('div', { key: entry?.id ?? `edu-${eduIdx}` }, educationFormOverride);
                      }
                      const timeTag = educationStatusTag(entry);
                      const approvalTag = entry.status || 'pending';
                      const majors = entry.majors || [];
                      const minors = entry.minors || [];
                      const majorLabel = majors.length ? ` · ${majors.join(', ')}` : '';
                      const minorLabel = minors.length ? ` (Minor: ${minors.join(', ')})` : '';
                      return React.createElement('div', { key: entry?.id ?? `edu-${eduIdx}` },
                        html`<div className="rounded-2xl border p-5" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--app-surface-subtle)]" style=${{ color: 'var(--app-text-secondary)' }}>
                                  <${GraduationCapIcon} />
                                </div>
                                <div>
                                  <h3 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${entry.institution_name || 'Institution'}</h3>
                                  <p className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
                                    ${entry.degree}${majorLabel}${minorLabel}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                                <span><${CalendarIcon} /></span>
                                <span>${rangeLabel(entry.start_month, entry.end_month)}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:justify-end items-center">
                              <${StatusChip} status=${timeTag} />
                              <${StatusChip} status=${approvalTag} />
                              ${editable ? html`
                                <button key=${`edit-edu-${entry?.id ?? eduIdx}`} type="button" onClick=${() => onEditEducation?.(entry)} className="p-1.5 rounded hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-muted)' }} title="Edit"><${PencilIcon} /></button>
                                ${onDeleteEducation ? html`<button key=${`delete-edu-${entry?.id ?? eduIdx}`} type="button" onClick=${() => onDeleteEducation(entry)} className="p-1.5 rounded hover:bg-red-50" style=${{ color: 'var(--app-danger)' }} title="Delete"><${TrashIcon} /></button>` : null}
                              ` : null}
                            </div>
                          </div>
                        </div>`
                      );
                    })}
              </div>
            </div>

            <div key="experience-section" className=${`rounded-xl border p-6 ${showExperienceFirst ? 'order-1' : 'order-2'}`} style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-surface-subtle)]" style=${{ color: 'var(--app-text-secondary)' }}>
                    <${Building2Icon} />
                  </div>
                  <h2 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Professional Experience</h2>
                </div>
                ${editable && onAddExperience && !editingExperienceId ? html`
                  <button type="button" onClick=${onAddExperience} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style=${{ color: 'var(--app-accent)', background: 'var(--app-accent-soft)' }}>
                    <${PlusIcon} /> Add experience
                  </button>
                ` : null}
              </div>
              <div className="pt-0 space-y-6">
                ${addingExperience && experienceFormOverride ? html`<div key="exp-form" className="mb-5">${experienceFormOverride}</div>` : null}
                ${experience.length === 0 && !addingExperience
                  ? html`<div key="exp-empty" className="text-sm py-4" style=${{ color: 'var(--app-text-muted)' }}>No experience added yet. ${editable && onAddExperience ? html`<button type="button" onClick=${onAddExperience} className="ml-2 text-[var(--app-accent)] hover:underline">Add your first</button>` : null}</div>`
                  : experience.map((org, expIdx) => {
                      if (editingExperienceId && org.id === editingExperienceId && experienceFormOverride) {
                        return React.createElement('div', { key: org?.id ?? `exp-${expIdx}` }, experienceFormOverride);
                      }
                      const orgTag = experienceStatusTag(org);
                      const approvalTag = experienceApprovalTag(org);
                      const movements = org.movements || [];
                      const isCurrent = orgTag === 'current';
                      return React.createElement('div', { key: org?.id ?? `exp-${expIdx}` },
                        html`<div className="rounded-3xl border p-5 md:p-6" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--app-surface-subtle)]" style=${{ color: 'var(--app-text-secondary)' }}>
                                  <${Building2Icon} />
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${org.organisation_name || 'Organisation'}</h3>
                                  <div className="mt-1 flex flex-col gap-0.5 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                                    <span className="flex items-center gap-1.5">
                                      <${CalendarIcon} />
                                      ${(() => {
                                        const sorted = [...movements].sort((a, b) => (a.start_month || '').localeCompare(b.start_month || ''));
                                        const first = sorted[0];
                                        const last = sorted[sorted.length - 1];
                                        return rangeLabel(first?.start_month || '', last?.end_month);
                                      })()}
                                    </span>
                                    ${(() => {
                                      const sorted = [...movements].sort((a, b) => (a.start_month || '').localeCompare(b.start_month || ''));
                                      const first = sorted[0];
                                      const last = sorted[sorted.length - 1];
                                      const dur = formatDuration(first?.start_month, last?.end_month);
                                      return dur ? html`<span className="text-xs">${dur}</span>` : null;
                                    })()}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2 md:justify-end items-center">
                              <${StatusChip} status=${orgTag} />
                              <${StatusChip} status=${approvalTag} />
                              ${editable ? html`
                                <button key=${`edit-exp-${org?.id ?? expIdx}`} type="button" onClick=${() => onEditExperience?.(org)} className="p-1.5 rounded hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-muted)' }} title="Edit"><${PencilIcon} /></button>
                                ${onDeleteExperience ? html`<button key=${`delete-exp-${org?.id ?? expIdx}`} type="button" onClick=${() => onDeleteExperience(org)} className="p-1.5 rounded hover:bg-red-50" style=${{ color: 'var(--app-danger)' }} title="Delete"><${TrashIcon} /></button>` : null}
                              ` : null}
                            </div>
                          </div>

                          ${movements.length > 0 ? (() => {
                            const sorted = [...movements].sort((a, b) => (b.start_month || '').localeCompare(a.start_month || ''));
                            const buKey = (m) => `${String(m.business_unit || '').trim()}|${String(m.function || '').trim()}`;
                            const groups = [];
                            let currentKey = null;
                            let currentGroup = null;
                            for (const mov of sorted) {
                              const key = buKey(mov);
                              if (key !== currentKey) {
                                currentKey = key;
                                currentGroup = { key, bu: (mov.business_unit || '').trim(), func: (mov.function || '').trim(), movements: [] };
                                groups.push(currentGroup);
                              }
                              currentGroup.movements.push(mov);
                            }
                            const boxStyle = { borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' };
                            const textMutedStyle = { color: 'var(--app-text-muted)' };
                            const textSecondaryStyle = { color: 'var(--app-text-secondary)' };
                            const lineStyle = { background: 'var(--app-border-soft)' };
                            const accentStyle = { background: ACCENT };
                            const accentColorStyle = { color: ACCENT };
                            const textPrimaryStyle = { color: 'var(--app-text-primary)' };
                            return html`
                              <div className="mt-6 space-y-4">
                                ${groups.map((grp, grpIdx) => React.createElement('div', { key: `grp-${grpIdx}-${grp.key}` },
                                  html`<div className="rounded-xl border p-4" style=${boxStyle}>
                                    ${(grp.bu || grp.func) ? html`
                                      <div className="mb-3 flex justify-between gap-4 text-sm" style=${textSecondaryStyle}>
                                        ${grp.bu ? html`<span><span className="font-medium">Business unit:</span> ${String(grp.bu)}</span>` : html`<span></span>`}
                                        ${grp.func ? html`<span className="text-right"><span className="font-medium">Function:</span> ${String(grp.func)}</span>` : null}
                                      </div>
                                    ` : null}
                                    <div className="relative">
                                      ${grp.movements.length > 1 ? html`
                                        <div className="absolute left-[5px] top-0 bottom-0 w-px" style=${lineStyle}></div>
                                      ` : null}
                                      <div className="space-y-0">
                                        ${grp.movements.map((mov, moveIndex) => {
                                          const isFirstInGroup = moveIndex === 0;
                                          const isFirstGroup = groups.indexOf(grp) === 0;
                                          const isLatest = isFirstInGroup && isFirstGroup && isCurrent;
                                          const movApprovalStatus = (mov.status || 'pending') === 'listed' ? 'listed' : 'pending';
                                          const duration = formatDuration(mov.start_month, mov.end_month);
                                          return React.createElement('div', { key: mov?.id ?? `mov-${grpIdx}-${moveIndex}` },
                                            html`<div className="flex gap-4 relative">
                                              <div className="flex flex-col items-center flex-shrink-0 relative z-10">
                                                <div className=${`rounded-full ${isLatest ? 'h-3 w-3' : 'h-2.5 w-2.5'} mt-1.5`} style=${accentStyle}></div>
                                              </div>
                                              <div className="flex-1 min-w-0 pb-4">
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                                  <div className="flex items-center gap-2 flex-wrap">
                                                    <h5 className="text-base font-semibold" style=${textPrimaryStyle}>${String(mov.title || '')}</h5>
                                                    ${isLatest ? html`<span className="cursor-help" title="Current role at this organization" style=${accentColorStyle}><${BadgeCheckIcon} /></span>` : null}
                                                    <${StatusChip} status=${movApprovalStatus} />
                                                  </div>
                                                  <div className="text-sm flex-shrink-0 text-right">
                                                    <div style=${textMutedStyle}>${rangeLabel(mov.start_month, mov.end_month)}</div>
                                                    ${duration ? html`<div className="text-xs mt-0.5" style=${textMutedStyle}>${duration}</div>` : null}
                                                  </div>
                                                </div>
                                              </div>
                                            </div>`
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>`))}
                              </div>
                            `;
                          })() : null}
                        </div>`
                      );
                    })}
              </div>
            </div>
          </main>

          <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start order-3">
            <div key="responsibilities-section" className="rounded-xl border p-6" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-surface-subtle)]" style=${{ color: 'var(--app-text-secondary)' }}>
                    <${ClipboardListIcon} />
                  </div>
                  <h2 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Additional Responsibilities</h2>
                </div>
                ${editable && onAddResponsibility && !editingResponsibilityId ? html`
                  <button type="button" onClick=${onAddResponsibility} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style=${{ color: 'var(--app-accent)', background: 'var(--app-accent-soft)' }}>
                    <${PlusIcon} /> Add
                  </button>
                ` : null}
              </div>
              <div className="pt-0 space-y-5">
                ${addingResponsibility && responsibilityFormOverride ? html`<div key="resp-form" className="mb-5">${responsibilityFormOverride}</div>` : null}
                ${additionalResponsibilities.length === 0 && !addingResponsibility
                  ? html`<div key="resp-empty" className="text-sm py-4" style=${{ color: 'var(--app-text-muted)' }}>No additional responsibilities. ${editable && onAddResponsibility ? html`<button type="button" onClick=${onAddResponsibility} className="ml-2 text-[var(--app-accent)] hover:underline">Add</button>` : null}</div>`
                  : additionalResponsibilities.map((item, idx) => {
                      const key = item?.id ?? `resp-${idx}`;
                      if (editingResponsibilityId && item.id === editingResponsibilityId && responsibilityFormOverride) {
                        return React.createElement('div', { key }, responsibilityFormOverride);
                      }
                      const sub = item.organisation_name ? ` · ${item.organisation_name}` : '';
                      return React.createElement(React.Fragment, { key }, html`
                        <div className="rounded-2xl border p-5" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2 flex-1">
                              <h3 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${item.title}${sub}</h3>
                              ${item.description ? html`<p className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>${item.description}</p>` : null}
                              ${(item.start_month || item.end_month) ? html`
                                <div className="flex items-center gap-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                                  <span><${CalendarIcon} /></span>
                                  <span>${rangeLabel(item.start_month || '', item.end_month)}</span>
                                </div>
                              ` : null}
                            </div>
                            ${editable ? html`
                              <div className="flex gap-2">
                                <button type="button" onClick=${() => onEditResponsibility?.(item)} className="p-1.5 rounded hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-muted)' }} title="Edit"><${PencilIcon} /></button>
                                ${onDeleteResponsibility ? html`<button type="button" onClick=${() => onDeleteResponsibility(item)} className="p-1.5 rounded hover:bg-red-50" style=${{ color: 'var(--app-danger)' }} title="Delete"><${TrashIcon} /></button>` : null}
                              </div>
                            ` : null}
                          </div>
                        </div>
                      `);
                    })}
              </div>
            </div>

            <div key="achievements-section" className="rounded-xl border p-6" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
              <div className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--app-surface-subtle)]" style=${{ color: 'var(--app-text-secondary)' }}>
                    <${TrophyIcon} />
                  </div>
                  <h2 className="text-xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Other Achievements</h2>
                </div>
                ${editable && onAddAchievement && !editingAchievementId ? html`
                  <button type="button" onClick=${onAddAchievement} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium" style=${{ color: 'var(--app-accent)', background: 'var(--app-accent-soft)' }}>
                    <${PlusIcon} /> Add
                  </button>
                ` : null}
              </div>
              <div className="pt-0 space-y-5">
                ${addingAchievement && achievementFormOverride ? html`<div key="ach-form" className="mb-5">${achievementFormOverride}</div>` : null}
                ${otherAchievements.length === 0 && !addingAchievement
                  ? html`<div key="ach-empty" className="text-sm py-4" style=${{ color: 'var(--app-text-muted)' }}>No other achievements. ${editable && onAddAchievement ? html`<button type="button" onClick=${onAddAchievement} className="ml-2 text-[var(--app-accent)] hover:underline">Add</button>` : null}</div>`
                  : otherAchievements.map((item, idx) => {
                      const key = item?.id ?? `ach-${idx}`;
                      if (editingAchievementId && item.id === editingAchievementId && achievementFormOverride) {
                        return React.createElement('div', { key }, achievementFormOverride);
                      }
                      const catLabel = (item.category || 'other').charAt(0).toUpperCase() + (item.category || 'other').slice(1);
                      return React.createElement(React.Fragment, { key }, html`
                        <div className="rounded-2xl border p-5" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}>${catLabel}</span>
                                <h3 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${item.title}</h3>
                              </div>
                              ${item.description ? html`<p className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>${item.description}</p>` : null}
                            </div>
                            ${editable ? html`
                              <div className="flex gap-2">
                                <button type="button" onClick=${() => onEditAchievement?.(item)} className="p-1.5 rounded hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-muted)' }} title="Edit"><${PencilIcon} /></button>
                                ${onDeleteAchievement ? html`<button type="button" onClick=${() => onDeleteAchievement(item)} className="p-1.5 rounded hover:bg-red-50" style=${{ color: 'var(--app-danger)' }} title="Delete"><${TrashIcon} /></button>` : null}
                              </div>
                            ` : null}
                          </div>
                        </div>
                      `);
                    })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  `;
};

export default ProfileLayout;
export { formatMonth, rangeLabel, formatDuration };
