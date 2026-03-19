/**
 * Profile completeness bar computed from filled fields.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const FIELDS = [
  'name', 'logo_url', 'description', 'website', 'institution_type', 'founded_year',
  'country', 'city', 'cover_image_url',
];

const ProfileCompletenessBar = ({ institution }) => {
  const filled = FIELDS.filter((f) => {
    const v = institution?.[f];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  const pct = FIELDS.length ? Math.round((filled / FIELDS.length) * 100) : 0;

  return html`
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style=${{ background: 'var(--app-surface)' }}>
        <div
          className="h-full rounded-full transition-all duration-300"
          style=${{ width: `${pct}%`, background: 'var(--app-accent)' }}
        />
      </div>
      <span className="text-xs font-medium" style=${{ color: 'var(--app-text-muted)' }}>${pct}% complete</span>
    </div>
  `;
};

export default ProfileCompletenessBar;
