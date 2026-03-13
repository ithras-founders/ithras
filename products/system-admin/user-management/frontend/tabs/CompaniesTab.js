import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getCompanies } from '/core/frontend/src/modules/shared/services/api.js';
import { useDebouncedValue } from '/core/frontend/src/modules/shared/hooks/useDebouncedValue.js';
import CompanyForm from '/products/profiles/company/frontend/src/CompanyForm.js';
import { getCompanyLogoUrl, getCompanyLogoFallback } from '/core/frontend/src/modules/shared/utils/logoUtils.js';
import { PaginationControls, EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const CompaniesTab = ({
  isSystemAdmin,
  onDrillDown,
  deleteCompany,
  toast,
  confirm,
}) => {
  const [showCompForm, setShowCompForm] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const debouncedSearch = useDebouncedValue(search, 300);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCompanies({
        q: debouncedSearch.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        include_counts: true,
      });
      setCompanies(res?.items ?? []);
      setTotal(res?.total ?? 0);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setCompanies([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const handleDelete = async (e, comp) => {
    e.stopPropagation();
    if (!(await confirm({ message: `Delete "${comp.name}" and all its data?` }))) return;
    try {
      await deleteCompany(comp.id);
      toast.success('Company deleted');
      fetchData();
    } catch (err) { toast.error('Delete failed: ' + (err.message || '')); }
  };

  if (showCompForm) {
    return html`
      <div className="bg-[var(--app-surface)] p-8 rounded-2xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
        <${CompanyForm}
          isSystemAdmin=${isSystemAdmin}
          onSuccess=${() => { setShowCompForm(false); fetchData(); }}
          onCancel=${() => setShowCompForm(false)}
        />
      </div>
    `;
  }

  return html`
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-[var(--app-text-secondary)]">${total} compan${total !== 1 ? 'ies' : 'y'}</p>
        ${isSystemAdmin ? html`
          <button onClick=${() => setShowCompForm(true)}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors">
            + Add Company
          </button>
        ` : null}
      </div>

      <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            type="text"
            placeholder="Search by name..."
            value=${search}
            onChange=${(e) => setSearch(e.target.value)}
            aria-label="Search companies"
            className="flex-1 min-w-[200px] px-4 py-3 border border-[var(--app-border-soft)] rounded-xl text-sm bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/30"
          />
        </div>
      </div>

      ${loading ? html`
        <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] overflow-hidden divide-y divide-[var(--app-border-soft)]">
          ${[1, 2, 3, 4, 5].map(i => html`
            <div key=${i} className="h-14 bg-[var(--app-surface-muted)] animate-pulse" />
          `)}
        </div>
      ` : html`
        <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] overflow-hidden" data-tour-id="companies-list">
          ${companies.length === 0 ? html`
            <div className="p-8">
              <${EmptyState} title="No companies found" message=${debouncedSearch ? 'Try a different search term.' : 'Add your first company to get started.'} />
            </div>
          ` : html`
            <div className="divide-y divide-[var(--app-border-soft)]">
              ${companies.map(comp => {
                const logoUrl = getCompanyLogoUrl(comp);
                const recruiterCount = comp.recruiter_count ?? 0;
                return html`
                  <div key=${comp.id}
                    className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-[var(--app-surface-muted)] transition-colors cursor-pointer group"
                    onClick=${() => onDrillDown && onDrillDown('companies', comp.id)}>
                    ${logoUrl ? html`
                      <img src=${logoUrl} alt=${comp.name} className="w-10 h-10 rounded-xl object-contain border border-[var(--app-border-soft)] bg-[var(--app-surface)] shrink-0" onError=${(e) => { if (e.target.src !== getCompanyLogoFallback(comp)) e.target.src = getCompanyLogoFallback(comp); }} />
                    ` : html`
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 font-semibold flex items-center justify-center text-sm shrink-0">
                        ${(comp.name || 'C')[0].toUpperCase()}
                      </div>
                    `}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-[var(--app-text-primary)] group-hover:text-indigo-600 transition-colors truncate">${comp.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        ${(comp.status || 'PARTNER') === 'PENDING' ? html`<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">PENDING</span>` : (comp.status || 'PARTNER') === 'LISTED' ? html`<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">LISTED</span>` : html`<span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">PARTNER</span>`}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0 text-xs text-[var(--app-text-muted)]">
                      <span><strong className="text-[var(--app-accent)]">${recruiterCount}</strong> Recruiters</span>
                      <span><strong className="text-[var(--app-success)]">${comp.last_year_hires || 0}</strong> Hires (LY)</span>
                      <span><strong className="text-purple-600">${comp.cumulative_hires_3y || 0}</strong> Hires (3Y)</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      ${isSystemAdmin ? html`
                        <button onClick=${(e) => handleDelete(e, comp)}
                          className="p-1.5 rounded-lg text-[var(--app-text-muted)] hover:bg-red-50 hover:text-[var(--app-danger)] transition-colors"
                          title="Delete company">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      ` : null}
                      <svg className="w-4 h-4 text-[var(--app-text-muted)] group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                  </div>
                `;
              })}
            </div>
          `}
        </div>
        ${companies.length > 0 ? html`
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
    </div>
  `;
};

export default React.memo(CompaniesTab);
