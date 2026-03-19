/**
 * MessageThread - Conversation view with messages and composer.
 */
import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import MessageBubble from './MessageBubble.js';
import MessageComposer from './MessageComposer.js';
import EmptyState from './EmptyState.js';
import { getConversation, sendMessage } from '../services/messagingApi.js';

const html = htm.bind(React.createElement);

const ThreadIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
`;

const MessageThread = ({ conversationId, currentUserId, onMessageSent }) => {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    getConversation(conversationId)
      .then(setConversation)
      .catch((e) => {
        setError(e.message || 'Failed to load conversation');
        setConversation(null);
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    if (scrollRef.current && conversation?.messages?.length) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages]);

  const handleSend = async (content) => {
    if (!conversationId || !content?.trim()) return;
    try {
      await sendMessage(conversationId, content);
      const updated = await getConversation(conversationId);
      setConversation(updated);
      onMessageSent?.();
    } catch (e) {
      setError(e.message || 'Failed to send');
    }
  };

  if (!conversationId) {
    return html`
      <div className="flex flex-col flex-1 items-center justify-center" style=${{ background: 'var(--app-bg)' }}>
        <${EmptyState}
          icon=${html`<${ThreadIcon} />`}
          title="No conversation selected"
          description="Select a conversation from the list or start a new message"
        />
      </div>
    `;
  }

  if (loading) {
    return html`
      <div className="flex flex-1 items-center justify-center" style=${{ background: 'var(--app-bg)' }}>
        <div className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>Loading...</div>
      </div>
    `;
  }

  if (error) {
    return html`
      <div className="flex flex-1 flex-col items-center justify-center p-6" style=${{ background: 'var(--app-bg)' }}>
        <p className="text-sm mb-4" style=${{ color: 'var(--app-danger)' }}>${error}</p>
      </div>
    `;
  }

  const messages = conversation.messages || [];
  const otherParticipant = (conversation.participants || []).find((p) => p.id !== currentUserId);

  return html`
    <div className="flex flex-col flex-1 min-h-0" style=${{ background: 'var(--app-bg)' }}>
      <div
        ref=${scrollRef}
        className="flex-1 overflow-y-auto p-4"
      >
        ${messages.length === 0 ? html`
          <${EmptyState}
            icon=${html`<${ThreadIcon} />`}
            title="No messages yet"
            description=${otherParticipant ? `Start the conversation with ${otherParticipant.full_name}` : 'Send your first message'}
          />
        ` : messages.map((m) => html`
          <${MessageBubble}
            key=${m.id}
            message=${m}
            isOwn=${m.sender_id === currentUserId}
          />
        `)}
      </div>
      <${MessageComposer} onSend=${handleSend} disabled=${false} />
    </div>
  `;
};

export default MessageThread;
