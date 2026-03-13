import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getUser,
  getUserProfile,
  getPrograms,
  getAssignableRoles,
  getUserProfiles,
  assignProfile,
  updateProfile,
  revokeProfile,
  updateUser,
  deleteUser,
  getApplications,
  getCVs,
  getCV,
  getWorkflows,
  getJobs,
  getAuditLogs,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { getTelemetrySessions } from '/core/frontend/src/modules/shared/services/api/telemetry.js';
import { useToast, useDialog } from '/core/frontend/src/modules/shared/index.js';
import AuditTrailPanel from '/core/frontend/src/modules/shared/components/AuditTrailPanel.js';
import { SectionCard } from '/core/frontend/src/modules/shared/primitives/index.js';
import TabbedDetailView from './TabbedDetailView.js';

const html = htm.bind(React.createElement);

const extractSection = (cvData, keys) => {
  if (!cvData || typeof cvData !== 'object') return null;
  const data = cvData.data || cvData;
  for (const key of keys) {
    const val = data[key] ?? data[key?.toLowerCase?.()];
    if (val !== undefined && val !== null) return val;
  }
  return null;
};

const normalizeSectionEntries = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (val.entries && Array.isArray(val.entries)) {
    const out = [];
    for (const entry of val.entries) {
      const tableKey = Object.keys(entry || {}).find((k) => k && (k.includes('table') || k.includes('qualifications')));
      const rows = tableKey && entry[tableKey];
      if (Array.isArray(rows) && rows.length > 0) {
        for (const row of rows) {
          if (typeof row === 'object' && row !== null && !Array.isArray(row)) {
            out.push({ degree: row.degree, institution: row.institution || row.institute, institute: row.institute || row.institution, year: row.year });
          } else if (Array.isArray(row) && row.length >= 2) {
            out.push({ degree: row[0], institution: row[1], institute: row[1], year: row[4] });
          }
        }
      } else out.push(entry);
    }
    return out.length ? out : val.entries;
  }
  return [val];
};

const USER_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'roles', label: 'Roles' },
  { id: 'activity', label: 'Activity' },
  { id: 'audit', label: 'Audit Trail' },
  { id: 'sessions', label: 'Sessions' },
];

