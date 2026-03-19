/**
 * ConversationDetailsPanel - Right panel: profile, overlap context, shared info.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ConversationDetailsPanel = ({ conversation, currentUserId, onClose }) => {
  const other = (conversation?.participants || []).find((p) => p.id !== currentUserId)
    || conversation?.other_user;
  if (!other) {
    return html`
      <div
        className="w-72 flex-shrink-0 border-l overflow-y-auto p-4"
        style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>Details</span>
          ${onClose ? html`
            <button onClick=${onClose} className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>Close</button>
          ` : null}
        </div>
        <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>No details available</p>
      </div>
    `;
  }

  const initials = (other.full_name || '?').slice(0, 2).toUpperCase();
  const overlap = other.overlap_context || [];
  const relLabel = {
    connection: 'Connection',
    following: 'You follow',
    follower: 'Follows you',
    other: 'Not in network',
  }[other.relationship_type] || other.relationship_type;

  return html`
    <div
      className="w-72 flex-shrink-0 border-l overflow-y-auto p-4"
      style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
    >
      <div className="flex justify-between items-center mb-4">
        <span className="font-medium" style=${{ color: 'var(--app-text-primary)' }}>Details</span>
        ${onClose ? html`
          <button onClick=${onClose} className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>Close</button>
        ` : null}
      </div>
      <div className="flex flex-col items-center mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-medium mb-2"
          style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
        >
          ${initials}
        </div>
        <div className="font-semibold text-center" style=${{ color: 'var(--app-text-primary)' }}>
          ${other.full_name || 'Unknown'}
        </div>
        ${other.headline ? html`
          <p className="text-xs text-center mt-1" style=${{ color: 'var(--app-text-muted)' }}>${other.headline}</p>
        ` : null}
      </div>
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-medium mb-2 uppercase" style=${{ color: 'var(--app-text-faint)' }}>
            Relationship
          </h4>
          <span
            className="text-sm px-2 py-1 rounded"
            style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
          >
            ${relLabel}
          </span>
        </div>
        ${overlap.length > 0 ? html`
          <div>
            <h4 className="text-xs font-medium mb-2 uppercase" style=${{ color: 'var(--app-text-faint)' }}>
              Shared context
            </h4>
            <ul className="space-y-1">
              ${overlap.map((o) => html`
                <li key=${o.type} className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
                  ${o.label}
                </li>
              `)}
            </ul>
          </div>
        ` : null}
        ${(other.current_org || other.institution_name) ? html`
          <div>
            <h4 className="text-xs font-medium mb-2 uppercase" style=${{ color: 'var(--app-text-faint)' }}>
              Profile
            </h4>
            <p className="text-sm" style=${{ color: 'var(--app-text-secondary)' }}>
              ${[other.current_org, other.institution_name].filter(Boolean).join(' · ') || '—'}
            </p>
          </div>
        ` : null}
      </div>
    </div>
  `;
};

export default ConversationDetailsPanel;
