/**
 * Active filter chips + preset key/value editor (overlay strip or page panel).
 */
import React from 'react';
import htm from 'htm';
import { FilterChip } from './searchResultCards.js';
import { FILTER_PRESETS } from './searchConstants.js';

const html = htm.bind(React.createElement);

/**
 * @param {{
 *   operators: Record<string, string>,
 *   extraFilters: Record<string, string>,
 *   mode: string,
 *   filterDraft: { key: string, value: string },
 *   setFilterDraft: (fn: any) => void,
 *   onRemoveOperator: (key: string) => void,
 *   onRemoveExtra: (key: string) => void,
 *   onAddStructured: () => void,
 *   className?: string,
 * }} props
 */
const SearchFiltersBar = ({
  operators,
  extraFilters,
  mode,
  filterDraft,
  setFilterDraft,
  onRemoveOperator,
  onRemoveExtra,
  onAddStructured,
  className = '',
}) => {
  const chipEntries = Object.entries(operators || {});
  const presets = FILTER_PRESETS[mode] || [];

  return html`
    <div
      className=${`flex flex-wrap gap-2 items-center border-b min-h-[44px] py-2 px-3 ${className}`}
      style=${{ borderColor: 'var(--app-border-soft)' }}
    >
      ${chipEntries.map(
        ([k, v]) => html`
          <${FilterChip} key=${k} label=${k} value=${v} onRemove=${() => onRemoveOperator(k)} />
        `,
      )}
      ${Object.entries(extraFilters || {}).map(
        ([k, v]) => html`
          <${FilterChip} key=${'x-' + k} label=${k} value=${v} onRemove=${() => onRemoveExtra(k)} />
        `,
      )}
      ${presets.length
        ? html`
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <select
                className="text-xs rounded-lg border px-2 py-1 bg-[var(--app-surface-subtle)] text-[var(--app-text-primary)]"
                value=${filterDraft.key}
                onChange=${(e) => setFilterDraft((d) => ({ ...d, key: e.target.value }))}
              >
                <option value="">Add filter…</option>
                ${presets.map((p) => html`<option key=${p.key} value=${p.key}>${p.label}</option>`)}
              </select>
              <input
                type="text"
                className="text-xs rounded-lg border px-2 py-1 w-36 bg-[var(--app-surface)] text-[var(--app-text-primary)]"
                placeholder=${presets.find((x) => x.key === filterDraft.key)?.placeholder || 'Value'}
                value=${filterDraft.value}
                onChange=${(e) => setFilterDraft((d) => ({ ...d, value: e.target.value }))}
                onKeyDown=${(e) => e.key === 'Enter' && (e.preventDefault(), onAddStructured())}
              />
              <button type="button" className="text-xs font-medium text-[var(--app-accent)]" onClick=${onAddStructured}>
                Add
              </button>
            </div>
          `
        : null}
    </div>
  `;
};

export default SearchFiltersBar;
