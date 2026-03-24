/**
 * Full-page contextual filters: mode copy, chips, structured add-filter, scope guidance.
 */
import React from 'react';
import htm from 'htm';
import { FilterChip } from './searchResultCards.js';
import { FILTER_PRESETS } from './searchConstants.js';

const html = htm.bind(React.createElement);

const MODE_COPY = {
  all: {
    title: 'Filters in this view',
    subtitle:
      'Structured filters and chips below apply to people, posts, and communities. Channels, organizations, and institutions are matched by keywords in the main search bar only.',
    bullets: [
      'Use typed operators in the search field (e.g. company:acme) or add filters here when a scope supports them.',
      'Switch scope in the left sidebar to change which results are listed.',
    ],
  },
  people: {
    title: 'People filters',
    subtitle: 'Combine free-text search with structured fields. Operators in the main bar merge with the chips you add here.',
  },
  posts: {
    title: 'Post filters',
    subtitle: 'Posts need keywords and/or a community filter. Empty query with no community returns no results.',
  },
  communities: {
    title: 'Community filters',
    subtitle: 'Free text matches name and description. Add type or institution to narrow further.',
  },
  channels: {
    title: 'Channel search',
    subtitle:
      'This scope uses your search text only (name and description). Structured filters in this panel are not applied to channel results yet.',
    bullets: ['Try distinctive words from the channel or parent community name.'],
  },
  organizations: {
    title: 'Organizations',
    subtitle:
      'Matches listed organisation name or slug. Use at least a couple of characters. Extra JSON filters here do not change this list.',
  },
  institutions: {
    title: 'Institutions',
    subtitle:
      'Matches listed institution name or slug (two or more characters). Structured filters here do not apply to this scope.',
  },
};

