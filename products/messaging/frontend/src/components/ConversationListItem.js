/**
 * ConversationListItem - Row for conversation list with relationship context.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const REL_BADGES = {
  connection: { label: 'Connection', color: 'var(--app-success-soft)', text: 'var(--app-success)' },
  following: { label: 'You follow', color: 'var(--app-accent-soft)', text: 'var(--app-accent)' },
  follower: { label: 'Follows you', color: 'var(--app-warning-soft)', text: 'var(--app-warning)' },
  other: { label: '', color: '', text: '' },
};

const ConversationListItem = ({ conversation, isActive, onClick }) => {
  const rel = conversation.relationship_type || 'other';
  const badge = REL_BADGES[rel];
  const preview = (conversation.last_message_preview || '').replace(/\n/g, ' ').slice(0, 50);
  const initials = (conversation.title || '?').slice(0, 2).toUpperCase();

  return html`
    <button
      onClick=${onClick}
      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b"
      style=${{
        background: isActive ? 'var(--app-surface-hover)' : 'transparent',
        borderColor: 'var(--app-border-soft)',
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
        style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
      >
        ${initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-medium truncate" style=${{ color: 'var(--app-text-primary)' }}>
            ${conversation.title || 'Unknown'}
          </span>
          ${badge && badge.label ? html`
            <span
              className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
              style=${{ background: badge.color, color: badge.text }}
            >
              ${badge.label}
            </span>
          ` : null}
        </div>
        ${preview ? html`
          <p className="text-sm truncate" style=${{ color: 'var(--app-text-muted)' }}>
            ${preview}${(conversation.last_message_preview || '').length > 50 ? '...' : ''}
          </p>
        ` : null}
      </div>
      <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
        ${conversation.last_message_at ? html`
          <span className="text-xs" style=${{ color: 'var(--app-text-faint)' }}>
            ${formatTime(conversation.last_message_at)}
          </span>
        ` : null}
        ${(conversation.unread_count || 0) > 0 ? html`
          <span
            className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-semibold px-1"
            style=${{ background: 'var(--app-accent)', color: 'white' }}
          >
            ${conversation.unread_count > 99 ? '99+' : conversation.unread_count}
          </span>
        ` : null}
      </div>
    </button>
  `;
};

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 604800000) {
    return d.toLocaleDateString([], { weekday: 'short' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default ConversationListItem;
