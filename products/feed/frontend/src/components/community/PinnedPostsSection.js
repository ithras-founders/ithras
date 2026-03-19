/**
 * PinnedPostsSection - Pinned posts with amber banner styling.
 */
import React from 'react';
import htm from 'htm';
import PremiumPostCard from '../PremiumPostCard.js';

const html = htm.bind(React.createElement);

const pinSvg = html`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>`;

const PinnedPostsSection = ({ items, onRefresh, user }) => {
  if (!items || items.length === 0) return null;

  return html`
    <div className="rounded-3xl border p-5" style=${{ borderColor: 'var(--app-warning-soft)', background: 'rgba(251,191,36,0.15)' }}>
      <div className="mb-2 flex items-center gap-2 text-sm font-medium" style=${{ color: 'var(--app-warning)' }}>
        <span>${pinSvg}</span>
        Pinned
      </div>
      <div className="space-y-4">
        ${items.map((post) => html`
          <${PremiumPostCard} key=${post.id} post=${post} onRefresh=${onRefresh} user=${user} />
        `)}
      </div>
    </div>
  `;
};

export default PinnedPostsSection;
