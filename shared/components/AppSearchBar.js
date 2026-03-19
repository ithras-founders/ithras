import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const SearchIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
  </svg>
`;

const AppSearchBar = ({ placeholder = 'Search...', value = '', onChange }) => html`
  <div className="relative flex-shrink-0 mb-4">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]">
      <${SearchIcon} />
    </span>
    <input
      type="search"
      placeholder=${placeholder}
      value=${value}
      onChange=${(e) => onChange?.(e.target.value)}
      className="w-full max-w-md pl-10 pr-4 py-2 rounded-lg border border-[var(--app-border-soft)] bg-[var(--app-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]"
    />
  </div>
`;

export default AppSearchBar;
