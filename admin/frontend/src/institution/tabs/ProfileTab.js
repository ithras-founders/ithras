/**
 * Profile tab: Basic info, Classification, Branding, Links.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../components/SectionCard.js';

const html = htm.bind(React.createElement);

const INPUT_CLASS = 'w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white';
const LABEL_CLASS = 'block text-sm font-semibold mb-2';

const ProfileTab = ({ form, onChange }) => html`
  <div className="space-y-6">
    <${SectionCard} title="Basic info">
      <div className="space-y-4">
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Name</label>
          <input type="text" value=${form?.name || ''} onChange=${(e) => onChange({ ...form, name: e.target.value })} className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Short name</label>
          <input type="text" value=${form?.short_name || ''} onChange=${(e) => onChange({ ...form, short_name: e.target.value })} placeholder="e.g. MIT" className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Description</label>
          <textarea value=${form?.description || ''} onChange=${(e) => onChange({ ...form, description: e.target.value })} rows=${4} className=${INPUT_CLASS + ' resize-y'} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Website</label>
          <input type="text" value=${form?.website || ''} onChange=${(e) => onChange({ ...form, website: e.target.value })} placeholder="https://..." className=${INPUT_CLASS} />
        </div>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Classification">
      <div className="space-y-4">
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Institution type</label>
          <select value=${form?.institution_type || ''} onChange=${(e) => onChange({ ...form, institution_type: e.target.value })} className=${INPUT_CLASS}>
            <option value="">Select...</option>
            <option value="University">University</option>
            <option value="College">College</option>
            <option value="Bootcamp">Bootcamp</option>
            <option value="School">School</option>
          </select>
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Founded year</label>
          <input type="number" value=${form?.founded_year || ''} onChange=${(e) => onChange({ ...form, founded_year: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="e.g. 1861" className=${INPUT_CLASS} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Country</label>
            <input type="text" value=${form?.country || ''} onChange=${(e) => onChange({ ...form, country: e.target.value })} className=${INPUT_CLASS} />
          </div>
          <div>
            <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>State</label>
            <input type="text" value=${form?.state || ''} onChange=${(e) => onChange({ ...form, state: e.target.value })} className=${INPUT_CLASS} />
          </div>
          <div>
            <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>City</label>
            <input type="text" value=${form?.city || ''} onChange=${(e) => onChange({ ...form, city: e.target.value })} className=${INPUT_CLASS} />
          </div>
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Campus type</label>
          <select value=${form?.campus_type || ''} onChange=${(e) => onChange({ ...form, campus_type: e.target.value })} className=${INPUT_CLASS}>
            <option value="">Select...</option>
            <option value="Main">Main</option>
            <option value="Satellite">Satellite</option>
            <option value="Online">Online</option>
          </select>
        </div>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Branding">
      <div className="space-y-4">
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Logo URL</label>
          <input type="text" value=${form?.logo_url || ''} onChange=${(e) => onChange({ ...form, logo_url: e.target.value })} placeholder="https://..." className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Cover image URL</label>
          <input type="text" value=${form?.cover_image_url || ''} onChange=${(e) => onChange({ ...form, cover_image_url: e.target.value })} placeholder="https://..." className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Brand colors (JSON)</label>
          <input type="text" value=${form?.brand_colors_json || ''} onChange=${(e) => onChange({ ...form, brand_colors_json: e.target.value })} placeholder='{"primary":"#..."}' className=${INPUT_CLASS} />
          <p className="text-xs mt-1" style=${{ color: 'var(--app-text-muted)' }}>Optional hex values as JSON</p>
        </div>
      </div>
    </${SectionCard}>
    <${SectionCard} title="Links">
      <div className="space-y-4">
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>LinkedIn</label>
          <input type="text" value=${form?.linkedin_url || ''} onChange=${(e) => onChange({ ...form, linkedin_url: e.target.value })} placeholder="https://linkedin.com/..." className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Twitter</label>
          <input type="text" value=${form?.twitter_url || ''} onChange=${(e) => onChange({ ...form, twitter_url: e.target.value })} placeholder="https://twitter.com/..." className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Facebook</label>
          <input type="text" value=${form?.facebook_url || ''} onChange=${(e) => onChange({ ...form, facebook_url: e.target.value })} placeholder="https://facebook.com/..." className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Wikipedia</label>
          <input type="text" value=${form?.wikipedia_url || ''} onChange=${(e) => onChange({ ...form, wikipedia_url: e.target.value })} placeholder="https://wikipedia.org/..." className=${INPUT_CLASS} />
        </div>
      </div>
    </${SectionCard}>
  </div>
`;

export default ProfileTab;
