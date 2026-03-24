/**
 * ConversationHeader - Header for active conversation with context.
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ChevronLeftIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
`;

const InfoIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
`;

const MoreIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
`;

const ConversationHeader = ({ conversation, onDetailsToggle, onBack }) => {
  const title = conversation?.title || 'Conversation';
  const context = (conversation?.relationship_context || [])[0];
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const openDetails = () => {
    setMenuOpen(false);
    onDetailsToggle?.();
  };

  return html`
    <div
      className="flex items-center gap-2 px-3 md:px-4 py-3 border-b"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      ${onBack
        ? html`
            <button
              type="button"
              onClick=${onBack}
              className="md:hidden flex-shrink-0 p-2 rounded-lg transition-colors ith-focus-ring"
              style=${{ color: 'var(--app-text-secondary)' }}
              aria-label="Back to conversations"
            >
              <${ChevronLeftIcon} />
            </button>
          `
        : null}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate text-sm md:text-base" style=${{ color: 'var(--app-text-primary)' }}>
          ${title}
        </h2>
        ${context ? html`
          <p className="text-xs truncate mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>
            ${context.label || context.type}
          </p>
        ` : null}
      </div>
      <div className="relative flex items-center gap-0.5 flex-shrink-0" ref=${menuRef}>
        <button
          type="button"
          onClick=${() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg transition-colors ith-focus-ring"
          style=${{ color: 'var(--app-text-muted)' }}
          aria-label="More actions"
          aria-haspopup="true"
          aria-expanded=${menuOpen}
        >
          <${MoreIcon} />
        </button>
        ${menuOpen ? html`
          <div
            className="absolute right-0 top-full z-30 mt-1 min-w-[11rem] rounded-xl border py-1 shadow-lg"
            style=${{
              borderColor: 'var(--app-border-soft)',
              background: 'var(--app-surface)',
              boxShadow: 'var(--app-shadow-floating)',
            }}
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick=${openDetails}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--app-surface-hover)] ith-focus-ring"
              style=${{ color: 'var(--app-text-primary)' }}
            >
              <${InfoIcon} />
              Conversation details
            </button>
            <button type="button" role="menuitem" disabled className="w-full px-3 py-2 text-left text-sm opacity-45 cursor-not-allowed" title="Coming soon">
              Mute notifications
            </button>
            <button type="button" role="menuitem" disabled className="w-full px-3 py-2 text-left text-sm opacity-45 cursor-not-allowed" title="Coming soon">
              Archive
            </button>
            <button type="button" role="menuitem" disabled className="w-full px-3 py-2 text-left text-sm opacity-45 cursor-not-allowed" title="Coming soon">
              Mark unread
            </button>
          </div>
        ` : null}
        <button
          type="button"
          onClick=${onDetailsToggle}
          className="hidden sm:flex p-2 rounded-lg transition-colors ith-focus-ring"
          style=${{ color: 'var(--app-text-muted)' }}
          aria-label="Conversation details"
          title="Details"
        >
          <${InfoIcon} />
        </button>
      </div>
    </div>
  `;
};

export default ConversationHeader;
