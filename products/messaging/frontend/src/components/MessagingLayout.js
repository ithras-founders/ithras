/**
 * MessagingLayout - 3-column: conversation list, thread, details panel.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import ConversationList from './ConversationList.js';
import MessageThread from './MessageThread.js';
import ConversationHeader from './ConversationHeader.js';
import ConversationDetailsPanel from './ConversationDetailsPanel.js';
import MessageRequestCard from './MessageRequestCard.js';
import NewMessageModal from './NewMessageModal.js';
import EmptyState from './EmptyState.js';
import {
  getInbox,
  getMessageRequests,
  messageRequestAction,
} from '../services/messagingApi.js';

const html = htm.bind(React.createElement);

const RequestIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/>
    <line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
`;

const MessagingLayout = ({
  currentUserId,
  activeSection,
  showNewMessage,
  onCloseNewMessage,
  onConversationStarted,
  startConversationId,
  onClearStartConversation,
  onRequestAccepted,
}) => {
  const [inbox, setInbox] = useState({});
  const [requests, setRequests] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const loadInbox = () => {
    getInbox()
      .then((data) => setInbox(data || {}))
      .catch(() => setInbox({}));
  };

  const loadRequests = () => {
    getMessageRequests('pending')
      .then((res) => setRequests(res.items || []))
      .catch(() => setRequests([]));
  };

  useEffect(() => {
    loadInbox();
    loadRequests();
  }, [activeSection]);

  useEffect(() => {
    if (startConversationId) {
      setActiveConversation({ id: startConversationId, title: 'New conversation' });
      onClearStartConversation?.();
    }
  }, [startConversationId]);

  const conversations = activeSection === 'requests' ? [] : (inbox[activeSection]?.items || []);

  const handleRequestAction = async (req, action) => {
    try {
      const res = await messageRequestAction(req.id, action);
      loadRequests();
      loadInbox();
      if (action === 'accept' && res.conversation_id) {
        const conv = { id: res.conversation_id, title: 'New conversation' };
        setActiveConversation(conv);
        onRequestAccepted?.();
      }
    } catch (e) {
      console.error('Request action failed:', e);
    }
  };

  const handleConversationStarted = (convId) => {
    loadInbox();
    onConversationStarted?.(convId);
  };

  const sectionCounts = { priority: 0, requests: requests.length };
  (inbox.priority?.items || []).forEach((c) => { sectionCounts.priority += c.unread_count || 0; });

  const reqEmptyIcon = html`<${RequestIcon} />`;

  return html`
    <div className="flex flex-1 min-h-0 overflow-hidden">
      ${activeSection === 'requests' ? html`
        <div className="flex-1 overflow-y-auto p-6" style=${{ background: 'var(--app-bg)' }}>
          ${requests.length === 0 ? html`
            <${EmptyState} icon=${reqEmptyIcon} title="No message requests" description="Inbound requests from people who follow you will appear here" />
          ` : requests.map((r) => html`
            <${MessageRequestCard} key=${r.id} request=${r} onAccept=${(req) => handleRequestAction(req, 'accept')} onIgnore=${(req) => handleRequestAction(req, 'ignore')} onArchive=${(req) => handleRequestAction(req, 'archive')} onBlock=${(req) => handleRequestAction(req, 'block')} />
          `)}
        </div>
      ` : html`
        <div className="flex-1 flex min-w-0" style=${{ minWidth: 0 }}>
          <div className="w-80 flex-shrink-0 flex flex-col">
            <${ConversationList} conversations=${conversations} activeConversationId=${activeConversation?.id} activeSection=${activeSection} onSelect=${setActiveConversation} />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            ${activeConversation ? html`<${ConversationHeader} conversation=${activeConversation} onDetailsToggle=${() => setShowDetails((d) => !d)} />` : null}
            <${MessageThread} conversationId=${activeConversation?.id} currentUserId=${currentUserId} onMessageSent=${loadInbox} />
          </div>
          ${showDetails && activeConversation ? html`<${ConversationDetailsPanel} conversation=${activeConversation} currentUserId=${currentUserId} onClose=${() => setShowDetails(false)} />` : null}
        </div>
      `}
      ${showNewMessage ? html`<${NewMessageModal} onClose=${onCloseNewMessage} onConversationStarted=${handleConversationStarted} />` : null}
    </div>
  `;
};

export default MessagingLayout;
