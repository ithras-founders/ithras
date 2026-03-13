import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getRoles, getUserProfiles, assignProfile, revokeProfile, updateProfile, getPrograms } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const ProfileAssignment = ({ institutions = [], companies = [], allUsers = [], onRefresh }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [roles, setRoles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userProfiles, setUserProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignData, setAssignData] = useState({ role_id: '', institution_id: '', company_id: '', program_id: '', expires_at: '' });
  const [programs, setPrograms] = useState([]);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { getRoles().then(setRoles).catch(() => {}); }, []);

  const selectUser = async (userId) => {
    setSelectedUserId(userId);
    setShowAssignForm(false);
    setLoadingProfiles(true);
    try {
      const profiles = await getUserProfiles(userId);
      setUserProfiles(profiles);
    } catch (e) {
      toast.error('Failed to load profiles');
      setUserProfiles([]);
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleAssignFormChange = async (field, value) => {
    const next = { ...assignData, [field]: value };
    if (field === 'institution_id' && value) {
      try {
        const progs = await getPrograms(value);
        setPrograms(progs);
      } catch { setPrograms([]); }
      next.program_id = '';
    }
    setAssignData(next);
  };

  const handleAssign = async () => {
    if (!assignData.role_id) { toast.error('Select a role'); return; }
    setSaving(true);
    try {
      const payload = { role_id: assignData.role_id };
      if (assignData.institution_id) payload.institution_id = assignData.institution_id;
      if (assignData.company_id) payload.company_id = assignData.company_id;
      if (assignData.program_id) payload.program_id = assignData.program_id;
      if (assignData.expires_at) payload.expires_at = new Date(assignData.expires_at).toISOString();
      await assignProfile(selectedUserId, payload);
      toast.success('Role assigned');
      setShowAssignForm(false);
      selectUser(selectedUserId);
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error(e.message || 'Failed to assign role');
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (assignmentId) => {
    if (!(await confirm({ message: 'Revoke this role assignment?' }))) return;
    try {
      await revokeProfile(selectedUserId, assignmentId);
      toast.success('Role revoked');
      selectUser(selectedUserId);
      if (onRefresh) onRefresh();
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const handleToggleActive = async (profile) => {
    try {
      await updateProfile(selectedUserId, profile.id, { is_active: !profile.is_active });
      toast.success(profile.is_active ? 'Profile deactivated' : 'Profile reactivated');
      selectUser(selectedUserId);
    } catch (e) {
      toast.error(e.message || 'Failed');
    }
  };

  const filteredUsers = searchQuery.trim()
    ? allUsers.filter(u => u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    : allUsers;

  const selectedUser = allUsers.find(u => u.id === selectedUserId);

  return html`
    <div className="space-y-6 animate-in pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User list -->
        <div className="bg-[var(--app-surface)] rounded-[30px] border border-[var(--app-border-soft)] shadow-sm p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-4">
            <input
              placeholder="Search users..."
              value=${searchQuery}
              onChange=${e => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--app-accent)] outline-none"
            />
          </div>
          <div className="space-y-2">
            ${filteredUsers.map(u => html`
              <button
                key=${u.id}
                onClick=${() => selectUser(u.id)}
                className=${`w-full text-left p-3 rounded-2xl border transition-colors ${selectedUserId === u.id ? 'border-[var(--app-accent)] bg-[var(--app-accent-soft)]' : 'border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 text-indigo-600 font-semibold rounded-lg flex items-center justify-center text-sm">
                    ${(u.name || '?')[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-[var(--app-text-primary)] truncate">${u.name}</p>
                    <p className="text-[11px] text-[var(--app-text-muted)] truncate">${u.email}</p>
                  </div>
                </div>
              </button>
            `)}
            ${filteredUsers.length === 0 ? html`<p className="text-center text-[var(--app-text-muted)] py-6 text-sm">No users found</p>` : ''}
          </div>
        </div>

        <!-- Profile details -->
        <div className="lg:col-span-2">
          ${!selectedUserId ? html`
            <div className="bg-[var(--app-surface)] rounded-[30px] border border-[var(--app-border-soft)] shadow-sm p-10 text-center">
              <p className="text-[var(--app-text-muted)] text-sm">Select a user to manage their role profiles.</p>
            </div>
          ` : html`
            <div className="bg-[var(--app-surface)] rounded-[30px] border border-[var(--app-border-soft)] shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--app-text-primary)]">${selectedUser?.name}</h3>
                  <p className="text-sm text-[var(--app-text-secondary)]">${selectedUser?.email}</p>
                </div>
                <button
                  onClick=${() => { setAssignData({ role_id: '', institution_id: '', company_id: '', program_id: '', expires_at: '' }); setShowAssignForm(true); }}
                  className="px-6 py-2 bg-[var(--app-accent)] text-white rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-accent-hover)] transition-colors"
                >
                  + Assign Role
                </button>
              </div>

              ${showAssignForm ? html`
                <div className="bg-[var(--app-surface-muted)] rounded-2xl border border-[var(--app-border-soft)] p-5 space-y-4">
                  <h4 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">New Role Assignment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Role</label>
                      <select
                        value=${assignData.role_id}
                        onChange=${e => handleAssignFormChange('role_id', e.target.value)}
                        className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--app-accent)] outline-none bg-[var(--app-surface)]"
                      >
                        <option value="">Select role...</option>
                        ${roles.map(r => html`<option key=${r.id} value=${r.id}>${r.name} (${r.type})</option>`)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Institution (optional)</label>
                      <select
                        value=${assignData.institution_id}
                        onChange=${e => handleAssignFormChange('institution_id', e.target.value)}
                        className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--app-accent)] outline-none bg-[var(--app-surface)]"
                      >
                        <option value="">None</option>
                        ${institutions.map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Company (optional)</label>
                      <select
                        value=${assignData.company_id}
                        onChange=${e => handleAssignFormChange('company_id', e.target.value)}
                        className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--app-accent)] outline-none bg-[var(--app-surface)]"
                      >
                        <option value="">None</option>
                        ${companies.map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Program (optional)</label>
                      <select
                        value=${assignData.program_id}
                        onChange=${e => handleAssignFormChange('program_id', e.target.value)}
                        className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--app-accent)] outline-none bg-[var(--app-surface)]"
                        disabled=${!assignData.institution_id}
                      >
                        <option value="">None</option>
                        ${programs.map(p => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase tracking-widest mb-1">Expires At (optional)</label>
                      <input
                        type="datetime-local"
                        value=${assignData.expires_at}
                        onChange=${e => handleAssignFormChange('expires_at', e.target.value)}
                        className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--app-accent)] outline-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button onClick=${handleAssign} disabled=${saving} className="px-6 py-2.5 bg-[var(--app-accent)] text-white rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-accent-hover)] disabled:opacity-50">
                      ${saving ? 'Assigning...' : 'Assign'}
                    </button>
                    <button onClick=${() => setShowAssignForm(false)} className="px-6 py-2.5 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-surface-muted)]">
                      Cancel
                    </button>
                  </div>
                </div>
              ` : ''}

              ${loadingProfiles ? html`<div className="text-center text-[var(--app-text-muted)] py-6 animate-pulse">Loading profiles...</div>` : html`
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Active Profiles (${userProfiles.length})</h4>
                  ${userProfiles.length === 0 ? html`
                    <p className="text-center text-[var(--app-text-muted)] py-6 text-sm italic">No role assignments yet.</p>
                  ` : userProfiles.map(p => {
                    const isExpired = p.expires_at && new Date(p.expires_at) < new Date();
                    return html`
                      <div key=${p.id} className=${`p-4 rounded-2xl border ${!p.is_active || isExpired ? 'bg-[var(--app-surface-muted)] border-[var(--app-border-soft)] opacity-60' : 'bg-[var(--app-surface)] border-[var(--app-border-soft)]'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className=${`w-8 h-8 rounded-lg flex items-center justify-center font-semibold text-sm ${p.is_active && !isExpired ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]'}`}>
                              ${p.role?.name?.[0] || '?'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-[var(--app-text-primary)]">${p.role?.name}</span>
                                <span className=${`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${p.role?.type === 'PREDEFINED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-purple-50 text-purple-600'}`}>
                                  ${p.role?.type}
                                </span>
                                ${!p.is_active ? html`<span className="px-2 py-0.5 bg-[rgba(255,59,48,0.06)] text-[var(--app-danger)] rounded text-[9px] font-semibold uppercase">Inactive</span>` : ''}
                                ${isExpired ? html`<span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded text-[9px] font-semibold uppercase">Expired</span>` : ''}
                              </div>
                              <div className="flex gap-3 mt-1 text-[11px] text-[var(--app-text-muted)]">
                                ${p.institution_name ? html`<span>Institution: ${p.institution_name}</span>` : ''}
                                ${p.company_name ? html`<span>Company: ${p.company_name}</span>` : ''}
                                ${p.program_name ? html`<span>Program: ${p.program_name}</span>` : ''}
                                ${p.expires_at ? html`<span>Expires: ${new Date(p.expires_at).toLocaleDateString()}</span>` : ''}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick=${() => handleToggleActive(p)}
                              className=${`px-3 py-1.5 rounded-lg text-[9px] font-semibold uppercase ${p.is_active ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-[rgba(52,199,89,0.06)] text-[var(--app-success)] border border-[rgba(52,199,89,0.2)]'}`}
                            >
                              ${p.is_active ? 'Deactivate' : 'Reactivate'}
                            </button>
                            <button
                              onClick=${() => handleRevoke(p.id)}
                              className="px-3 py-1.5 bg-[rgba(255,59,48,0.06)] text-[var(--app-danger)] border border-red-200 rounded-lg text-[9px] font-semibold uppercase hover:bg-[rgba(255,59,48,0.08)]"
                            >
                              Revoke
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          ${(p.permissions || []).map(code => html`
                            <span key=${code} className="px-1.5 py-0.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded text-[9px]">${code}</span>
                          `)}
                        </div>
                      </div>
                    `;
                  })}
                </div>
              `}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

export default ProfileAssignment;
