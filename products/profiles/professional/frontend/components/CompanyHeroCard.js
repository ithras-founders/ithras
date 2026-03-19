/**
 * Company hero card: logo, name, metadata, stats grid, actions, tags.
 */
import React from 'react';
import htm from 'htm';
import { ExternalLink, UserPlus, Pencil, Download } from 'lucide-react';

const html = htm.bind(React.createElement);

const getInitials = (name) =>
  (name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

/**
 * @param {{ org: { name?: string, logo_url?: string, description?: string, website?: string, status?: string }, extras?: { industry?: string, headquarters?: string, founded?: number, website?: string, status?: string, openRoles?: number, avgTenure?: string, tags?: string[] }, stats?: { current_count?: number, alumni_count?: number, total_count?: number }, onAddMember?: () => void, onEdit?: () => void, onExport?: () => void }} props
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
  const description = org?.description || (isInstitution ? 'A leading academic institution.' : 'A leading organisation in its industry.');
  const website = org?.website || extras?.website;
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
            ? html`<img src=${logoUrl} alt="" className="h-20 w-20 rounded-xl object-cover flex-shrink-0" />`
            : html`
                <div
                  className="h-20 w-20 rounded-xl flex items-center justify-center text-2xl font-semibold flex-shrink-0 bg-gray-100 text-gray-600"
                >
                  ${getInitials(name)}
                </div>
              `}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">${name}</h1>
            <p className="mt-1 text-sm text-gray-500 max-w-xl">${description}</p>
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
