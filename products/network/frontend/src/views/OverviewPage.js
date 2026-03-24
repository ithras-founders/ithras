/**
 * OverviewPage - Network overview: stats, CTAs, network activity, load errors.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import htm from 'htm';
import NetworkOverviewCards from '../components/NetworkOverviewCards.js';
import { getOverview, getNotifications, markNotificationRead } from '../services/networkApi.js';

const html = htm.bind(React.createElement);

const go = (href) => {
  window.history.pushState(null, '', href);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

const fmtActivityTime = (iso) => {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
};

const humanizeNotifType = (t) => {
  if (!t) return 'Network update';
  return String(t)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const buildNetworkActivityRows = (pendingItems, notificationItems) => {
  const pendingByConnId = new Map((pendingItems || []).map((p) => [p.id, p]));
  const pendingConnIds = new Set((pendingItems || []).map((p) => p.id));
  const rows = [];

  for (const p of pendingItems || []) {
    rows.push({
      key: `pending-${p.id}`,
      title: `${p.requester?.full_name || 'Someone'} wants to connect`,
      meta: fmtActivityTime(p.created_at),
      href: '/network/connections?tab=invitations',
      unread: true,
      notificationId: null,
    });
  }

  for (const n of notificationItems || []) {
    if (n.type === 'connection_request') {
      const cid = n.payload?.connection_id;
      const numId = cid != null ? Number(cid) : NaN;
      if (Number.isFinite(numId) && pendingConnIds.has(numId)) continue;
      const pending = Number.isFinite(numId) ? pendingByConnId.get(numId) : null;
      rows.push({
        key: `notif-${n.id}`,
        title: pending
          ? `${pending.requester?.full_name || 'Someone'} wants to connect`
          : 'Connection request',
        meta: fmtActivityTime(n.created_at),
        href: '/network/connections?tab=invitations',
        unread: !n.read_at,
        notificationId: n.id,
      });
    } else {
      rows.push({
        key: `notif-${n.id}`,
        title: humanizeNotifType(n.type),
        meta: fmtActivityTime(n.created_at),
        href: '/network/connections',
        unread: !n.read_at,
        notificationId: n.id,
      });
    }
  }

  return rows.slice(0, 30);
};

const OverviewPage = ({ pendingItems = [] }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notificationItems, setNotificationItems] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const loadOverview = useCallback(() => {
    setLoading(true);
    setLoadError('');
    getOverview()
      .then((data) => {
        setStats(data);
        setLoadError('');
      })
      .catch(() => {
        setLoadError('We could not load your network stats. You can still explore connections and suggestions below.');
        setStats({
          connections_count: 0,
          following_count: 0,
          same_org_count: 0,
          same_institution_count: 0,
          same_function_count: 0,
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const loadActivity = useCallback(() => {
    setActivityLoading(true);
    getNotifications({ limit: 25 })
      .then((r) => setNotificationItems(r.items || []))
      .catch(() => setNotificationItems([]))
      .finally(() => setActivityLoading(false));
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    loadActivity();
    const onNet = () => loadActivity();
    window.addEventListener('ithras:notifications-changed', onNet);
    return () => window.removeEventListener('ithras:notifications-changed', onNet);
  }, [loadActivity]);

  const activityRows = useMemo(
    () => buildNetworkActivityRows(pendingItems, notificationItems),
    [pendingItems, notificationItems],
  );

  const onActivityRow = (row) => {
    if (row.notificationId != null) {
      markNotificationRead(row.notificationId).catch(() => {});
      window.dispatchEvent(new CustomEvent('ithras:notifications-changed'));
    }
    go(row.href);
  };

  if (loading) {
    return html`
      <div className="p-8">
        <div className="h-8 w-48 rounded bg-[var(--app-surface-subtle)] animate-pulse" />
        <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4">
          ${[1, 2, 3, 4, 5].map((i) => html`
            <div key=${i} className="h-24 rounded-xl bg-[var(--app-surface-subtle)] animate-pulse" />
          `)}
        </div>
      </div>
    `;
  }

  return html`
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      ${loadError
        ? html`
            <div
              className="rounded-xl border px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3"
              style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-warning-soft, #fffbeb)', color: 'var(--app-text-primary)' }}
              role="alert"
            >
              <span>${loadError}</span>
              <button
                type="button"
                onClick=${loadOverview}
                className="text-sm font-medium shrink-0 ith-focus-ring rounded-lg px-2 py-1"
                style=${{ color: 'var(--app-accent)' }}
              >
                Retry
              </button>
            </div>
          `
        : null}

      <section>
        <h1 className="text-2xl font-semibold tracking-tight" style=${{ color: 'var(--app-text-primary)' }}>
          Network overview
        </h1>
        <p className="mt-2 text-sm max-w-2xl leading-relaxed" style=${{ color: 'var(--app-text-secondary)' }}>
          Grow your professional graph: connect with peers, follow people you care about, and explore communities that
          match your background.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick=${() => go('/network/suggestions')}
            className="rounded-full px-4 py-2 text-sm font-medium ith-focus-ring"
            style=${{ background: 'var(--app-accent)', color: '#fff' }}
          >
            Discover people
          </button>
          <button
            type="button"
            onClick=${() => go('/network/connections')}
            className="rounded-full px-4 py-2 text-sm font-medium border ith-focus-ring"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
          >
            My connections
          </button>
          <button
            type="button"
            onClick=${() => go('/feed/discover')}
            className="rounded-full px-4 py-2 text-sm font-medium border ith-focus-ring"
            style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-primary)' }}
          >
            Browse communities
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>At a glance</h2>
        <${NetworkOverviewCards} stats=${stats} />
      </section>

      <section className="rounded-xl border p-4" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h2 className="text-base font-semibold" style=${{ color: 'var(--app-text-primary)' }}>Network updates</h2>
          ${activityRows.length > 0
            ? html`
                <button
                  type="button"
                  onClick=${() => go('/network/connections?tab=invitations')}
                  className="text-sm font-medium ith-focus-ring rounded-lg"
                  style=${{ color: 'var(--app-accent)' }}
                >
                  Open invitations
                </button>
              `
            : null}
        </div>
        <p className="text-xs mb-4" style=${{ color: 'var(--app-text-muted)' }}>
          Connection requests and other network activity. Feed updates live under Feed → Updates.
        </p>
        ${activityLoading
          ? html`<div className="text-sm py-6" style=${{ color: 'var(--app-text-muted)' }}>Loading activity…</div>`
          : activityRows.length === 0
            ? html`
                <p className="text-sm py-4" style=${{ color: 'var(--app-text-muted)' }}>
                  No recent network activity. Invitations and alerts will show up here.
                </p>
              `
            : html`
                <ul className="space-y-0 divide-y" style=${{ borderColor: 'var(--app-border-soft)' }}>
                  ${activityRows.map(
                    (row) => html`
                      <li key=${row.key}>
                        <button
                          type="button"
                          onClick=${() => onActivityRow(row)}
                          className="w-full flex items-start justify-between gap-3 text-left text-sm py-3 ith-focus-ring rounded-lg -mx-1 px-1"
                        >
                          <span className="min-w-0">
                            <span className="flex items-center gap-2">
                              ${row.unread
                                ? html`<span className="inline-block w-2 h-2 rounded-full shrink-0" style=${{ background: 'var(--app-accent)' }} aria-hidden="true" />`
                                : null}
                              <span style=${{ color: 'var(--app-text-primary)' }}>${row.title}</span>
                            </span>
                            ${row.meta ? html`<span className="block text-xs mt-0.5" style=${{ color: 'var(--app-text-muted)' }}>${row.meta}</span>` : null}
                          </span>
                          <span className="text-xs font-medium shrink-0 pt-0.5" style=${{ color: 'var(--app-accent)' }}>View</span>
                        </button>
                      </li>
                    `,
                  )}
                </ul>
              `}
      </section>
    </div>
  `;
};

export default OverviewPage;
