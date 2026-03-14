import React, { useState, useEffect, useCallback, useRef } from 'react';
import htm from 'htm';
import { getUsers, getInstitutions, getPrograms, getBatches } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { toDisplayString } from '../utils/displayUtils.js';
import { iconMap } from '../ui/icons/iconMap.js';

const html = htm.bind(React.createElement);

const CV_STATUS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'VERIFIED', label: 'Verified' },
  { value: 'SUBMITTED', label: 'Pending' },
  { value: 'DRAFT', label: 'Draft' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'CANDIDATE', label: 'Candidate' },
  { value: 'RECRUITER', label: 'Recruiter' },
  { value: 'PLACEMENT_TEAM', label: 'Placement Team' },
  { value: 'PLACEMENT_ADMIN', label: 'Placement Admin' },
  { value: 'INSTITUTION_ADMIN', label: 'Institution Admin' },
  { value: 'SYSTEM_ADMIN', label: 'System Admin' },
];

const GlobalSearchBar = ({ user, navigate, onClose }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [programFilter, setProgramFilter] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [cvStatusFilter, setCvStatusFilter] = useState('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [institutions, setInstitutions] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [batches, setBatches] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);
  const panelRef = useRef(null);

  const debouncedQuery = useDebouncedValue(query, 300);

  const userRole = user?.role;

  useEffect(() => {
    getInstitutions({ limit: 500 }).then((d) => setInstitutions(d?.items ?? [])).catch(() => setInstitutions([]));
  }, []);

  useEffect(() => {
    if (!institutionFilter) {
      setPrograms([]);
      setProgramFilter('');
      setBatches([]);
      setBatchFilter('');
      return;
    }
    getPrograms(institutionFilter).then((d) => setPrograms(Array.isArray(d) ? d : [])).catch(() => setPrograms([]));
    setProgramFilter('');
    setBatches([]);
    setBatchFilter('');
  }, [institutionFilter]);

  useEffect(() => {
    if (!programFilter) {
      setBatches([]);
      setBatchFilter('');
      return;
    }
    getBatches({ program_id: programFilter }).then((d) => setBatches(Array.isArray(d) ? d : [])).catch(() => setBatches([]));
    setBatchFilter('');
  }, [programFilter]);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const filters = { limit: 20 };
      if (debouncedQuery.trim()) filters.q = debouncedQuery.trim();
      if (roleFilter) filters.role = roleFilter;
      if (institutionFilter) filters.institution_id = institutionFilter;
      if (programFilter) filters.program_id = programFilter;
      if (batchFilter) filters.batch_id = batchFilter;
      if (cvStatusFilter) filters.cv_status = cvStatusFilter;
      if (sectorFilter.trim()) filters.sector = sectorFilter.trim();

      const data = await getUsers(filters);
      setResults(data?.items ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, roleFilter, institutionFilter, programFilter, batchFilter, cvStatusFilter, sectorFilter]);

  useEffect(() => {
    if (!open) return;
    fetchResults();
  }, [open, fetchResults]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [open]);

  const handleResultClick = (u) => {
    const uid = u.id;
    const isSystemAdmin = userRole === UserRole.SYSTEM_ADMIN || userRole === 'SYSTEM_ADMIN';

    if (isSystemAdmin) {
      navigate?.('system-admin/people/user/' + uid);
    } else {
      navigate?.('profile/' + uid);
    }
    setOpen(false);
    setQuery('');
    onClose?.();
  };

  const getInstName = (id) => institutions.find((i) => i.id === id)?.name || id || '-';
  const getProgName = (id) => programs.find((p) => p.id === id)?.name || id || '-';
  const getBatchName = (id) => batches.find((b) => b.id === id)?.name || id || '-';

  const hasFilters = !!(roleFilter || institutionFilter || programFilter || batchFilter || cvStatusFilter || sectorFilter.trim());
  const clearFilters = () => {
    setRoleFilter('');
    setInstitutionFilter('');
    setProgramFilter('');
    setBatchFilter('');
    setCvStatusFilter('');
    setSectorFilter('');
  };

  const SearchIcon = iconMap.search;
  return html`
    <div className="relative" ref=${panelRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3 pointer-events-none text-[var(--app-text-muted)]">
          <${SearchIcon} className="w-4 h-4" />
        </div>
        <input
          ref=${inputRef}
          type="text"
          placeholder="Search users... (⌘K)"
          value=${query}
          onInput=${(e) => setQuery(e.target.value)}
          onFocus=${() => setOpen(true)}
          className="w-48 md:w-64 lg:w-80 pl-10 pr-4 py-2 rounded-lg border border-[var(--app-border-soft)] bg-white/70 backdrop-blur-md text-sm placeholder-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          aria-label="Search users"
        />
      </div>

      ${open && html`
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] shadow-xl max-h-[80vh] overflow-hidden flex flex-col min-w-[320px]">
          <div className="p-4 border-b border-[var(--app-border-soft)]">
            <button
              onClick=${() => setShowFilters(!showFilters)}
              className="text-xs font-semibold text-[var(--app-accent)] uppercase tracking-wider mb-2"
            >
              ${showFilters ? 'Hide filters' : 'Show filters'}
            </button>
            ${showFilters && html`
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                <select value=${roleFilter} onChange=${(e) => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-xs bg-[var(--app-surface-muted)]">
                  ${ROLE_OPTIONS.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
                </select>
                <select value=${institutionFilter} onChange=${(e) => setInstitutionFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-xs bg-[var(--app-surface-muted)]">
                  <option value="">All Institutions</option>
                  ${institutions.map((i) => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
                </select>
                <select value=${programFilter} onChange=${(e) => setProgramFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-xs bg-[var(--app-surface-muted)]" disabled=${!institutionFilter}>
                  <option value="">All Programs</option>
                  ${programs.map((p) => html`<option key=${p.id} value=${p.id}>${p.name}</option>`)}
                </select>
                <select value=${batchFilter} onChange=${(e) => setBatchFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-xs bg-[var(--app-surface-muted)]" disabled=${!programFilter}>
                  <option value="">All Batches</option>
                  ${batches.map((b) => html`<option key=${b.id} value=${b.id}>${b.name}</option>`)}
                </select>
                <select value=${cvStatusFilter} onChange=${(e) => setCvStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-xs bg-[var(--app-surface-muted)]">
                  ${CV_STATUS_OPTIONS.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
                </select>
                <input
                  type="text"
                  placeholder="Sector"
                  value=${sectorFilter}
                  onInput=${(e) => setSectorFilter(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[var(--app-border-soft)] text-xs bg-[var(--app-surface-muted)]"
                />
                ${hasFilters && html`
                  <button onClick=${clearFilters} className="col-span-2 md:col-span-3 text-xs font-semibold text-[var(--app-accent)] hover:underline">
                    Clear filters
                  </button>
                `}
              </div>
            `}
          </div>

          <div className="overflow-y-auto flex-1 max-h-96">
            ${loading ? html`
              <div className="p-8 text-center text-[var(--app-text-muted)] text-sm">Loading...</div>
            ` : results.length === 0 ? html`
              <div className="p-8 text-center text-[var(--app-text-muted)] text-sm">No users found</div>
            ` : results.map((u) => html`
              <button
                key=${u.id}
                onClick=${() => handleResultClick(u)}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-[var(--app-surface-muted)] transition-colors border-b border-[var(--app-border-soft)] last:border-b-0"
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0 bg-[var(--app-accent-soft)] text-[var(--app-accent)]">
                  ${(toDisplayString(u.name) || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--app-text-primary)] truncate">${toDisplayString(u.name) || toDisplayString(u.email)}</p>
                  <p className="text-xs text-[var(--app-text-secondary)] truncate">${toDisplayString(u.email)}</p>
                  ${u.institution_id ? html`<span className="text-[10px] text-[var(--app-text-muted)]">${getInstName(u.institution_id)}</span>` : ''}
                </div>
                <span className="px-2 py-0.5 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded text-[10px] font-semibold uppercase shrink-0">
                  ${(typeof u.role === 'string' ? u.role : (u.role?.name ?? u.role?.id ?? 'USER')).replace(/_/g, ' ')}
                </span>
              </button>
            `)}
          </div>
        </div>
      `}
    </div>
  `;
};

export default GlobalSearchBar;
