/**
 * CommunityComposer - Premium conversation entry point.
 * Feels like starting a conversation, not filling a form.
 */
import React, { useState } from 'react';
import htm from 'htm';
import ExpandedComposer from './ExpandedComposer.js';

const html = htm.bind(React.createElement);

const CommunityComposer = ({ onSuccess, communityId, channelId, community, user, defaultExpanded = true }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const channels = community?.channels || [];
  const channelName = channelId && channels.length
    ? (channels.find((c) => c.id === channelId)?.name || 'General')
    : 'General';
  const communityInitials = (community?.name || 'C').slice(0, 2).toUpperCase();

  return html`
    <div
      className="rounded-3xl border p-4 shadow-sm sm:p-6 transition-all duration-300"
      style=${{
        background: 'var(--app-surface)',
        borderColor: 'var(--app-border-soft)',
      }}
    >
      ${!expanded
        ? html`
            <button
              type="button"
              onClick=${() => setExpanded(true)}
              className="flex w-full items-center gap-4 rounded-3xl px-5 py-4 sm:p-6 text-left transition-all duration-200 hover:bg-[rgba(0,0,0,0.015)]"
            >
              <div className="min-w-0 flex-1">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-[0.18em]" style=${{ color: 'var(--app-text-muted)' }}>
                    Posting in
                  </span>
                  <span
                    className="group inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition"
                    style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface-subtle)', color: 'var(--app-text-secondary)' }}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold" style=${{ background: 'var(--app-text-primary)', color: 'var(--app-surface)' }}>
                      ${communityInitials}
                    </span>
                    <span className="max-w-[200px] truncate sm:max-w-[280px]">${community?.name || 'Community'} · ${channelName}</span>
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 transition group-hover:opacity-80" style=${{ color: 'var(--app-text-muted)' }}>
                      <path d="m5 7.5 5 5 5-5" />
                    </svg>
                  </span>
                </div>
                <div className="text-[15px]" style=${{ color: 'var(--app-text-muted)' }}>
                  Start a discussion, ask a question, or share something…
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0" style=${{ color: 'var(--app-text-muted)' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          `
        : html`
            <div>
              <${ExpandedComposer}
                onSuccess=${() => { setExpanded(false); onSuccess?.(); }}
                onCancel=${() => setExpanded(false)}
                communityId=${communityId}
                channelId=${channelId}
                community=${community}
              />
            </div>
          `}
    </div>
  `;
};

export default CommunityComposer;
