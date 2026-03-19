/**
 * CommunityInfoCard - Single quiet card with About, Members, Guidelines.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const CommunityInfoCard = ({ community }) => {
  if (!community) return null;

  const desc = community.description?.trim();
  const rules = community.rules;
  const hasRules = rules && (typeof rules === 'string' ? rules.trim() : String(rules)).length > 0;

  return html`
    <div className="rounded-lg border p-3" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>About</p>
          <p className="text-sm mt-0.5 line-clamp-2" style=${{ color: 'var(--app-text-secondary)' }}>
            ${desc || 'No description yet.'}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Members</p>
          <p className="text-sm mt-0.5" style=${{ color: 'var(--app-text-secondary)' }}>${community.member_count ?? 0}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider" style=${{ color: 'var(--app-text-muted)' }}>Guidelines</p>
          <p className="text-sm mt-0.5 line-clamp-3 whitespace-pre-wrap" style=${{ color: hasRules ? 'var(--app-text-secondary)' : 'var(--app-text-muted)' }}>
            ${hasRules ? (typeof rules === 'string' ? rules : String(rules)) : 'No guidelines yet.'}
          </p>
        </div>
      </div>
    </div>
  `;
};

export default CommunityInfoCard;
