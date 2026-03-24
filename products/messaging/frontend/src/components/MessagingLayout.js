/**
 * MessagingLayout - Conversation list, thread, details panel; responsive stack on small screens.
 */
import React, { useState, useEffect, useCallback } from 'react';
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

const SearchIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
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
  onSectionCountsChange,
}) => {
  const [inbox, setInbox] = useState({});
  const [requests, setRequests] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [inboxSearch, setInboxSearch] = useState('');

  const loadInbox = useCallback(() => {
    getInbox()
      .then((data) => setInbox(data || {}))
      .catch(() => setInbox({}));
  }, []);

  const loadRequests = useCallback(() => {
    getMessageRequests('pending')
      .then((res) => setRequests(res.items || []))
      .catch(() => setRequests([]));
  }, []);

  useEffect(() => {
    loadInbox();
    loadRequests();
  }, [activeSection, loadInbox, loadRequests]);

  useEffect(() => {
    const sectionCounts = {
      priority: 0,
      following: 0,
      other: 0,
      archived: 0,
      requests: requests.length,
    };
    ['priority', 'following', 'other', 'archived'].forEach((k) => {
      (inbox[k]?.items || []).forEach((c) => {
        sectionCounts[k] += c.unread_count || 0;
      });
    });
    onSectionCountsChange?.(sectionCounts);
  }, [inbox, requests, onSectionCountsChange]);

  useEffect(() => {
    if (startConversationId) {
      setActiveConversation({ id: startConversationId, title: 'New conversation' });
      onClearStartConversation?.();
    }
  }, [startConversationId, onClearStartConversation]);

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

  const handleSelectConversation = (c) => {
    setActiveConversation(c);
    setShowDetails(false);
  };

  const handleBackToList = () => {
    setActiveConversation(null);
    setShowDetails(false);
  };

  const reqEmptyIcon = html`<${RequestIcon} />`;

  const listColumnClasses = activeConversation
    ? 'hidden md:flex md:w-80 md:flex-shrink-0 md:flex-col'
    : 'flex w-full md:w-80 md:flex-shrink-0 flex-col';

  const threadColumnClasses = activeConversation
    ? 'flex flex-1 flex-col min-w-0'
    : 'hidden md:flex md:flex-1 md:flex-col md:min-w-0';

  return html`
    <div className="flex flex-1 min-h-0 overflow-hidden">
      ${activeSection === 'requests'
        ? html`
            <div className="flex-1 overflow-y-auto px-4 py-5 md:px-6" style=${{ background: 'var(--app-bg)' }}>
              <div className="max-w-2xl mx-auto">
                <h1 className="text-lg font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Message requests</h1>
                <p className="text-sm mt-1 mb-6" style=${{ color: 'var(--app-text-muted)' }}>
                  People who follow you can ask to start a conversation. Accept to open your inbox thread.
                </p>
                ${requests.length === 0
                  ? html`<${EmptyState} icon=${reqEmptyIcon} title="No message requests" description="Inbound requests from people who follow you will appear here" />`
                  : html`
                      <div className="space-y-4">
                        ${requests.map((r) => html`
                          <${MessageRequestCard}
                            key=${r.id}
                            request=${r}
                            onAccept=${(req) => handleRequestAction(req, 'accept')}
                            onIgnore=${(req) => handleRequestAction(req, 'ignore')}
                            onArchive=${(req) => handleRequestAction(req, 'archive')}
                            onBlock=${(req) => handleRequestAction(req, 'block')}
                          />
                        `)}
                      </div>
                    `}
              </div>
            </div>
          `
        : html`
            <div className="flex-1 flex min-w-0" style=${{ minWidth: 0 }}>
              <div className=${listColumnClasses}>
                <div className="flex-shrink-0 px-2 pt-2 pb-1 border-b md:border-b" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
                  <label className="sr-only" htmlFor="ithras-inbox-search">Search conversations</label>
                  <div className="flex items-center gap-2 rounded-lg border px-2 py-1.5" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)' }}>
                    <span className="flex-shrink-0 opacity-60" style=${{ color: 'var(--app-text-muted)' }}><${SearchIcon} /></span>
                    <input
                      id="ithras-inbox-search"
                      type="search"
                      placeholder="Search conversations…"
                      value=${inboxSearch}
                      onInput=${(e) => setInboxSearch(e.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                      style=${{ color: 'var(--app-text-primary)' }}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <${ConversationList}
                  conversations=${conversations}
                  activeConversationId=${activeConversation?.id}
                  activeSection=${activeSection}
                  onSelect=${handleSelectConversation}
                  filterText=${inboxSearch}
                />
              </div>
              <div className=${threadColumnClasses}>
                ${activeConversation
                  ? html`<${ConversationHeader}
                      conversation=${activeConversation}
                      onDetailsToggle=${() => setShowDetails((d) => !d)}
                      onBack=${handleBackToList}
                    />`
                  : null}
                <${MessageThread} conversationId=${activeConversation?.id} currentUserId=${currentUserId} onMessageSent=${loadInbox} />
              </div>
              ${showDetails && activeConversation
                ? html`<${ConversationDetailsPanel} conversation=${activeConversation} currentUserId=${currentUserId} onClose=${() => setShowDetails(false)} />`
                : null}
            </div>
          `}
      ${showNewMessage ? html`<${NewMessageModal} onClose=${onCloseNewMessage} onConversationStarted=${handleConversationStarted} />` : null}
    </div>
  `;
};

export default MessagingLayout;
