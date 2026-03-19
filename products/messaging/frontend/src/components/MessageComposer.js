/**
 * MessageComposer - Rich text composer with toolbar, send.
 */
import React, { useState, useRef } from 'react';
import htm from 'htm';
import RichTextToolbar from './RichTextToolbar.js';

const html = htm.bind(React.createElement);

const SendIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
`;

const MessageComposer = ({ onSend, disabled, placeholder = 'Write a message...' }) => {
  const [value, setValue] = useState('');
  const textRef = useRef(null);

  const canSend = !disabled && (value || '').trim().length > 0;

  const handleFormat = (format) => {
    const el = textRef.current;
    if (!el) return;
    el.focus();
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    const wrappers = {
      bold: ['**', '**'],
      italic: ['_', '_'],
      code: ['`', '`'],
      list: ['\n- ', ''],
      quote: ['\n> ', ''],
    };
    const [pre, post] = wrappers[format] || ['', ''];
    setValue(before + pre + selected + post + after);
    setTimeout(() => {
      el.selectionStart = el.selectionEnd = start + pre.length + selected.length;
    }, 0);
  };

  const handleSend = () => {
    const text = (value || '').trim();
    if (!text || !onSend) return;
    onSend(text);
    setValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return html`
    <div
      className="flex flex-col border-t"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      <${RichTextToolbar} onFormat=${handleFormat} disabled=${disabled} />
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref=${textRef}
          value=${value}
          onInput=${(e) => setValue(e.target.value)}
          onKeyDown=${handleKeyDown}
          placeholder=${placeholder}
          disabled=${disabled}
          rows=${2}
          className="flex-1 resize-none rounded-lg px-3 py-2.5 text-sm border focus:outline-none focus:ring-2"
          style=${{
            borderColor: 'var(--app-border-soft)',
            background: 'var(--app-bg)',
            color: 'var(--app-text-primary)',
            minHeight: '44px',
          }}
        />
        <button
          onClick=${handleSend}
          disabled=${!canSend}
          className="flex-shrink-0 p-2.5 rounded-lg transition-colors disabled:opacity-40"
          style=${{
            background: canSend ? 'var(--app-accent)' : 'var(--app-surface-hover)',
            color: canSend ? 'white' : 'var(--app-text-muted)',
          }}
          aria-label="Send message"
        >
          <${SendIcon} />
        </button>
      </div>
    </div>
  `;
};

export default MessageComposer;
