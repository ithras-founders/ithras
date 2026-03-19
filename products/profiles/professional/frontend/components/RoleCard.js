/**
 * Role display card for Roles / Position History section.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ role: { title: string, level?: string, department?: string, function?: string, team?: string, employmentType?: string, location?: string, status?: string, peopleCount?: number }, business_unit?: string, function?: string, title?: string }} props
 */
const RoleCard = ({ role, business_unit, function: fn, title }) => {
  const r = role || {};
  const displayTitle = r.title || title;
  const displayBu = r.business_unit ?? business_unit;
  const displayFn = r.function ?? fn;
  const level = r.level;
  const department = r.department;
  const team = r.team;
  const employmentType = r.employmentType;
  const location = r.location;
  const status = r.status;
  const peopleCount = r.peopleCount;

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">${displayTitle}</p>
          ${level ? html`<span className="text-xs font-medium text-gray-500">${level}</span>` : null}
        </div>
        ${status ? html`<span className=${`px-2 py-0.5 rounded text-xs font-medium ${status === 'current' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>${status}</span>` : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
        ${department ? html`<span>${department}</span>` : null}
        ${displayFn ? html`<span>${displayFn}</span>` : null}
        ${team ? html`<span>${team}</span>` : null}
        ${employmentType ? html`<span>${employmentType}</span>` : null}
        ${location ? html`<span>${location}</span>` : null}
        ${displayBu ? html`<span>${displayBu}</span>` : null}
      </div>
      ${peopleCount != null
        ? html`
            <p className="mt-2 text-xs text-gray-400">${peopleCount} people in this role</p>
          `
        : null}
    </div>
  `;
};

export default RoleCard;
