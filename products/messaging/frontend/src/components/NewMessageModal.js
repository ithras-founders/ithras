/**
 * NewMessageModal - Start new conversation: search user, select, show context.
 */
import React, { useState } from 'react';
import htm from 'htm';
import { searchUsers, createConversation, createMessageRequest } from '../services/messagingApi.js';

const html = htm.bind(React.createElement);

const SearchIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
`;

const NewMessageModal = ({ onClose, onConversationStarted }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await searchUsers(query.trim());
      setResults(res.items || []);
    } catch (e) {
      setError(e.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (user) => {
    setSelected(user);
    setMessageText('');
  };

  const handleStart = async () => {
    if (!selected) return;
    setSending(true);
    setError(null);
    try {
      const rel = selected.relationship_type;
      if (rel === 'connection' || rel === 'following' || rel === 'follower') {
        const { id } = await createConversation([selected.id]);
        onConversationStarted?.(id);
        onClose?.();
      } else {
        await createMessageRequest(selected.id, messageText.trim() || 'Hi');
        setError('Message request sent. They will need to accept to start the conversation.');
        setTimeout(() => {
          onClose?.();
        }, 1500);
      }
    } catch (e) {
      setError(e.message || 'Failed to start conversation');
    } finally {
      setSending(false);
    }
  };

  return html`
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style=${{ background: 'rgba(0,0,0,0.4)' }}
      onClick=${(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div
        className="w-full max-w-md rounded-xl shadow-lg flex flex-col max-h-[85vh]"
        style=${{ background: 'var(--app-surface)' }}
        onClick=${(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b" style=${{ borderColor: 'var(--app-border-soft)' }}>
          <h2 className="text-lg font-semibold" style=${{ color: 'var(--app-text-primary)' }}>New message</h2>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          ${!selected ? html`
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value=${query}
                onInput=${(e) => setQuery(e.target.value)}
                onKeyDown=${(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by name or email"
                className="flex-1 rounded-lg px-3 py-2 text-sm border"
                style=${{ borderColor: 'var(--app-border-soft)' }}
              />
              <button
                onClick=${handleSearch}
                disabled=${loading || !query.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style=${{ background: 'var(--app-accent)', color: 'white' }}
              >
                Search
              </button>
            </div>
            ${error ? html`<p className="text-sm mb-4" style=${{ color: 'var(--app-danger)' }}>${error}</p>` : null}
            ${results.length === 0 && !loading ? html`
              <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>
                ${query ? 'No users found' : 'Search for someone to message'}
              </p>
            ` : null}
            ${results.length > 0 ? html`
              <div className="space-y-1">
                ${results.map((u) => html`
                  <button
                    key=${u.id}
                    onClick=${() => handleSelect(u)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                    style=${{ background: 'var(--app-surface-hover)' }}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                      style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                    >
                      ${(u.full_name || '?').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>${u.full_name}</div>
                      ${(u.overlap_context || [])[0] ? html`
                        <div className="text-xs" style=${{ color: 'var(--app-text-muted)' }}>
                          ${u.overlap_context[0].label}
                        </div>
                      ` : null}
                    </div>
                  </button>
                `)}
              </div>
            ` : null}
          ` : html`
            <div className="mb-4">
              <button
                onClick=${() => setSelected(null)}
                className="text-sm" style=${{ color: 'var(--app-accent)' }}
              >
                ← Back to search
              </button>
              <div className="flex items-center gap-3 mt-3 p-3 rounded-lg" style=${{ background: 'var(--app-surface-hover)' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium"
                  style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
                >
                  ${(selected.full_name || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>${selected.full_name}</div>
                  <div className="text-xs" style=${{ color: 'var(--app-text-muted)' }}>
                    ${selected.relationship_type === 'other' ? 'Not in your network — add a message to send a request' : 'In your network — start chatting'}
                  </div>
                </div>
              </div>
              ${selected.relationship_type === 'other' ? html`
                <textarea
                  value=${messageText}
                  onInput=${(e) => setMessageText(e.target.value)}
                  placeholder="Introduce yourself..."
                  className="w-full mt-3 rounded-lg px-3 py-2 text-sm border resize-none"
                  rows=${3}
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                />
              ` : null}
            </div>
            ${error ? html`<p className="text-sm mb-4" style=${{ color: 'var(--app-danger)' }}>${error}</p>` : null}
            <button
              onClick=${handleStart}
              disabled=${sending || (selected.relationship_type === 'other' && !messageText.trim())}
              className="w-full py-2.5 rounded-lg font-medium"
              style=${{ background: 'var(--app-accent)', color: 'white' }}
            >
              ${sending ? 'Starting...' : 'Start conversation'}
            </button>
          `}
        </div>
      </div>
    </div>
  `;
};

export default NewMessageModal;
