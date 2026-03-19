/**
 * Current members section: search, filters, sort, member cards.
 */
import React, { useState, useMemo } from 'react';
import htm from 'htm';
import { Search, ExternalLink } from 'lucide-react';
import EmptyState from './EmptyState.js';
import { Users } from 'lucide-react';

const html = htm.bind(React.createElement);

const getInitials = (name) =>
  (name || '?').split(/\s+/).map((s) => s[0]).join('').slice(0, 2).toUpperCase();

/**
 * @param {{ members: Array<{ id: string, fullName: string, title: string, team: string, location: string, startDate: string, tenure: string, badges: string[], profileSlug: string }>, title?: string, teamFilterLabel?: string }} props
 */
const MemberList = ({ members = [], title = 'Current Members', teamFilterLabel = 'All teams' }) => {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const teams = useMemo(() => [...new Set(members.map((m) => m.team).filter(Boolean))].sort(), [members]);
  const locations = useMemo(() => [...new Set(members.map((m) => m.location).filter(Boolean))].sort(), [members]);

  const filtered = useMemo(() => {
    let list = members;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.fullName.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q) ||
          (m.team || '').toLowerCase().includes(q)
      );
    }
    if (teamFilter) list = list.filter((m) => m.team === teamFilter);
    if (locationFilter) list = list.filter((m) => m.location === locationFilter);
    if (sortBy === 'newest') list = [...list].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
    else if (sortBy === 'tenure') list = [...list].sort((a, b) => parseFloat((b.tenure || '0').replace(/\D/g, '')) - parseFloat((a.tenure || '0').replace(/\D/g, '')));
    else if (sortBy === 'alphabetical') list = [...list].sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    return list;
  }, [members, search, teamFilter, locationFilter, sortBy]);

  return html`
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-gray-900">
          ${title}
          <span className="ml-2 text-sm font-normal text-gray-500">${filtered.length}</span>
        </h2>
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 sm:flex-initial min-w-[160px]">
            <${Search} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value=${search}
              onChange=${(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value=${teamFilter}
            onChange=${(e) => setTeamFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">${teamFilterLabel}</option>
            ${teams.map((t) => html`<option key=${t} value=${t}>${t}</option>`)}
          </select>
          <select
            value=${locationFilter}
            onChange=${(e) => setLocationFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All locations</option>
            ${locations.map((l) => html`<option key=${l} value=${l}>${l}</option>`)}
          </select>
          <select
            value=${sortBy}
            onChange=${(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest</option>
            <option value="tenure">Tenure</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>
      <div className="p-4">
        ${filtered.length === 0
          ? html`<${EmptyState} icon=${Users} message="No members found." />`
          : html`
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                ${filtered.map(
                  (m) => html`
                    <div
                      key=${m.id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-medium bg-gray-200 text-gray-700 flex-shrink-0">
                        ${getInitials(m.fullName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">${m.fullName}</p>
                        <p className="text-sm text-gray-500 truncate">${m.title}</p>
                        <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                          ${m.team ? html`<span>${m.team}</span>` : null}
                          ${m.location ? html`<span>· ${m.location}</span>` : null}
                          ${m.startDate ? html`<span>· ${m.startDate}</span>` : null}
                          ${m.tenure ? html`<span>· ${m.tenure}</span>` : null}
                        </div>
                        ${(m.badges || []).length > 0
                          ? html`
                              <div className="mt-1 flex gap-1">
                                ${m.badges.map(
                                  (b) => html`<span key=${b} className="px-1.5 py-0.5 rounded text-xs bg-blue-50 text-blue-700">${b}</span>`
                                )}
                              </div>
                            `
                          : null}
                      </div>
                      <a
                        href=${`/p/${m.profileSlug}`}
                        className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline flex-shrink-0"
                      >
                        View
                        <${ExternalLink} className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  `
                )}
              </div>
            `}
      </div>
    </div>
  `;
};

export default MemberList;
