/**
 * Public Page tab: Editable slug, description, visibility, Preview.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../components/SectionCard.js';

const html = htm.bind(React.createElement);

const INPUT_CLASS = 'w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white';
const LABEL_CLASS = 'block text-sm font-semibold mb-2';

const PublicPageTab = ({ form, onChange, onPreview }) => html`
  <div className="space-y-6">
    <${SectionCard} title="Public URL">
      <div>
        <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>URL slug</label>
        <div className="flex items-center gap-2">
          <span className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>/i/</span>
          <input
            type="text"
            value=${form?.slug || ''}
            onChange=${(e) => onChange({ ...form, slug: e.target.value })}
            placeholder="institution-name"
            className=${INPUT_CLASS}
          />
        </div>
        <p className="text-xs mt-1" style=${{ color: 'var(--app-text-muted)' }}>Used in public URL: /i/your-slug</p>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Visibility">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="is_public"
          checked=${form?.is_public !== false}
          onChange=${(e) => onChange({ ...form, is_public: e.target.checked })}
          className="rounded border-[var(--app-border-soft)]"
        />
        <label for="is_public" className="text-sm font-medium" style=${{ color: 'var(--app-text-primary)' }}>
          Public page is visible
        </label>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Preview">
      <button
        onClick=${onPreview}
        className="px-4 py-2 rounded-xl font-medium"
        style=${{ background: 'var(--app-accent)', color: 'white' }}
      >
        Preview public page
      </button>
    </${SectionCard}>
  </div>
`;

export default PublicPageTab;
