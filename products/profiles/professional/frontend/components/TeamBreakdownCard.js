/**
 * Department/team card for org breakdown section.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ team: { name: string, memberCount: number, alumniCount: number, lead: string, description: string } }} props
 */
const TeamBreakdownCard = ({ team }) => {
  const { name, memberCount, alumniCount, lead, description } = team || {};

  return html`
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900">${name || 'Team'}</h3>
      <div className="mt-2 flex gap-4 text-sm text-gray-500">
        <span>${memberCount ?? 0} members</span>
        <span>${alumniCount ?? 0} alumni</span>
      </div>
      ${lead ? html`<p className="mt-1 text-xs text-gray-500">Lead: ${lead}</p>` : null}
      ${description ? html`<p className="mt-2 text-sm text-gray-600">${description}</p>` : null}
    </div>
  `;
};

export default TeamBreakdownCard;
