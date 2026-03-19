/**
 * MessageRequestCard - Card for message request with accept/ignore/archive/block.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const MessageRequestCard = ({ request, onAccept, onIgnore, onArchive, onBlock }) => {
  const sender = request.sender || {};
  const initials = (sender.full_name || '?').slice(0, 2).toUpperCase();
  const overlap = request.overlap_context || [];
  const relLabel = {
    connection: 'Connection',
    following: 'You follow them',
    follower: 'Follows you',
    other: 'Not in your network',
  }[request.relationship_type] || request.relationship_type;

  return html`
    <div
      className="rounded-xl border p-4 mb-3"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      <div className="flex gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
          style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
        >
          ${initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>
            ${sender.full_name || 'Unknown'}
          </div>
          ${sender.headline ? html`
            <p className="text-xs mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>${sender.headline}</p>
          ` : null}
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded"
              style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
            >
              ${relLabel}
            </span>
            ${overlap.slice(0, 2).map((o) => html`
              <span
                key=${o.type}
                className="text-[10px] px-2 py-0.5 rounded"
                style=${{ background: 'var(--app-surface-hover)', color: 'var(--app-text-secondary)' }}
              >
                ${o.label}
              </span>
            `)}
          </div>
        </div>
      </div>
      ${request.preview_content ? html`
        <div
          className="mt-3 pt-3 border-t text-sm"
          style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
        >
          ${request.preview_content}
        </div>
      ` : null}
      <div className="flex flex-wrap gap-2 mt-4">
        <button
          onClick=${() => onAccept?.(request)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style=${{ background: 'var(--app-accent)', color: 'white' }}
        >
          Accept
        </button>
        <button
          onClick=${() => onIgnore?.(request)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium"
          style=${{ background: 'var(--app-surface-hover)', color: 'var(--app-text-primary)' }}
        >
          Ignore
        </button>
        <button
          onClick=${() => onArchive?.(request)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style=${{ color: 'var(--app-text-muted)' }}
        >
          Archive
        </button>
        <button
          onClick=${() => onBlock?.(request)}
          className="px-3 py-1.5 rounded-lg text-sm"
          style=${{ color: 'var(--app-danger)' }}
        >
          Block
        </button>
      </div>
    </div>
  `;
};

export default MessageRequestCard;
