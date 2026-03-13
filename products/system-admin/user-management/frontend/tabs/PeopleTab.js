import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getUsers, getInstitutions, getCompanies } from '/core/frontend/src/modules/shared/services/api.js';
import { useDebouncedValue } from '/core/frontend/src/modules/shared/hooks/useDebouncedValue.js';
import { PaginationControls, EmptyState } from '/core/frontend/src/modules/shared/index.js';
import AddUserModal from '../AddUserModal.js';

const html = htm.bind(React.createElement);

const PeopleTab = ({ institutions: institutionsProp, companies: companiesProp, roles, programsByInstitution, user, toast, confirm, onRefresh, navigate, isSystemAdmin, defaultInstitutionFilter }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [instFilter, setInstFilter] = useState('');
  const [compFilter, setCompFilter] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [institutions, setInstitutions] = useState(institutionsProp || []);
  const [companies, setCompanies] = useState(companiesProp || []);

  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchInstitutionsAndCompanies = useCallback(async () => {
    try {
      const [instRes, compRes] = await Promise.all([
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
      ]);
      setInstitutions(instRes?.items ?? []);
      setCompanies(compRes?.items ?? []);
    } catch {
      if (institutionsProp?.length) setInstitutions(institutionsProp);
      if (companiesProp?.length) setCompanies(companiesProp);
    }
  }, [institutionsProp, companiesProp]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
        q: debouncedSearch.trim() || undefined,
        role: roleFilter || undefined,
        institution_id: instFilter || defaultInstitutionFilter || undefined,
        company_id: compFilter || undefined,
      };
      const res = await getUsers(filters);
      setUsers(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, roleFilter, instFilter, compFilter, defaultInstitutionFilter]);

  useEffect(() => { fetchInstitutionsAndCompanies(); }, [fetchInstitutionsAndCompanies]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, instFilter, compFilter, defaultInstitutionFilter]);

  const getInstName = (id) => institutions.find(i => i.id === id)?.name || id || '-';
  const getCompName = (id) => companies.find(c => c.id === id)?.name || id || '-';

  const uniqueRoles = ['CANDIDATE', 'PLACEMENT_TEAM', 'PLACEMENT_ADMIN', 'INSTITUTION_ADMIN', 'RECRUITER', 'FACULTY_OBSERVER', 'ALUMNI', 'SYSTEM_ADMIN'];

  const hasActiveFilters = !!(roleFilter || instFilter || compFilter || search);
  const clearFilters = () => { setRoleFilter(''); setInstFilter(''); setCompFilter(''); setSearch(''); setPage(1); };

  return html`
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-tour-id="people-header">
        <p className="text-sm text-[var(--app-text-secondary)]">${total} user${total !== 1 ? 's' : ''}</p>
        ${isSystemAdmin ? html`
          <button onClick=${() => setShowAddUserModal(true)}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
            + Add User
          </button>
        ` : null}
      </div>
      <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]" data-tour-id="people-search">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider">Filters</span>
          ${hasActiveFilters ? html`
            <button onClick=${clearFilters} className="text-xs font-semibold text-[var(--app-accent)] hover:underline">
              Clear all
            </button>
          ` : null}
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text" placeholder="Search by name or email..."
            value=${search} onChange=${e => setSearch(e.target.value)}
            aria-label="Search users by name or email"
            className="flex-1 min-w-[200px] px-4 py-3 border border-[var(--app-border-soft)] rounded-xl text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          />
          <select value=${roleFilter} onChange=${e => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
            className="px-4 py-3 min-w-[160px] border border-[var(--app-border-soft)] rounded-xl text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30">
            <option value="">All Roles</option>
            ${uniqueRoles.map(r => html`<option key=${r} value=${r}>${r.replace(/_/g, ' ')}</option>`)}
          </select>
          <select value=${instFilter} onChange=${e => setInstFilter(e.target.value)}
            aria-label="Filter by institution"
            className="px-4 py-3 min-w-[160px] border border-[var(--app-border-soft)] rounded-xl text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30">
            <option value="">All Institutions</option>
            ${(institutions || []).map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
          </select>
          <select value=${compFilter} onChange=${e => setCompFilter(e.target.value)}
            aria-label="Filter by company"
            className="px-4 py-3 min-w-[160px] border border-[var(--app-border-soft)] rounded-xl text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30">
            <option value="">All Companies</option>
            ${(companies || []).map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
          </select>
          <span className="text-sm text-[var(--app-text-muted)] font-semibold">${total} user${total !== 1 ? 's' : ''}</span>
        </div>
      </div>

      ${loading ? html`
        <div className="animate-pulse space-y-2">
          ${[1,2,3,4,5,6,7,8].map(i => html`<div key=${i} className="h-20 bg-[var(--app-surface-muted)] rounded-2xl" />`)}
        </div>
      ` : html`
      <div className="space-y-2" data-tour-id="people-list">
        ${users.length === 0 ? html`
          <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-12">
            <${EmptyState} title="No users found" message=${hasActiveFilters ? 'Try adjusting your filters.' : 'Add your first user to get started.'} />
          </div>
        ` : users.map(u => html`
          <div key=${u.id}
            onClick=${() => navigate && navigate('system-admin/people/user/' + u.id)}
            className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] overflow-hidden transition-shadow hover:shadow-md hover:border-indigo-200 cursor-pointer group"
          >
            <div className="w-full flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0 bg-indigo-100 text-indigo-600">
                ${(u.name || '?')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[var(--app-text-primary)] truncate">${u.name}</p>
                <p className="text-sm text-[var(--app-text-secondary)] truncate">${u.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                ${u.institution_id ? html`<span className="hidden sm:inline px-2 py-0.5 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded text-[10px] font-bold">${getInstName(u.institution_id)}</span>` : null}
                ${u.company_id ? html`<span className="hidden sm:inline px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">${getCompName(u.company_id)}</span>` : null}
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg text-[10px] font-semibold uppercase">
                  ${(typeof u.role === 'string' ? u.role : (u.role?.name ?? u.role?.id ?? 'GENERAL')).replace(/_/g, ' ')}
                </span>
                <svg className="w-4 h-4 text-[var(--app-text-muted)] group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        `)}
      </div>
      ${users.length > 0 ? html`
        <div className="mt-6 pt-4 border-t border-[var(--app-border-soft)]">
          <${PaginationControls}
            page=${page}
            pageSize=${pageSize}
            total=${total}
            onPageChange=${setPage}
            onPageSizeChange=${(s) => { setPageSize(s); setPage(1); }}
            pageSizeOptions=${[20, 50]}
          />
        </div>
      ` : null}
      `}
      <${AddUserModal}
        open=${showAddUserModal}
        onClose=${() => setShowAddUserModal(false)}
        institutions=${institutions}
        companies=${companies}
        programsByInstitution=${programsByInstitution}
        onSuccess=${(createdUser) => {
          onRefresh?.();
          fetchUsers();
          if (navigate && createdUser?.id) navigate('system-admin/people/user/' + createdUser.id);
        }}
      />
    </div>
  `;
};

export default React.memo(PeopleTab);
