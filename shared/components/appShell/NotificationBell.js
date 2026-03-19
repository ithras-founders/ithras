/**
 * NotificationBell - Shows unread count and links to connection invitations.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const BellIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
`;

const NotificationBell = () => {
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = () => {
    import('/products/network/frontend/src/services/networkApi.js')
      .then(({ getNotifications }) => getNotifications())
      .then((r) => setUnreadCount(r?.unread_count ?? 0))
      .catch(() => setUnreadCount(0));
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 60000);
    const handler = () => fetchCount();
    window.addEventListener('ithras:path-changed', handler);
    window.addEventListener('ithras:notifications-changed', handler);
    return () => {
      clearInterval(interval);
      window.removeEventListener('ithras:path-changed', handler);
      window.removeEventListener('ithras:notifications-changed', handler);
    };
  }, []);

  const handleClick = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/network/connections?tab=invitations');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <a
      href="/network/connections?tab=invitations"
      onClick=${handleClick}
      className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-lg min-w-[56px] transition-colors hover:bg-[var(--app-surface-hover)]"
      style=${{ color: 'var(--app-text-secondary)' }}
      title="Notifications"
    >
      <span className="flex-shrink-0 relative">
        <${BellIcon} />
        ${unreadCount > 0 ? html`
          <span
            className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold"
            style=${{ background: 'var(--app-accent)', color: 'white' }}
          >
            ${unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ` : null}
      </span>
      <span className="text-xs font-medium">Notifications</span>
    </a>
  `;
};

export default NotificationBell;
