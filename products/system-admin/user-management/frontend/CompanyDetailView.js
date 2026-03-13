import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getCompany, getCompanyJobs, getCompanyHires,
  getUsers, getWorkflows, getShortlists, getApplications,
  getWorkflowApprovals, deleteCompany, deleteUser,
  getCompanyBusinessUnits, createBusinessUnit, deleteBusinessUnit,
  getCompanyFunctions, createCompanyFunction, deleteCompanyFunction,
  getCompanyDesignations, createCompanyDesignation, deleteCompanyDesignation,
  approveCompany, rejectCompany,
} from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast, useDialog, useDebouncedValue } from '/core/frontend/src/modules/shared/index.js';
import AuditTrailPanel from '/core/frontend/src/modules/shared/components/AuditTrailPanel.js';
import { SectionCard, StatCard, PaginationControls } from '/core/frontend/src/modules/shared/primitives/index.js';
import { EmptyState } from '/core/frontend/src/modules/shared/index.js';
import CompanyForm from '/products/profiles/company/frontend/src/CompanyForm.js';
import AddUserModal from './AddUserModal.js';
import TabbedDetailView from './TabbedDetailView.js';

const html = htm.bind(React.createElement);

const PRIMARY_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'people', label: 'People' },
  { id: 'placement', label: 'Placement' },
  { id: 'admin', label: 'Admin' },
];
const SECONDARY_BY_PRIMARY = {
  placement: [
    { id: 'workflows', label: 'Placement Cycles' },
    { id: 'jobs', label: 'JD Submissions' },
    { id: 'shortlists', label: 'Shortlists' },
    { id: 'applications', label: 'Applications' },
  ],
};

