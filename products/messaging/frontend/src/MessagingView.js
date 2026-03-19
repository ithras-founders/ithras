/**
 * MessagingView - Main entry: AppShell + MessagingLayout.
 */
import React, { useState } from 'react';
import htm from 'htm';
import { AppShell } from '/shared/components/appShell/index.js';
import MessagingLayout from './components/MessagingLayout.js';
import InboxSidebar from './components/InboxSidebar.js';

const html = htm.bind(React.createElement);

const MessagingView = ({ user, onLogout }) => {
  const [activeSection, setActiveSection] = useState('priority');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [startConversationId, setStartConversationId] = useState(null);
  const currentUserId = user?.user_numerical || user?.id;

  const handleConversationStarted = (convId) => {
    setStartConversationId(convId);
    setShowNewMessage(false);
    setActiveSection('priority');
  };

  const sidebarContent = html`
    <${InboxSidebar}
      activeSection=${activeSection}
      onSectionChange=${setActiveSection}
      onCompose=${() => setShowNewMessage(true)}
    />
  `;

  return html`
    <${AppShell}
      user=${user}
      onLogout=${onLogout}
      navItems=${[]}
      showSettings=${true}
      sidebarContent=${sidebarContent}
    >
      <${MessagingLayout}
        currentUserId=${currentUserId}
        activeSection=${activeSection}
        showNewMessage=${showNewMessage}
        onCloseNewMessage=${() => setShowNewMessage(false)}
        onConversationStarted=${handleConversationStarted}
        startConversationId=${startConversationId}
        onClearStartConversation=${() => setStartConversationId(null)}
        onRequestAccepted=${() => setActiveSection('priority')}
      />
    </${AppShell}>
  `;
};

export default MessagingView;
