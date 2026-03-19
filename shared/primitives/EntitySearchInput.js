/**
 * Entity search input: institution or organisation search with logo + name in dropdown.
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const EntitySearchInput = ({
  value,
  onChange,
  onSelect,
  searchFn,
  placeholder = 'Search or type name',
  disabled = false,
  label,
  entityType = 'institution',
}) => {
  const [inputValue, setInputValue] = useState(value ?? '');
  const [entities, setEntities] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setInputValue(value ?? '');
  }, [value]);

  const doSearch = (q) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!q || q.length < 2) {
      setEntities([]);
      return;
    }
    timeoutRef.current = setTimeout(() => {
      setLoading(true);
      searchFn(q)
        .then((res) => {
          const list = res?.institutions ?? res?.organisations ?? [];
          setEntities(list);
        })
        .catch(() => setEntities([]))
        .finally(() => setLoading(false));
    }, 200);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setInputValue(v);
    onChange?.(v);
    onSelect?.(null);
    doSearch(v);
    setShowDropdown(true);
  };

  const handleSelect = (entity) => {
    setInputValue(entity.name);
    onChange?.(entity.name);
    onSelect?.(entity);
    setShowDropdown(false);
  };

  const getInitials = (name) =>
    (name || '?')
      .split(/\s+/)
      .map((s) => s[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

  return html`
    <div className="relative">
      ${label ? html`<label className="block text-sm font-medium text-gray-700 mb-1">${label}</label>` : null}
      <input
        type="text"
        value=${inputValue}
        onChange=${handleChange}
        onFocus=${() => setShowDropdown(true)}
        onBlur=${() => setTimeout(() => setShowDropdown(false), 200)}
        placeholder=${placeholder}
        disabled=${disabled}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
      />
      ${showDropdown && (entities.length > 0 || loading) ? html`
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          ${loading ? html`<div className="px-4 py-3 text-sm text-gray-500">Loading...</div>` : null}
          ${!loading && entities.map((entity) => html`
            <button
              key=${entity.id}
              type="button"
              className="flex items-center gap-3 w-full text-left px-4 py-2 hover:bg-gray-50"
              onMouseDown=${(e) => { e.preventDefault(); handleSelect(entity); }}
            >
              ${entity.logo_url
                ? html`<img src=${entity.logo_url} alt="" className="h-8 w-8 rounded object-cover flex-shrink-0" />`
                : html`
                  <div
                    className="h-8 w-8 rounded flex items-center justify-center flex-shrink-0 text-xs font-medium"
                    style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-muted)' }}
                  >
                    ${getInitials(entity.name)}
                  </div>
                `}
              <span>${entity.name}</span>
            </button>
          `)}
        </div>
      ` : null}
    </div>
  `;
};

export default EntitySearchInput;
