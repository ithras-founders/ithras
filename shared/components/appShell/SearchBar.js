/**
 * SearchBar - Global top search with progressive suggestions (debounced /v1/search/suggest).
 */
import React, { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import htm from 'htm';
import { Search } from 'lucide-react';
import { searchSuggest } from '/shared/services/searchApi.js';

const html = htm.bind(React.createElement);

const KIND_LABEL = {
  person: 'Person',
  community: 'Community',
  institution: 'Institution',
  organization: 'Organization',
};

const debounceMs = 240;

/**
 * @param {{
 *   placeholder?: string,
 *   className?: string,
 *   value?: string,
 *   onChange?: (v: string) => void,
 *   onSubmit?: (value: string) => void,
 *   inputRef?: import('react').MutableRefObject<HTMLInputElement | null>,
 *   suggestEnabled?: boolean,
 *   onNavigateHref?: (href: string) => void,
 * }}
 */
const SearchBar = ({
  placeholder = 'Search...',
  className = '',
  value: controlledValue,
  onChange,
  onSubmit,
  inputRef: externalRef,
  suggestEnabled = false,
  onNavigateHref,
}) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const [suggestions, setSuggestions] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const wrapRef = useRef(null);
  const portalDropdownRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const internalInputRef = useRef(null);
  const inputRef = externalRef || internalInputRef;

  const [anchorRect, setAnchorRect] = useState(null);

  const syncAnchor = useCallback(() => {
    const el = wrapRef.current;
    if (!el) {
      setAnchorRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setAnchorRect({ top: r.bottom + 4, left: r.left, width: r.width });
  }, []);

  const runSuggest = useCallback(
    (q) => {
      if (!suggestEnabled || !onNavigateHref || q.length < 1) {
        setSuggestions([]);
        setSuggestOpen(false);
        setSuggestLoading(false);
        return;
      }
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setSuggestLoading(true);
      searchSuggest({ q, limit: 10, signal: abortRef.current.signal })
        .then((r) => {
          const items = r?.suggestions || [];
          setSuggestions(items);
          setSuggestOpen(true);
          setHighlight(-1);
        })
        .catch(() => {
          setSuggestions([]);
          setSuggestOpen(true);
        })
        .finally(() => setSuggestLoading(false));
    },
    [suggestEnabled, onNavigateHref],
  );

  useEffect(() => {
    if (!suggestEnabled || !onNavigateHref) return undefined;
    const q = (value || '').trim();
    if (q.length < 1) {
      setSuggestions([]);
      setSuggestOpen(false);
      setSuggestLoading(false);
      return undefined;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSuggest(q), debounceMs);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, suggestEnabled, onNavigateHref, runSuggest]);

  const dropdownVisible = suggestEnabled && (suggestOpen || suggestLoading);

  useLayoutEffect(() => {
    if (!dropdownVisible) {
      setAnchorRect(null);
      return undefined;
    }
    syncAnchor();
    const el = wrapRef.current;
    const ro = el ? new ResizeObserver(() => syncAnchor()) : null;
    if (el && ro) ro.observe(el);
    const onWin = () => syncAnchor();
    window.addEventListener('resize', onWin);
    window.addEventListener('scroll', onWin, true);
    return () => {
      if (ro && el) ro.unobserve(el);
      ro?.disconnect();
      window.removeEventListener('resize', onWin);
      window.removeEventListener('scroll', onWin, true);
    };
  }, [dropdownVisible, syncAnchor, value, suggestions.length]);

  useEffect(() => {
    if (!suggestEnabled) return undefined;
    const onDocDown = (e) => {
      const t = e.target;
      if (wrapRef.current?.contains(t) || portalDropdownRef.current?.contains(t)) return;
      setSuggestOpen(false);
      setHighlight(-1);
    };
    document.addEventListener('mousedown', onDocDown);
    return () => document.removeEventListener('mousedown', onDocDown);
  }, [suggestEnabled]);

  const handleChange = (e) => {
    const v = e.target.value;
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
  };

  const pickSuggestion = useCallback(
    (item) => {
      if (!item?.href || !onNavigateHref) return;
      onNavigateHref(item.href);
      setSuggestOpen(false);
      setHighlight(-1);
      setSuggestions([]);
    },
    [onNavigateHref],
  );

  const handleKeyDown = (e) => {
    const list = suggestions;
    const open = suggestOpen && list.length > 0;

    if (open) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((i) => (i < list.length - 1 ? i + 1 : i));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((i) => (i > 0 ? i - 1 : -1));
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestOpen(false);
        setHighlight(-1);
        return;
      }
      if (e.key === 'Enter' && highlight >= 0 && list[highlight]) {
        e.preventDefault();
        pickSuggestion(list[highlight]);
        return;
      }
    }

    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      setSuggestOpen(false);
      onSubmit(value || '');
    }
  };

  const listboxId = 'ithras-topsearch-suggest-list';

  const suggestPanel =
    dropdownVisible && anchorRect
      ? html`
          <div
            ref=${portalDropdownRef}
            id=${listboxId}
            role="listbox"
            className="max-h-72 overflow-y-auto rounded-lg border shadow-lg py-1"
            style=${{
              position: 'fixed',
              top: anchorRect.top,
              left: anchorRect.left,
              width: anchorRect.width,
              zIndex: 10050,
              borderColor: 'var(--app-border-soft)',
              background: 'var(--app-surface)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
            }}
          >
            ${suggestLoading && suggestions.length === 0
              ? html`<div className="px-3 py-2.5 text-xs" style=${{ color: 'var(--app-text-muted)' }}>Searching…</div>`
              : null}
            ${suggestions.map(
              (item, idx) => html`
                <div
                  key=${`${item.kind}-${item.id}-${idx}`}
                  id=${`${listboxId}-opt-${idx}`}
                  role="option"
                  aria-selected=${highlight === idx}
                  className=${`px-3 py-2 cursor-pointer text-left flex flex-col gap-0.5 border-b border-[var(--app-border-soft)] last:border-0 ${highlight === idx ? 'bg-[var(--app-accent-soft)]' : 'hover:bg-[var(--app-surface-hover)]'}`}
                  onMouseDown=${(e) => e.preventDefault()}
                  onMouseEnter=${() => setHighlight(idx)}
                  onClick=${() => pickSuggestion(item)}
                >
                  <span className="text-sm font-medium truncate" style=${{ color: 'var(--app-text-primary)' }}>${item.label || '—'}</span>
                  <span className="text-xs truncate" style=${{ color: 'var(--app-text-muted)' }}>
                    ${item.subtitle || KIND_LABEL[item.kind] || item.kind || ''}
                  </span>
                </div>
              `,
            )}
            ${!suggestLoading && suggestions.length === 0 && (value || '').trim().length > 0
              ? html`<div className="px-3 py-2.5 text-xs" style=${{ color: 'var(--app-text-muted)' }}>No quick matches — press Enter for full search</div>`
              : null}
          </div>
        `
      : null;

  return html`
    <div className=${`w-full min-w-0 ${className}`}>
      <div ref=${wrapRef} className="relative w-full min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)] pointer-events-none z-[1]" aria-hidden>
          <${Search} size=${18} strokeWidth=${2} />
        </span>
        <input
          ref=${inputRef}
          type="search"
          role=${suggestEnabled ? 'combobox' : undefined}
          aria-autocomplete=${suggestEnabled ? 'list' : undefined}
          aria-expanded=${suggestEnabled ? suggestOpen : undefined}
          aria-controls=${suggestEnabled ? listboxId : undefined}
          aria-activedescendant=${suggestEnabled && highlight >= 0 ? `${listboxId}-opt-${highlight}` : undefined}
          placeholder=${placeholder}
          value=${value}
          onChange=${handleChange}
          onKeyDown=${handleKeyDown}
          onFocus=${() => {
            if (suggestEnabled && suggestions.length > 0) setSuggestOpen(true);
          }}
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface-subtle)] text-sm text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-0 focus:border-[var(--app-accent)] hover:border-[var(--app-border-strong)]"
          aria-label="Search"
        />
      </div>
      ${typeof document !== 'undefined' && suggestPanel ? createPortal(suggestPanel, document.body) : null}
    </div>
  `;
};

export default SearchBar;
