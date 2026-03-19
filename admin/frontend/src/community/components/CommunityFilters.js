/**
 * Community filters - type, status, institution, organisation, etc.
 */
import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const COMMUNITY_TYPES = [
  { value: '', label: 'All types' },
  { value: 'institution', label: 'Institution' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'function', label: 'Function' },
  { value: 'public', label: 'Public' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'listed', label: 'Listed' },
  { value: 'archived', label: 'Archived' },
];

const CommunityFilters = ({ filters, onChange, institutions = [], organisations = [] }) => {
  const setFilter = (key, value) => onChange({ ...filters, [key]: value });
  return html`
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <select
        value=${filters.type || ''}
        onChange=${(e) => setFilter('type', e.target.value || null)}
        className="px-3 py-2 text-sm border rounded-lg"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      >
        ${COMMUNITY_TYPES.map((t) => html`<option key=${t.value} value=${t.value}>${t.label}</option>`)}
      </select>
      <select
        value=${filters.status || ''}
        onChange=${(e) => setFilter('status', e.target.value || null)}
        className="px-3 py-2 text-sm border rounded-lg"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      >
        ${STATUS_OPTIONS.map((s) => html`<option key=${s.value} value=${s.value}>${s.label}</option>`)}
      </select>
      <select
        value=${filters.institution_id ?? ''}
        onChange=${(e) => setFilter('institution_id', e.target.value ? parseInt(e.target.value, 10) : null)}
        className="px-3 py-2 text-sm border rounded-lg min-w-[140px]"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      >
        <option value="">All institutions</option>
        ${institutions.map((i) => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
      </select>
      <select
        value=${filters.organisation_id ?? ''}
        onChange=${(e) => setFilter('organisation_id', e.target.value ? parseInt(e.target.value, 10) : null)}
        className="px-3 py-2 text-sm border rounded-lg min-w-[140px]"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      >
        <option value="">All organisations</option>
        ${organisations.map((o) => html`<option key=${o.id} value=${o.id}>${o.name}</option>`)}
      </select>
      <select
        value=${filters.has_channels ?? ''}
        onChange=${(e) => setFilter('has_channels', e.target.value === '' ? null : e.target.value === 'true')}
        className="px-3 py-2 text-sm border rounded-lg"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      >
        <option value="">All</option>
        <option value="true">Has channels</option>
        <option value="false">No channels</option>
      </select>
      <input
        type="text"
        placeholder="Search name or entity..."
        value=${filters.search || ''}
        onChange=${(e) => setFilter('search', e.target.value || null)}
        className="px-3 py-2 text-sm border rounded-lg min-w-[180px]"
        style=${{ borderColor: 'var(--app-border-soft)' }}
      />
    </div>
  `;
};

export default CommunityFilters;
