/**
 * CommunityEmptyState - Premium empty state for feed.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const CommunityEmptyState = ({ variant = 'community', isMember }) => {
  const config = variant === 'channel'
    ? {
        title: 'No discussions yet in this channel',
        description: isMember ? 'Start the conversation here.' : 'Join the community to participate.',
      }
    : {
        title: 'No discussions yet',
        description: isMember ? 'Start the first discussion.' : 'Join the community to post.',
      };

  return html`
    <div className="rounded-xl border p-10 text-center" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      <div
        className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
        style=${{ background: 'var(--app-surface-subtle)' }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style=${{ color: 'var(--app-text-muted)' }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <h3 className="text-base font-semibold mb-1.5" style=${{ color: 'var(--app-text-primary)' }}>${config.title}</h3>
      <p className="text-sm max-w-sm mx-auto" style=${{ color: 'var(--app-text-secondary)' }}>${config.description}</p>
    </div>
  `;
};

export default CommunityEmptyState;
