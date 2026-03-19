/**
 * Programs tab: Degrees, Majors, Minors, Departments tables with CRUD.
 */
import React, { useState } from 'react';
import htm from 'htm';
import SectionCard from '../components/SectionCard.js';
import { apiRequest } from '/shared/services/apiBase.js';

const html = htm.bind(React.createElement);

const TABLE_HEAD = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider';
const TABLE_CELL = 'px-4 py-3 text-sm';

const ProgramsTab = ({
  institution,
  onRefresh,
}) => {
  const [adding, setAdding] = useState(null);
  const [editDegree, setEditDegree] = useState(null);
  const [editMajor, setEditMajor] = useState(null);

  const addDepartment = async () => {
    const name = window.prompt('Department name');
    if (!name?.trim()) return;
    setAdding('department');
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/departments`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed to add');
    } finally {
      setAdding(null);
    }
  };

  const addDegree = async () => {
    const name = window.prompt('Degree name (e.g. Bachelor of Science)');
    if (!name?.trim()) return;
    setAdding('degree');
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/degrees`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), level: 'Undergraduate', duration_years: 4 }),
      });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed to add');
    } finally {
      setAdding(null);
    }
  };

  const addMajor = async () => {
    const name = window.prompt('Major name');
    if (!name?.trim()) return;
    setAdding('major');
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/majors`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed to add');
    } finally {
      setAdding(null);
    }
  };

  const addMinor = async () => {
    const name = window.prompt('Minor name');
    if (!name?.trim()) return;
    setAdding('minor');
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/minors`, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim() }),
      });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed to add');
    } finally {
      setAdding(null);
    }
  };

  const deleteDepartment = async (id) => {
    if (!window.confirm('Remove this department?')) return;
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/departments/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  const deleteDegree = async (id) => {
    if (!window.confirm('Remove this degree?')) return;
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/degrees/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  const deleteMajor = async (id) => {
    if (!window.confirm('Remove this major?')) return;
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/majors/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  const deleteMinor = async (id) => {
    if (!window.confirm('Remove this minor?')) return;
    try {
      await apiRequest(`/v1/admin/institutions/${institution.id}/minors/${id}`, { method: 'DELETE' });
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed');
    }
  };

  const departments = institution?.departments ?? [];
  const degrees = institution?.degrees_v2 ?? [];
  const majors = institution?.majors_v2 ?? [];
  const minors = institution?.minors_v2 ?? [];

  return html`
    <div className="space-y-6">
      <${SectionCard} title="Departments">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${departments.map((d) => html`
                <tr key=${d.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${d.name}</td>
                  <td className=${TABLE_CELL}>
                    <button onClick=${() => deleteDepartment(d.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addDepartment} disabled=${adding === 'department'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>
          + Add department
        </button>
      </${SectionCard}>
      <${SectionCard} title="Degrees">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Level</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Duration</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${degrees.map((d) => html`
                <tr key=${d.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${d.name}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${d.level || 'Undergraduate'}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${d.duration_years ?? 4} yrs</td>
                  <td className=${TABLE_CELL}>
                    <button onClick=${() => deleteDegree(d.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addDegree} disabled=${adding === 'degree'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>
          + Add degree
        </button>
      </${SectionCard}>
      <${SectionCard} title="Majors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Status</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${majors.map((m) => html`
                <tr key=${m.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${m.name}</td>
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-secondary)' }}>${m.status || 'active'}</td>
                  <td className=${TABLE_CELL}>
                    <button onClick=${() => deleteMajor(m.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addMajor} disabled=${adding === 'major'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>
          + Add major
        </button>
      </${SectionCard}>
      <${SectionCard} title="Minors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style=${{ background: 'var(--app-surface-subtle)' }}>
              <tr>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}>Name</th>
                <th className=${TABLE_HEAD} style=${{ color: 'var(--app-text-muted)' }}></th>
              </tr>
            </thead>
            <tbody>
              ${minors.map((m) => html`
                <tr key=${m.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]">
                  <td className=${TABLE_CELL} style=${{ color: 'var(--app-text-primary)' }}>${m.name}</td>
                  <td className=${TABLE_CELL}>
                    <button onClick=${() => deleteMinor(m.id)} className="text-red-600 hover:underline text-sm">Remove</button>
                  </td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        <button onClick=${addMinor} disabled=${adding === 'minor'} className="mt-3 text-sm font-medium" style=${{ color: 'var(--app-accent)' }}>
          + Add minor
        </button>
      </${SectionCard}>
    </div>
  `;
};

export default ProgramsTab;
