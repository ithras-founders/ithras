import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getRoles, getPermissions, createRole, updateRole, deleteRole } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const PERMISSION_CATEGORIES = [
  'placement', 'cv', 'applications', 'users', 'institution', 'company', 'system', 'governance'
];

const RoleManager = () => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', permission_codes: [] });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesData, permsData] = await Promise.all([getRoles(), getPermissions()]);
      setRoles(rolesData);
      setPermissions(permsData);
    } catch (e) {
      toast.error('Failed to load roles: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const permsByCategory = PERMISSION_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = permissions.filter(p => p.category === cat);
    return acc;
  }, {});

  const handleNewRole = () => {
    setEditingRole(null);
    setFormData({ name: '', description: '', permission_codes: [] });
    setShowForm(true);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permission_codes: role.permissions.map(p => p.code),
    });
    setShowForm(true);
  };

  const handleDeleteRole = async (role) => {
    if (role.is_system) { toast.error('Cannot delete a system role'); return; }
    if (!(await confirm({ message: `Delete role "${role.name}"?` }))) return;
    try {
      await deleteRole(role.id);
      toast.success('Role deleted');
      fetchData();
    } catch (e) {
      toast.error('Failed: ' + (e.message || ''));
    }
  };

  const togglePermission = (code) => {
    setFormData(prev => ({
      ...prev,
      permission_codes: prev.permission_codes.includes(code)
        ? prev.permission_codes.filter(c => c !== code)
        : [...prev.permission_codes, code],
    }));
  };

  const toggleCategory = (cat) => {
    const catCodes = permsByCategory[cat].map(p => p.code);
    const allSelected = catCodes.every(c => formData.permission_codes.includes(c));
    setFormData(prev => ({
      ...prev,
      permission_codes: allSelected
        ? prev.permission_codes.filter(c => !catCodes.includes(c))
        : [...new Set([...prev.permission_codes, ...catCodes])],
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editingRole) {
        await updateRole(editingRole.id, formData);
        toast.success('Role updated');
      } else {
        await createRole(formData);
        toast.success('Role created');
      }
      setShowForm(false);
      fetchData();
    } catch (e) {
      toast.error('Failed: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return html`<div className="p-10 text-center text-[var(--app-text-muted)] animate-pulse">Loading roles...</div>`;

  if (showForm) return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-[var(--app-text-primary)]">${editingRole ? 'Edit Role' : 'Create Custom Role'}</h3>
        <button onClick=${() => setShowForm(false)} className="px-4 py-2 text-[var(--app-text-secondary)] hover:text-[var(--app-text-secondary)] text-sm font-bold">Cancel</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Name</label>
          <input
            value=${formData.name}
            onChange=${e => setFormData(d => ({ ...d, name: e.target.value }))}
            className="w-full px-4 py-3 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="e.g. Program Coordinator"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Description</label>
          <input
            value=${formData.description}
            onChange=${e => setFormData(d => ({ ...d, description: e.target.value }))}
            className="w-full px-4 py-3 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="What does this role do?"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider mb-3">Permissions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${PERMISSION_CATEGORIES.map(cat => {
            const catPerms = permsByCategory[cat] || [];
            if (catPerms.length === 0) return null;
            const allSelected = catPerms.every(p => formData.permission_codes.includes(p.code));
            const someSelected = catPerms.some(p => formData.permission_codes.includes(p.code));
            return html`
              <div key=${cat} className="bg-[var(--app-surface-muted)] rounded-2xl border border-[var(--app-border-soft)] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked=${allSelected}
                    ref=${el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                    onChange=${() => toggleCategory(cat)}
                    className="w-4 h-4 text-[var(--app-accent)] rounded"
                  />
                  <span className="text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest">${cat}</span>
                </div>
                <div className="space-y-2">
                  ${catPerms.map(p => html`
                    <label key=${p.code} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked=${formData.permission_codes.includes(p.code)}
                        onChange=${() => togglePermission(p.code)}
                        className="w-3.5 h-3.5 text-[var(--app-accent)] rounded"
                      />
                      <span className="text-xs text-[var(--app-text-secondary)]">${p.name}</span>
                    </label>
                  `)}
                </div>
              </div>
            `;
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          onClick=${handleSave}
          disabled=${saving}
          className="px-8 py-3 bg-[var(--app-accent)] text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] disabled:opacity-50"
        >
          ${saving ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
        </button>
        <button onClick=${() => setShowForm(false)} className="px-6 py-3 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-2xl text-[11px] font-semibold uppercase tracking-widest hover:bg-[var(--app-surface-muted)]">
          Cancel
        </button>
      </div>
    </div>
  `;

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-[var(--app-text-primary)] tracking-tighter">Roles & Permissions</h3>
          <p className="text-[var(--app-text-secondary)] text-sm mt-1">Manage predefined and custom roles with granular permissions.</p>
        </div>
        <button
          onClick=${handleNewRole}
          className="px-6 py-3 bg-[var(--app-accent)] text-white rounded-2xl text-[11px] font-semibold uppercase tracking-widest shadow-lg hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          + Custom Role
        </button>
      </div>

      <div className="space-y-4">
        ${roles.map(role => html`
          <div key=${role.id} className="bg-[var(--app-surface)] p-6 rounded-[30px] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className=${`w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-lg ${role.is_system ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-purple-100 text-purple-600'}`}>
                  ${role.name[0]}
                </div>
                <div>
                  <h4 className="font-bold text-[var(--app-text-primary)]">${role.name}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className=${`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${role.type === 'PREDEFINED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-purple-50 text-purple-600'}`}>
                      ${role.type}
                    </span>
                    ${role.description ? html`<span className="text-xs text-[var(--app-text-muted)]">${role.description}</span>` : ''}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick=${() => handleEditRole(role)}
                  className="px-4 py-2 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-surface-muted)]"
                >
                  Edit
                </button>
                ${!role.is_system ? html`
                  <button
                    onClick=${() => handleDeleteRole(role)}
                    className="px-4 py-2 bg-[rgba(255,59,48,0.06)] border border-red-200 text-[var(--app-danger)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[rgba(255,59,48,0.08)]"
                  >
                    Delete
                  </button>
                ` : ''}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3">
              ${(role.permissions || []).map(p => html`
                <span key=${p.code} className="px-2 py-1 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-lg text-[10px] font-semibold">
                  ${p.code}
                </span>
              `)}
              ${(!role.permissions || role.permissions.length === 0) ? html`
                <span className="text-xs text-[var(--app-text-muted)] italic">No permissions assigned</span>
              ` : ''}
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default RoleManager;
