/**
 * Organisation Profile tab: Basic info, Classification, Branding, Links.
 */
import React from 'react';
import htm from 'htm';
import SectionCard from '../../institution/components/SectionCard.js';

const html = htm.bind(React.createElement);

const INPUT_CLASS = 'w-full px-4 py-2.5 border border-[var(--app-border-soft)] rounded-xl focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent bg-white';
const LABEL_CLASS = 'block text-sm font-semibold mb-2';

const ProfileTab = ({ form, onChange }) => html`
  <div className="space-y-6">
    <${SectionCard} title="Basic info">
      <div className="space-y-4">
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Organization name</label>
          <input type="text" value=${form?.name || ''} onChange=${(e) => onChange({ ...form, name: e.target.value })} className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Short name</label>
          <input type="text" value=${form?.short_name || ''} onChange=${(e) => onChange({ ...form, short_name: e.target.value })} placeholder="e.g. Citi" className=${INPUT_CLASS} />
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
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Organization type</label>
          <select value=${form?.organisation_type || ''} onChange=${(e) => onChange({ ...form, organisation_type: e.target.value })} className=${INPUT_CLASS}>
            <option value="">Select...</option>
            <option value="Company">Company</option>
            <option value="Startup">Startup</option>
            <option value="NGO">NGO</option>
            <option value="Government">Government</option>
          </select>
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Industry</label>
          <input type="text" value=${form?.industry || ''} onChange=${(e) => onChange({ ...form, industry: e.target.value })} placeholder="e.g. Financial Services" className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Headquarters</label>
          <input type="text" value=${form?.headquarters || ''} onChange=${(e) => onChange({ ...form, headquarters: e.target.value })} placeholder="e.g. New York, NY" className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Founded year</label>
          <input type="number" value=${form?.founded_year || ''} onChange=${(e) => onChange({ ...form, founded_year: e.target.value ? parseInt(e.target.value, 10) : null })} placeholder="e.g. 1812" className=${INPUT_CLASS} />
        </div>
        <div>
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Company size</label>
          <select value=${form?.company_size || ''} onChange=${(e) => onChange({ ...form, company_size: e.target.value })} className=${INPUT_CLASS}>
            <option value="">Select...</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-500">201-500</option>
            <option value="500+">500+</option>
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
        </div>
      </div>
    </${SectionCard}>
    <${SectionCard} title="External links">
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
          <label className=${LABEL_CLASS} style=${{ color: 'var(--app-text-primary)' }}>Crunchbase</label>
          <input type="text" value=${form?.crunchbase_url || ''} onChange=${(e) => onChange({ ...form, crunchbase_url: e.target.value })} placeholder="https://crunchbase.com/..." className=${INPUT_CLASS} />
        </div>
      </div>
    </${SectionCard}>
  </div>
`;

export default ProfileTab;
