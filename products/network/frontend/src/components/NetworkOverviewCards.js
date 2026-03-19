/**
 * NetworkOverviewCards - Stat cards for overview.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const StatCard = ({ label, value, href }) => html`
  <div
    className="p-4 rounded-xl border flex flex-col"
    style=${{ borderColor: 'var(--app-border-soft)' }}
  >
    <span className="text-2xl font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${value}</span>
    <span className="text-sm mt-1" style=${{ color: 'var(--app-text-secondary)' }}>${label}</span>
    ${href ? html`
      <a
        href=${href}
        onClick=${(e) => { e.preventDefault(); window.history.pushState(null, '', href); window.dispatchEvent(new CustomEvent('ithras:path-changed')); }}
        className="text-sm mt-2 font-medium hover:underline"
        style=${{ color: 'var(--app-accent)' }}
      >
        View
      </a>
    ` : null}
  </div>
`;

const NetworkOverviewCards = ({ stats }) => html`
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
    <${StatCard} label="Connections" value=${stats?.connections_count ?? 0} href="/network/connections" />
    <${StatCard} label="Following" value=${stats?.following_count ?? 0} href="/network/following" />
    <${StatCard} label="Same organizations" value=${stats?.same_org_count ?? 0} href="/network/org" />
    <${StatCard} label="Same institutions" value=${stats?.same_institution_count ?? 0} href="/network/institution" />
    <${StatCard} label="Same function" value=${stats?.same_function_count ?? 0} href="/network/function" />
  </div>
`;

export default NetworkOverviewCards;
