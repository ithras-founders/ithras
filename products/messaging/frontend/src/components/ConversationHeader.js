/**
 * ConversationHeader - Header for active conversation with context.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const MoreIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>
`;

const ConversationHeader = ({ conversation, onDetailsToggle }) => {
  const title = conversation?.title || 'Conversation';
  const context = (conversation?.relationship_context || [])[0];

  return html`
    <div
      className="flex items-center justify-between px-4 py-3 border-b"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold truncate" style=${{ color: 'var(--app-text-primary)' }}>
          ${title}
        </h2>
        ${context ? html`
          <p className="text-xs truncate mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>
            ${context.label || context.type}
          </p>
        ` : null}
      </div>
      <button
        onClick=${onDetailsToggle}
        className="p-2 rounded-lg transition-colors"
        style=${{ color: 'var(--app-text-muted)' }}
        aria-label="Conversation details"
      >
        <${MoreIcon} />
      </button>
    </div>
  `;
};

export default ConversationHeader;