const UserDetailView = ({
  userId,
  institutions,
  companies,
  programsByInstitution,
  onBack,
  onRefresh,
  deleteUser: deleteUserFn,
}) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [tab, setTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [userProfiles, setUserProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [assignForm, setAssignForm] = useState(null);
  const [assignPrograms, setAssignPrograms] = useState([]);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [assignRolesLoading, setAssignRolesLoading] = useState(false);

  const [cvs, setCvs] = useState([]);
  const [cvData, setCvData] = useState(null);
  const [applications, setApplications] = useState([]);
  const [workflowsCreated, setWorkflowsCreated] = useState([]);
  const [companyWorkflows, setCompanyWorkflows] = useState([]);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [sessions, setSessions] = useState([]);

  const getInstName = (id) => institutions?.find(i => i.id === id)?.name || id || '-';
  const getCompName = (id) => companies?.find(c => c.id === id)?.name || id || '-';

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      let data = await getUserProfile(userId).catch(() => null);
      if (!data) {
        const u = await getUser(userId);
        data = { user: u, institution_links: [], organization_links: [], profile_type: 'public' };
      }
      setProfileData(data);
      const u = data.user;
      setUser(u);
      setEditForm({
        name: u.name || '',
        email: u.email || '',
        institution_id: u.institution_id || '',
        company_id: u.company_id || '',
        program_id: u.program_id || '',
      });
      const cvList = await getCVs({ candidate_id: userId }).catch(() => []);
      const cvArray = Array.isArray(cvList) ? cvList : cvList?.items ?? [];
      if (cvArray.length > 0) {
        const latest = [...cvArray].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))[0];
        const full = await getCV(latest.id).catch(() => null);
        setCvData(full || null);
      } else {
        setCvData(null);
      }
    } catch (e) {
      toast.error('Failed to load user');
      setUser(null);
      setProfileData(null);
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const loadProfiles = useCallback(async () => {
    setProfilesLoading(true);
    try {
      const profiles = await getUserProfiles(userId);
      setUserProfiles(Array.isArray(profiles) ? profiles : []);
    } catch { setUserProfiles([]); }
    finally { setProfilesLoading(false); }
  }, [userId]);

  const fetchActivity = useCallback(async () => {
    if (!userId) return;
    try {
      const [cvsData, appsData, wfCreated, sessData] = await Promise.all([
        getCVs({ candidate_id: userId }).catch(() => []),
        getApplications({ student_id: userId }).catch(() => []),
        getWorkflows({ created_by: userId }).catch(() => []),
        getTelemetrySessions('24h').catch(() => ({ sessions: [] })),
      ]);
      setCvs(Array.isArray(cvsData) ? cvsData : []);
      setApplications(Array.isArray(appsData) ? appsData : []);
      setWorkflowsCreated(Array.isArray(wfCreated) ? wfCreated : []);
      const sessList = sessData?.sessions || [];
      setSessions(sessList.filter(s => s.user_id === userId));
    } catch (err) {
      console.error('Failed to fetch user activity:', err);
    }
  }, [userId]);

  const fetchRecruiterData = useCallback(async () => {
    if (!user?.company_id) return;
    try {
      const [wfs, jobs] = await Promise.all([
        getWorkflows({ company_id: user.company_id }).catch(() => []),
        getJobs({ company_id: user.company_id }).catch(() => []),
      ]);
      setCompanyWorkflows(Array.isArray(wfs) ? wfs : []);
      setCompanyJobs(Array.isArray(jobs) ? jobs : []);
    } catch (err) {
      console.error('Failed to fetch recruiter data:', err);
    }
  }, [user?.company_id]);

  useEffect(() => { loadUser(); }, [loadUser]);
  useEffect(() => { if (userId) { loadProfiles(); fetchActivity(); } }, [userId, loadProfiles, fetchActivity]);
  useEffect(() => { if (user?.company_id) fetchRecruiterData(); }, [user?.company_id, fetchRecruiterData]);
  useEffect(() => {
    if (editing && editForm.institution_id) {
      getPrograms(editForm.institution_id).then(setAssignPrograms).catch(() => setAssignPrograms([]));
    } else if (assignForm?.institution_id) {
      getPrograms(assignForm.institution_id).then(setAssignPrograms).catch(() => setAssignPrograms([]));
    } else {
      setAssignPrograms([]);
    }
  }, [editing, editForm.institution_id, assignForm?.institution_id]);
  useEffect(() => {
    if (!profilesLoading && userProfiles.length === 0 && tab !== 'roles') setTab('roles');
  }, [profilesLoading, userProfiles.length]);

  const handleSaveProfile = async () => {
    try {
      await updateUser(userId, {
        name: editForm.name || undefined,
        email: editForm.email || undefined,
        institution_id: editForm.institution_id || null,
        company_id: editForm.company_id || null,
        program_id: editForm.program_id || null,
      });
      toast.success('Profile updated');
      setEditing(false);
      loadUser();
      onRefresh?.();
    } catch (e) {
      toast.error('Update failed: ' + (e?.message || 'Unknown error'));
    }
  };

  const handleAssign = async () => {
    if (!assignForm?.role_id) { toast.error('Select a role'); return; }
    try {
      await assignProfile(userId, {
        role_id: assignForm.role_id,
        institution_id: assignForm.institution_id || null,
        company_id: assignForm.company_id || null,
        program_id: assignForm.program_id || null,
        expires_at: assignForm.expires_at || null,
      });
      toast.success('Role assigned');
      setAssignForm(null);
      loadProfiles();
      onRefresh?.();
    } catch (e) { toast.error('Failed: ' + (e?.message || '')); }
  };

  const handleRevoke = async (profile) => {
    const activeCount = userProfiles.filter(p => p.is_active).length;
    if (activeCount <= 1) {
      toast.error('Cannot revoke the last role. Every user must have at least one role.');
      return;
    }
    try {
      await revokeProfile(userId, profile.id);
      toast.success('Profile revoked');
      loadProfiles();
      onRefresh?.();
    } catch (e) { toast.error('Revoke failed: ' + (e?.message || '')); }
  };

  const handleToggleActive = async (profile) => {
    try {
      await updateProfile(userId, profile.id, { is_active: !profile.is_active });
      loadProfiles();
    } catch (e) { toast.error('Update failed'); }
  };

  const handleDeactivate = async () => {
    const activeProfiles = userProfiles.filter(p => p.is_active);
    if (activeProfiles.length === 0) {
      toast.error('User has no active roles');
      return;
    }
    if (activeProfiles.length === 1) {
      toast.error('Cannot revoke the last role. Every user must have at least one role.');
      return;
    }
    if (!(await confirm({ message: `Revoke all ${activeProfiles.length} active role(s)? User will lose access.` }))) return;
    try {
      for (const p of activeProfiles) {
        await revokeProfile(userId, p.id);
      }
      toast.success('User deactivated');
      loadProfiles();
      onRefresh?.();
    } catch (e) {
      toast.error('Deactivation failed: ' + (e?.message || ''));
    }
  };

  const handleDelete = async () => {
    if (user?.role === UserRole.SYSTEM_ADMIN) {
      toast.error('System Admin cannot be deleted');
      return;
    }
    if (!(await confirm({ message: `Delete user "${user?.name}" (${user?.email})? This cannot be undone.` }))) return;
    try {
      await (deleteUserFn || deleteUser)(userId);
      toast.success('User deleted');
      onRefresh?.();
      onBack?.();
    } catch (e) {
      toast.error('Delete failed: ' + (e?.message || ''));
    }
  };

  const handleAssignContextChange = (type, id) => {
    const instId = type === 'institution' && id ? id : null;
    const compId = type === 'company' && id ? id : null;
    const next = {
      context_type: type,
      institution_id: instId,
      company_id: compId,
      role_id: '',
      program_id: '',
      expires_at: '',
    };
    setAssignForm(next);
    setAssignableRoles([]);
    if (instId) {
      setAssignRolesLoading(true);
      getAssignableRoles({ institution_id: instId })
        .then((roles) => setAssignableRoles(Array.isArray(roles) ? roles : []))
        .catch(() => setAssignableRoles([]))
        .finally(() => setAssignRolesLoading(false));
      getPrograms(instId).then(setAssignPrograms).catch(() => setAssignPrograms([]));
    } else if (compId) {
      setAssignRolesLoading(true);
      getAssignableRoles({ company_id: compId })
        .then((roles) => setAssignableRoles(Array.isArray(roles) ? roles : []))
        .catch(() => setAssignableRoles([]))
        .finally(() => setAssignRolesLoading(false));
      setAssignPrograms([]);
    } else {
      setAssignPrograms([]);
    }
  };

  if (loading || !user) {
    return html`
      <${TabbedDetailView}
        title="User"
        tabs=${USER_TABS}
        activeTab=${tab}
        onTabChange=${setTab}
        onBack=${onBack}
        loading=${true}
      />
    `;
  }

  const formatDuration = (sec) => {
    if (!sec) return '-';
    if (sec < 60) return `${sec}s`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m`;
    return `${Math.floor(sec / 3600)}h ${Math.floor((sec % 3600) / 60)}m`;
  };

  const subtitleParts = [user.email];
  if (user.institution_id) subtitleParts.push(getInstName(user.institution_id));
  if (user.company_id) subtitleParts.push(getCompName(user.company_id));
  subtitleParts.push((user.role || 'GENERAL').replace(/_/g, ' '));
  const headerActions = html`
    <div className="flex gap-2 shrink-0">
      ${!editing ? html`
        <button onClick=${() => setEditing(true)} className="px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm font-bold hover:bg-[var(--app-surface-muted)]">Edit</button>
      ` : html`
        <button onClick=${() => setEditing(false)} className="px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm font-bold">Cancel</button>
        <button onClick=${handleSaveProfile} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">Save</button>
      `}
      <button onClick=${handleDeactivate} disabled=${userProfiles.filter(p => p.is_active).length <= 1} title=${userProfiles.filter(p => p.is_active).length <= 1 ? 'Cannot deactivate: user must have at least one role' : ''} className="px-4 py-2 border border-red-200 text-[var(--app-danger)] rounded-xl text-sm font-bold hover:bg-[rgba(255,59,48,0.06)] disabled:opacity-50 disabled:cursor-not-allowed">
        Deactivate
      </button>
      ${user.role !== UserRole.SYSTEM_ADMIN ? html`
        <button onClick=${handleDelete} className="px-4 py-2 bg-[var(--app-surface)] border border-red-200 text-[var(--app-danger)] rounded-xl text-sm font-bold hover:bg-[rgba(255,59,48,0.06)] flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      ` : null}
    </div>
  `;

  const tabContent = tab === 'profile' ? html`
            <div className="space-y-6">
            <${SectionCard} title="Profile" padding=${true}>
            <div className="space-y-4">
              ${editing ? html`
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Name</label>
                    <input type="text" value=${editForm.name} onChange=${e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm" />
                  </div>
                  <div><label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Email</label>
                    <input type="email" value=${editForm.email} onChange=${e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm" />
                  </div>
                  <div><label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Institution</label>
                    <select value=${editForm.institution_id || ''} onChange=${e => setEditForm(f => ({ ...f, institution_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm">
                      <option value="">None</option>
                      ${(institutions || []).map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
                    </select>
                  </div>
                  <div><label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Company</label>
                    <select value=${editForm.company_id || ''} onChange=${e => setEditForm(f => ({ ...f, company_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm">
                      <option value="">None</option>
                      ${(companies || []).map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
                    </select>
                  </div>
                  <div><label className="text-xs font-bold text-[var(--app-text-secondary)] block mb-1">Program</label>
                    <select value=${editForm.program_id || ''} onChange=${e => setEditForm(f => ({ ...f, program_id: e.target.value }))}
                      className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm">
                      <option value="">None</option>
                      ${(assignPrograms.length ? assignPrograms : (programsByInstitution?.[editForm.institution_id] || [])).map(p => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
                    </select>
                  </div>
                </div>
              ` : html`
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div><dt className="text-[var(--app-text-muted)] font-bold">Name</dt><dd>${user.name || '-'}</dd></div>
                  <div><dt className="text-[var(--app-text-muted)] font-bold">Email</dt><dd>${user.email || '-'}</dd></div>
                  <div><dt className="text-[var(--app-text-muted)] font-bold">Institution</dt><dd>${user.institution_id ? getInstName(user.institution_id) : '-'}</dd></div>
                  <div><dt className="text-[var(--app-text-muted)] font-bold">Company</dt><dd>${user.company_id ? getCompName(user.company_id) : '-'}</dd></div>
                  <div><dt className="text-[var(--app-text-muted)] font-bold">Program</dt><dd>${user.program_id ? (programsByInstitution?.[user.institution_id] || []).find(p => p.id === user.program_id)?.name || user.program_id : '-'}</dd></div>
                </dl>
              `}
            </div>
            </${SectionCard}>
            ${(() => {
              const instLinks = (profileData?.institution_links || []).filter((l) => l.institution_name || l.institution_id || l.program_name);
              const orgLinks = (profileData?.organization_links || []).filter((l) => l.company_name || l.company_id);
              const cvResolved = cvData?.data ? { ...cvData, data: cvData.data } : cvData || {};
              const eduCv = extractSection(cvResolved, ['education', 'academic_qualifications', 'academic']);
              const expCv = extractSection(cvResolved, ['experience', 'work_experience', 'industry_experience']);
              const eduEntries = normalizeSectionEntries(eduCv);
              const expEntries = normalizeSectionEntries(expCv);
              const norm = (s) => (s || '').toString().toLowerCase().trim();
              const dupEdu = (e) => {
                const key = `${norm(e.institution || e.institute || e.school || e.name)}|${norm(e.degree || e.program)}`;
                if (key === '|') return false;
                return instLinks.some((l) => `${norm(l.institution_name || l.institution_id)}|${norm(l.program_name)}` === key);
              };
              const dupExp = (e) => {
                const key = `${norm(e.company || e.organization)}|${norm(e.role || e.title)}`;
                if (key === '|') return false;
                return orgLinks.some((l) => `${norm(l.company_name || l.company_id)}|${norm(l.role_name || l.role_id)}` === key);
              };
              const allEdu = [...instLinks.map((l) => ({ type: 'link', link: l })), ...eduEntries.filter((e) => !dupEdu(e)).map((e) => ({ type: 'cv', entry: e }))];
              const allExp = [...orgLinks.map((l) => ({ type: 'link', link: l })), ...expEntries.filter((e) => !dupExp(e)).map((e) => ({ type: 'cv', entry: e }))];
              if (allEdu.length === 0 && allExp.length === 0) return null;
              return html`
            <${SectionCard} title="Education & Experience" padding=${true}>
              <div className="space-y-4">
                ${allEdu.length > 0 ? html`
                  <div>
                    <h4 className="text-xs font-bold text-[var(--app-text-muted)] uppercase mb-2">Education</h4>
                    <div className="space-y-2">
                      ${allEdu.map((item, i) => item.type === 'link' ? html`
                        <div key=${item.link.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[var(--app-surface-muted)]">
                          <span className="font-semibold text-[var(--app-text-primary)]">${item.link.institution_name || item.link.institution_id || '—'}</span>
                          <span className="text-sm text-[var(--app-text-secondary)]">${item.link.program_name || '—'}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold shrink-0 ${item.link.tag === 'Alumni' ? 'bg-[var(--app-surface)] text-[var(--app-text-secondary)]' : 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'}">${item.link.tag}</span>
                        </div>
                      ` : html`
                        <div key=${`cv-e-${i}`} className="py-2 px-3 rounded-lg bg-[var(--app-surface-muted)]">
                          <span className="font-semibold text-[var(--app-text-primary)]">${item.entry.institution || item.entry.institute || item.entry.school || item.entry.name || '—'}</span>
                          <span className="text-sm text-[var(--app-text-secondary)] ml-2">${item.entry.degree || item.entry.program || '—'}</span>
                          ${item.entry.year ? html`<span className="text-xs text-[var(--app-text-muted)] ml-2">${item.entry.year}</span>` : null}
                        </div>
                      `)}
                    </div>
                  </div>
                ` : null}
                ${allExp.length > 0 ? html`
                  <div>
                    <h4 className="text-xs font-bold text-[var(--app-text-muted)] uppercase mb-2">Experience</h4>
                    <div className="space-y-2">
                      ${allExp.map((item, i) => item.type === 'link' ? html`
                        <div key=${item.link.id} className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-[var(--app-surface-muted)]">
                          <span className="font-semibold text-[var(--app-text-primary)]">${item.link.company_name || item.link.company_id || '—'}</span>
                          <span className="text-sm text-[var(--app-text-secondary)]">${item.link.role_name || item.link.role_id || ''}</span>
                          <span className="px-2 py-0.5 rounded text-xs font-bold shrink-0 ${item.link.tag === 'Alumni' ? 'bg-[var(--app-surface)] text-[var(--app-text-secondary)]' : 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'}">${item.link.tag}</span>
                        </div>
                      ` : html`
                        <div key=${`cv-x-${i}`} className="py-2 px-3 rounded-lg bg-[var(--app-surface-muted)]">
                          <span className="font-semibold text-[var(--app-text-primary)]">${item.entry.company || item.entry.organization || item.entry.role || '—'}</span>
                          <span className="text-sm text-[var(--app-text-secondary)] ml-2">${item.entry.role || item.entry.title || ''}</span>
                          ${(item.entry.duration || item.entry.dates) ? html`<span className="text-xs text-[var(--app-text-muted)] ml-2">${item.entry.duration || item.entry.dates}</span>` : null}
                        </div>
                      `)}
                    </div>
                  </div>
                ` : null}
              </div>
            </${SectionCard}>
            `;
            })()}
            </div>
          ` : tab === 'roles' ? html`
            <${SectionCard} title="Role Assignments" padding=${true}>
            <div className="space-y-4">
              <div className="flex justify-end mb-4">
                <button onClick=${() => setAssignForm(assignForm ? null : { context_type: 'institution', role_id: '', institution_id: '', company_id: '', program_id: '', expires_at: '' })}
                  className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700">${assignForm ? 'Cancel' : '+ Assign Role'}</button>
              </div>
              ${assignForm ? html`
                <div className="bg-[var(--app-surface-muted)] rounded-xl p-5 space-y-4">
                  <p className="text-xs text-[var(--app-text-muted)]">Select context first (institution or company), then choose a role allowed for that context.</p>
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold block mb-1">Step 1: Context (Institution or Company)</label>
                      <div className="flex gap-4 mb-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="assign-ctx" checked=${assignForm.context_type === 'institution'} onChange=${() => handleAssignContextChange('institution', assignForm.institution_id || '')} />
                          <span className="text-sm font-medium">Institution</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="assign-ctx" checked=${assignForm.context_type === 'company'} onChange=${() => handleAssignContextChange('company', assignForm.company_id || '')} />
                          <span className="text-sm font-medium">Company</span>
                        </label>
                      </div>
                      ${assignForm.context_type === 'institution' ? html`
                        <select value=${assignForm.institution_id || ''} onChange=${e => handleAssignContextChange('institution', e.target.value)} className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm bg-[var(--app-bg)]">
                          <option value="">Select institution...</option>
                          ${(institutions || []).map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
                        </select>
                      ` : html`
                        <select value=${assignForm.company_id || ''} onChange=${e => handleAssignContextChange('company', e.target.value)} className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm bg-[var(--app-bg)]">
                          <option value="">Select company...</option>
                          ${(companies || []).map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
                        </select>
                      `}
                    </div>
                    ${(assignForm.institution_id || assignForm.company_id) ? html`
                      <div>
                        <label className="text-xs font-bold block mb-1">Step 2: Role</label>
                        ${assignRolesLoading ? html`<div className="flex items-center gap-2 py-2 text-sm text-[var(--app-text-muted)]"><div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />Loading roles...</div>` : html`
                        <select value=${assignForm.role_id} onChange=${e => setAssignForm(f => ({ ...f, role_id: e.target.value, program_id: '' }))} className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm bg-[var(--app-bg)]">
                          <option value="">Select role...</option>
                          ${assignableRoles.map(r => html`<option key=${r.id} value=${r.id}>${r.name || r.id}</option>`)}
                        </select>
                        `}
                      </div>
                      ${assignForm.role_id === UserRole.CANDIDATE && assignForm.institution_id ? html`
                        <div>
                          <label className="text-xs font-bold block mb-1">Step 3: Program (required for Students)</label>
                          <select value=${assignForm.program_id || ''} onChange=${e => setAssignForm(f => ({ ...f, program_id: e.target.value }))} className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm bg-[var(--app-bg)]" required>
                            <option value="">Select program...</option>
                            ${(assignPrograms.length ? assignPrograms : (programsByInstitution?.[assignForm.institution_id] || [])).map(p => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
                          </select>
                        </div>
                      ` : null}
                    ` : null}
                  </div>
                  ${(() => {
                    const ctxOk = !!(assignForm.institution_id || assignForm.company_id);
                    const roleOk = !!assignForm.role_id;
                    const progOk = assignForm.role_id !== UserRole.CANDIDATE || !!assignForm.program_id || !assignForm.institution_id;
                    const canAssign = ctxOk && roleOk && progOk;
                    return html`<div className="flex justify-end"><button onClick=${handleAssign} disabled=${!canAssign} className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">Assign</button></div>`;
                  })()}
                </div>
              ` : null}
              ${profilesLoading ? html`<div className="py-4 text-center animate-pulse text-sm">Loading...</div>` : userProfiles.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)] py-4">No role assignments. Assign at least one role to grant access.</p>` : html`
                <div className="space-y-2">
                  ${userProfiles.map(p => {
                    const activeCount = userProfiles.filter(x => x.is_active).length;
                    const canRevoke = activeCount > 1;
                    return html`
                    <div key=${p.id} className="flex items-center justify-between p-3 rounded-xl border bg-[var(--app-surface)]">
                      <div>
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]'}">${p.role?.name || 'Unknown'}</span>
                        <span className="text-xs text-[var(--app-text-secondary)] ml-2">${p.institution?.name || p.company?.name || ''}</span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick=${() => handleToggleActive(p)} className="px-3 py-1 text-xs font-bold border rounded-lg">${p.is_active ? 'Deactivate' : 'Activate'}</button>
                        <button onClick=${() => handleRevoke(p)} disabled=${!canRevoke} title=${!canRevoke ? 'Cannot revoke the last role' : ''} className="px-3 py-1 text-xs font-bold border border-red-200 text-[var(--app-danger)] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Revoke</button>
                      </div>
                    </div>
                  `; })}
                </div>
              `}
            </div>
            </${SectionCard}>
          ` : tab === 'activity' ? html`
            <div className="space-y-6">
              ${(userProfiles.some(p => p.role?.id === UserRole.CANDIDATE) || user.institution_id) ? html`
                <${SectionCard} title=${`CVs (${cvs.length})`} padding=${true}>
                  ${cvs.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No CVs</p>` : html`
                    <div className="space-y-2">
                      ${cvs.map(cv => html`<div key=${cv.id} className="p-3 rounded-xl border bg-[var(--app-surface-muted)] flex justify-between items-center">
                        <span>${cv.template_id || 'CV'} • ${cv.status || '-'}</span>
                      </div>`)}
                    </div>
                  `}
                </${SectionCard}>
                <${SectionCard} title=${`Applications (${applications.length})`} padding=${true}>
                  ${applications.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No applications</p>` : html`
                    <div className="space-y-2">
                      ${applications.map(app => html`<div key=${app.id} className="p-3 rounded-xl border bg-[var(--app-surface-muted)]">
                        <span>Workflow ${app.workflow_id || '-'} • Job ${app.job_id || '-'}</span>
                      </div>`)}
                    </div>
                  `}
                </${SectionCard}>
              ` : null}
              ${(userProfiles.some(p => [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN, UserRole.INSTITUTION_ADMIN].includes(p.role?.id))) ? html`
                <${SectionCard} title=${`Workflows Created (${workflowsCreated.length})`} padding=${true}>
                  ${workflowsCreated.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No workflows created</p>` : html`
                    <div className="space-y-2">
                      ${workflowsCreated.map(wf => html`<div key=${wf.id} className="p-3 rounded-xl border bg-[var(--app-surface-muted)] flex justify-between">
                        <span>${wf.name || wf.id}</span>
                        <span className="text-xs text-[var(--app-text-muted)]">${wf.status || '-'}</span>
                      </div>`)}
                    </div>
                  `}
                </${SectionCard}>
              ` : null}
              ${(userProfiles.some(p => p.role?.id === UserRole.RECRUITER) || user.company_id) ? html`
                <${SectionCard} title="Company" padding=${true}>
                  ${!user.company_id ? html`<p className="text-sm text-[var(--app-text-muted)]">User has no company</p>` : html`
                    <div className="space-y-4">
                      <div>
                        <span className="text-xs font-semibold text-[var(--app-text-muted)]">Jobs (${companyJobs.length})</span>
                        ${companyJobs.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No jobs</p>` : html`
                          <div className="space-y-2 mt-1">${companyJobs.slice(0, 10).map(j => html`<div key=${j.id} className="p-3 rounded-xl border">${j.title || j.id}</div>`)}</div>
                        `}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-[var(--app-text-muted)]">Workflows (${companyWorkflows.length})</span>
                        ${companyWorkflows.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No workflows</p>` : html`
                          <div className="space-y-2 mt-1">${companyWorkflows.slice(0, 10).map(wf => html`<div key=${wf.id} className="p-3 rounded-xl border">${wf.name || wf.id}</div>`)}</div>
                        `}
                      </div>
                    </div>
                  `}
                </${SectionCard}>
              ` : null}
              ${!userProfiles.some(p => p.role?.id === UserRole.CANDIDATE) && !userProfiles.some(p => [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN, UserRole.INSTITUTION_ADMIN].includes(p.role?.id)) && !userProfiles.some(p => p.role?.id === UserRole.RECRUITER) && !user.company_id && !user.institution_id ? html`<${SectionCard} padding=${true}><p className="text-sm text-[var(--app-text-muted)]">No activity data. Assign roles to see user activity.</p></${SectionCard}>` : null}
            </div>
          ` : tab === 'audit' ? html`
            <${SectionCard} padding=${true}>
              <${AuditTrailPanel} userId=${userId} title="User activity" compact=${false} showFilters=${true} />
            </${SectionCard}>
          ` : tab === 'sessions' ? html`
            <${SectionCard} title=${`Sessions (${sessions.length})`} padding=${true}>
              ${sessions.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No sessions in last 24h</p>` : html`
                <div className="space-y-2">
                  ${sessions.map(s => html`<div key=${s.session_id} className="p-3 rounded-xl border bg-[var(--app-surface-muted)] text-sm">
                    <div>${s.pages_visited || 0} pages • ${formatDuration(s.duration_seconds)} • ${s.pages?.slice(0, 3).join(', ') || '-'}</div>
                  </div>`)}
                </div>
              `}
            </${SectionCard}>
          ` : null;

  return html`
    <${TabbedDetailView}
      title=${user.name || 'Unknown'}
      subtitle=${subtitleParts.join(' • ')}
      tabs=${USER_TABS}
      activeTab=${tab}
      onTabChange=${setTab}
      onBack=${onBack}
      loading=${false}
      headerActions=${headerActions}
      layout="tabs"
    >
      ${tabContent}
    </${TabbedDetailView}>
  `;
};

export default UserDetailView;
