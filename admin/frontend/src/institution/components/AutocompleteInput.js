/**
 * Input with suggestions from DB or predefined list.
 */
import React, { useState, useRef, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const AutocompleteInput = ({
  value = '',
  onChange,
  suggestions = [],
  onSearch,
  placeholder = 'Type to search...',
  minChars = 0,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState([]);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (suggestions.length > 0) {
      setLocalSuggestions(suggestions);
    }
  }, [suggestions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (listRef.current && !listRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const v = e.target.value;
    onChange(v);
    if (v.length >= minChars && onSearch) {
      setLoading(true);
      onSearch(v)
        .then((res) => {
          setLocalSuggestions(Array.isArray(res) ? res : res?.items ?? []);
          setOpen(true);
          setHighlightIndex(-1);
        })
        .catch(() => setLocalSuggestions([]))
        .finally(() => setLoading(false));
    } else if (v.length < minChars) {
      setLocalSuggestions([]);
      setOpen(false);
    } else if (suggestions.length > 0) {
      const filtered = suggestions.filter((s) => (typeof s === 'string' ? s : s?.name || s).toLowerCase().includes(v.toLowerCase()));
      setLocalSuggestions(filtered);
      setOpen(filtered.length > 0);
      setHighlightIndex(-1);
    }
  };

  const pick = (item) => {
    const val = typeof item === 'string' ? item : item?.name ?? item;
    onChange(val);
    setOpen(false);
    setHighlightIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!open || localSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i < localSuggestions.length - 1 ? i + 1 : i));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i > 0 ? i - 1 : -1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      pick(localSuggestions[highlightIndex]);
    }
  };

  const displaySuggestions = localSuggestions.slice(0, 10);

  return html`
    <div className="relative">
      <input
        ref=${inputRef}
        type="text"
        value=${value}
        onChange=${handleInputChange}
        onFocus=${() => displaySuggestions.length > 0 && setOpen(true)}
        onKeyDown=${handleKeyDown}
        placeholder=${placeholder}
        className="w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white"
        style=${{ color: 'var(--app-text-primary)' }}
      />
      ${open && (displaySuggestions.length > 0 || loading) && html`
        <ul
          ref=${listRef}
          className="absolute z-50 mt-1 w-full rounded-xl border border-[var(--app-border-soft)] overflow-hidden py-1"
          style=${{ background: 'white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          ${loading ? html`
            <li className="px-4 py-2 text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</li>
          ` : displaySuggestions.map((s, i) => {
            const label = typeof s === 'string' ? s : s?.name ?? String(s);
            const isHighlighted = i === highlightIndex;
            return html`
              <li key=${i}>
                <button
                  type="button"
                  onClick=${() => pick(s)}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[var(--app-surface-hover)] transition-colors"
                  style=${{
                    background: isHighlighted ? 'var(--app-surface-hover)' : 'transparent',
                    color: 'var(--app-text-primary)',
                  }}
                >
                  ${label}
                </button>
              </li>
            `;
          })}
        </ul>
      `}
    </div>
  `;
};

export default AutocompleteInput;
