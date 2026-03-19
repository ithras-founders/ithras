/**
 * ConnectionButton - Connect / Pending / Connected / Follow.
 */
import React from 'react';
import htm from 'htm';
import { sendConnectionRequest, followUser, unfollowUser } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const ConnectionButton = ({
  userId,
  connectionStatus,  // null | 'pending' | 'accepted' | 'rejected'
  isFollowing,
  followId,
  onConnectionSent,
  onConnectionAccepted,
  onFollowChange,
  disabled = false,
}) => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleConnect = async (e) => {
    e.preventDefault();
    if (loading || disabled || connectionStatus) return;
    setLoading(true);
    setError('');
    try {
      await sendConnectionRequest(userId);
      onConnectionSent?.();
    } catch (err) {
      setError(err.message || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (e) => {
    e.preventDefault();
    if (loading || disabled) return;
    setLoading(true);
    setError('');
    try {
      if (isFollowing) {
        await unfollowUser(followId);
        onFollowChange?.(false);
      } else {
        await followUser(userId);
        onFollowChange?.(true);
      }
    } catch (err) {
      setError(err.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  if (connectionStatus === 'accepted') {
    return html`
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-muted)' }}>
        Connected
      </span>
    `;
  }

  if (connectionStatus === 'pending') {
    return html`
      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium" style=${{ background: 'var(--app-surface-subtle)', color: 'var(--app-text-muted)' }}>
        Pending
      </span>
    `;
  }

  return html`
    <div>
      <button
        type="button"
        onClick=${handleConnect}
        disabled=${loading || disabled}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        style=${{ background: 'var(--app-accent)', color: 'white' }}
      >
        ${loading ? 'Sending...' : 'Connect'}
      </button>
      ${!connectionStatus ? html`
        <button
          type="button"
          onClick=${handleFollow}
          disabled=${loading || disabled}
          className="ml-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
          style=${{ borderColor: 'var(--app-border-strong)', color: 'var(--app-text-secondary)' }}
        >
          ${loading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
        </button>
      ` : null}
      ${error ? html`<p className="mt-1 text-xs" style=${{ color: 'var(--app-danger)' }}>${error}</p>` : null}
    </div>
  `;
};

export default ConnectionButton;
