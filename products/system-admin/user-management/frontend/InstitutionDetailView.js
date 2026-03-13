import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getInstitution, getUsers, getPrograms, getBatches, deleteProgram, deleteInstitution,
  getShortlists, getApplications, getCVs, getWorkflows, deleteUser,
  getInstitutionDegrees, createInstitutionDegree, deleteInstitutionDegree,
  getInstitutionCertifications, createInstitutionCertification, deleteInstitutionCertification,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast, useDialog, useDebouncedValue } from '/core/frontend/src/modules/shared/index.js';
import AuditTrailPanel from '/core/frontend/src/modules/shared/components/AuditTrailPanel.js';
import { SectionCard, StatCard, PaginationControls } from '/core/frontend/src/modules/shared/primitives/index.js';
import { EmptyState } from '/core/frontend/src/modules/shared/index.js';
import InstitutionForm from '/products/profiles/institution/frontend/src/InstitutionForm.js';
import ProgramList from './ProgramList.js';
import AddUserModal from './AddUserModal.js';
import TabbedDetailView from './TabbedDetailView.js';

const html = htm.bind(React.createElement);

const STAFF_ROLES = [UserRole.PLACEMENT_TEAM, UserRole.PLACEMENT_ADMIN, UserRole.INSTITUTION_ADMIN].join(',');

const PRIMARY_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'people', label: 'People' },
  { id: 'programs', label: 'Programs & Policies' },
  { id: 'placement', label: 'Placement' },
  { id: 'admin', label: 'Admin' },
];
const SECONDARY_BY_PRIMARY = {
  placement: [
    { id: 'shortlists', label: 'Shortlists' },
    { id: 'applications', label: 'Applications' },
  ],
};

