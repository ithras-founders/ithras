/**
 * Organisation People tab: Current members, Alumni, Admins.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';

const html = htm.bind(React.createElement);

const TABLE_HEAD = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider';
const TABLE_CELL = 'px-4 py-3 text-sm';

const PeopleTab = ({ people, admins }) => {
  const current = people?.current ?? [];
  const alumni = people?.alumni ?? [];

  return html`
    <div className="space-y-6">
      <${SectionCard} title="Current members">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Role</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Business unit</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Function</th>
              </tr>
            </thead>
            <tbody>
              ${current.length ? current.map((p) => html`
                <tr key=${p.user_id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL}>
                    <a href=${`/p/${p.profile_slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style=${{ color: 'var(--app-accent)' }}>${p.full_name}</a>
                  </td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${p.title || '-'}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${p.business_unit || '-'}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${p.function || '-'}</td>
                </tr>
              `) : html`<tr><td colSpan=${4} className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>No current members</td></tr>`}
            </tbody>
          </table>
        </div>
      </${SectionCard}>
      <${SectionCard} title="Alumni">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Role</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Period</th>
              </tr>
            </thead>
            <tbody>
              ${alumni.length ? alumni.slice(0, 50).map((p) => html`
                <tr key=${p.user_id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL}>
                    <a href=${`/p/${p.profile_slug}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style=${{ color: 'var(--app-accent)' }}>${p.full_name}</a>
                  </td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${p.title || '-'}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>${p.start_month || ''} - ${p.end_month || ''}</td>
                </tr>
              `) : html`<tr><td colSpan=${3} className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>No alumni</td></tr>`}
            </tbody>
          </table>
        </div>
        ${alumni.length > 50 ? html`<p className="text-sm mt-2" style=${{ color: 'var(--app-text-muted)' }}>Showing first 50 of ${alumni.length}</p>` : null}
      </${SectionCard}>
      <${SectionCard} title="Org admins">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Role</th>
              </tr>
            </thead>
            <tbody>
              ${(admins ?? []).length ? (admins ?? []).map((a) => html`
                <tr key=${a.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${a.full_name || `User ${a.user_id}`}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${a.role}</td>
                </tr>
              `) : html`<tr><td colSpan=${2} className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>No admins yet</td></tr>`}
            </tbody>
          </table>
        </div>
      </${SectionCard}>
    </div>
  `;
};

export default PeopleTab;
