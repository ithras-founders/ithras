/**
 * Autocomplete input: progressive suggestions from a list, supports free text.
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const AutocompleteInput = ({
  value,
  onChange,
  suggestions = [],
  onSuggestionsFetch,
  placeholder,
  disabled = false,
  label,
  renderSuggestion,
  debounceMs = 200,
  minChars = 0,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState(value ?? '');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localSuggestions, setLocalSuggestions] = useState(suggestions);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  useEffect(() => {
    setLocalSuggestions(suggestions);
  }, [suggestions]);

  const fetchSuggestions = useCallback(
    (q) => {
      if (!onSuggestionsFetch || (minChars > 0 && (!q || q.length < minChars))) {
        setLocalSuggestions([]);
        return;
      }
      setLoading(true);
      onSuggestionsFetch(q)
        .then((result) => {
          const list = Array.isArray(result) ? result : result?.suggestions ?? result?.items ?? [];
          setLocalSuggestions(list);
        })
        .catch(() => setLocalSuggestions([]))
        .finally(() => setLoading(false));
    },
    [onSuggestionsFetch, minChars]
  );

  const handleInputChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    onChange?.(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (onSuggestionsFetch) {
      timeoutRef.current = setTimeout(() => fetchSuggestions(v), debounceMs);
      setShowDropdown(true);
    } else if (suggestions.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleSelect = (item) => {
    const display = typeof item === 'string' ? item : item?.name ?? item?.title ?? item?.label ?? String(item);
    setInputValue(display);
    onChange?.(display, item);
    setShowDropdown(false);
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const filtered =
    !onSuggestionsFetch && inputValue
      ? localSuggestions.filter((s) => {
          const str = typeof s === 'string' ? s : s?.name ?? s?.title ?? s?.label ?? '';
          return str.toLowerCase().includes((inputValue || '').toLowerCase());
        })
      : localSuggestions;

  const defaultRender = (item) => {
    const str = typeof item === 'string' ? item : item?.name ?? item?.title ?? item?.label ?? String(item);
    return str;
  };

  return html`
    <div ref=${containerRef} className="relative">
      ${label ? html`<label className="block text-sm font-medium text-gray-700 mb-1">${label}</label>` : null}
      <input
        type="text"
        value=${inputValue}
        onChange=${handleInputChange}
        onFocus=${() => setShowDropdown(true)}
        onBlur=${handleBlur}
        placeholder=${placeholder}
        disabled=${disabled}
        className=${`w-full px-4 py-2 border border-gray-300 rounded-lg ${className}`.trim()}
      />
      ${showDropdown && (filtered.length > 0 || loading) ? html`
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          ${loading ? html`<div className="px-4 py-3 text-sm text-gray-500">Loading...</div>` : null}
          ${!loading && filtered.map((item, i) => html`
            <button
              key=${i}
              type="button"
              className="block w-full text-left px-4 py-2 hover:bg-gray-50"
              onMouseDown=${(e) => { e.preventDefault(); handleSelect(item); }}
            >
              ${renderSuggestion ? renderSuggestion(item) : defaultRender(item)}
            </button>
          `)}
        </div>
      ` : null}
    </div>
  `;
};

export default AutocompleteInput;
