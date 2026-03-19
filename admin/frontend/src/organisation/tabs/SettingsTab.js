/**
 * Organisation Settings tab: status, ownership, danger zone.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';

const html = htm.bind(React.createElement);

const LABEL_CLASS = 'block text-sm font-semibold mb-2';
const INPUT_CLASS = 'w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white';

const SettingsTab = ({ form, onChange, onArchive, onDelete, loading }) => html`
  <div className="space-y-6">
    <${SectionCard} title="Org status">
      <div>
        <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Listing status</label>
        <select value=${form?.status || 'listed'} onChange=${(e) => onChange({ ...form, status: e.target.value })} className=${INPUT_CLASS}>
          <option value="listed">Listed</option>
          <option value="placeholder">Placeholder</option>
          <option value="hidden">Hidden</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Ownership">
      <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>Ownership and admin management is in the People tab.</p>
    </${SectionCard}>
    <${SectionCard} title="Danger zone">
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-amber-200" style=${{ background: 'var(--app-surface)' }}>
          <p className="text-sm font-medium" style=${{ color: 'var(--app-text-primary)' }}>Archive organisation</p>
          <p className="text-xs mt-1 mb-3" style=${{ color: 'var(--app-text-muted)' }}>Marks as archived. Reversible.</p>
          ${onArchive ? html`
            <button
              type="button"
              onClick=${() => onArchive?.()}
              disabled=${loading}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-amber-300 hover:bg-amber-50 disabled:opacity-60"
              style=${{ color: 'var(--app-text-primary)' }}
            >
              ${loading ? 'Archiving...' : 'Archive organisation'}
            </button>
          ` : null}
        </div>
        <div className="p-4 rounded-xl border border-red-200" style=${{ background: 'var(--app-surface)' }}>
          <p className="text-sm font-medium text-red-600">Delete organisation</p>
          <p className="text-xs mt-1 mb-3" style=${{ color: 'var(--app-text-muted)' }}>Permanently removes. Cannot be undone.</p>
          ${onDelete ? html`
            <button
              type="button"
              onClick=${() => onDelete?.()}
              disabled=${loading}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
            >
              ${loading ? 'Deleting...' : 'Delete organisation'}
            </button>
          ` : null}
        </div>
      </div>
    </${SectionCard}>
  </div>
`;

export default SettingsTab;
