/**
 * Alumni section: search, filter, alumni cards.
 */
import React, { useState, useMemo } from 'react';
import htm from 'htm';
import { Search, ExternalLink } from 'lucide-react';
import EmptyState from './EmptyState.js';
import { GraduationCap } from 'lucide-react';

const html = htm.bind(React.createElement);

const getInitials = (name) =>
  (name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

/**
 * @param {{ alumni: Array<{ id: string, fullName: string, formerTitle: string, team: string, yearsAtCompany: number, currentCompany: string, departureYear: number, profileSlug: string }>, variant?: 'company'|'institution' }} props
 */
const AlumniList = ({ alumni = [], variant = 'company' }) => {
  const isInstitution = variant === 'institution';
  const tenureLabel = isInstitution ? 'at institution' : 'at company';
  const departureLabel = isInstitution ? 'Graduated' : 'Left';
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return alumni;
    const q = search.toLowerCase();
    return alumni.filter(
      (a) =>
        a.fullName.toLowerCase().includes(q) ||
        (a.formerTitle || '').toLowerCase().includes(q) ||
        (a.team || '').toLowerCase().includes(q) ||
        (a.currentCompany || '').toLowerCase().includes(q)
    );
  }, [alumni, search]);

  return html`
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          Alumni
          <span className="ml-2 text-sm font-normal text-gray-500">${filtered.length}</span>
        </h2>
        <div className="relative w-full sm:w-64">
          <${Search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search alumni..."
            value=${search}
            onChange=${(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="p-4">
        ${filtered.length === 0
          ? html`<${EmptyState} icon=${GraduationCap} message="No alumni found." />`
          : html`
              <div className="grid gap-3 sm:grid-cols-2">
                ${filtered.map(
                  (a) => html`
                    <div
                      key=${a.id}
                      className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-700 flex-shrink-0">
                        ${getInitials(a.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900">${a.fullName}</p>
                        <p className="text-sm text-gray-500">${a.formerTitle}</p>
                        <div className="mt-2 text-xs text-gray-400 space-y-0.5">
                          ${a.team ? html`<p>${a.team}</p>` : null}
                          <p>${a.yearsAtCompany != null ? `${Number(a.yearsAtCompany).toFixed(1)} yrs` : '—'} ${tenureLabel}</p>
                          ${a.currentCompany && a.currentCompany !== '—'
                            ? html`<p>Now at ${a.currentCompany}</p>`
                            : null}
                          ${a.departureYear != null ? html`<p>${departureLabel} ${a.departureYear}</p>` : null}
                        </div>
                        <a
                          href=${`/p/${a.profileSlug}`}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                        >
                          View profile
                          <${ExternalLink} className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  `
                )}
              </div>
            `}
      </div>
    </div>
  `;
};

export default AlumniList;
