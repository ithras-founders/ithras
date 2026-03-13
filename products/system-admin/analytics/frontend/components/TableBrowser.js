import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  getAnalyticsTables,
  getAnalyticsTableDetails,
  refreshAnalyticsStats,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useDebouncedValue } from '/core/frontend/src/modules/shared/hooks/useDebouncedValue.js';
import TableDataView from './TableDataView.js';
import SkeletonLoader from '/core/frontend/src/modules/shared/components/SkeletonLoader.js';

const html = htm.bind(React.createElement);

const TableBrowser = () => {
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
  const [writeMode, setWriteMode] = useState(false);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyticsTables({
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
      const data = await getAnalyticsTableDetails(tableName);
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
      await refreshAnalyticsStats();
      fetchTables();
    } catch (err) {
      console.error('Failed to refresh stats:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const sortIcon = (col) => {
    if (sortBy !== col) return '\u2195';
    return order === 'asc' ? '\u2191' : '\u2193';
  };

  return html`
    <div className="space-y-4 animate-in pb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-end gap-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked=${writeMode}
              onChange=${(e) => setWriteMode(e.target.checked)}
              className="rounded border-[var(--app-border-soft)]"
            />
            <span className="text-sm font-medium">Write mode</span>
          </label>
          <button
            onClick=${handleRefreshStats}
            disabled=${refreshing}
            className="px-4 py-2 bg-[var(--app-surface-muted)] hover:bg-[var(--app-border-soft)] rounded-xl text-xs font-bold disabled:opacity-50"
          >
            ${refreshing ? 'Refreshing...' : 'Refresh stats'}
          </button>
        </div>
      </div>

      <div className="flex gap-6 min-h-[500px]">
        <div className="w-[220px] shrink-0 flex flex-col">
          <form onSubmit=${handleSearchSubmit} className="mb-4">
            <input
              type="text"
              value=${searchInput}
              onChange=${(e) => setSearchInput(e.target.value)}
              placeholder="Filter tables..."
              className="w-full px-3 py-2 border border-[var(--app-border-soft)] rounded-lg text-sm"
            />
          </form>
          <div className="flex items-center gap-2 mb-2">
            <select
              value=${pageSize}
              onChange=${(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="px-2 py-1 border border-[var(--app-border-soft)] rounded text-xs"
            >
              <option value=${10}>10</option>
              <option value=${20}>20</option>
              <option value=${50}>50</option>
            </select>
            <span className="text-xs text-[var(--app-text-secondary)]">per page</span>
          </div>

          <div className="bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] flex-1 overflow-hidden flex flex-col">
            ${error ? html`
              <div className="p-3 text-[var(--app-danger)] text-xs">${error}</div>
            ` : loading ? html`
              <div className="py-8"><${SkeletonLoader} variant="listRows" lines=${5} /></div>
            ` : html`
              <div className="overflow-y-auto flex-1">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-[var(--app-surface)]">
                    <tr className="border-b border-[var(--app-border-soft)]">
                      <th className="text-left py-2 px-2">
                        <button
                          onClick=${() => handleSort('table_name')}
                          className="font-bold text-[var(--app-text-secondary)] hover:text-[var(--app-accent)] text-xs"
                        >
                          Table ${sortIcon('table_name')}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    ${tables.map((t) => html`
                      <tr
                        key=${t.table_name}
                        onClick=${() => handleRowClick(t.table_name)}
                        className=${`cursor-pointer hover:bg-[var(--app-accent-soft)]/50 ${selectedTable === t.table_name ? 'bg-[var(--app-accent-soft)]' : ''}`}
                      >
                        <td className="py-2 px-2 font-medium truncate max-w-[200px]" title=${t.table_name}>${t.table_name}</td>
                      </tr>
                    `)}
                  </tbody>
                </table>
              </div>
              <div className="shrink-0 flex items-center justify-between px-2 py-2 border-t border-[var(--app-border-soft)] text-xs">
                <button onClick=${() => setPage(p => Math.max(1, p - 1))} disabled=${!canPrev} className="text-[var(--app-text-secondary)] disabled:opacity-40">Prev</button>
                <span>${page}/${totalPages}</span>
                <button onClick=${() => setPage(p => Math.min(totalPages, p + 1))} disabled=${!canNext} className="text-[var(--app-text-secondary)] disabled:opacity-40">Next</button>
              </div>
            `}
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-[var(--app-surface)] rounded-xl border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-4">
          ${!selectedTable ? html`
            <div className="h-full flex items-center justify-center text-[var(--app-text-muted)] min-h-[300px]">
              Click a table to open it
            </div>
          ` : detailLoading ? html`
            <div className="h-full flex items-center justify-center text-[var(--app-text-muted)] min-h-[300px]">
              Loading table...
            </div>
          ` : tableDetail ? html`
            <${TableDataView}
              tableName=${selectedTable}
              tableDetail=${tableDetail}
              writeMode=${writeMode}
              onClose=${() => setSelectedTable(null)}
            />
          ` : html`
            <div className="h-full flex items-center justify-center text-[var(--app-text-muted)] min-h-[300px]">
              Failed to load table
            </div>
          `}
        </div>
      </div>
    </div>
  `;
};

export default TableBrowser;
