import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { getNotifications, getUnreadNotificationCount, markNotificationRead, markAllNotificationsRead } from '../services/api.js';
import { isDemoUser } from '../utils/demoUtils.js';

const html = htm.bind(React.createElement);

const NotificationBell = ({ user, navigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.id && !isDemoUser(user)) {
      fetchNotifications();
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(user.id, false);
      setNotifications(data.slice(0, 10)); // Show last 10 unread
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const data = await getUnreadNotificationCount(user.id);
      setUnreadCount(data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const handleNotificationClick = (notif) => {
    handleMarkRead(notif.id);
    if (notif.notification_type === 'NETWORK_ADDED' && navigate) {
      const followerId = notif.data?.follower_id;
      if (followerId) navigate(`profile/${followerId}`);
      else navigate('my-network');
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(user.id);
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return html`
    <div className="relative">
      <button
        onClick=${() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        ${unreadCount > 0 && html`
          <span className="absolute top-0 right-0 w-4 h-4 bg-[var(--app-danger)] text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
            ${unreadCount > 9 ? '9+' : unreadCount}
          </span>
        `}
      </button>

      ${isOpen && html`
        <div className="absolute right-0 top-12 w-80 bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-floating)] z-50 max-h-96 overflow-y-auto">
          <div className="p-4 border-b border-[var(--app-border-soft)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--app-text-primary)]">Notifications</h3>
            ${notifications.length > 0 && html`
              <button
                onClick=${handleMarkAllRead}
                className="text-xs text-[var(--app-accent)] font-bold hover:text-[var(--app-accent-hover)]"
              >
                Mark all read
              </button>
            `}
          </div>
          
          ${loading ? html`
            <div className="p-8 text-center text-[var(--app-text-muted)]">Loading...</div>
          ` : notifications.length === 0 ? html`
            <div className="p-8 text-center text-[var(--app-text-muted)]">No new notifications</div>
          ` : html`
            <div className="divide-y divide-[var(--app-border-soft)]">
              ${notifications.map(notif => html`
                <div
                  key=${notif.id}
                  className="p-4 hover:bg-[var(--app-surface-muted)] cursor-pointer"
                  onClick=${() => handleNotificationClick(notif)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[var(--app-accent)] rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[var(--app-text-primary)] mb-1">${notif.title}</p>
                      <p className="text-xs text-[var(--app-text-secondary)] line-clamp-2">${notif.message}</p>
                      <p className="text-[10px] text-[var(--app-text-muted)] mt-2">
                        ${new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              `)}
            </div>
          `}
        </div>
      `}
    </div>
  `;
};

export default NotificationBell;
