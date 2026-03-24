/**
 * Full-page advanced search: scope in AppShell sidebar, center results, right filters panel.
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import htm from 'htm';
import {
  LayoutGrid,
  Users,
  MessageSquare,
  Layers,
  Hash,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import { AppShell } from '/shared/components/appShell/index.js';
import { unifiedSearch } from '/shared/services/searchApi.js';
import { removeOperatorFromQuery } from './searchQueryUtils.js';
import { SEARCH_MODE_TABS } from './searchConstants.js';
import { navigateToSearchResult } from './searchResultCards.js';
import { useUnifiedSearch } from './useUnifiedSearch.js';
import SearchFiltersPanel from './SearchFiltersPanel.js';
import SearchResultsContent from './SearchResultsContent.js';
import SearchErrorCallout from './SearchErrorCallout.js';

const html = htm.bind(React.createElement);

const MODE_TO_BUCKET = {
  people: 'people',
  posts: 'posts',
  communities: 'communities',
  channels: 'channels',
  organizations: 'organizations',
  institutions: 'institutions',
};

const SEARCH_SCOPE_ICONS = {
  all: LayoutGrid,
  people: Users,
  posts: MessageSquare,
  communities: Layers,
  channels: Hash,
  organizations: Briefcase,
  institutions: GraduationCap,
};

function buildSearchHref(q, modeId) {
  const sp = new URLSearchParams();
  if (q.trim()) sp.set('q', q.trim());
  if (modeId && modeId !== 'all') sp.set('mode', modeId);
  const qs = sp.toString();
  return `/search${qs ? `?${qs}` : ''}`;
}

function readUrlParams() {
  const sp = new URLSearchParams(window.location.search || '');
  return { q: sp.get('q') || '', mode: sp.get('mode') || 'all' };
}

/**
 * @param {{ user: object, onLogout: () => void }}
 */
