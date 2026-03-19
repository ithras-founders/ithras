/**
 * Organisation Structure tab: Business units and Functions tables.
 */
import React, { useState } from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const TABLE_HEAD = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider';
const TABLE_CELL = 'px-4 py-3 text-sm';

const StructureTab = ({ organisation, onRefresh }) => {
  const [adding, setAdding] = useState(null);
  const bus = organisation?.business_units_v2 ?? [];
  const fns = organisation?.functions_v2 ?? [];
  const getBUName = (id) => bus.find((b) => b.id === id)?.name ?? '-';

  const addBU = async () => {
    const name = window.prompt('Business unit name');
    if (!name?.trim()) return;
    setAdding('bu');
    try {
      await apiRequest(`/v1/admin/organisations/${organisation.id}/business-units`, { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setAdding(null);
    }
  };

  const deleteBU = async (id) => {
    if (!window.confirm('Remove this business unit?')) return;
    try {
      await apiRequest(`/v1/admin/organisations/${organisation.id}/business-units/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  const addFunction = async () => {
    const name = window.prompt('Function name');
    if (!name?.trim()) return;
    setAdding('fn');
    try {
      await apiRequest(`/v1/admin/organisations/${organisation.id}/functions`, { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setAdding(null);
    }
  };

  const deleteFunction = async (id) => {
    if (!window.confirm('Remove this function?')) return;
    try {
      await apiRequest(`/v1/admin/organisations/${organisation.id}/functions/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  return html`
    <div className="space-y-6">
      <${SectionCard} title="Business units">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${bus.map((b) => html`
                <tr key=${b.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${b.name}</td>
                  <td className=${TABLE_CELL}><button onClick=${() => deleteBU(b.id)} className="text-red-600 hover:underline text-sm">Remove</button></td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addBU} disabled=${adding === 'bu'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>+ Add business unit</button>
      </${SectionCard}>
      <${SectionCard} title="Functions">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Business unit</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${fns.map((f) => html`
                <tr key=${f.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${f.name}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${getBUName(f.business_unit_id)}</td>
                  <td className=${TABLE_CELL}><button onClick=${() => deleteFunction(f.id)} className="text-red-600 hover:underline text-sm">Remove</button></td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addFunction} disabled=${adding === 'fn'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>+ Add function</button>
      </${SectionCard}>
    </div>
  `;
};

export default StructureTab;
