import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getInstitutions, getUsers, getPrograms, getCompanies } from '/core/frontend/src/modules/shared/services/api.js';
import { useDebouncedValue } from '/core/frontend/src/modules/shared/hooks/useDebouncedValue.js';
import { PaginationControls, EmptyState } from '/core/frontend/src/modules/shared/index.js';
import InstitutionForm from './InstitutionForm.js';
import AddUserModal from '/products/system-admin/user-management/frontend/AddUserModal.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';

const html = htm.bind(React.createElement);

const InstitutionAdminPortal = ({ user, activeView }) => {
  const [activeTab, setActiveTab] = useState('institutions');
  const [institutions, setInstitutions] = useState([]);
  const [institutionsTotal, setInstitutionsTotal] = useState(0);
  const [institutionsPage, setInstitutionsPage] = useState(1);
  const [institutionsPageSize, setInstitutionsPageSize] = useState(20);
  const [institutionsSearch, setInstitutionsSearch] = useState('');
  const [institutionsLoading, setInstitutionsLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(20);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersLoading, setUsersLoading] = useState(true);

  const [showInstitutionForm, setShowInstitutionForm] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState(null);
  const [programsByInstitution, setProgramsByInstitution] = useState({});
  const [companies, setCompanies] = useState([]);

  const isInstitutionAdmin = user.role === UserRole.INSTITUTION_ADMIN;
  const instFilter = isInstitutionAdmin && user.institution_id ? user.institution_id : null;

  const instDebouncedSearch = useDebouncedValue(institutionsSearch, 300);
  const usersDebouncedSearch = useDebouncedValue(usersSearch, 300);

  const fetchInstitutions = useCallback(async () => {
    setInstitutionsLoading(true);
    try {
      const res = await getInstitutions({
        q: instDebouncedSearch.trim() || undefined,
        limit: institutionsPageSize,
        offset: (institutionsPage - 1) * institutionsPageSize,
        institution_id: instFilter || undefined,
        include_counts: true,
      });
      setInstitutions(res?.items ?? []);
      setInstitutionsTotal(res?.total ?? 0);
      const progMap = {};
      for (const inst of res?.items ?? []) {
        try { progMap[inst.id] = await getPrograms(inst.id); } catch { progMap[inst.id] = []; }
      }
      setProgramsByInstitution(prev => ({ ...prev, ...progMap }));
    } catch (err) {
      console.error('Failed to fetch institutions:', err);
      setInstitutions([]);
      setInstitutionsTotal(0);
    } finally {
      setInstitutionsLoading(false);
    }
  }, [instDebouncedSearch, institutionsPage, institutionsPageSize, instFilter]);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await getUsers({
        institution_id: instFilter || undefined,
        limit: usersPageSize,
        offset: (usersPage - 1) * usersPageSize,
        q: usersDebouncedSearch.trim() || undefined,
      });
      setUsers(res?.items ?? []);
      setUsersTotal(res?.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      setUsers([]);
      setUsersTotal(0);
    } finally {
      setUsersLoading(false);
    }
  }, [usersDebouncedSearch, usersPage, usersPageSize, instFilter]);

  const fetchCompanies = useCallback(async () => {
    const res = await getCompanies({ limit: 200 }).catch(() => ({ items: [] }));
    setCompanies(res?.items ?? []);
  }, []);

  useEffect(() => { fetchInstitutions(); }, [fetchInstitutions]);
  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { if (showAddUserModal) fetchCompanies(); }, [showAddUserModal, fetchCompanies]);
  useEffect(() => { setInstitutionsPage(1); }, [instDebouncedSearch]);
  useEffect(() => { setUsersPage(1); }, [usersDebouncedSearch]);

  const handleInstitutionSubmit = async () => {
    setShowInstitutionForm(false);
    setEditingInstitution(null);
    fetchInstitutions();
  };

  const renderInstitutionsTab = () => html`
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        ${!isInstitutionAdmin ? html`
          <input
            type="text"
            placeholder="Search institutions..."
            value=${institutionsSearch}
            onChange=${(e) => setInstitutionsSearch(e.target.value)}
            className="px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          />
        ` : null}
        ${isInstitutionAdmin && user.institution_id ? html`
          <button
            onClick=${() => {
              const inst = institutions.find(i => i.id === user.institution_id);
              setEditingInstitution(inst);
              setShowInstitutionForm(true);
            }}
            className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] font-medium"
          >
            Edit Institution
          </button>
        ` : html`
          <button
            onClick=${() => {
              setEditingInstitution(null);
              setShowInstitutionForm(true);
            }}
            className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] font-medium"
          >
            Add Institution
          </button>
        `}
      </div>

      ${institutionsLoading ? html`
        <div className="animate-pulse space-y-2 py-8">
          ${[1,2,3,4].map(i => html`<div key=${i} className="h-24 bg-[var(--app-surface-muted)] rounded-xl" />`)}
        </div>
      ` : institutions.length === 0 ? html`
        <${EmptyState} title="No institutions found" message=${instDebouncedSearch ? 'Try a different search.' : 'Add your first institution.'} />
      ` : html`
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${institutions.map(inst => html`
            <div key=${inst.id} className="bg-[var(--app-surface)] rounded-xl p-6 shadow-[var(--app-shadow-subtle)] border border-[var(--app-border-soft)]">
              <h3 className="text-lg font-bold text-[var(--app-text-primary)] mb-2">${inst.name}</h3>
              <p className="text-sm text-[var(--app-text-secondary)] mb-4">${inst.tier || 'N/A'}</p>
              <div className="flex gap-2">
                <button
                  onClick=${() => {
                    setEditingInstitution(inst);
                    setShowInstitutionForm(true);
                  }}
                  className="px-3 py-1 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded text-sm hover:bg-[var(--app-accent-soft)]"
                >
                  Edit
                </button>
              </div>
            </div>
          `)}
        </div>
        ${institutionsTotal > 0 ? html`
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <${PaginationControls}
              page=${institutionsPage}
              pageSize=${institutionsPageSize}
              total=${institutionsTotal}
              onPageChange=${setInstitutionsPage}
              onPageSizeChange=${(s) => { setInstitutionsPageSize(s); setInstitutionsPage(1); }}
              pageSizeOptions=${[20, 50]}
            />
          </div>
        ` : null}
      `}
    </div>
  `;

  const renderUsersTab = () => html`
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value=${usersSearch}
          onChange=${(e) => setUsersSearch(e.target.value)}
          className="px-4 py-2 border border-[var(--app-border-soft)] rounded-xl text-sm min-w-[200px] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
        />
        <button
          onClick=${() => setShowAddUserModal(true)}
          className="px-4 py-2 bg-[var(--app-accent)] text-white rounded-lg hover:bg-[var(--app-accent-hover)] font-medium"
        >
          Add User
        </button>
      </div>

      ${usersLoading ? html`
        <div className="animate-pulse space-y-2 py-8">
          ${[1,2,3,4,5].map(i => html`<div key=${i} className="h-12 bg-[var(--app-surface-muted)] rounded-xl" />`)}
        </div>
      ` : users.length === 0 ? html`
        <${EmptyState} title="No users found" message=${usersDebouncedSearch ? 'Try a different search.' : 'Add your first user.'} action=${() => setShowAddUserModal(true)} actionLabel="Add User" />
      ` : html`
        <div className="bg-[var(--app-surface)] rounded-xl shadow-[var(--app-shadow-subtle)] border border-[var(--app-border-soft)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--app-surface-muted)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-secondary)] uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-secondary)] uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--app-text-secondary)] uppercase">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--app-border-soft)]">
              ${users.map(u => html`
                <tr key=${u.id}>
                  <td className="px-6 py-4 text-sm text-[var(--app-text-primary)]">${u.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-[var(--app-text-secondary)]">${u.email}</td>
                  <td className="px-6 py-4 text-sm text-[var(--app-text-secondary)]">${typeof u.role === 'string' ? u.role : (u.role?.name ?? u.role?.id ?? 'N/A')}</td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
        ${usersTotal > 0 ? html`
          <div className="mt-4 pt-4 border-t border-[var(--app-border-soft)]">
            <${PaginationControls}
              page=${usersPage}
              pageSize=${usersPageSize}
              total=${usersTotal}
              onPageChange=${setUsersPage}
              onPageSizeChange=${(s) => { setUsersPageSize(s); setUsersPage(1); }}
              pageSizeOptions=${[20, 50]}
            />
          </div>
        ` : null}
      `}
    </div>
  `;

  return html`
    <div className="p-8">
      <div className="mb-6 border-b border-[var(--app-border-soft)]">
        <div className="flex gap-4">
          <button
            onClick=${() => setActiveTab('institutions')}
            className=${`px-4 py-2 font-medium ${activeTab === 'institutions' ? 'text-[var(--app-accent)] border-b-2 border-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
          >
            Institutions
          </button>
          <button
            onClick=${() => setActiveTab('users')}
            className=${`px-4 py-2 font-medium ${activeTab === 'users' ? 'text-[var(--app-accent)] border-b-2 border-[var(--app-accent)]' : 'text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)]'}`}
          >
            Users
          </button>
        </div>
      </div>

      ${activeTab === 'institutions' ? renderInstitutionsTab() : renderUsersTab()}

      ${showInstitutionForm ? html`
        <${InstitutionForm}
          institution=${editingInstitution}
          onSuccess=${handleInstitutionSubmit}
          onCancel=${() => {
            setShowInstitutionForm(false);
            setEditingInstitution(null);
          }}
        />
      ` : null}

      <${AddUserModal}
        open=${showAddUserModal}
        onClose=${() => setShowAddUserModal(false)}
        preselectedContext=${user.institution_id ? { type: 'institution', id: user.institution_id } : null}
        institutions=${institutions}
        companies=${companies}
        programsByInstitution=${programsByInstitution}
        onSuccess=${() => { fetchUsers(); }}
      />
    </div>
  `;
};

export default InstitutionAdminPortal;
