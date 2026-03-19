/**
 * ConnectionsPage - Accepted connections and pending invitations (with Accept/Reject).
 */
import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import { getConnections, getPendingConnections, acceptConnection, rejectConnection } from '../services/networkApi.js';
import { markAllNotificationsRead } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const getTab = () => (new URLSearchParams(window.location.search || '')).get('tab') || 'connections';

const ConnectionsPage = () => {
  const [tab, setTab] = useState(getTab());
  const [items, setItems] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const loadConnections = useCallback(() => {
    setLoading(true);
    getConnections()
      .then((r) => setItems(r.items || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const loadPending = useCallback(() => {
    setPendingLoading(true);
    getPendingConnections()
      .then((r) => setPending(r.items || []))
      .catch(() => setPending([]))
      .finally(() => setPendingLoading(false));
  }, []);

  useEffect(() => {
    const handler = () => setTab(getTab());
    window.addEventListener('popstate', handler);
    window.addEventListener('ithras:path-changed', handler);
    return () => {
      window.removeEventListener('popstate', handler);
      window.removeEventListener('ithras:path-changed', handler);
    };
  }, []);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  useEffect(() => {
    if (tab === 'invitations' && pending.length > 0) {
      markAllNotificationsRead().catch(() => {});
      window.dispatchEvent(new CustomEvent('ithras:notifications-changed'));
    }
  }, [tab, pending.length]);

  const goToSuggestions = () => {
    window.history.pushState(null, '', '/network/suggestions');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  const switchTab = (t) => {
    setTab(t);
    const url = t === 'invitations' ? '/network/connections?tab=invitations' : '/network/connections';
    window.history.pushState(null, '', url);
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  const handleAccept = async (connId) => {
    setAcceptingId(connId);
    try {
      await acceptConnection(connId);
      loadPending();
      loadConnections();
      window.dispatchEvent(new CustomEvent('ithras:notifications-changed'));
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (connId) => {
    setAcceptingId(connId);
    try {
      await rejectConnection(connId);
      loadPending();
      window.dispatchEvent(new CustomEvent('ithras:notifications-changed'));
    } finally {
      setAcceptingId(null);
    }
  };

  const showInvitations = tab === 'invitations';

  if (showInvitations) {
    const pendingLoadingState = pendingLoading;
    const pendingEmpty = pending.length === 0 && !pendingLoadingState;

    return html`
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick=${() => switchTab('connections')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style=${{ background: 'transparent', color: 'var(--app-text-secondary)' }}
          >
            Connections
          </button>
          <button
            onClick=${() => switchTab('invitations')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
          >
            Invitations
            ${pending.length > 0 ? html`<span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium bg-[var(--app-accent)] text-white">${pending.length}</span>` : null}
          </button>
        </div>
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Connection requests</h1>
        ${pendingLoadingState ? html`
          <div className="space-y-4">
            ${[1, 2].map((i) => html`<div key=${i} className="h-24 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />`)}
          </div>
        ` : pendingEmpty ? html`
          <${EmptyState}
            title="No pending requests"
            description="When someone sends you a connection request, it will appear here."
            ctaLabel="Find connections"
            onCta=${goToSuggestions}
          />
        ` : html`
          <div className="space-y-4">
            ${pending.map((p) => html`
              <${UserCard}
                key=${p.id}
                user=${p.requester}
                actions=${html`
                  <div className="flex gap-2">
                    <button
                      onClick=${() => handleAccept(p.id)}
                      disabled=${acceptingId === p.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                      style=${{ background: 'var(--app-accent)' }}
                    >
                      ${acceptingId === p.id ? 'Accepting...' : 'Accept'}
                    </button>
                    <button
                      onClick=${() => handleReject(p.id)}
                      disabled=${acceptingId === p.id}
                      className="px-4 py-2 rounded-lg text-sm font-medium border"
                      style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}
                    >
                      Reject
                    </button>
                  </div>
                `}
              />
            `)}
          </div>
        `}
      </div>
    `;
  }

  if (loading) {
    return html`
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}>Connections</button>
          <button className="px-4 py-2 rounded-lg text-sm font-medium" style=${{ background: 'transparent', color: 'var(--app-text-secondary)' }}>Invitations</button>
        </div>
        <div className="h-8 w-48 rounded bg-[var(--app-surface-subtle)] animate-pulse" />
        <div className="mt-6 space-y-4">
          ${[1, 2, 3].map((i) => html`<div key=${i} className="h-24 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />`)}
        </div>
      </div>
    `;
  }

  if (items.length === 0) {
    return html`
      <div className="p-8">
        <div className="flex gap-2 mb-6">
          <button
            onClick=${() => switchTab('connections')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
          >
            Connections
          </button>
          <button
            onClick=${() => switchTab('invitations')}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style=${{ background: 'transparent', color: 'var(--app-text-secondary)' }}
          >
            Invitations
          </button>
        </div>
        <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Connections</h1>
        <${EmptyState}
          title="No connections yet"
          description="Build your network by connecting with colleagues and alumni."
          ctaLabel="Find connections"
          onCta=${goToSuggestions}
        />
      </div>
    `;
  }

  return html`
    <div className="p-8">
      <div className="flex gap-2 mb-6">
        <button
          onClick=${() => switchTab('connections')}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
        >
          Connections
        </button>
        <button
          onClick=${() => switchTab('invitations')}
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style=${{ background: 'transparent', color: 'var(--app-text-secondary)' }}
        >
          Invitations
          ${pending.length > 0 ? html`<span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">${pending.length}</span>` : null}
        </button>
      </div>
      <h1 className="text-2xl font-semibold mb-6" style=${{ color: 'var(--app-text-primary)' }}>Connections</h1>
      <div className="space-y-4">
        ${items.map((c) => html`
          <${UserCard}
            key=${c.id}
            user=${c.other_user}
            mutualCount=${c.other_user?.mutual_connections_count}
          />
        `)}
      </div>
    </div>
  `;
};

export default ConnectionsPage;