const SearchPage = ({ user, onLogout }) => {
  const initial = useRef(readUrlParams());
  const {
    query,
    setQuery,
    mode,
    setMode,
    loading,
    data,
    errorFormatted,
    extraFilters,
    setExtraFilters,
    filterDraft,
    setFilterDraft,
    operators,
    mergedFilters,
  } = useUnifiedSearch({
    active: true,
    limitAll: 8,
    limitSingle: 24,
    offset: 0,
    debounceMs: 320,
    initialQuery: initial.current.q,
    initialMode: initial.current.mode,
  });

  const searchNavItems = useMemo(
    () =>
      SEARCH_MODE_TABS.map((tab) => ({
        key: tab.id,
        label: tab.label,
        icon: SEARCH_SCOPE_ICONS[tab.id] || LayoutGrid,
        href: buildSearchHref(query, tab.id),
      })),
    [query],
  );

  const [appendByMode, setAppendByMode] = useState({});
  const [moreLoading, setMoreLoading] = useState(false);

  useEffect(() => {
    setAppendByMode({});
  }, [query, mode, JSON.stringify(mergedFilters)]);

  useEffect(() => {
    const sync = () => {
      const { q, mode: m } = readUrlParams();
      setQuery(q);
      setMode(m && SEARCH_MODE_TABS.some((t) => t.id === m) ? m : 'all');
    };
    window.addEventListener('popstate', sync);
    window.addEventListener('ithras:path-changed', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('ithras:path-changed', sync);
    };
  }, [setQuery, setMode]);

  useEffect(() => {
    if ((window.location.pathname || '') !== '/search') return;
    const sp = new URLSearchParams();
    if (query.trim()) sp.set('q', query.trim());
    if (mode && mode !== 'all') sp.set('mode', mode);
    const next = sp.toString() ? `?${sp.toString()}` : '';
    const cur = window.location.search || '';
    if (cur === next || (cur === '' && next === '')) return;
    window.history.replaceState(null, '', `/search${next}`);
  }, [query, mode]);

  const dataWithAppend = useMemo(() => {
    if (!data || mode === 'all') return data;
    const bucket = MODE_TO_BUCKET[mode];
    if (!bucket) return data;
    const extra = appendByMode[mode] || [];
    if (!extra.length) return data;
    const base = data[bucket];
    if (!base) return data;
    return {
      ...data,
      [bucket]: {
        ...base,
        items: [...(base.items || []), ...extra],
      },
    };
  }, [data, mode, appendByMode]);

  const bucket = MODE_TO_BUCKET[mode];
  const total = bucket && data?.[bucket] != null ? data[bucket].total ?? 0 : 0;
  const shown = bucket ? (dataWithAppend?.[bucket]?.items || []).length : 0;
  const canLoadMore = mode !== 'all' && bucket && total > shown && !loading;

  const loadMore = useCallback(async () => {
    if (!bucket || mode === 'all' || moreLoading) return;
    const offset = shown;
    setMoreLoading(true);
    try {
      const r = await unifiedSearch({
        q: query,
        mode,
        limit: 24,
        offset,
        filters: Object.keys(mergedFilters).length ? mergedFilters : undefined,
      });
      const newItems = (r[bucket]?.items || []).filter(Boolean);
      if (newItems.length) {
        setAppendByMode((p) => ({ ...p, [mode]: [...(p[mode] || []), ...newItems] }));
      }
    } catch (_) {
      /* quiet */
    } finally {
      setMoreLoading(false);
    }
  }, [bucket, mode, moreLoading, query, mergedFilters, shown]);

  const onRemoveChip = (key) => {
    setQuery(removeOperatorFromQuery(query, key));
  };

  const addStructuredFilter = () => {
    if (!filterDraft.key || !filterDraft.value.trim()) return;
    setExtraFilters((prev) => ({ ...prev, [filterDraft.key]: filterDraft.value.trim() }));
    setFilterDraft({ key: '', value: '' });
  };

  const removeExtraFilter = (k) => {
    setExtraFilters((prev) => {
      const n = { ...prev };
      delete n[k];
      return n;
    });
  };

  const onNavigate = (href) => navigateToSearchResult(href, {});

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      activeTab=${mode}
      navItems=${searchNavItems}
      sidebarNavSectionTitle="Search scope"
      showSettings=${true}
      searchPlaceholder="Search…"
    >
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 pb-10">
        <h1 className="text-2xl font-semibold tracking-tight mb-1" style=${{ color: 'var(--app-text-primary)' }}>Search</h1>
        <p className="text-sm mb-6" style=${{ color: 'var(--app-text-muted)' }}>
          Search across the platform. Choose a scope in the left sidebar, type keywords or operators in the field below, and refine with the filter panel when available.
        </p>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
          <div className="flex-1 min-w-0 space-y-3 w-full">
            <${SearchErrorCallout} formatted=${errorFormatted} />
            <input
              type="search"
              value=${query}
              onChange=${(e) => setQuery(e.target.value)}
              placeholder="Type keywords, names, or operators…"
              className="w-full rounded-xl border px-4 py-3 text-base outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
              style=${{
                borderColor: 'var(--app-border-soft)',
                background: 'var(--app-surface)',
                color: 'var(--app-text-primary)',
              }}
              aria-label="Search query"
            />
            <${SearchResultsContent}
              data=${dataWithAppend}
              mode=${mode}
              loading=${loading}
              query=${query}
              mergedFilters=${mergedFilters}
              onNavigate=${onNavigate}
              onModeChange=${setMode}
              showIdleHint=${true}
              variant="page"
            />
            ${canLoadMore
              ? html`
                  <div className="flex justify-center pt-2">
                    <button
                      type="button"
                      disabled=${moreLoading}
                      onClick=${loadMore}
                      className="rounded-full px-5 py-2 text-sm font-medium border ith-focus-ring disabled:opacity-50"
                      style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
                    >
                      ${moreLoading ? 'Loading…' : 'Load more'}
                    </button>
                  </div>
                `
              : null}
          </div>

          <${SearchFiltersPanel}
            mode=${mode}
            operators=${operators}
            extraFilters=${extraFilters}
            filterDraft=${filterDraft}
            setFilterDraft=${setFilterDraft}
            onRemoveOperator=${onRemoveChip}
            onRemoveExtra=${removeExtraFilter}
            onAddStructured=${addStructuredFilter}
            onClearStructured=${() => setExtraFilters({})}
          />
        </div>
      </div>
    </${AppShell}>
  `;
};

export default SearchPage;
