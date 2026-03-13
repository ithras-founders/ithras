import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getRoles, getPermissions, createRole, updateRole, deleteRole, setRolePermissions } from '/core/frontend/src/modules/shared/services/api.js';
import { PERM_CATEGORIES } from './constants.js';

const html = htm.bind(React.createElement);

const AccessControlTab = ({ toast }) => {
  const [roles, setRoles] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedRole, setExpandedRole] = useState(null);
  const [editPerms, setEditPerms] = useState({});
  const [editMeta, setEditMeta] = useState({});
  const [creating, setCreating] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [newPerms, setNewPerms] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesData, permsData] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(Array.isArray(rolesData) ? rolesData : []);
      setAllPerms(Array.isArray(permsData) ? permsData : []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const permsByCategory = {};
  allPerms.forEach(p => {
    const cat = p.category || 'other';
    if (!permsByCategory[cat]) permsByCategory[cat] = [];
    permsByCategory[cat].push(p);
  });

  const handleExpand = (role) => {
    if (expandedRole === role.id) { setExpandedRole(null); return; }
    setExpandedRole(role.id);
    const currentCodes = {};
    (role.permissions || []).forEach(p => { currentCodes[p.code] = true; });
    setEditPerms(currentCodes);
    setEditMeta({ name: role.name, description: role.description || '' });
  };

  const handleSave = async (role) => {
    setSaving(true);
    try {
      if (!role.is_system) {
        await updateRole(role.id, { name: editMeta.name, description: editMeta.description });
      }
      const selectedCodes = Object.keys(editPerms).filter(k => editPerms[k]);
      await setRolePermissions(role.id, selectedCodes);
      toast.success('Role updated');
      setExpandedRole(null);
      loadData();
    } catch (e) { toast.error('Save failed: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const handleCreate = async () => {
    if (!newRole.name.trim()) { toast.error('Role name is required'); return; }
    setSaving(true);
    try {
      await createRole({
        name: newRole.name,
        description: newRole.description,
        type: 'CUSTOM',
        permission_codes: Object.keys(newPerms).filter(k => newPerms[k]),
      });
      toast.success('Role created');
      setCreating(false);
      setNewRole({ name: '', description: '' });
      setNewPerms({});
      loadData();
    } catch (e) { toast.error('Create failed: ' + (e.message || '')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (role) => {
    try {
      await deleteRole(role.id);
      toast.success('Role deleted');
      loadData();
    } catch (e) { toast.error('Delete failed: ' + (e.message || '')); }
  };

  const togglePerm = (permSet, setPermSet, code) => {
    setPermSet(prev => ({ ...prev, [code]: !prev[code] }));
  };

  const toggleCategory = (permSet, setPermSet, category) => {
    const catPerms = permsByCategory[category] || [];
    const allSelected = catPerms.every(p => permSet[p.code]);
    const updated = { ...permSet };
    catPerms.forEach(p => { updated[p.code] = !allSelected; });
    setPermSet(updated);
  };

  const renderPermEditor = (permSet, setPermSet, readOnly = false) => {
    const categories = PERM_CATEGORIES.filter(c => permsByCategory[c.key]?.length > 0);
    return html`
      <div className="space-y-2 mt-4">
        ${categories.map(cat => {
          const catPerms = permsByCategory[cat.key] || [];
          const selectedCount = catPerms.filter(p => permSet[p.code]).length;
          return html`
            <details key=${cat.key} className="group">
              <summary className="flex items-center justify-between p-3 bg-[var(--app-surface-muted)] rounded-xl cursor-pointer hover:bg-[var(--app-surface-muted)] transition-colors select-none">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--app-text-secondary)]">${cat.label}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]">${selectedCount}/${catPerms.length}</span>
                </div>
                ${!readOnly ? html`
                  <button onClick=${(e) => { e.preventDefault(); toggleCategory(permSet, setPermSet, cat.key); }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800">
                    ${selectedCount === catPerms.length ? 'Deselect All' : 'Select All'}
                  </button>
                ` : null}
              </summary>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 p-3 pl-6">
                ${catPerms.map(p => html`
                  <label key=${p.code} className=${'flex items-center gap-2.5 p-2 rounded-lg transition-colors ' + (readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-[var(--app-surface-muted)]')}>
                    <input type="checkbox" checked=${!!permSet[p.code]} disabled=${readOnly}
                      onChange=${() => !readOnly && togglePerm(permSet, setPermSet, p.code)}
                      className="w-4 h-4 rounded border-[var(--app-border-soft)] text-indigo-600 focus:ring-indigo-200" />
                    <div>
                      <span className="text-sm font-medium text-[var(--app-text-primary)]">${p.name}</span>
                      <span className="text-[10px] text-[var(--app-text-muted)] font-mono ml-2">${p.code}</span>
                    </div>
                  </label>
                `)}
              </div>
            </details>
          `;
        })}
      </div>
    `;
  };

  if (loading) return html`<div className="text-center text-[var(--app-text-muted)] py-12 animate-pulse">Loading roles...</div>`;

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--app-text-secondary)]">${roles.length} role${roles.length !== 1 ? 's' : ''} configured</p>
        <button onClick=${() => setCreating(!creating)} data-tour-id="access-create"
          className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
          ${creating ? 'Cancel' : '+ Create Custom Role'}
        </button>
      </div>

      ${creating ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border-2 border-indigo-200 p-6 space-y-4">
          <h4 className="text-sm font-semibold text-indigo-700 uppercase tracking-wider">New Custom Role</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Name *</label>
              <input type="text" value=${newRole.name} onChange=${e => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Department Coordinator"
                className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
            <div>
              <label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Description</label>
              <input type="text" value=${newRole.description} onChange=${e => setNewRole(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What this role is for"
                className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
            </div>
          </div>
          ${renderPermEditor(newPerms, setNewPerms)}
          <div className="flex justify-end pt-2">
            <button onClick=${handleCreate} disabled=${saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              ${saving ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </div>
      ` : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-tour-id="access-roles">
        ${roles.map(role => {
          const isExpanded = expandedRole === role.id;
          const permCount = role.permissions?.length || 0;
          return html`
            <div key=${role.id} className=${'bg-[var(--app-surface)] rounded-2xl border transition-all ' + (isExpanded ? 'border-indigo-300 shadow-lg col-span-full' : 'border-[var(--app-border-soft)] hover:shadow-md')}>
              <button onClick=${() => handleExpand(role)}
                className="w-full p-5 text-left">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-[var(--app-text-primary)]">${role.name}</h4>
                      <span className=${'px-2 py-0.5 rounded text-[10px] font-bold uppercase ' + (role.type === 'PREDEFINED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-amber-100 text-amber-700')}>
                        ${role.type}
                      </span>
                      ${role.is_system ? html`<span className="px-2 py-0.5 rounded bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] text-[10px] font-bold">System</span>` : null}
                    </div>
                    ${role.description ? html`<p className="text-sm text-[var(--app-text-secondary)] mt-1">${role.description}</p>` : null}
                    <p className="text-xs text-[var(--app-text-muted)] mt-2">${permCount} permission${permCount !== 1 ? 's' : ''}</p>
                  </div>
                  <svg className=${'w-4 h-4 text-[var(--app-text-muted)] transition-transform shrink-0 mt-1 ' + (isExpanded ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              ${isExpanded ? html`
                <div className="border-t border-[var(--app-border-soft)] p-5 space-y-4 animate-in">
                  ${!role.is_system ? html`
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Name</label>
                        <input type="text" value=${editMeta.name} onChange=${e => setEditMeta(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Description</label>
                        <input type="text" value=${editMeta.description} onChange=${e => setEditMeta(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200" />
                      </div>
                    </div>
                  ` : null}

                  ${renderPermEditor(editPerms, setEditPerms, role.is_system)}

                  <div className="flex items-center justify-between pt-2">
                    ${!role.is_system ? html`
                      <button onClick=${() => handleDelete(role)}
                        className="px-4 py-2 text-[var(--app-danger)] border border-red-200 rounded-lg text-xs font-bold hover:bg-[rgba(255,59,48,0.06)] transition-colors">
                        Delete Role
                      </button>
                    ` : html`<div />`}
                    ${!role.is_system ? html`
                      <button onClick=${() => handleSave(role)} disabled=${saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                        ${saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    ` : null}
                  </div>
                </div>
              ` : null}
            </div>
          `;
        })}
      </div>
    </div>
  `;
};

export default React.memo(AccessControlTab);
