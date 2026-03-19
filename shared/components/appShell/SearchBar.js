/**
 * SearchBar - Subtle search input for global navigation.
 */
import React, { useState } from 'react';
import htm from 'htm';
import { Search } from 'lucide-react';

const html = htm.bind(React.createElement);

/**
 * @param {{ placeholder?: string, className?: string, value?: string, onChange?: (v: string) => void }}
 */
const SearchBar = ({ placeholder = 'Search...', className = '', value: controlledValue, onChange }) => {
  const [internalValue, setInternalValue] = useState('');
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const handleChange = (e) => {
    const v = e.target.value;
    if (!isControlled) setInternalValue(v);
    onChange?.(v);
  };

  return html`
    <div className=${`relative w-full min-w-0 ${className}`}>
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)] pointer-events-none" aria-hidden>
        <${Search} size=${18} strokeWidth=${2} />
      </span>
      <input
        type="search"
        placeholder=${placeholder}
        value=${value}
        onChange=${handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface-subtle)] text-sm text-[var(--app-text-primary)] placeholder:text-[var(--app-text-muted)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)] focus:ring-offset-0 focus:border-[var(--app-accent)] hover:border-[var(--app-border-strong)]"
        aria-label="Search"
      />
    </div>
  `;
};

export default SearchBar;