const InstitutionDetailView = ({ institutionId, institutions, companies, programsByInstitution, isSystemAdmin, onBack, navigate }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [tab, setTab] = useState('overview');
  const [institution, setInstitution] = useState(null);
  const [programs, setPrograms] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [staffCount, setStaffCount] = useState(0);
  const [shortlists, setShortlists] = useState([]);
  const [applications, setApplications] = useState([]);
  const [cvs, setCvs] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [studentsProgramFilter, setStudentsProgramFilter] = useState('');
  const [studentsBatchFilter, setStudentsBatchFilter] = useState('');
  const [batches, setBatches] = useState([]);
  const [degrees, setDegrees] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [degreeName, setDegreeName] = useState('');
  const [certName, setCertName] = useState('');
  const [certIssuingBody, setCertIssuingBody] = useState('');
  const [certDesc, setCertDesc] = useState('');

  const [staffUsers, setStaffUsers] = useState([]);
  const [staffTotal, setStaffTotal] = useState(0);

  const [students, setStudents] = useState([]);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [studentsById, setStudentsById] = useState({});

  const [alumniCount, setAlumniCount] = useState(0);
  const [alumni, setAlumni] = useState([]);
  const [alumniTotal, setAlumniTotal] = useState(0);

  const [peopleAffiliation, setPeopleAffiliation] = useState('staff');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peoplePage, setPeoplePage] = useState(1);
  const [peoplePageSize, setPeoplePageSize] = useState(20);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const peopleDebouncedSearch = useDebouncedValue(peopleSearch, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [inst, progs, staffRes, studentsRes, alumniRes, studentsList, sl, apps, cvsData, wfs, degs, certs] = await Promise.all([
        getInstitution(institutionId).catch(() => null),
        getPrograms(institutionId).catch(() => []),
        getUsers({ institution_id: institutionId, role_in: STAFF_ROLES, limit: 1 }).catch(() => ({ total: 0 })),
        getUsers({ institution_id: institutionId, role: UserRole.CANDIDATE, limit: 1 }).catch(() => ({ total: 0 })),
        getUsers({ institution_id: institutionId, is_alumni: true, limit: 1 }).catch(() => ({ total: 0 })),
        getUsers({ institution_id: institutionId, role: UserRole.CANDIDATE, limit: 5000 }).catch(() => ({ items: [] })),
        getShortlists({ limit: 100 }).catch(() => ({ items: [] })),
        getApplications({ limit: 100 }).catch(() => ({ items: [] })),
        getCVs({ institution_id: institutionId }).catch(() => []),
        getWorkflows({ institution_id: institutionId }).catch(() => []),
        getInstitutionDegrees(institutionId).catch(() => []),
        getInstitutionCertifications(institutionId).catch(() => []),
      ]);
      setInstitution(inst);
      setPrograms(Array.isArray(progs) ? progs : []);
      setDegrees(Array.isArray(degs) ? degs : []);
      setCertifications(Array.isArray(certs) ? certs : []);
      setStaffCount(staffRes?.total ?? 0);
      setStudentCount(studentsRes?.total ?? 0);
      setAlumniCount(alumniRes?.total ?? 0);
      setCvs(Array.isArray(cvsData) ? cvsData : []);
      setWorkflows(Array.isArray(wfs) ? wfs : []);

      const studs = studentsList?.items ?? [];
      const studentIds = new Set(studs.map(s => s.id));
      const byId = {};
      studs.forEach(s => { byId[s.id] = s; });
      setStudentsById(byId);
      const slItems = sl?.items ?? (Array.isArray(sl) ? sl : []);
      const appItems = apps?.items ?? (Array.isArray(apps) ? apps : []);
      setShortlists(slItems.filter(s => studentIds.has(s.candidate_id)));
      setApplications(appItems.filter(a => studentIds.has(a.student_id)));
    } catch (err) {
      console.error('Failed to fetch institution details:', err);
    } finally {
      setLoading(false);
    }
  }, [institutionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchPeople = useCallback(async () => {
    setPeopleLoading(true);
    try {
      if (peopleAffiliation === 'staff') {
        const res = await getUsers({
          institution_id: institutionId,
          role_in: STAFF_ROLES,
          limit: peoplePageSize,
          offset: (peoplePage - 1) * peoplePageSize,
          q: peopleDebouncedSearch.trim() || undefined,
        });
        setStaffUsers(res?.items ?? []);
        setStaffTotal(res?.total ?? 0);
      } else if (peopleAffiliation === 'students') {
        const res = await getUsers({
          institution_id: institutionId,
          role: UserRole.CANDIDATE,
          limit: peoplePageSize,
          offset: (peoplePage - 1) * peoplePageSize,
          q: peopleDebouncedSearch.trim() || undefined,
          program_id: studentsProgramFilter || undefined,
          batch_id: studentsBatchFilter || undefined,
        });
        setStudents(res?.items ?? []);
        setStudentsTotal(res?.total ?? 0);
      } else {
        const res = await getUsers({
          institution_id: institutionId,
          is_alumni: true,
          limit: peoplePageSize,
          offset: (peoplePage - 1) * peoplePageSize,
          q: peopleDebouncedSearch.trim() || undefined,
        });
        setAlumni(res?.items ?? []);
        setAlumniTotal(res?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch people:', err);
      if (peopleAffiliation === 'staff') { setStaffUsers([]); setStaffTotal(0); }
      else if (peopleAffiliation === 'students') { setStudents([]); setStudentsTotal(0); }
      else { setAlumni([]); setAlumniTotal(0); }
    } finally {
      setPeopleLoading(false);
    }
  }, [institutionId, peopleAffiliation, peoplePage, peoplePageSize, peopleDebouncedSearch, studentsProgramFilter, studentsBatchFilter]);

  useEffect(() => {
    if (tab === 'people') fetchPeople();
  }, [tab, fetchPeople]);

  useEffect(() => { setPeoplePage(1); }, [peopleAffiliation, peopleDebouncedSearch, studentsProgramFilter, studentsBatchFilter]);

  useEffect(() => {
    if (studentsProgramFilter) {
      getBatches({ program_id: studentsProgramFilter })
        .then((b) => setBatches(Array.isArray(b) ? b : []))
        .catch(() => setBatches([]));
      setStudentsBatchFilter('');
    } else {
      setBatches([]);
      setStudentsBatchFilter('');
    }
  }, [studentsProgramFilter]);

  const handleDelete = async () => {
    if (!(await confirm({ message: 'Delete this institution and all its data?' }))) return;
    try {
      await deleteInstitution(institutionId);
      toast.success('Institution deleted');
      onBack();
    } catch (e) { toast.error('Failed: ' + (e.message || '')); }
  };

  if (editing && institution) {
    return html`
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick=${() => setEditing(false)} className="p-2 hover:bg-[var(--app-surface-muted)] rounded-lg transition-colors">
            <svg className="w-5 h-5 text-[var(--app-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-semibold text-[var(--app-text-primary)]">Edit Institution</h2>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-2xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <${InstitutionForm}
            institution=${institution}
            isSystemAdmin=${isSystemAdmin}
            onSuccess=${() => { setEditing(false); fetchData(); }}
            onCancel=${() => setEditing(false)}
          />
        </div>
      </div>
    `;
  }


  if (loading) {
    return html`
      <${TabbedDetailView}
        title="Institution"
        primaryTabs=${PRIMARY_TABS}
        secondaryByPrimary=${SECONDARY_BY_PRIMARY}
        activeTab=${tab}
        onTabChange=${setTab}
        onBack=${onBack}
        loading=${true}
        layout="primary-secondary"
      />
    `;
  }

  if (!institution) {
    return html`
      <div className="py-20 text-center">
        <p className="text-[var(--app-text-muted)] text-lg">Institution not found</p>
        <button onClick=${onBack} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Go Back</button>
      </div>
    `;
  }

  const renderOverview = () => html`
    <div className="space-y-6">
      <${SectionCard} padding=${true} className="overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="shrink-0">
            ${institution.logo_url ? html`
              <img src=${institution.logo_url} alt=${institution.name} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-contain border-2 border-[var(--app-border-soft)] bg-[var(--app-surface)]" />
            ` : html`
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold border-2 border-[var(--app-border-soft)]">${(institution.name || 'I')[0]}</div>
            `}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-[var(--app-text-primary)] mb-2">${institution.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-bold ${statusBadgeClass}">${instStatus}</span>
              ${institution.tier ? html`<span className="text-sm text-[var(--app-text-muted)]">${institution.tier}</span>` : ''}
              ${institution.location ? html`<span className="text-sm text-[var(--app-text-muted)]">• ${institution.location}</span>` : ''}
            </div>
            ${institution.website ? html`<a href=${institution.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">${institution.website}</a>` : ''}
            ${institution.about ? html`<p className="mt-3 text-sm text-[var(--app-text-secondary)] line-clamp-3">${institution.about}</p>` : ''}
            <div className="mt-3 pt-3 border-t border-[var(--app-border-soft)]">
              <p className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-1">Public profile URL</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[var(--app-text-primary)] bg-[var(--app-surface-muted)] px-2 py-1 rounded flex-1 truncate">${typeof window !== 'undefined' ? window.location.origin : ''}/institution/${institutionId}</code>
                <button
                  onClick=${(e) => { e.stopPropagation(); const url = (typeof window !== 'undefined' ? window.location.origin : '') + '/institution/' + institutionId; navigator.clipboard?.writeText(url).then(() => toast.success('Copied to clipboard')).catch(() => {}); }}
                  className="shrink-0 px-2 py-1 text-xs font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >Copy</button>
              </div>
            </div>
          </div>
        </div>
      </${SectionCard}>

      <${SectionCard} title="Key Stats">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <${StatCard} label="Students" value=${studentCount} color="accent" />
          <${StatCard} label="Alumni" value=${alumniCount} />
          <${StatCard} label="Staff" value=${staffCount} />
          <${StatCard} label="Programs" value=${programs.length} />
          <${StatCard} label="Placement Cycles" value=${workflows.length} />
          <${StatCard} label="CVs" value=${cvs.length} color="success" />
          <${StatCard} label="Applications" value=${applications.length} color="warning" />
          <${StatCard} label="Shortlists" value=${shortlists.length} />
        </div>
      </${SectionCard}>

      <div className="flex flex-wrap gap-4 cursor-pointer" onClick=${() => setTab('people')}>
        <${SectionCard} title="People at this institution" className="hover:border-indigo-300 transition-colors flex-1 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-600">${studentCount + staffCount}</p>
              <p className="text-sm text-[var(--app-text-muted)]">Current students & staff</p>
            </div>
            <svg className="w-6 h-6 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </div>
        </${SectionCard}>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <${SectionCard} title="Programs">
          ${programs.length === 0 ? html`<p className="text-[var(--app-text-muted)] text-sm">No programs</p>` : html`
            <div className="flex flex-wrap gap-2">
              ${programs.map(p => html`
                <span key=${p.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold">${p.name}${p.code ? ' (' + p.code + ')' : ''}</span>
              `)}
            </div>
          `}
        </${SectionCard}>

        <${SectionCard} title="Institution Details">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><span className="text-[var(--app-text-muted)]">ID:</span> <span className="font-mono font-bold ml-2 text-xs">${institution.id}</span></div>
            <div><span className="text-[var(--app-text-muted)]">Tier:</span> <span className="font-bold ml-2">${institution.tier || 'N/A'}</span></div>
            <div><span className="text-[var(--app-text-muted)]">Location:</span> <span className="font-bold ml-2">${institution.location || 'N/A'}</span></div>
            ${institution.website ? html`<div><span className="text-[var(--app-text-muted)]">Website:</span> <a href=${institution.website} target="_blank" rel="noopener noreferrer" className="font-bold ml-2 text-indigo-600 hover:underline">${institution.website}</a></div>` : ''}
            ${institution.founding_year ? html`<div><span className="text-[var(--app-text-muted)]">Founded:</span> <span className="font-bold ml-2">${institution.founding_year}</span></div>` : ''}
            ${institution.student_count_range ? html`<div><span className="text-[var(--app-text-muted)]">Student Count:</span> <span className="font-bold ml-2">${institution.student_count_range}</span></div>` : ''}
            <div><span className="text-[var(--app-text-muted)]">Created:</span> <span className="font-bold ml-2">${institution.created_at ? new Date(institution.created_at).toLocaleDateString() : 'N/A'}</span></div>
          </div>
          ${institution.about ? html`<div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]"><span className="text-[var(--app-text-muted)] block mb-1">About</span><p className="text-sm text-[var(--app-text-primary)]">${institution.about}</p></div>` : ''}
        </${SectionCard}>
      </div>

      ${isSystemAdmin && instStatus === 'PENDING' ? html`
        <${SectionCard} title="Pending Approval" padding=${true}>
          <p className="text-sm text-[var(--app-text-secondary)] mb-4">This institution is pending approval. Fill in details via Edit, then approve.</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick=${async () => {
                try {
                  await approveInstitution(institutionId, {
                    status: 'LISTED',
                    name: institution.name,
                    tier: institution.tier,
                    location: institution.location,
                    logo_url: institution.logo_url,
                    about: institution.about,
                    website: institution.website,
                    founding_year: institution.founding_year,
                    student_count_range: institution.student_count_range,
                  });
                  toast.success('Institution approved as Listed');
                  fetchData();
                } catch (e) { toast.error('Failed: ' + (e.message || '')); }
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
            >Approve as Listed</button>
            <button
              onClick=${async () => {
                try {
                  await approveInstitution(institutionId, {
                    status: 'PARTNER',
                    name: institution.name,
                    tier: institution.tier,
                    location: institution.location,
                    logo_url: institution.logo_url,
                    about: institution.about,
                    website: institution.website,
                    founding_year: institution.founding_year,
                    student_count_range: institution.student_count_range,
                  });
                  toast.success('Institution approved as Partner');
                  fetchData();
                } catch (e) { toast.error('Failed: ' + (e.message || '')); }
              }}
              className="px-4 py-2 bg-[var(--app-success)] text-white rounded-xl text-xs font-bold hover:opacity-90"
            >Approve as Partner</button>
            <button
              onClick=${async () => {
                if (!(await confirm({ message: 'Reject and remove this institution?' }))) return;
                try {
                  await rejectInstitution(institutionId, {});
                  toast.success('Institution rejected');
                  onBack?.();
                } catch (e) { toast.error('Failed: ' + (e.message || '')); }
              }}
              className="px-4 py-2 border border-red-200 text-[var(--app-danger)] rounded-xl text-xs font-bold hover:bg-[rgba(255,59,48,0.06)]"
            >Reject</button>
          </div>
        </${SectionCard}>
      ` : null}

      ${isSystemAdmin ? html`
        <${SectionCard} title="Allowed Roles">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              ${(institution.allowed_roles?.length > 0) ? html`
                <p className="text-sm text-[var(--app-text-secondary)] mb-2">Roles that can be assigned to users within this institution:</p>
                <div className="flex flex-wrap gap-2">
                  ${(institution.allowed_roles || []).map(r => html`
                    <span key=${r} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">${r.replace(/_/g, ' ')}</span>
                  `)}
                </div>
              ` : html`
                <p className="text-sm text-[var(--app-text-muted)]">No roles configured. Default institution roles apply. Click Edit to customize.</p>
              `}
            </div>
            <button onClick=${() => setEditing(true)} className="px-4 py-2 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl text-xs font-bold hover:bg-[var(--app-surface-muted)] transition-colors shrink-0 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Edit
            </button>
          </div>
        </${SectionCard}>
      ` : null}

      ${isSystemAdmin ? html`
        <${SectionCard} title="Degrees">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <input
                type="text"
                value=${degreeName}
                onChange=${(e) => setDegreeName(e.target.value)}
                placeholder="Degree name (e.g. MBA, B.Tech)"
                className="flex-1 min-w-[160px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick=${async () => {
                  if (!degreeName.trim()) { toast.error('Enter a degree name'); return; }
                  try {
                    await createInstitutionDegree(institutionId, { name: degreeName.trim() });
                    toast.success('Degree added');
                    setDegreeName('');
                    fetchData();
                  } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >Add</button>
            </div>
            ${degrees.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No degrees yet</p>` : html`
              <div className="flex flex-wrap gap-2">
                ${degrees.map(d => html`
                  <span key=${d.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                    ${d.name}${d.degree_type ? ' (' + d.degree_type + ')' : ''}
                    <button onClick=${async () => {
                      if (!(await confirm({ message: `Remove "${d.name}"?` }))) return;
                      try {
                        await deleteInstitutionDegree(institutionId, d.id);
                        toast.success('Degree removed');
                        fetchData();
                      } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                    }} className="text-[var(--app-danger)] hover:underline text-xs">×</button>
                  </span>
                `)}
              </div>
            `}
          </div>
        </${SectionCard}>

        <${SectionCard} title="Certifications">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-end">
              <input
                type="text"
                value=${certName}
                onChange=${(e) => setCertName(e.target.value)}
                placeholder="Certification name"
                className="flex-1 min-w-[140px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value=${certIssuingBody}
                onChange=${(e) => setCertIssuingBody(e.target.value)}
                placeholder="Issuing body"
                className="min-w-[120px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <input
                type="text"
                value=${certDesc}
                onChange=${(e) => setCertDesc(e.target.value)}
                placeholder="Description (optional)"
                className="min-w-[140px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick=${async () => {
                  if (!certName.trim()) { toast.error('Enter a certification name'); return; }
                  try {
                    await createInstitutionCertification(institutionId, {
                      name: certName.trim(),
                      issuing_body: certIssuingBody.trim() || undefined,
                      description: certDesc.trim() || undefined,
                    });
                    toast.success('Certification added');
                    setCertName(''); setCertIssuingBody(''); setCertDesc('');
                    fetchData();
                  } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >Add</button>
            </div>
            ${certifications.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No certifications yet</p>` : html`
              <div className="space-y-2">
                ${certifications.map(c => html`
                  <div key=${c.id} className="flex items-center justify-between gap-2 p-2 rounded-lg border border-[var(--app-border-soft)]">
                    <div>
                      <span className="font-bold text-sm">${c.name}</span>
                      ${c.issuing_body ? html`<span className="text-[var(--app-text-muted)] text-xs ml-2">— ${c.issuing_body}</span>` : ''}
                      ${c.description ? html`<p className="text-xs text-[var(--app-text-secondary)] mt-0.5">${c.description}</p>` : ''}
                    </div>
                    <button onClick=${async () => {
                      if (!(await confirm({ message: `Remove "${c.name}"?` }))) return;
                      try {
                        await deleteInstitutionCertification(institutionId, c.id);
                        toast.success('Certification removed');
                        fetchData();
                      } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                    }} className="px-2 py-1 rounded text-[10px] font-bold border border-red-200 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.06)]">Delete</button>
                  </div>
                `)}
              </div>
            `}
          </div>
        </${SectionCard}>
      ` : null}
    </div>
  `;

  const peopleTotal = peopleAffiliation === 'staff' ? staffTotal : peopleAffiliation === 'students' ? studentsTotal : alumniTotal;
  const peopleItems = peopleAffiliation === 'staff' ? staffUsers : peopleAffiliation === 'students' ? students : alumni;
  const renderUserRow = (u, isAlumni, extraCells = null) => {
    const canDelete = u.role !== UserRole.SYSTEM_ADMIN;
    return html`
      <tr key=${u.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] cursor-pointer" onClick=${() => navigate && navigate('system-admin/people/user/' + u.id)}>
        <td className="p-3 font-bold text-[var(--app-text-primary)]">${u.name}</td>
        <td className="p-3 text-[var(--app-text-secondary)]">${u.email}</td>
        <td className="p-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">${(typeof u.role === 'string' ? u.role : (u.role?.name ?? u.role?.id ?? '')).replace(/_/g, ' ') || '—'}</span></td>
        <td className="p-3">
          ${isAlumni ? html`<span className="px-2 py-0.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded text-xs font-bold">Former</span>` : html`<span className="px-2 py-0.5 bg-[rgba(52,199,89,0.12)] text-[var(--app-success)] rounded text-xs font-bold">Current</span>`}
        </td>
        ${extraCells || ''}
        <td className="p-3 text-right" onClick=${(e) => e.stopPropagation()}>
          ${canDelete && !isAlumni ? html`
            <button onClick=${async (e) => { e.stopPropagation();
              if (!(await confirm({ message: `Delete ${u.name}? This will remove the user from the platform.` }))) return;
              try {
                await deleteUser(u.id);
                toast.success('User removed');
                fetchData();
                fetchPeople();
              } catch (err) { toast.error('Failed: ' + (err.message || '')); }
            }} className="px-3 py-1 rounded-lg text-[10px] font-bold border border-red-200 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.06)]">
            Delete
            </button>` : html`<span className="text-[var(--app-text-muted)] text-xs">—</span>`}
        </td>
      </tr>
    `;
  };

  const renderPeople = () => html`
    <div className="space-y-4">
      <${SectionCard} padding=${true}>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value=${peopleAffiliation}
            onChange=${(e) => setPeopleAffiliation(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          >
            <option value="staff">Staff</option>
            <option value="students">Students</option>
            <option value="alumni">Alumni</option>
          </select>
          ${peopleAffiliation === 'students' ? html`
            <select
              value=${studentsProgramFilter}
              onChange=${(e) => setStudentsProgramFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
            >
              <option value="">All Programs</option>
              ${programs.map((p) => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
            </select>
            <select
              value=${studentsBatchFilter}
              onChange=${(e) => setStudentsBatchFilter(e.target.value)}
              disabled=${!studentsProgramFilter && batches.length === 0}
              className="px-3 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30 disabled:opacity-50"
            >
              <option value="">All Batches</option>
              ${batches.map((b) => html`<option key=${b.id} value=${b.id}>${b.name}</option>`)}
            </select>
          ` : null}
          <input
            type="text"
            placeholder="Search by name or email..."
            value=${peopleSearch}
            onChange=${(e) => setPeopleSearch(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30 min-w-[200px]"
          />
          <span className="text-sm text-[var(--app-text-muted)] font-semibold py-2">
            ${peopleTotal} ${peopleAffiliation === 'staff' ? 'staff' : peopleAffiliation === 'students' ? 'student' : 'alumn'}${peopleTotal !== 1 ? (peopleAffiliation === 'alumni' ? 'i' : 's') : (peopleAffiliation === 'alumni' ? 'us' : '')}
          </span>
        </div>
        <button onClick=${() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Add User
        </button>
      </div>
      ${peopleLoading ? html`
        <div className="animate-pulse space-y-2 py-8">
          ${[1,2,3,4,5].map(i => html`<div key=${i} className="h-12 bg-[var(--app-surface-muted)] rounded-xl" />`)}
        </div>
      ` : peopleItems.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">
          <${EmptyState}
            title=${peopleAffiliation === 'staff' ? 'No staff yet' : peopleAffiliation === 'students' ? 'No students found' : 'No alumni found'}
            message=${peopleDebouncedSearch || (peopleAffiliation === 'students' && (studentsProgramFilter || studentsBatchFilter)) ? 'Try adjusting your filters or search.' : (peopleAffiliation === 'staff' ? 'Add your first staff member.' : peopleAffiliation === 'students' ? 'No students in this institution yet.' : 'Alumni (users with ended institution links) will appear here.')}
            action=${peopleAffiliation === 'staff' ? () => setShowAddUserModal(true) : undefined}
            actionLabel=${peopleAffiliation === 'staff' ? 'Add User' : undefined}
          />
        </div>
      ` : html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Name</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Email</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Role</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                ${peopleAffiliation === 'students' ? html`
                  <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Program</th>
                  <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Batch</th>
                ` : null}
                <th className="text-right p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${peopleAffiliation === 'staff' ? staffUsers.map(u => renderUserRow(u, false))
                : peopleAffiliation === 'students' ? students.map(s => html`
                  <tr key=${s.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] cursor-pointer" onClick=${() => navigate && navigate('system-admin/people/user/' + s.id)}>
                    <td className="p-3 font-bold text-[var(--app-text-primary)]">${s.name}</td>
                    <td className="p-3 text-[var(--app-text-secondary)]">${s.email}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">${(typeof s.role === 'string' ? s.role : (s.role?.name ?? s.role?.id ?? '')).replace(/_/g, ' ') || '—'}</span></td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-[rgba(52,199,89,0.12)] text-[var(--app-success)] rounded text-xs font-bold">Current</span></td>
                    <td className="p-3 text-[var(--app-text-secondary)]">${getProgramName(s.program_id)}</td>
                    <td className="p-3 text-[var(--app-text-secondary)]">${s.batch_id ? getBatchName(s.batch_id) : '-'}</td>
                    <td className="p-3 text-right" onClick=${(e) => e.stopPropagation()}>
                      <span className="text-[var(--app-text-muted)] text-xs">—</span>
                    </td>
                  </tr>
                `)
                : alumni.map(u => renderUserRow(u, true))}
            </tbody>
          </table>
        </div>
        ${peopleTotal > 0 ? html`
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <${PaginationControls}
              page=${peoplePage}
              pageSize=${peoplePageSize}
              total=${peopleTotal}
              onPageChange=${setPeoplePage}
              onPageSizeChange=${(s) => { setPeoplePageSize(s); setPeoplePage(1); }}
              pageSizeOptions=${[20, 50]}
            />
          </div>
        ` : null}
      `}
      </${SectionCard}>
    </div>
  `;

  const renderPrograms = () => html`
    <${SectionCard} padding=${true}>
      <${ProgramList}
        institutionId=${institutionId}
        programs=${programs}
        onProgramCreated=${fetchData}
        onProgramDeleted=${fetchData}
        onEditProgram=${() => {}}
        deleteProgram=${deleteProgram}
        confirm=${confirm}
        toast=${toast}
      />
    </${SectionCard}>
  `;

  const getBatchName = (id) => batches.find((b) => b.id === id)?.name || id || '-';
  const getProgramName = (id) => programs.find((p) => p.id === id)?.name || id || '-';

  const renderShortlists = () => html`
    <div className="space-y-4">
      <p className="text-sm text-[var(--app-text-secondary)]">${shortlists.length} shortlist${shortlists.length !== 1 ? 's' : ''}</p>
      ${shortlists.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">No shortlists for this institution's students</div>
      ` : html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Student</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Job ID</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Received</th>
              </tr>
            </thead>
            <tbody>
              ${shortlists.map(sl => {
                const student = studentsById[sl.candidate_id];
                const statusColor = sl.status === 'Accepted' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : sl.status === 'Rejected' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' : 'bg-amber-100 text-amber-700';
                return html`
                  <tr key=${sl.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 font-bold text-[var(--app-text-primary)]">${student?.name || sl.candidate_id}</td>
                    <td className="p-3 text-[var(--app-text-secondary)] font-mono text-xs">${(sl.job_id || '').slice(-12)}</td>
                    <td className="p-3"><span className=${'px-2 py-0.5 rounded text-xs font-bold ' + statusColor}>${sl.status || 'Pending'}</span></td>
                    <td className="p-3 text-[var(--app-text-muted)] text-xs">${sl.received_at ? new Date(sl.received_at).toLocaleDateString() : '-'}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  const renderApplications = () => html`
    <div className="space-y-4">
      <p className="text-sm text-[var(--app-text-secondary)]">${applications.length} application${applications.length !== 1 ? 's' : ''}</p>
      ${applications.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">No applications</div>
      ` : html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Student</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Workflow</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Submitted</th>
              </tr>
            </thead>
            <tbody>
              ${applications.map(app => {
                const student = studentsById[app.student_id];
                const wf = workflows.find(w => w.id === app.workflow_id);
                const statusColor = app.status === 'SELECTED' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]'
                  : app.status === 'REJECTED' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]'
                  : app.status === 'SHORTLISTED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]'
                  : 'bg-amber-100 text-amber-700';
                return html`
                  <tr key=${app.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 font-bold text-[var(--app-text-primary)]">${student?.name || app.student_id}</td>
                    <td className="p-3 text-[var(--app-text-secondary)]">${wf?.name || (app.workflow_id || '').slice(-12)}</td>
                    <td className="p-3"><span className=${'px-2 py-0.5 rounded text-xs font-bold ' + statusColor}>${app.status}</span></td>
                    <td className="p-3 text-[var(--app-text-muted)] text-xs">${app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : '-'}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;

  const instStatus = institution?.status || 'PARTNER';
  const statusBadgeClass = instStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : instStatus === 'LISTED' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700';
  const subtitle = html`
    <div class="flex items-center gap-2 flex-wrap">
      <span class="px-2 py-0.5 rounded text-xs font-bold ${statusBadgeClass}">${instStatus}</span>
      ${institution.tier ? html`<span class="text-[var(--app-text-muted)]">${institution.tier}</span>` : ''}
      ${institution.location ? html`<span class="text-[var(--app-text-muted)]">${institution.location}</span>` : ''}
    </div>
  `;
  const headerActions = html`
    <div className="flex items-center gap-2">
      <button onClick=${() => setShowAddUserModal(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        Add User
      </button>
      <button onClick=${() => setEditing(true)}
        className="px-4 py-2 bg-[var(--app-surface)] border border-[var(--app-border-soft)] rounded-xl text-xs font-bold hover:bg-[var(--app-surface-muted)] transition-colors flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        Edit
      </button>
      ${isSystemAdmin ? html`
        <button onClick=${handleDelete}
          className="px-4 py-2 bg-[var(--app-surface)] border border-red-200 text-[var(--app-danger)] rounded-xl text-xs font-bold hover:bg-[rgba(255,59,48,0.06)] transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          Delete
        </button>
      ` : null}
    </div>
  `;

  const tabContent = tab === 'overview' ? renderOverview()
    : tab === 'people' ? renderPeople()
    : tab === 'programs' ? renderPrograms()
    : tab === 'shortlists' ? renderShortlists()
    : tab === 'applications' ? renderApplications()
    : (tab === 'admin' || tab === 'audit') ? html`
      <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6">
        <${AuditTrailPanel} institutionId=${institutionId} title="Institution Activity" />
      </div>
    `
    : renderOverview();

  return html`
    <${TabbedDetailView}
      title=${institution.name}
      subtitle=${subtitle}
      primaryTabs=${PRIMARY_TABS}
      secondaryByPrimary=${SECONDARY_BY_PRIMARY}
      activeTab=${tab}
      onTabChange=${setTab}
      onBack=${onBack}
      loading=${loading}
      headerActions=${headerActions}
      layout="primary-secondary"
    >
      ${tabContent}
    </${TabbedDetailView}>
    <${AddUserModal}
      open=${showAddUserModal}
      onClose=${() => setShowAddUserModal(false)}
      preselectedContext=${{ type: 'institution', id: institutionId }}
      institutions=${institutions || []}
      companies=${companies || []}
      programsByInstitution=${programsByInstitution || {}}
      onSuccess=${() => { fetchData(); fetchPeople(); }}
    />
  `;
};

export default InstitutionDetailView;
