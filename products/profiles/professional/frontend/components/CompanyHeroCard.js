/**
 * Company hero card: logo, name, metadata, stats grid, actions, tags.
 */
import React, { useMemo, useState } from 'react';
import htm from 'htm';
import { ExternalLink, UserPlus, Pencil, Download } from 'lucide-react';

const html = htm.bind(React.createElement);

const getInitials = (name) =>
  (name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

const READ_MORE_AT = 400;

/** Uppercase first letter in the string (after any leading non-letters). */
export function capitalizeDescriptionLead(s) {
  const t = (s || '').trim();
  if (!t) return t;
  let i = 0;
  while (i < t.length && !/[a-zA-Z]/.test(t[i])) i += 1;
  if (i >= t.length) return t;
  return t.slice(0, i) + t[i].toUpperCase() + t.slice(i + 1);
}

/** Strip pasted Wikipedia lines and bare URLs from legacy seed copy. */
export function sanitizeEntityDescription(raw, entityName) {
  if (!raw || typeof raw !== 'string') return '';
  let t = raw.replace(/\s*Wikipedia:\s*https?:\/\/\S+/gi, ' ').trim();
  t = t.replace(/https?:\/\/[^\s)\]]+/g, '').replace(/\s{2,}/g, ' ').trim();
  const n = (entityName || '').trim();
  if (n.length > 8 && t.length > n.length + 10) {
    const low = t.toLowerCase();
    const nn = n.toLowerCase();
    if (low.startsWith(nn)) {
      const rest = t.slice(n.length).trim();
      if (rest.startsWith('(')) {
        const end = rest.indexOf(')');
        if (end > 0 && end < 80) {
          const after = rest.slice(end + 1).trim().replace(/^[,.\s]+/, '');
          const noise = /^(is|was)\s+(a|an|the)\s+/i;
          if (noise.test(after)) {
            t = after.replace(noise, '').trim();
          }
        }
      }
    }
  }
  return capitalizeDescriptionLead(t.trim());
}

/**
 * @param {{ org: { name?: string, logo_url?: string, description?: string, website?: string, wikipedia_url?: string, status?: string }, extras?: object, stats?: object, variant?: string }} props
 */
const CompanyHeroCard = ({
  org,
  extras = {},
  stats = {},
  onAddMember,
  onEdit,
  onExport,
  variant = 'company',
}) => {
  const isInstitution = variant === 'institution';
  const name = org?.name || (isInstitution ? 'Institution' : 'Company');
  const logoUrl = org?.logo_url || extras?.logo_url;
  const rawDescription =
    org?.description || (isInstitution ? 'A leading academic institution.' : 'A leading organisation in its industry.');
  const cleanedDescription = useMemo(() => sanitizeEntityDescription(rawDescription, name), [rawDescription, name]);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const aboutLong = cleanedDescription.length > READ_MORE_AT;
  const aboutShown =
    !aboutLong || aboutExpanded
      ? cleanedDescription
      : `${cleanedDescription.slice(0, READ_MORE_AT).replace(/\s+\S*$/, '')}…`;

  const website = org?.website || extras?.website;
  const wikipediaUrl = org?.wikipedia_url || extras?.wikipedia_url;
  const status = extras?.status || (org?.status === 'placeholder' ? 'Pending' : 'Active');
  const industry = extras?.industry;
  const headquarters = extras?.headquarters;
  const founded = extras?.founded;
  const openRoles = extras?.openRoles ?? 0;
  const avgTenure = extras?.avgTenure;
  const tags = extras?.tags || [];
  const currentCount = stats?.current_count ?? 0;
  const alumniCount = stats?.alumni_count ?? 0;
  const totalCount = stats?.total_count ?? currentCount + alumniCount;
  const teamCount = extras?.teamCount ?? 6;

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-4">
          ${logoUrl
            ? html`<img
                src=${logoUrl}
                alt=""
                className="h-24 w-24 rounded-xl object-contain flex-shrink-0 bg-white p-2 ring-1 ring-gray-100"
                loading="lazy"
                decoding="async"
              />`
            : html`
                <div
                  className="h-24 w-24 rounded-xl flex items-center justify-center text-2xl font-semibold flex-shrink-0 bg-gray-100 text-gray-600"
                >
                  ${getInitials(name)}
                </div>
              `}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-gray-900">${name}</h1>
            <div className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">
              <p>${aboutShown}</p>
              ${aboutLong
                ? html`
                    <button
                      type="button"
                      className="mt-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                      onClick=${() => setAboutExpanded((e) => !e)}
                    >
                      ${aboutExpanded ? 'Show less' : 'Read more'}
                    </button>
                  `
                : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              ${industry ? html`<span>${industry}</span>` : null}
              ${headquarters ? html`<span>${headquarters}</span>` : null}
              ${founded ? html`<span>Founded ${founded}</span>` : null}
              ${website
                ? html`
                    <a href=${website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                      <${ExternalLink} className="w-3.5 h-3.5" />
                      Website
                    </a>
                  `
                : null}
              ${wikipediaUrl
                ? html`
                    <a
                      href=${wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <${ExternalLink} className="w-3.5 h-3.5" />
                      Wikipedia
                    </a>
                  `
                : null}
            </div>
            <div className="mt-2">
              <span className=${`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                ${status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          ${onAddMember ? html`<button onClick=${onAddMember} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"><${UserPlus} className="w-4 h-4" /> Add member</button>` : null}
          ${onEdit ? html`<button onClick=${onEdit} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"><${Pencil} className="w-4 h-4" /> Edit company</button>` : null}
          ${onExport ? html`<button onClick=${onExport} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"><${Download} className="w-4 h-4" /> Export data</button>` : null}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">${isInstitution ? 'Current students' : 'Current members'}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${currentCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Alumni</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${alumniCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Total people</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${totalCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">${isInstitution ? 'Programmes' : 'Open roles'}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${openRoles}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">${isInstitution ? 'Departments' : 'Teams'}</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${teamCount}</p>
        </div>
        <div className="rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Avg tenure</p>
          <p className="mt-1 text-xl font-bold text-gray-900">${avgTenure || '—'}</p>
        </div>
      </div>
      ${tags.length > 0
        ? html`
            <div className="mt-4 flex flex-wrap gap-2">
              ${tags.map(
                (t) =>
                  html`<span key=${t} className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">${t}</span>`
              )}
            </div>
          `
        : null}
    </div>
  `;
};

export default CompanyHeroCard;