function renderPanelBody({
  mode,
  operators,
  extraFilters,
  filterDraft,
  setFilterDraft,
  onRemoveOperator,
  onRemoveExtra,
  onAddStructured,
  onClearStructured,
}) {
  const meta = MODE_COPY[mode] || MODE_COPY.all;
  const presets = FILTER_PRESETS[mode] || [];
  const chipEntries = Object.entries(operators || {});
  const extraEntries = Object.entries(extraFilters || {});
  const hasChips = chipEntries.length > 0 || extraEntries.length > 0;
  const hasExtra = extraEntries.length > 0;
  const selectedPreset = presets.find((p) => p.key === filterDraft.key);

  return html`
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold" style=${{ color: 'var(--app-text-primary)' }}>${meta.title}</h2>
        <p className="text-xs mt-1 leading-relaxed" style=${{ color: 'var(--app-text-muted)' }}>${meta.subtitle}</p>
        ${meta.bullets
          ? html`
              <ul className="mt-2 text-[11px] leading-relaxed list-disc list-inside space-y-1" style=${{ color: 'var(--app-text-muted)' }}>
                ${meta.bullets.map((b, i) => html`<li key=${`b-${i}`}>${b}</li>`)}
              </ul>
            `
          : null}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style=${{ color: 'var(--app-text-muted)' }}>Active filters</p>
        ${hasChips
          ? html`
              <div className="flex flex-wrap gap-2">
                ${chipEntries.map(
                  ([k, v]) => html`
                    <${FilterChip} key=${k} label=${k} value=${v} onRemove=${() => onRemoveOperator(k)} />
                  `,
                )}
                ${extraEntries.map(
                  ([k, v]) => html`
                    <${FilterChip} key=${'x-' + k} label=${k} value=${v} onRemove=${() => onRemoveExtra(k)} />
                  `,
                )}
              </div>
            `
          : html`<p className="text-xs" style=${{ color: 'var(--app-text-faint)' }}>No active filters</p>`}
        <p className="text-[11px] mt-2 leading-relaxed" style=${{ color: 'var(--app-text-muted)' }}>
          Remove a chip to drop that constraint. Typed operators live in the main search field—edit the query to change them.
        </p>
      </div>

      ${presets.length > 0
        ? html`
            <div className="rounded-xl border p-3 space-y-3" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }}>
              <p className="text-[11px] font-semibold uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Add filter</p>
              <div className="space-y-2">
                <label className="block">
                  <span className="sr-only">Filter field</span>
                  <select
                    className="w-full text-sm rounded-lg border px-3 py-2 bg-[var(--app-surface)] text-[var(--app-text-primary)]"
                    style=${{ borderColor: 'var(--app-border-soft)' }}
                    value=${filterDraft.key}
                    onChange=${(e) => setFilterDraft((d) => ({ ...d, key: e.target.value }))}
                  >
                    <option value="">Choose field…</option>
                    ${presets.map((p) => html`<option key=${p.key} value=${p.key}>${p.label}</option>`)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium mb-1 block" style=${{ color: 'var(--app-text-secondary)' }}>Value</span>
                  <input
                    type="text"
                    className="w-full text-sm rounded-lg border px-3 py-2 bg-[var(--app-surface)] text-[var(--app-text-primary)]"
                    style=${{ borderColor: 'var(--app-border-soft)' }}
                    placeholder=${selectedPreset?.placeholder || 'Value'}
                    value=${filterDraft.value}
                    onChange=${(e) => setFilterDraft((d) => ({ ...d, value: e.target.value }))}
                    onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), onAddStructured())}
                  />
                </label>
                ${selectedPreset?.hint
                  ? html`<p className="text-[11px] leading-relaxed" style=${{ color: 'var(--app-text-muted)' }}>${selectedPreset.hint}</p>`
                  : null}
                <button
                  type="button"
                  className="w-full sm:w-auto rounded-lg px-4 py-2 text-sm font-semibold text-white ith-focus-ring"
                  style=${{ background: 'var(--app-accent)' }}
                  onClick=${onAddStructured}
                >
                  Add filter
                </button>
              </div>
            </div>
          `
        : null}

      ${hasExtra
        ? html`
            <button
              type="button"
              className="text-xs font-semibold ith-focus-ring rounded-lg px-2 py-1 border"
              style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-accent)' }}
              onClick=${onClearStructured}
            >
              Clear panel filters
            </button>
          `
        : null}

      <div className="text-[11px] leading-relaxed space-y-2 border-t pt-3" style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-muted)' }}>
        <p className="font-semibold text-[var(--app-text-secondary)]">Query operators</p>
        <p>
          <code className="text-[var(--app-text-secondary)]">company:</code>{' '}
          <code className="text-[var(--app-text-secondary)]">institution:</code>{' '}
          <code className="text-[var(--app-text-secondary)]">function:</code>{' '}
          <code className="text-[var(--app-text-secondary)]">year:</code>{' '}
          <code className="text-[var(--app-text-secondary)]">community:</code> — use quotes for multi-word values.
        </p>
        <p>
          Keyboard: <kbd className="px-1 rounded border text-[10px]">⌘K</kbd> or{' '}
          <kbd className="px-1 rounded border text-[10px]">/</kbd> opens this page from anywhere.
        </p>
      </div>
    </div>
  `;
}

/**
 * @param {{
 *   mode: string,
 *   operators: Record<string, string>,
 *   extraFilters: Record<string, string>,
 *   filterDraft: { key: string, value: string },
 *   setFilterDraft: (fn: any) => void,
 *   onRemoveOperator: (key: string) => void,
 *   onRemoveExtra: (key: string) => void,
 *   onAddStructured: () => void,
 *   onClearStructured: () => void,
 * }} props
 */
const SearchFiltersPanel = (props) => {
  const bodyProps = props;
  return html`
    <aside className="w-full lg:w-[22rem] shrink-0 space-y-4" aria-label="Search filters">
      <details className="lg:hidden rounded-xl border" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
        <summary
          className="cursor-pointer px-4 py-3 text-sm font-semibold ith-focus-ring rounded-xl marker:text-[var(--app-text-muted)]"
          style=${{ color: 'var(--app-text-primary)' }}
        >
          Filters & tips
        </summary>
        <div className="px-4 pb-4 pt-0 border-t" style=${{ borderColor: 'var(--app-border-soft)' }}>${renderPanelBody(bodyProps)}</div>
      </details>

      <div
        className="hidden lg:block rounded-xl border p-4 space-y-4"
        style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
      >
        ${renderPanelBody(bodyProps)}
      </div>
    </aside>
  `;
};

export default SearchFiltersPanel;
