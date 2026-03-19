/**
 * MessageBubble - Single message with rich text, status, edited indicator.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const MessageBubble = ({ message, isOwn }) => {
  const content = message.content || '';
  const lines = content.split('\n');
  const rendered = lines.map((line, i) => {
    if (!line.trim()) return html`<br key=${i} />`;
    return html`<p key=${i} className="mb-1 last:mb-0">${line}</p>`;
  });

  return html`
    <div
      className="flex ${isOwn ? 'justify-end' : 'justify-start'} mb-3"
    >
      <div
        className="max-w-[75%] rounded-lg px-4 py-2.5"
        style=${{
          background: isOwn ? 'var(--app-accent)' : 'var(--app-surface-hover)',
          color: isOwn ? 'white' : 'var(--app-text-primary)',
        }}
      >
        ${!isOwn && message.sender ? html`
          <div className="text-xs font-medium mb-1 opacity-80">
            ${message.sender.full_name || 'Unknown'}
          </div>
        ` : null}
        <div className="text-sm whitespace-pre-wrap break-words">${rendered}</div>
        <div className="flex items-center gap-2 mt-1">
          ${message.is_edited ? html`
            <span className="text-[10px] opacity-70">(edited)</span>
          ` : null}
          <span className="text-[10px] opacity-70">
            ${formatMessageTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  `;
};

function formatMessageTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default MessageBubble;
