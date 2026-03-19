/**
 * Organisation Roles tab: structured roles (title, level, function, BU).
 */
import React, { useState } from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const TABLE_HEAD = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider';
const TABLE_CELL = 'px-4 py-3 text-sm';

const RolesTab = ({ organisation, onRefresh }) => {
  const [adding, setAdding] = useState(null);
  const roles = organisation?.roles_v2 ?? [];
  const bus = organisation?.business_units_v2 ?? [];
  const fns = organisation?.functions_v2 ?? [];
  const getBUName = (id) => bus.find((b) => b.id === id)?.name ?? '-';
  const getFnName = (id) => fns.find((f) => f.id === id)?.name ?? '-';

  const addRole = async () => {
    const title = window.prompt('Role title (e.g. Analyst)');
    if (!title?.trim()) return;
    setAdding('role');
    try {
      await apiRequest(`/v1/admin/organisations/${organisation.id}/roles`, {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), level: 'C10' }),
      });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setAdding(null);
    }
  };

  const deleteRole = async (id) => {
    if (!window.confirm('Remove this role?')) return;
    try {
      await apiRequest(`/v1/admin/organisations/${organisation.id}/roles/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  return html`
    <div className="space-y-6">
      <${SectionCard} title="Roles">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Title</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Level</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Function</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Business unit</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Status</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${roles.map((r) => html`
                <tr key=${r.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${r.title}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${r.level || 'C10'}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${getFnName(r.function_id)}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${getBUName(r.business_unit_id)}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-muted)' }}>${r.status || 'active'}</td>
                  <td className=${TABLE_CELL}><button onClick=${() => deleteRole(r.id)} className="text-red-600 hover:underline text-sm">Remove</button></td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addRole} disabled=${adding === 'role'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>+ Add role</button>
      </${SectionCard}>
    </div>
  `;
};

export default RolesTab;
