/**
 * Renders unified search results (all mode + single-entity modes).
 */
import React from 'react';
import htm from 'htm';
import { Users, Hash, MessageSquare, Building2, Layers, Landmark } from 'lucide-react';
import {
  PersonCard,
  CommunityCard,
  PostCard,
  EntityRow,
  InstitutionEntityRow,
  Section,
  SkeletonBlock,
} from './searchResultCards.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   data: object | null,
 *   mode: string,
 *   loading: boolean,
 *   query: string,
 *   mergedFilters: Record<string, string>,
 *   onNavigate: (href: string) => void,
 *   onModeChange: (m: string) => void,
 *   showIdleHint?: boolean,
 *   variant?: 'modal' | 'page',
 * }} props
 */
const SearchResultsContent = ({
  data,
  mode,
  loading,
  query,
  mergedFilters,
  onNavigate,
  onModeChange,
  showIdleHint = true,
  variant = 'modal',
}) => {
  const chipKeys = Object.keys(mergedFilters || {});
  const hasQueryOrFilters = query.trim().length > 0 || chipKeys.length > 0;

  const renderAll = () => {
    if (!data) return null;
    const ppl = data.people?.items || [];
    const comm = data.communities?.items || [];
    const posts = data.posts?.items || [];
    const ch = data.channels?.items || [];
    const orgs = data.organizations?.items || [];
    const inst = data.institutions?.items || [];

    return html`
      <div className="search-results-all">
        ${ppl.length
          ? html`<${Section} key="search-section-people" title="People" icon=${Users} total=${data.people?.total} showViewAll=${(data.people?.total || 0) > ppl.length} onViewAll=${() => onModeChange('people')}>
              ${ppl.map((item, i) => html`<${PersonCard} key=${item.id ?? item.href ?? `p-${i}`} item=${item} onNavigate=${onNavigate} />`)}
            </${Section}>`
          : null}
        ${comm.length
          ? html`<${Section} key="search-section-communities" title="Communities" icon=${Hash} total=${data.communities?.total} showViewAll=${(data.communities?.total || 0) > comm.length} onViewAll=${() => onModeChange('communities')}>
              ${comm.map((item, i) => html`<${CommunityCard} key=${item.id ?? item.slug ?? `c-${i}`} item=${item} onNavigate=${onNavigate} />`)}
            </${Section}>`
          : null}
        ${posts.length
          ? html`<${Section} key="search-section-posts" title="Posts" icon=${MessageSquare} total=${data.posts?.total} showViewAll=${(data.posts?.total || 0) > posts.length} onViewAll=${() => onModeChange('posts')}>
              ${posts.map((item, i) => html`<${PostCard} key=${item.id ?? `post-${i}`} item=${item} onNavigate=${onNavigate} />`)}
            </${Section}>`
          : null}
        ${ch.length
          ? html`<${Section} key="search-section-channels" title="Channels" icon=${Layers} total=${data.channels?.total} showViewAll=${(data.channels?.total || 0) > ch.length} onViewAll=${() => onModeChange('channels')}>
              ${ch.map((item, i) => html`<${EntityRow} key=${item.id ?? item.href ?? `ch-${i}`} item=${item} subtitle=${item.community_name || ''} onNavigate=${onNavigate} />`)}
            </${Section}>`
          : null}
        ${orgs.length
          ? html`<${Section} key="search-section-orgs" title="Organizations" icon=${Building2} total=${data.organizations?.total}>
              ${orgs.map((item, i) => html`<${EntityRow} key=${item.id ?? item.href ?? `o-${i}`} item=${item} subtitle="Organization" onNavigate=${onNavigate} />`)}
            </${Section}>`
          : null}
        ${inst.length
          ? html`<${Section} key="search-section-institutions" title="Institutions" icon=${Landmark} total=${data.institutions?.total}>
              ${inst.map((item, i) => html`<${InstitutionEntityRow} key=${item.id ?? item.href ?? `i-${i}`} item=${item} subtitle="Institution" onNavigate=${onNavigate} />`)}
            </${Section}>`
          : null}
      </div>
    `;
  };

  const renderSingle = () => {
    if (!data) return null;
    if (mode === 'people') {
      const items = data.people?.items || [];
      return items.length
        ? items.map((item) => html`<${PersonCard} key=${item.id} item=${item} onNavigate=${onNavigate} />`)
        : html`<p className="text-sm text-[var(--app-text-muted)] text-center py-8">No people match your search.</p>`;
    }
    if (mode === 'communities') {
      const items = data.communities?.items || [];
      return items.length
        ? items.map((item) => html`<${CommunityCard} key=${item.id} item=${item} onNavigate=${onNavigate} />`)
        : html`<p className="text-sm text-[var(--app-text-muted)] text-center py-8">No communities found.</p>`;
    }
    if (mode === 'posts') {
      const items = data.posts?.items || [];
      return items.length
        ? items.map((item) => html`<${PostCard} key=${item.id} item=${item} onNavigate=${onNavigate} />`)
        : html`<p className="text-sm text-[var(--app-text-muted)] text-center py-8">No posts found.</p>`;
    }
    if (mode === 'channels') {
      const items = data.channels?.items || [];
      return items.length
        ? items.map((item) => html`<${EntityRow} key=${item.id} item=${item} subtitle=${item.community_name || ''} onNavigate=${onNavigate} />`)
        : html`<p className="text-sm text-[var(--app-text-muted)] text-center py-8">No channels found.</p>`;
    }
    if (mode === 'organizations') {
      const items = data.organizations?.items || [];
      return items.length
        ? items.map((item) => html`<${EntityRow} key=${item.id} item=${item} subtitle="Organization" onNavigate=${onNavigate} />`)
        : html`<p className="text-sm text-[var(--app-text-muted)] text-center py-8">No organizations found.</p>`;
    }
    if (mode === 'institutions') {
      const items = data.institutions?.items || [];
      return items.length
        ? items.map((item) => html`<${InstitutionEntityRow} key=${item.id} item=${item} subtitle="Institution" onNavigate=${onNavigate} />`)
        : html`<p className="text-sm text-[var(--app-text-muted)] text-center py-8">No institutions found.</p>`;
    }
    return null;
  };

  const hasResults =
    data &&
    (mode !== 'all'
      ? true
      : ['people', 'communities', 'posts', 'channels', 'organizations', 'institutions'].some(
          (k) => (data[k]?.items || []).length > 0,
        ));

  const emptyAll = data && mode === 'all' && !hasResults && !loading && hasQueryOrFilters;

  const idlePadding = variant === 'page' ? 'py-16' : 'py-10';

  return html`
    <div className=${variant === 'page' ? 'min-h-[200px]' : ''}>
      ${loading && !data ? html`<${SkeletonBlock} />` : null}
      ${showIdleHint && !hasQueryOrFilters && !loading
        ? html`
            <div
              className=${`text-center ${idlePadding} px-4 rounded-[var(--app-radius-card)] border border-dashed mb-4 relative overflow-hidden`}
              style=${{
                borderColor: 'var(--app-border-soft)',
                background: 'var(--app-surface-subtle)',
              }}
            >
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style=${{
                  background: 'radial-gradient(ellipse 80% 60% at 50% 0%, var(--app-accent-soft), transparent 55%)',
                }}
              />
              <div className="relative">
                <p className="text-sm font-semibold text-[var(--app-text-primary)] tracking-tight">Discovery search</p>
                <p className="text-xs text-[var(--app-text-muted)] mt-2 max-w-md mx-auto leading-relaxed">
                  Type free text to find people, posts, and communities. Add filters on the right or use operators in the
                  query (e.g. <code className="text-[var(--app-accent)] font-medium">company:acme institution:iim</code>).
                </p>
              </div>
            </div>
          `
        : null}
      ${emptyAll
        ? html`
            <div className="text-center py-12 px-4">
              <p className="text-[var(--app-text-primary)] font-medium">No results for “${query}”</p>
              ${chipKeys.length
                ? html`<p className="text-sm text-[var(--app-text-muted)] mt-2">Try removing filters or switch scope in the sidebar.</p>`
                : html`<p className="text-sm text-[var(--app-text-muted)] mt-2">Try another keyword or use filters.</p>`}
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <button
                  type="button"
                  className="text-sm px-3 py-1.5 rounded-lg border"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                  onClick=${() => onModeChange('communities')}
                >
                  Search communities
                </button>
                <button
                  type="button"
                  className="text-sm px-3 py-1.5 rounded-lg border"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                  onClick=${() => onModeChange('posts')}
                >
                  Search posts
                </button>
              </div>
            </div>
          `
        : null}
      ${mode === 'all' && data && !loading ? renderAll() : null}
      ${mode !== 'all' && data && !loading ? html`<div className="space-y-2">${renderSingle()}</div>` : null}
    </div>
  `;
};

export default SearchResultsContent;
