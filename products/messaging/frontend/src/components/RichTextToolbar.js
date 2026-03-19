/**
 * RichTextToolbar - Formatting toolbar for message composer.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const BoldIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
    <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
  </svg>
`;

const ItalicIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="4" x2="10" y2="4"/>
    <line x1="14" y1="20" x2="5" y2="20"/>
    <line x1="15" y1="4" x2="9" y2="20"/>
  </svg>
`;

const CodeIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
`;

const ListIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="8" y1="6" x2="21" y2="6"/>
    <line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/>
    <line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
`;

const QuoteIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21c3 0 7-4 7-10V5"/>
    <path d="M15 21c3 0 7-4 7-10V5"/>
  </svg>
`;

const RichTextToolbar = ({ onFormat, disabled }) => {
  const btn = (icon, format, title) => html`
    <button
      type="button"
      onClick=${() => onFormat?.(format)}
      disabled=${disabled}
      className="p-1.5 rounded transition-colors disabled:opacity-40"
      style=${{ color: 'var(--app-text-muted)' }}
      title=${title}
      aria-label=${title}
    >
      <${icon} />
    </button>
  `;

  return html`
    <div className="flex items-center gap-0.5 py-1 px-2 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
      ${btn(BoldIcon, 'bold', 'Bold')}
      ${btn(ItalicIcon, 'italic', 'Italic')}
      ${btn(CodeIcon, 'code', 'Inline code')}
      ${btn(ListIcon, 'list', 'List')}
      ${btn(QuoteIcon, 'quote', 'Quote')}
    </div>
  `;
};

export default RichTextToolbar;
