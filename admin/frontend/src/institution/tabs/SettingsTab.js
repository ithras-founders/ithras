/**
 * Settings tab: Status, Ownership, Danger zone.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../components/SectionCard.js';

const html = htm.bind(React.createElement);

const INPUT_CLASS = 'w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white';
const LABEL_CLASS = 'block text-sm font-semibold mb-2';

const SettingsTab = ({ form, onChange, institutionId, onArchive, onDelete, loading }) => html`
  <div className="space-y-6">
    <${SectionCard} title="Status">
      <div>
        <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Listing status</label>
        <select
          value=${form?.status || 'listed'}
          onChange=${(e) => onChange({ ...form, status: e.target.value })}
          className=${INPUT_CLASS}
        >
          <option value="listed">Listed</option>
          <option value="placeholder">Placeholder</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
        <p className="text-xs mt-1" style=${{ color: 'var(--app-text-muted)' }}>Listed = visible in search; Placeholder = minimal; Hidden/Archived = not shown</p>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Ownership">
      <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>
        Ownership and admin management is configured in the People tab.
      </p>
    </${SectionCard}>
    <${SectionCard} title="Danger zone">
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-amber-200" style=${{ background: 'var(--app-surface)' }}>
          <p className="text-sm font-medium" style=${{ color: 'var(--app-text-primary)' }}>Archive institution</p>
          <p className="text-xs mt-1 mb-3" style=${{ color: 'var(--app-text-muted)' }}>Marks as archived. Reversible.</p>
          ${onArchive ? html`
            <button
              type="button"
              onClick=${() => onArchive?.()}
              disabled=${loading}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-amber-300 hover:bg-amber-50 disabled:opacity-60"
              style=${{ color: 'var(--app-text-primary)' }}
            >
              ${loading ? 'Archiving...' : 'Archive institution'}
            </button>
          ` : null}
        </div>
        <div className="p-4 rounded-xl border border-red-200" style=${{ background: 'var(--app-surface)' }}>
          <p className="text-sm font-medium text-red-600">Delete institution</p>
          <p className="text-xs mt-1 mb-3" style=${{ color: 'var(--app-text-muted)' }}>Permanently removes. Cannot be undone.</p>
          ${onDelete ? html`
            <button
              type="button"
              onClick=${() => onDelete?.()}
              disabled=${loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
            >
              ${loading ? 'Deleting...' : 'Delete institution'}
            </button>
          ` : null}
        </div>
      </div>
    </${SectionCard}>
  </div>
`;

export default SettingsTab;
