import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import {
  listConversations,
  getOrCreateDirect,
  getMessages,
  sendMessage,
  getUser,
  getUserProfile,
} from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';
import { SkeletonLoader, EmptyState } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const formatTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diff < 604800000) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString();
};

const MessagesInboxView = ({ user, navigate }) => {
  const toast = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [openUserId, setOpenUserId] = useState(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('messagesOpenUserId');
      if (stored) {
        setOpenUserId(stored);
        sessionStorage.removeItem('messagesOpenUserId');
      }
    } catch (_) {}
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listConversations();
      const items = res?.items || [];
      setConversations(items);
      if (openUserId && items.length === 0) {
        const convRes = await getOrCreateDirect(openUserId);
        if (convRes?.id) {
          setSelectedConvId(convRes.id);
          setConversations([{ id: convRes.id, other_user_id: openUserId, last_message: null, updated_at: new Date().toISOString() }]);
        }
        setOpenUserId(null);
      } else if (openUserId) {
        const existing = items.find((c) => c.other_user_id === openUserId);
        if (existing) {
          setSelectedConvId(existing.id);
        } else {
          const convRes = await getOrCreateDirect(openUserId);
          if (convRes?.id) {
            setSelectedConvId(convRes.id);
            setConversations((prev) => [...prev, { id: convRes.id, other_user_id: openUserId, last_message: null, updated_at: new Date().toISOString() }]);
          }
        }
        setOpenUserId(null);
      } else if (items.length > 0 && !selectedConvId) {
        setSelectedConvId(items[0].id);
      }
    } catch (e) {
      toast.error(e?.message || 'Failed to load conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [openUserId, selectedConvId, toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    setMessagesLoading(true);
    getMessages(selectedConvId)
      .then((res) => setMessages(res?.items || []))
      .catch(() => setMessages([]))
      .finally(() => setMessagesLoading(false));
  }, [selectedConvId]);

  const selectedConv = conversations.find((c) => c.id === selectedConvId);
  const otherUserId = selectedConv?.other_user_id;
  const [otherUser, setOtherUser] = useState(null);
  useEffect(() => {
    if (!otherUserId) {
      setOtherUser(null);
      return;
    }
    getUserProfile(otherUserId)
      .then((data) => setOtherUser(data?.user))
      .catch(() => getUser(otherUserId).then(setOtherUser).catch(() => setOtherUser(null)));
  }, [otherUserId]);

  const handleSend = async () => {
    if (!messageText.trim() || !selectedConvId || sending) return;
    setSending(true);
    try {
      await sendMessage(selectedConvId, messageText.trim());
      setMessageText('');
      const res = await getMessages(selectedConvId);
      setMessages(res?.items || []);
      loadConversations();
    } catch (e) {
      toast.error(e?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return html`<div className="max-w-4xl mx-auto p-6"><${SkeletonLoader} variant="listRows" lines=${6} /></div>`;
  }

  return html`
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-4 h-[calc(100vh-12rem)] min-h-[400px]">
        <div className="w-full sm:w-80 flex-shrink-0 border border-[var(--app-border-soft)] rounded-xl bg-[var(--app-surface)] overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto">
            ${conversations.length === 0
              ? html`<div className="p-4"><${EmptyState} title="No conversations" message="Start a conversation from someone's profile." icon=${html`<svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`} /></div>`
              : conversations.map((c) => {
                  const isSelected = c.id === selectedConvId;
                  return html`
                    <button
                      key=${c.id}
                      onClick=${() => setSelectedConvId(c.id)}
                      className=${`w-full text-left px-4 py-3 border-b border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)] transition-colors flex flex-col gap-0.5 ${isSelected ? 'bg-[var(--app-surface-muted)]' : ''}`}
                    >
                      <span className="font-medium text-[var(--app-text-primary)] truncate">${c.other_user_name || 'User'}</span>
                      <span className="text-xs text-[var(--app-text-muted)] truncate">${c.last_message || 'No messages yet'}</span>
                      <span className="text-xs text-[var(--app-text-muted)]">${formatTime(c.updated_at)}</span>
                    </button>
                  `;
                })}
          </div>
        </div>
        <div className="flex-1 flex flex-col border border-[var(--app-border-soft)] rounded-xl bg-[var(--app-surface)] overflow-hidden min-h-0">
          ${selectedConvId
            ? html`
                <div className="p-4 border-b border-[var(--app-border-soft)] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center font-semibold flex-shrink-0">
                    ${(otherUser?.name || otherUser?.email || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--app-text-primary)] truncate">${otherUser?.name || otherUser?.email || 'User'}</p>
                    <p className="text-xs text-[var(--app-text-muted)] truncate">${otherUser?.email || ''}</p>
                  </div>
                  ${otherUserId ? html`<button onClick=${() => navigate(`profile/${otherUserId}`)} className="text-sm text-[var(--app-accent)] hover:underline">View profile</button>` : null}
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  ${messagesLoading ? html`<div className="flex justify-center py-8"><${SkeletonLoader} variant="listRows" lines=${4} /></div>` : messages.length === 0 ? html`<p className="text-center text-[var(--app-text-muted)] py-8">No messages yet. Say hello!</p>` : messages.map((m) => html`
                    <div key=${m.id} className=${`flex ${m.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}>
                      <div className=${`max-w-[75%] px-4 py-2.5 rounded-2xl ${m.sender_id === user?.id ? 'bg-[var(--app-accent)] text-white' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-primary)]'}`}>
                        <p className="text-sm whitespace-pre-wrap break-words">${m.body}</p>
                        <p className="text-xs mt-1 opacity-75">${formatTime(m.created_at)}</p>
                      </div>
                    </div>
                  `)}
                </div>
                <div className="p-4 border-t border-[var(--app-border-soft)]">
                  <form
                    onSubmit=${(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value=${messageText}
                      onChange=${(e) => setMessageText(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface-muted)]/50 text-[var(--app-text-primary)] placeholder-[var(--app-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--app-accent)]/40"
                    />
                    <button
                      type="submit"
                      disabled=${!messageText.trim() || sending}
                      className="px-5 py-2.5 rounded-xl bg-[var(--app-accent)] text-white font-medium disabled:opacity-50"
                    >
                      ${sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              `
            : html`
                <div className="flex-1 flex items-center justify-center text-[var(--app-text-muted)]">
                  <p>Select a conversation or start one from a profile</p>
                </div>
              `}
        </div>
      </div>
    </div>
  `;
};

export default MessagesInboxView;
