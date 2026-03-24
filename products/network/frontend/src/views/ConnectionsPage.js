/**
 * ConnectionsPage - Accepted connections and pending invitations (with Accept/Reject).
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import htm from 'htm';
import UserCard from '../components/UserCard.js';
import EmptyState from '/products/feed/frontend/src/components/EmptyState.js';
import Tabs from '/shared/components/ui/Tabs.js';
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

  const tabs = useMemo(
    () => [
      { id: 'connections', label: 'Connections' },
      { id: 'invitations', label: pending.length ? `Invitations (${pending.length})` : 'Invitations' },
    ],
    [pending.length],
  );

  const tabBar = html`
    <div className="mb-4">
      <${Tabs} tabs=${tabs} value=${tab} onChange=${switchTab} size="sm" />
    </div>
  `;

  const pageWrap = (subtitle, inner) => html`
    <div className="px-4 py-5 md:px-6 md:py-6">
      <div className="mx-auto max-w-2xl">
        ${tabBar}
        ${subtitle
          ? html`<p className="text-sm mb-4" style=${{ color: 'var(--app-text-muted)' }}>${subtitle}</p>`
          : null}
        ${inner}
      </div>
    </div>
  `;

  const showInvitations = tab === 'invitations';

  if (showInvitations) {
    const pendingLoadingState = pendingLoading;
    const pendingEmpty = pending.length === 0 && !pendingLoadingState;

    return pageWrap(
      pendingEmpty || pendingLoadingState ? null : `${pending.length} pending request${pending.length !== 1 ? 's' : ''}`,
      pendingLoadingState
        ? html`
            <div className="space-y-3">
              ${[1, 2].map((i) => html`<div key=${i} className="h-20 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />`)}
            </div>
          `
        : pendingEmpty
          ? html`
              <${EmptyState}
                title="No pending requests"
                description="When someone sends you a connection request, it will appear here."
                ctaLabel="Find connections"
                onCta=${goToSuggestions}
              />
            `
          : html`
              <div className="space-y-3">
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
            `,
    );
  }

  if (loading) {
    return pageWrap(
      null,
      html`
        <div className="h-7 w-40 rounded bg-[var(--app-surface-subtle)] animate-pulse mb-4" />
        <div className="space-y-2">
          ${[1, 2, 3].map((i) => html`<div key=${i} className="h-14 rounded-lg bg-[var(--app-surface-subtle)] animate-pulse" />`)}
        </div>
      `,
    );
  }

  if (items.length === 0) {
    return pageWrap(
      'People you’ve accepted as connections.',
      html`
        <${EmptyState}
          title="No connections yet"
          description="Build your network by connecting with colleagues and alumni."
          ctaLabel="Find connections"
          onCta=${goToSuggestions}
        />
      `,
    );
  }

  return pageWrap(
    `${items.length} connection${items.length !== 1 ? 's' : ''}`,
    html`
      <div className="rounded-xl border overflow-hidden bg-[var(--app-surface)]" style=${{ borderColor: 'var(--app-border-soft)' }}>
        ${items.map((c) => html`
          <${UserCard}
            key=${c.id}
            variant="list"
            user=${c.other_user}
            mutualCount=${c.other_user?.mutual_connections_count}
          />
        `)}
      </div>
    `,
  );
};

export default ConnectionsPage;
