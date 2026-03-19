/**
 * Organisation Public Page tab: slug, visibility, preview.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';

const html = htm.bind(React.createElement);

const INPUT_CLASS = 'w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white';
const LABEL_CLASS = 'block text-sm font-semibold mb-2';

const PublicPageTab = ({ form, onChange, onPreview }) => html`
  <div className="space-y-6">
    <${SectionCard} title="Public URL">
      <div>
        <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>URL slug</label>
        <div className="flex items-center gap-2">
          <span className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>/o/</span>
          <input type="text" value=${form?.slug || ''} onChange=${(e) => onChange({ ...form, slug: e.target.value })} placeholder="org-slug" className=${INPUT_CLASS} />
        </div>
        <p className="text-xs mt-1" style=${{ color: 'var(--app-text-muted)' }}>Public URL: /o/your-slug</p>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Visibility">
      <div className="flex items-center gap-2">
        <input type="checkbox" id="org_is_public" checked=${form?.is_public !== false} onChange=${(e) => onChange({ ...form, is_public: e.target.checked })} className="rounded border-[var(--app-border-soft)]" />
        <label for="org_is_public" className="text-sm font-medium" style=${{ color: 'var(--app-text-primary)' }}>Public page is visible</label>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Preview">
      <button onClick=${onPreview} className="px-4 py-2 rounded-xl font-medium" style=${{ background: 'var(--app-accent)', color: 'white' }}>Preview public page</button>
    </${SectionCard}>
  </div>
`;

export default PublicPageTab;
