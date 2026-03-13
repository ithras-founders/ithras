import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getDatabaseTables, getTableDetails, refreshDatabaseStats } from '/core/frontend/src/modules/shared/services/api.js';
import { useDebouncedValue } from '/core/frontend/src/modules/shared/hooks/useDebouncedValue.js';
import SkeletonLoader from '/core/frontend/src/modules/shared/components/SkeletonLoader.js';
import { PageHeader, SectionCard, Input, Button, DataTable, EmptyState, FilterBar } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const DatabaseManagement = () => {
  const [tables, setTables] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 300);
  const [sortBy, setSortBy] = useState('table_name');
  const [order, setOrder] = useState('asc');
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDatabaseTables({
        page,
        page_size: pageSize,
        search: debouncedSearch || undefined,
        sort_by: sortBy,
        order,
      });
      setTables(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setError(err.message || 'Failed to load tables');
      setTables([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearch, sortBy, order]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const fetchTableDetail = useCallback(async (tableName) => {
    if (!tableName) {
      setTableDetail(null);
      return;
    }
    try {
      setDetailLoading(true);
      const data = await getTableDetails(tableName);
      setTableDetail(data);
    } catch (err) {
      console.error('Failed to fetch table details:', err);
      setTableDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableDetail(selectedTable);
    } else {
      setTableDetail(null);
    }
  }, [selectedTable, fetchTableDetail]);

  const handleRowClick = (tableName) => {
    setSelectedTable(tableName);
  };

  const handleSort = (col) => {
    if (sortBy === col) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setOrder('asc');
    }
    setPage(1);
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const handleRefreshStats = async () => {
    try {
      setRefreshing(true);
      await refreshDatabaseStats();
      fetchTables();
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const columns = [
    { key: 'table_name', label: 'Table Name', sortable: true },
    { key: 'approximate_row_count', label: 'Row Count', sortable: true, render: (v) => v != null ? v.toLocaleString() : '—' },
    { key: 'table_schema', label: 'Schema' },
  ];
  const rows = tables.map((t) => ({ ...t, id: t.table_name }));

  return html`
    <div className="space-y-6 animate-in pb-20">
      <${PageHeader}
        title="Database Management"
        actions=${html`
          <${Button} variant="secondary" size="sm" onClick=${handleRefreshStats} disabled=${refreshing}>
            ${refreshing ? 'Refreshing...' : 'Refresh stats'}
          <//>
        `}
      />
      <${SectionCard} padding=${true}>
        <${FilterBar} className="mb-6">
          <form onSubmit=${handleSearchSubmit} className="flex gap-2 flex-1">
            <${Input}
              value=${searchInput}
              onChange=${(e) => setSearchInput(e.target.value)}
              placeholder="Filter by table name..."
              className="flex-1 max-w-md"
            />
            <${Button} type="submit" variant="primary" size="md">Search<//>
          </form>
          <label className="flex items-center gap-2 text-[var(--text-sm)]">
            <span className="text-[var(--text-secondary)]">Page size:</span>
            <select
              value=${pageSize}
              onChange=${(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="app-input px-3 py-1.5 text-[var(--text-sm)] rounded-[var(--radius-md)]"
            >
              <option value=${10}>10</option>
              <option value=${20}>20</option>
              <option value=${50}>50</option>
            </select>
          </label>
        <//>
        ${error ? html`
          <div className="p-4 bg-[var(--status-danger-bg)] border border-[rgba(255,59,48,0.2)] rounded-[var(--radius-md)] text-[var(--status-danger-text)] text-[var(--text-sm)] mb-6">
            ${error}
          </div>
        ` : loading ? html`
          <div className="py-12"><${SkeletonLoader} variant="listRows" lines=${5} /></div>
        ` : html`
          ${tables.length === 0 ? html`
            <${EmptyState} title="No tables found" message="No tables match your search criteria." />
          ` : html`
            <${DataTable}
              columns=${columns}
              rows=${rows}
              onSort=${handleSort}
              sortBy=${sortBy}
              order=${order}
              onRowClick=${(r) => handleRowClick(r.table_name)}
              selectedRowId=${selectedTable}
            />
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--border-soft)]">
              <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">
                Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total} tables
              </span>
              <div className="flex items-center gap-2">
                <${Button} variant="secondary" size="sm" onClick=${() => setPage(p => Math.max(1, p - 1))} disabled=${!canPrev}>
                  Previous
                <//>
                <span className="text-[var(--text-sm)] text-[var(--text-secondary)]">Page ${page} of ${totalPages}</span>
                <${Button} variant="secondary" size="sm" onClick=${() => setPage(p => Math.min(totalPages, p + 1))} disabled=${!canNext}>
                  Next
                <//>
              </div>
            </div>
          `}
        `}

        ${selectedTable ? html`
          <div className="mt-8 pt-8 border-t border-[var(--border-soft)]">
            <h3 className="text-[var(--text-lg)] font-semibold text-[var(--text-primary)] mb-4">
              ${detailLoading ? html`<span className="animate-pulse">Loading...</span>` : `Columns: ${selectedTable}`}
              ${tableDetail?.approximate_row_count != null ? html`
                <span className="text-[var(--text-secondary)] font-normal ml-2">
                  (~${tableDetail.approximate_row_count.toLocaleString()} rows)
                </span>
              ` : ''}
            </h3>
            ${detailLoading ? html`<div className="py-4"><${SkeletonLoader} lines=${3} /></div>` : tableDetail?.columns?.length ? html`
              <${DataTable}
                columns=${[
                  { key: 'column_name', label: 'Column' },
                  { key: 'data_type', label: 'Type' },
                  { key: 'is_nullable', label: 'Nullable' },
                  { key: 'column_default', label: 'Default', render: (v) => v || '—' },
                ]}
                rows=${tableDetail.columns.map((c) => ({ ...c, id: c.column_name }))}
                dense=${true}
              />
            ` : tableDetail ? html`<p className="text-[var(--text-muted)]">No columns found</p>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

export default DatabaseManagement;
