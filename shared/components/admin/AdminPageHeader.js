/**
 * Consistent admin page title + optional subtitle + actions row.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * @param {{ title: string, subtitle?: string, actions?: React.ReactNode }} props
 */
const AdminPageHeader = ({ title, subtitle, actions }) => html`
  <header className="ith-admin-page-header">
    <div>
      <h1>${title}</h1>
      ${subtitle ? html`<p>${subtitle}</p>` : null}
    </div>
    ${actions ? html`<div className="flex flex-wrap items-center gap-2">${actions}</div>` : null}
  </header>
`;

export default AdminPageHeader;
