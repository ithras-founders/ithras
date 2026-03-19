/**
 * Organisation Activity tab: audit trail.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const TABLE_HEAD = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider';
const TABLE_CELL = 'px-4 py-3 text-sm';

const ActivityTab = ({ organisationId }) => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [skip, setSkip] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (!organisationId) return;
    setLoading(true);
    apiRequest(`/v1/admin/organisations/${organisationId}/activity?skip=${skip}&limit=${limit}`)
      .then((r) => { setItems(r.items ?? []); setTotal(r.total ?? 0); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [organisationId, skip]);

  if (loading) return html`<div className="py-12 text-center" style=${{ color: 'var(--app-text-muted)' }}>Loading activity...</div>`;

  return html`
    <${SectionCard} title="Activity log">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead style=${{ background: 'var(--app-surface-subtle)' }}>
            <tr>
              <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Action</th>
              <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>User</th>
              <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            ${items.length ? items.map((a) => html`
              <tr key=${a.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${a.action}</td>
                <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${a.full_name || `User ${a.user_id || '-'}`}</td>
                <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>${a.created_at ? new Date(a.created_at).toLocaleString() : '-'}</td>
              </tr>
            `) : html`<tr><td colSpan=${3} className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>No activity yet</td></tr>`}
          </tbody>
        </table>
      </div>
      ${total > limit ? html`
        <div className="flex items-center gap-4 mt-4">
          <button onClick=${() => setSkip(Math.max(0, skip - limit))} disabled=${skip === 0} className="text-sm font-medium disabled:opacity-50" style=${{ color: 'var(--app-accent)' }}>← Previous</button>
          <span className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>${skip + 1}-${Math.min(skip + limit, total)} of ${total}</span>
          <button onClick=${() => setSkip(skip + limit)} disabled=${skip + limit >= total} className="text-sm font-medium disabled:opacity-50" style=${{ color: 'var(--app-accent)' }}>Next →</button>
        </div>
      ` : null}
    </${SectionCard}>
  `;
};

export default ActivityTab;