const CompanyDetailView = ({ companyId, institutions, companies, programsByInstitution, isSystemAdmin, onBack, navigate }) => {
  const toast = useToast();
  const { confirm } = useDialog();
  const [tab, setTab] = useState('overview');
  const [company, setCompany] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [hires, setHires] = useState([]);
  const [recruiterCount, setRecruiterCount] = useState(0);

  const [peopleStatus, setPeopleStatus] = useState('all');
  const [peopleRoleFilter, setPeopleRoleFilter] = useState('all');
  const [peopleSearch, setPeopleSearch] = useState('');
  const [peoplePage, setPeoplePage] = useState(1);
  const [peoplePageSize, setPeoplePageSize] = useState(20);
  const [peopleCurrent, setPeopleCurrent] = useState([]);
  const [peopleCurrentTotal, setPeopleCurrentTotal] = useState(0);
  const [peopleAlumni, setPeopleAlumni] = useState([]);
  const [peopleAlumniTotal, setPeopleAlumniTotal] = useState(0);
  const [peopleLoading, setPeopleLoading] = useState(false);
  const peopleDebouncedSearch = useDebouncedValue(peopleSearch, 300);

  const [workflows, setWorkflows] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [applications, setApplications] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [businessUnits, setBusinessUnits] = useState([]);
  const [functions, setFunctions] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [buName, setBuName] = useState('');
  const [fnName, setFnName] = useState('');
  const [desName, setDesName] = useState('');
  const [desLevel, setDesLevel] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [comp, compJobs, compHires, employeesRes, alumniRes, recruitersRes, wfs, sl, apps, wfApprovals, buList, fnList, desList] = await Promise.all([
        getCompany(companyId).catch(() => null),
        getCompanyJobs(companyId).catch(() => []),
        getCompanyHires(companyId).catch(() => []),
        getUsers({ company_id: companyId, limit: 1 }).catch(() => ({ total: 0 })),
        getUsers({ company_id: companyId, is_alumni: true, limit: 1 }).catch(() => ({ total: 0 })),
        getUsers({ company_id: companyId, role: UserRole.RECRUITER, limit: 1 }).catch(() => ({ total: 0 })),
        getWorkflows({ company_id: companyId }).catch(() => []),
        getShortlists({ limit: 100 }).catch(() => ({ items: [] })),
        getApplications({ limit: 100 }).catch(() => ({ items: [] })),
        getWorkflowApprovals({ company_id: companyId }).catch(() => []),
        getCompanyBusinessUnits(companyId).catch(() => []),
        getCompanyFunctions(companyId).catch(() => []),
        getCompanyDesignations(companyId).catch(() => []),
      ]);
      setCompany(comp);
      setJobs(Array.isArray(compJobs) ? compJobs : []);
      setHires(Array.isArray(compHires) ? compHires : []);
      setRecruiterCount(recruitersRes?.total ?? 0);
      setPeopleCurrentTotal(employeesRes?.total ?? 0);
      setPeopleAlumniTotal(alumniRes?.total ?? 0);
      setWorkflows(Array.isArray(wfs) ? wfs : []);
      setApprovals(Array.isArray(wfApprovals) ? wfApprovals : []);
      setBusinessUnits(Array.isArray(buList) ? buList : []);
      setFunctions(Array.isArray(fnList) ? fnList : []);
      setDesignations(Array.isArray(desList) ? desList : []);

      const jobIds = new Set((Array.isArray(compJobs) ? compJobs : []).map(j => j.id));
      const slItems = sl?.items ?? (Array.isArray(sl) ? sl : []);
      const appItems = apps?.items ?? (Array.isArray(apps) ? apps : []);
      setShortlists(slItems.filter(s => jobIds.has(s.job_id)));
      setApplications(appItems.filter(a => jobIds.has(a.job_id)));
    } catch (err) {
      console.error('Failed to fetch company details:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  const fetchPeople = useCallback(async () => {
    setPeopleLoading(true);
    const baseParams = {
      company_id: companyId,
      q: peopleDebouncedSearch.trim() || undefined,
      role: peopleRoleFilter === 'recruiters' ? UserRole.RECRUITER : undefined,
    };
    try {
      if (peopleStatus === 'all') {
        const [currentRes, alumniRes] = await Promise.all([
          getUsers({
            ...baseParams,
            limit: 50,
            offset: 0,
          }),
          getUsers({
            ...baseParams,
            is_alumni: true,
            limit: 50,
            offset: 0,
          }),
        ]);
        setPeopleCurrent(currentRes?.items ?? []);
        setPeopleCurrentTotal(currentRes?.total ?? 0);
        setPeopleAlumni(alumniRes?.items ?? []);
        setPeopleAlumniTotal(alumniRes?.total ?? 0);
      } else if (peopleStatus === 'current') {
        const res = await getUsers({
          ...baseParams,
          limit: peoplePageSize,
          offset: (peoplePage - 1) * peoplePageSize,
        });
        setPeopleCurrent(res?.items ?? []);
        setPeopleCurrentTotal(res?.total ?? 0);
        setPeopleAlumni([]);
        setPeopleAlumniTotal(0);
      } else {
        const res = await getUsers({
          ...baseParams,
          is_alumni: true,
          limit: peoplePageSize,
          offset: (peoplePage - 1) * peoplePageSize,
        });
        setPeopleCurrent([]);
        setPeopleCurrentTotal(0);
        setPeopleAlumni(res?.items ?? []);
        setPeopleAlumniTotal(res?.total ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch people:', err);
      setPeopleCurrent([]);
      setPeopleAlumni([]);
      setPeopleCurrentTotal(0);
      setPeopleAlumniTotal(0);
    } finally {
      setPeopleLoading(false);
    }
  }, [companyId, peopleStatus, peopleRoleFilter, peopleDebouncedSearch, peoplePage, peoplePageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (tab === 'people') fetchPeople();
  }, [tab, fetchPeople]);

  useEffect(() => { setPeoplePage(1); }, [peopleDebouncedSearch, peopleStatus, peopleRoleFilter]);

  const handleDelete = async () => {
    if (!(await confirm({ message: 'Delete this company and all its data?' }))) return;
    try {
      await deleteCompany(companyId);
      toast.success('Company deleted');
      onBack();
    } catch (e) { toast.error('Failed: ' + (e.message || '')); }
  };

  if (editing && company) {
    return html`
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <button onClick=${() => setEditing(false)} className="p-2 hover:bg-[var(--app-surface-muted)] rounded-lg transition-colors">
            <svg className="w-5 h-5 text-[var(--app-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h2 className="text-xl font-semibold text-[var(--app-text-primary)]">Edit Company</h2>
        </div>
        <div className="bg-[var(--app-surface)] p-8 rounded-2xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
          <${CompanyForm}
            company=${company}
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
        title="Company"
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

  if (!company) {
    return html`
      <div className="py-20 text-center">
        <p className="text-[var(--app-text-muted)] text-lg">Company not found</p>
        <button onClick=${onBack} className="mt-4 text-indigo-600 font-bold text-sm hover:underline">Go Back</button>
      </div>
    `;
  }

  const renderOverview = () => html`
    <div className="space-y-6">
      <${SectionCard} padding=${true} className="overflow-hidden">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="shrink-0">
            ${company.logo_url ? html`
              <img src=${company.logo_url} alt=${company.name} className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-contain border-2 border-[var(--app-border-soft)] bg-[var(--app-surface)]" />
            ` : html`
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-bold border-2 border-[var(--app-border-soft)]">${(company.name || 'C')[0]}</div>
            `}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-[var(--app-text-primary)] mb-2">${company.name}</h3>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2 py-0.5 rounded text-xs font-bold ${statusBadgeClass}">${compStatus}</span>
              ${company.headquarters ? html`<span className="text-sm text-[var(--app-text-muted)]">${company.headquarters}</span>` : ''}
              ${company.founding_year ? html`<span className="text-sm text-[var(--app-text-muted)]">• Est. ${company.founding_year}</span>` : ''}
            </div>
            ${company.description ? html`<p className="text-sm text-[var(--app-text-secondary)] line-clamp-3">${company.description}</p>` : ''}
            <div className="mt-3 pt-3 border-t border-[var(--app-border-soft)]">
              <p className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-1">Public profile URL</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-[var(--app-text-primary)] bg-[var(--app-surface-muted)] px-2 py-1 rounded flex-1 truncate">${typeof window !== 'undefined' ? window.location.origin : ''}/company/${companyId}</code>
                <button
                  onClick=${(e) => { e.stopPropagation(); const url = (typeof window !== 'undefined' ? window.location.origin : '') + '/company/' + companyId; navigator.clipboard?.writeText(url).then(() => toast.success('Copied to clipboard')).catch(() => {}); }}
                  className="shrink-0 px-2 py-1 text-xs font-bold bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >Copy</button>
              </div>
            </div>
          </div>
        </div>
      </${SectionCard}>

      <${SectionCard} title="Key Stats">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <${StatCard} label="Employees" value=${peopleCurrentTotal} color="accent" />
          <${StatCard} label="Recruiters" value=${recruiterCount} />
          <${StatCard} label="Former Recruiters" value=${peopleAlumniTotal} />
          <${StatCard} label="Placement Cycles" value=${workflows.length} />
          <${StatCard} label="Jobs" value=${jobs.length} />
          <${StatCard} label="Shortlists Sent" value=${shortlists.length} color="warning" />
          <${StatCard} label="Applications" value=${applications.length} color="success" />
        </div>
      </${SectionCard}>

      <div className="flex flex-wrap gap-4 cursor-pointer" onClick=${() => setTab('people')}>
        <${SectionCard} title="People at this organisation" className="hover:border-indigo-300 transition-colors flex-1 min-w-[200px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-indigo-600">${peopleCurrentTotal + peopleAlumniTotal}</p>
              <p className="text-sm text-[var(--app-text-muted)]">Current recruiters & alumni</p>
            </div>
            <svg className="w-6 h-6 text-[var(--app-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
          </div>
        </${SectionCard}>
      </div>

      ${(company.description || company.headquarters || company.founding_year) ? html`
        <${SectionCard} title="Company Info">
          <div className="space-y-3 text-sm">
            ${company.headquarters ? html`<div><span className="text-[var(--app-text-muted)]">Headquarters:</span> <span className="font-bold ml-2">${company.headquarters}</span></div>` : ''}
            ${company.founding_year ? html`<div><span className="text-[var(--app-text-muted)]">Founded:</span> <span className="font-bold ml-2">${company.founding_year}</span></div>` : ''}
            ${company.description ? html`<div><span className="text-[var(--app-text-muted)] block mb-1">Description:</span><p className="text-[var(--app-text-primary)]">${company.description}</p></div>` : ''}
          </div>
        </${SectionCard}>
      ` : ''}

      ${isSystemAdmin && (company?.status || 'PARTNER') === 'PENDING' ? html`
        <${SectionCard} title="Pending Approval" padding=${true}>
          <p className="text-sm text-[var(--app-text-secondary)] mb-4">This company is pending approval. Fill in details via Edit, then approve.</p>
          <div className="flex flex-wrap gap-2">
            <button onClick=${async () => {
              try {
                await approveCompany(companyId, { status: 'LISTED', name: company.name, description: company.description, headquarters: company.headquarters, founding_year: company.founding_year, last_year_hires: company.last_year_hires, cumulative_hires_3y: company.cumulative_hires_3y, last_year_median_fixed: company.last_year_median_fixed, logo_url: company.logo_url });
                toast.success('Company approved as Listed');
                fetchData();
              } catch (e) { toast.error('Failed: ' + (e.message || '')); }
            }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">Approve as Listed</button>
            <button onClick=${async () => {
              try {
                await approveCompany(companyId, { status: 'PARTNER', name: company.name, description: company.description, headquarters: company.headquarters, founding_year: company.founding_year, last_year_hires: company.last_year_hires, cumulative_hires_3y: company.cumulative_hires_3y, last_year_median_fixed: company.last_year_median_fixed, logo_url: company.logo_url });
                toast.success('Company approved as Partner');
                fetchData();
              } catch (e) { toast.error('Failed: ' + (e.message || '')); }
            }} className="px-4 py-2 bg-[var(--app-success)] text-white rounded-xl text-xs font-bold hover:opacity-90">Approve as Partner</button>
            <button onClick=${async () => {
              if (!(await confirm({ message: 'Reject and remove this company?' }))) return;
              try {
                await rejectCompany(companyId, {});
                toast.success('Company rejected');
                onBack?.();
              } catch (e) { toast.error('Failed: ' + (e.message || '')); }
            }} className="px-4 py-2 border border-red-200 text-[var(--app-danger)] rounded-xl text-xs font-bold hover:bg-[rgba(255,59,48,0.06)]">Reject</button>
          </div>
        </${SectionCard}>
      ` : null}

      ${isSystemAdmin ? html`
        <${SectionCard} title="Allowed Roles">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              ${(company.allowed_roles?.length > 0) ? html`
                <p className="text-sm text-[var(--app-text-secondary)] mb-2">Roles that can be assigned to users within this company:</p>
                <div className="flex flex-wrap gap-2">
                  ${(company.allowed_roles || []).map(r => html`
                    <span key=${r} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold">${r.replace(/_/g, ' ')}</span>
                  `)}
                </div>
              ` : html`
                <p className="text-sm text-[var(--app-text-muted)]">No roles configured. RECRUITER (default) applies. Click Edit to customize.</p>
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
        <${SectionCard} title="Business Units">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <input
                type="text"
                value=${buName}
                onChange=${(e) => setBuName(e.target.value)}
                placeholder="Business unit name"
                className="flex-1 min-w-[160px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick=${async () => {
                  if (!buName.trim()) { toast.error('Enter a name'); return; }
                  try {
                    await createBusinessUnit(companyId, { name: buName.trim() });
                    toast.success('Business unit added');
                    setBuName('');
                    fetchData();
                  } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >Add</button>
            </div>
            ${businessUnits.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No business units yet</p>` : html`
              <div className="flex flex-wrap gap-2">
                ${businessUnits.map(bu => html`
                  <span key=${bu.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                    ${bu.name}
                    <button onClick=${async () => {
                      if (!(await confirm({ message: `Remove "${bu.name}"?` }))) return;
                      try {
                        await deleteBusinessUnit(companyId, bu.id);
                        toast.success('Business unit removed');
                        fetchData();
                      } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                    }} className="text-[var(--app-danger)] hover:underline text-xs">×</button>
                  </span>
                `)}
              </div>
            `}
          </div>
        </${SectionCard}>

        <${SectionCard} title="Designations">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <input
                type="text"
                value=${desName}
                onChange=${(e) => setDesName(e.target.value)}
                placeholder="Designation name"
                className="flex-1 min-w-[140px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <input
                type="number"
                value=${desLevel}
                onChange=${(e) => setDesLevel(e.target.value)}
                placeholder="Level (optional)"
                className="w-24 px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick=${async () => {
                  if (!desName.trim()) { toast.error('Enter a designation name'); return; }
                  try {
                    await createCompanyDesignation(companyId, {
                      name: desName.trim(),
                      level: desLevel ? parseInt(desLevel, 10) : undefined,
                    });
                    toast.success('Designation added');
                    setDesName(''); setDesLevel('');
                    fetchData();
                  } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >Add</button>
            </div>
            ${designations.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No designations yet</p>` : html`
              <div className="flex flex-wrap gap-2">
                ${designations.map(d => html`
                  <span key=${d.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                    ${d.name}${d.level != null ? ' (L' + d.level + ')' : ''}
                    <button onClick=${async () => {
                      if (!(await confirm({ message: `Remove "${d.name}"?` }))) return;
                      try {
                        await deleteCompanyDesignation(companyId, d.id);
                        toast.success('Designation removed');
                        fetchData();
                      } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                    }} className="text-[var(--app-danger)] hover:underline text-xs">×</button>
                  </span>
                `)}
              </div>
            `}
          </div>
        </${SectionCard}>

        <${SectionCard} title="Functions">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap items-end">
              <input
                type="text"
                value=${fnName}
                onChange=${(e) => setFnName(e.target.value)}
                placeholder="Function name (e.g. Engineering, Sales)"
                className="flex-1 min-w-[160px] px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick=${async () => {
                  if (!fnName.trim()) { toast.error('Enter a function name'); return; }
                  try {
                    await createCompanyFunction(companyId, { name: fnName.trim() });
                    toast.success('Function added');
                    setFnName('');
                    fetchData();
                  } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700"
              >Add</button>
            </div>
            ${functions.length === 0 ? html`<p className="text-sm text-[var(--app-text-muted)]">No functions yet</p>` : html`
              <div className="flex flex-wrap gap-2">
                ${functions.map(f => html`
                  <span key=${f.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm">
                    ${f.name}
                    <button onClick=${async () => {
                      if (!(await confirm({ message: `Remove "${f.name}"?` }))) return;
                      try {
                        await deleteCompanyFunction(companyId, f.id);
                        toast.success('Function removed');
                        fetchData();
                      } catch (e) { toast.error('Failed: ' + (e.message || '')); }
                    }} className="text-[var(--app-danger)] hover:underline text-xs">×</button>
                  </span>
                `)}
              </div>
            `}
          </div>
        </${SectionCard}>
      ` : null}
    </div>
  `;

  const renderUserRow = (u, isAlumni) => {
    const canDelete = u.role !== UserRole.SYSTEM_ADMIN;
    return html`
      <tr key=${u.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] cursor-pointer" onClick=${() => navigate && navigate('system-admin/people/user/' + u.id)}>
        <td className="p-3 font-bold text-[var(--app-text-primary)]">${u.name}</td>
        <td className="p-3 text-[var(--app-text-secondary)]">${u.email}</td>
        <td className="p-3"><span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs font-bold">${(typeof u.role === 'string' ? u.role : (u.role?.name ?? u.role?.id ?? '')).replace(/_/g, ' ') || '—'}</span></td>
        <td className="p-3">
          ${isAlumni ? html`<span className="px-2 py-0.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded text-xs font-bold">Former</span>` : html`<span className="px-2 py-0.5 bg-[rgba(52,199,89,0.12)] text-[var(--app-success)] rounded text-xs font-bold">Current</span>`}
        </td>
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
            }} className="px-3 py-1 rounded-lg text-[10px] font-bold border border-red-200 text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.06)] shrink-0">
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
            value=${peopleStatus}
            onChange=${(e) => setPeopleStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          >
            <option value="all">All (Current + Alumni)</option>
            <option value="current">Current only</option>
            <option value="alumni">Alumni only</option>
          </select>
          <select
            value=${peopleRoleFilter}
            onChange=${(e) => setPeopleRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          >
            <option value="all">All roles</option>
            <option value="recruiters">Recruiters only</option>
          </select>
          <input
            type="text"
            placeholder="Search by name or email..."
            value=${peopleSearch}
            onChange=${(e) => setPeopleSearch(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[var(--app-border-soft)] text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30 min-w-[200px]"
          />
          <span className="text-sm text-[var(--app-text-muted)] font-semibold py-2">
            ${peopleStatus === 'all' ? (peopleCurrentTotal + peopleAlumniTotal) : peopleStatus === 'current' ? peopleCurrentTotal : peopleAlumniTotal} person${(peopleStatus === 'all' ? (peopleCurrentTotal + peopleAlumniTotal) : peopleStatus === 'current' ? peopleCurrentTotal : peopleAlumniTotal) !== 1 ? 's' : ''}
          </span>
        </div>
        <button onClick=${() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-2 shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          Add Person
        </button>
      </div>
      ${peopleLoading ? html`
        <div className="animate-pulse space-y-2 py-8">
          ${[1,2,3,4,5].map(i => html`<div key=${i} className="h-12 bg-[var(--app-surface-muted)] rounded-xl" />`)}
        </div>
      ` : (peopleStatus === 'all' ? (peopleCurrent.length === 0 && peopleAlumni.length === 0) : (peopleStatus === 'current' ? peopleCurrent.length === 0 : peopleAlumni.length === 0)) ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">
          <${EmptyState} title="No people found" message=${peopleDebouncedSearch || peopleRoleFilter !== 'all' ? 'Try adjusting your filters or search.' : 'Add your first person to this organisation.'} action=${() => setShowAddUserModal(true)} actionLabel="Add Person" />
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
                <th className="text-right p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${(peopleStatus === 'all'
                ? [...peopleCurrent.map(u => renderUserRow(u, false)), ...peopleAlumni.map(u => renderUserRow(u, true))]
                : peopleStatus === 'current'
                  ? peopleCurrent.map(u => renderUserRow(u, false))
                  : peopleAlumni.map(u => renderUserRow(u, true)))}
            </tbody>
          </table>
        </div>
        ${(peopleStatus !== 'all' && (peopleStatus === 'current' ? peopleCurrentTotal > 0 : peopleAlumniTotal > 0)) ? html`
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <${PaginationControls}
              page=${peoplePage}
              pageSize=${peoplePageSize}
              total=${peopleStatus === 'current' ? peopleCurrentTotal : peopleAlumniTotal}
              onPageChange=${setPeoplePage}
              onPageSizeChange=${(s) => { setPeoplePageSize(s); setPeoplePage(1); }}
              pageSizeOptions=${[20, 50]}
            />
          </div>
        ` : peopleStatus === 'all' && (peopleCurrentTotal > 50 || peopleAlumniTotal > 50) ? html`
          <p className="mt-4 text-xs text-[var(--app-text-muted)]">Showing first 50 of each. Use filters above to narrow results.</p>
        ` : null}
      `}
      </${SectionCard}>
    </div>
  `;

  const renderWorkflows = () => html`
    <div className="space-y-4">
      <${SectionCard} padding=${true}>
      <p className="text-sm text-[var(--app-text-secondary)] mb-4">${workflows.length} placement cycle${workflows.length !== 1 ? 's' : ''}</p>
      ${workflows.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">No placement cycles</div>
      ` : html`
        <div className="overflow-hidden rounded-xl border border-[var(--app-border-soft)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Name</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Institution</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Created</th>
              </tr>
            </thead>
            <tbody>
              ${workflows.map(wf => {
                const statusColor = wf.status === 'ACTIVE' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : wf.status === 'COMPLETED' ? 'bg-[var(--app-accent-soft)] text-[var(--app-accent)]' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]';
                return html`
                  <tr key=${wf.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 font-bold text-[var(--app-text-primary)]">${wf.name}</td>
                    <td className="p-3 text-[var(--app-text-secondary)] font-mono text-xs">${(wf.institution_id || '').slice(-12)}</td>
                    <td className="p-3"><span className=${'px-2 py-0.5 rounded text-xs font-bold ' + statusColor}>${wf.status}</span></td>
                    <td className="p-3 text-[var(--app-text-muted)] text-xs">${wf.created_at ? new Date(wf.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      `}
      </${SectionCard}>
    </div>
  `;

  const renderJobs = () => html`
    <div className="space-y-4">
      <${SectionCard} padding=${true}>
      <p className="text-sm text-[var(--app-text-secondary)] mb-4">${jobs.length} job${jobs.length !== 1 ? 's' : ''}</p>
      ${jobs.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">No job submissions</div>
      ` : html`
        <div className="overflow-hidden rounded-xl border border-[var(--app-border-soft)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Title</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Sector</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Fixed Comp</th>
              </tr>
            </thead>
            <tbody>
              ${jobs.map(job => {
                const statusColor = job.jd_status === 'Approved' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : job.jd_status === 'Rejected' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' : 'bg-amber-100 text-amber-700';
                return html`
                  <tr key=${job.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 font-bold text-[var(--app-text-primary)]">${job.title || job.job_title || '-'}</td>
                    <td className="p-3 text-[var(--app-text-secondary)]">${job.sector || '-'}</td>
                    <td className="p-3"><span className=${'px-2 py-0.5 rounded text-xs font-bold ' + statusColor}>${job.jd_status || 'Draft'}</span></td>
                    <td className="p-3 text-[var(--app-text-secondary)]">${job.fixed_comp ? '₹' + Number(job.fixed_comp).toLocaleString() : '-'}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
      `}
      </${SectionCard}>
    </div>
  `;

  const renderShortlists = () => html`
    <div className="space-y-4">
      <${SectionCard} padding=${true}>
      <p className="text-sm text-[var(--app-text-secondary)] mb-4">${shortlists.length} shortlist${shortlists.length !== 1 ? 's' : ''}</p>
      ${shortlists.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">No shortlists</div>
      ` : html`
        <div className="overflow-hidden rounded-xl border border-[var(--app-border-soft)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[var(--app-surface-muted)] border-b border-[var(--app-border-soft)]">
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Candidate</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Job</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Status</th>
                <th className="text-left p-3 text-[10px] font-semibold text-[var(--app-text-secondary)] uppercase">Received</th>
              </tr>
            </thead>
            <tbody>
              ${shortlists.map(sl => {
                const statusColor = sl.status === 'Accepted' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : sl.status === 'Rejected' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' : 'bg-amber-100 text-amber-700';
                return html`
                  <tr key=${sl.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 text-[var(--app-text-secondary)] font-mono text-xs">${(sl.candidate_id || '').slice(-12)}</td>
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
      </${SectionCard}>
    </div>
  `;

  const renderApplications = () => html`
    <div className="space-y-4">
      <${SectionCard} padding=${true}>
      <p className="text-sm text-[var(--app-text-secondary)] mb-4">${applications.length} application${applications.length !== 1 ? 's' : ''}</p>
      ${applications.length === 0 ? html`
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12 text-center text-[var(--app-text-muted)]">No applications</div>
      ` : html`
        <div className="overflow-hidden rounded-xl border border-[var(--app-border-soft)]">
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
                const wf = workflows.find(w => w.id === app.workflow_id);
                const statusColor = app.status === 'SELECTED' ? 'bg-[rgba(52,199,89,0.12)] text-[var(--app-success)]' : app.status === 'REJECTED' ? 'bg-[rgba(255,59,48,0.12)] text-[var(--app-danger)]' : 'bg-amber-100 text-amber-700';
                return html`
                  <tr key=${app.id} className="border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]">
                    <td className="p-3 text-[var(--app-text-secondary)] font-mono text-xs">${(app.student_id || '').slice(-12)}</td>
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
      </${SectionCard}>
    </div>
  `;

  const compStatus = company?.status || 'PARTNER';
  const statusBadgeClass = compStatus === 'PENDING' ? 'bg-amber-100 text-amber-700' : compStatus === 'LISTED' ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700';
  const subtitle = html`
    <div class="flex items-center gap-2 flex-wrap">
      <span class="px-2 py-0.5 rounded text-xs font-bold ${statusBadgeClass}">${compStatus}</span>
      ${company.headquarters ? html`<span class="text-[var(--app-text-muted)]">${company.headquarters}</span>` : ''}
      ${company.founding_year ? html`<span class="text-[var(--app-text-muted)]">Est. ${company.founding_year}</span>` : ''}
    </div>
  `;
  const headerActions = html`
    <div className="flex items-center gap-2">
      <button onClick=${() => setShowAddUserModal(true)}
        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        Add Recruiter
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
    : tab === 'workflows' ? renderWorkflows()
    : tab === 'jobs' ? renderJobs()
    : tab === 'shortlists' ? renderShortlists()
    : tab === 'applications' ? renderApplications()
    : (tab === 'admin' || tab === 'audit') ? html`
      <${SectionCard} padding=${true}>
        <${AuditTrailPanel} companyId=${companyId} title="Company Activity" />
      </${SectionCard}>
    `
    : renderOverview();

  return html`
    <${TabbedDetailView}
      title=${company.name}
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
      preselectedContext=${{ type: 'company', id: companyId }}
      institutions=${institutions || []}
      companies=${companies || []}
      programsByInstitution=${programsByInstitution || {}}
      onSuccess=${() => { fetchData(); fetchPeople(); }}
    />
  `;
};

export default CompanyDetailView;
