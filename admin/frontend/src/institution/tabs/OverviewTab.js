/**
 * Overview tab: Health cards, recent activity, quick actions.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../components/SectionCard.js';

const html = htm.bind(React.createElement);

const OverviewTab = ({ institution, stats, recentActivity, onAddDegree, onAddMajor }) => html`
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <${SectionCard} title="Profile completeness">
        <div className="text-2xl font-bold" style=${{ color: 'var(--app-accent)' }}>
          ${_profilePct(institution)}%
        </div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>Basic info filled</p>
      </${SectionCard}>
      <${SectionCard} title="Programs">
        <div className="text-2xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>
          ${(institution?.degrees_v2?.length ?? 0) + (institution?.majors_v2?.length ?? 0)}
        </div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>Degrees + Majors</p>
      </${SectionCard}>
      <${SectionCard} title="Members">
        <div className="text-2xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>
          ${stats?.total_count ?? 0}
        </div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>Current + Alumni</p>
      </${SectionCard}>
      <${SectionCard} title="Public status">
        <div className="text-lg font-semibold" style=${{ color: 'var(--app-text-primary)' }}>
          ${institution?.is_public !== false ? 'Visible' : 'Hidden'}
        </div>
        <p className="text-sm mt-1" style=${{ color: 'var(--app-text-muted)' }}>${institution?.status || 'listed'}</p>
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
        ${onAddDegree ? html`<button onClick=${onAddDegree} className="px-4 py-2 rounded-xl text-sm font-medium" style=${{ background: 'var(--app-accent)', color: 'white' }}>Add degree</button>` : null}
        ${onAddMajor ? html`<button onClick=${onAddMajor} className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--app-border-soft)] hover:bg-[var(--app-surface-hover)]" style=${{ color: 'var(--app-text-secondary)' }}>Add major</button>` : null}
      </div>
    </${SectionCard}>
  </div>
`;

function _profilePct(inst) {
  const f = ['name', 'logo_url', 'description', 'website', 'institution_type', 'founded_year', 'country', 'city', 'cover_image_url'];
  const filled = f.filter((k) => {
    const v = inst?.[k];
    return v !== undefined && v !== null && String(v).trim() !== '';
  }).length;
  return f.length ? Math.round((filled / f.length) * 100) : 0;
}

export default OverviewTab;
