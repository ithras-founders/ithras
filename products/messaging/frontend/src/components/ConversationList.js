/**
 * ConversationList - Middle column: list of conversations.
 */
import React from 'react';
import htm from 'htm';
import ConversationListItem from './ConversationListItem.js';
import EmptyState from './EmptyState.js';

const html = htm.bind(React.createElement);

const ConvListIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
`;

const EMPTY_MESSAGES = {
  priority: { title: 'No priority messages', description: 'Messages from your connections will appear here' },
  following: { title: 'No messages from following', description: 'Messages from people you follow will appear here' },
  requests: { title: 'No message requests', description: 'Inbound requests from followers will appear here' },
  other: { title: 'No other messages', description: 'Other messages will appear here' },
  archived: { title: 'No archived conversations', description: 'Archived conversations will appear here' },
};

const filterConversations = (list, q) => {
  const needle = (q || '').trim().toLowerCase();
  if (!needle) return list || [];
  return (list || []).filter((c) => {
    const title = (c.title || '').toLowerCase();
    const preview = (c.last_message_preview || '').toLowerCase();
    return title.includes(needle) || preview.includes(needle);
  });
};

const ConversationList = ({ conversations = [], activeConversationId, activeSection, onSelect, filterText = '' }) => {
  const empty = EMPTY_MESSAGES[activeSection] || EMPTY_MESSAGES.other;
  const filtered = filterConversations(conversations, filterText);
  const baseEmpty = !conversations || conversations.length === 0;
  const filterEmpty = !baseEmpty && filtered.length === 0;

  if (baseEmpty) {
    return html`
      <div className="flex flex-col h-full" style=${{ background: 'var(--app-surface)' }}>
        <div className="flex-1 overflow-auto">
          <${EmptyState}
            icon=${html`<${ConvListIcon} />`}
            title=${empty.title}
            description=${empty.description}
          />
        </div>
      </div>
    `;
  }

  if (filterEmpty) {
    return html`
      <div className="flex flex-col h-full overflow-y-auto" style=${{ background: 'var(--app-surface)', borderRight: '1px solid var(--app-border-soft)' }}>
        <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
          <p className="text-sm font-medium" style=${{ color: 'var(--app-text-primary)' }}>No matches</p>
          <p className="text-xs mt-1 max-w-[14rem]" style=${{ color: 'var(--app-text-muted)' }}>
            Try another name or keyword. Search runs on loaded conversations only.
          </p>
        </div>
      </div>
    `;
  }

  return html`
    <div
      className="flex flex-col h-full overflow-y-auto"
      style=${{ background: 'var(--app-surface)', borderRight: '1px solid var(--app-border-soft)' }}
    >
      ${filtered.map((c) => html`
        <${ConversationListItem}
          key=${c.id}
          conversation=${c}
          isActive=${activeConversationId === c.id}
          onClick=${() => onSelect(c)}
        />
      `)}
    </div>
  `;
};

export default ConversationList;
