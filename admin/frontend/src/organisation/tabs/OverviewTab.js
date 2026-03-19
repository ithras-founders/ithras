/**
 * Organisation Overview tab: health cards, recent activity, quick actions.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';

const html = htm.bind(React.createElement);

const _profilePct = (org) => {
  const f = ['name', 'logo_url', 'description', 'website', 'organisation_type', 'founded_year', 'industry', 'headquarters', 'cover_image_url'];
  const filled = f.filter((k) => {
    const v = org?.[k];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  return f.length ? Math.round((filled / f.length) * 100) : 0;
};

const OverviewTab = ({ organisation, stats, recentActivity, onAddBU, onAddFunction, onAddRole }) => html`
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <${SectionCard} title="Profile completeness">
        <div className="text-2xl font-bold" style=${{ color: 'var(--app-accent)' }}>${_profilePct(organisation)}%</div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>Basic info filled</p>
      </${SectionCard}>
      <${SectionCard} title="Structure">
        <div className="text-2xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>
          ${(organisation?.business_units_v2?.length ?? organisation?.business_units?.length ?? 0) + (organisation?.functions_v2?.length ?? organisation?.functions?.length ?? 0)}
        </div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>Business units + Functions</p>
      </${SectionCard}>
      <${SectionCard} title="Members">
        <div className="text-2xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>${stats?.total_count ?? 0}</div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>Current + Alumni</p>
      </${SectionCard}>
      <${SectionCard} title="Public status">
        <div className="text-lg font-semibold" style=${{ color: 'var(--app-text-primary)' }}>
          ${organisation?.is_public !== false ? 'Visible' : 'Hidden'}
        </div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>${organisation?.status || 'listed'}</p>
      </${SectionCard}>
    </div>
    <${SectionCard} title="Recent activity">
      ${(recentActivity?.length ? recentActivity.slice(0, 5).map((a) => html`
        <div key=${a.id} className="py-2 border-b border-[var(--app-border-soft)] last:border-0 flex justify-between">
          <span style=${{ color: 'var(--app-text-primary)' }}>${a.action}</span>
          <span className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>${a.created_at ? new Date(a.created_at).toLocaleDateString() : ''}</span>
        </div>
      `) : html`<p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>No recent activity</p>`)}
    </${SectionCard}>
    <${SectionCard} title="Quick actions">
      <div className="flex flex-wrap gap-2">
        ${onAddBU ? html`<button onClick=${onAddBU} className="px-4 py-2 rounded-xl text-sm font-medium" style=${{ background: 'var(--app-accent)', color: 'white' }}>Add business unit</button>` : null}
        ${onAddFunction ? html`<button onClick=${onAddFunction} className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>Add function</button>` : null}
        ${onAddRole ? html`<button onClick=${onAddRole} className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>Add role</button>` : null}
      </div>
    </${SectionCard}>
  </div>
`;

export default OverviewTab;
