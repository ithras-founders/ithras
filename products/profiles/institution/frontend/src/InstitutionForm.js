import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { createInstitution, updateInstitution, uploadFile } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const INSTITUTION_ROLES = ['CANDIDATE', 'PLACEMENT_TEAM', 'PLACEMENT_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY_OBSERVER', 'ALUMNI'];
const DEFAULT_INSTITUTION_ROLES = ['CANDIDATE', 'PLACEMENT_TEAM', 'PLACEMENT_ADMIN', 'INSTITUTION_ADMIN', 'FACULTY_OBSERVER', 'ALUMNI'];

const InstitutionForm = ({ institution, onSuccess, onCancel, isSystemAdmin }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    tier: 'Tier 1',
    location: '',
    logo_url: '',
    about: '',
    website: '',
    founding_year: '',
    student_count_range: '',
    allowed_roles: [...DEFAULT_INSTITUTION_ROLES],
    status: 'PENDING',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadFile(file);
      setFormData(f => ({ ...f, logo_url: result.url }));
    } catch (err) {
      toast.error('Upload failed: ' + (err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    if (institution) {
      const roles = Array.isArray(institution.allowed_roles) && institution.allowed_roles.length > 0
        ? institution.allowed_roles
        : [...DEFAULT_INSTITUTION_ROLES];
      setFormData({
        id: institution.id,
        name: institution.name || '',
        tier: institution.tier || 'Tier 1',
        location: institution.location || '',
        logo_url: institution.logo_url || '',
        about: institution.about || '',
        website: institution.website || '',
        founding_year: institution.founding_year ? String(institution.founding_year) : '',
        student_count_range: institution.student_count_range || '',
        allowed_roles: roles,
      });
    } else {
      setFormData({
        id: `inst${Date.now()}`,
        name: '',
        tier: 'Tier 1',
        location: '',
        logo_url: '',
        about: '',
        website: '',
        founding_year: '',
        student_count_range: '',
        allowed_roles: [...DEFAULT_INSTITUTION_ROLES],
        status: 'PENDING',
      });
    }
  }, [institution]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.id.trim()) newErrors.id = 'ID is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        tier: formData.tier,
        location: formData.location,
        logo_url: formData.logo_url || null,
        about: formData.about?.trim() || null,
        website: formData.website?.trim() || null,
        founding_year: formData.founding_year ? parseInt(formData.founding_year, 10) : null,
        student_count_range: formData.student_count_range?.trim() || null,
      };
      if (isSystemAdmin && formData.allowed_roles) {
        payload.allowed_roles = formData.allowed_roles;
      }
      if (isSystemAdmin && formData.status) {
        payload.status = formData.status;
      }
      if (institution) {
        await updateInstitution(institution.id, payload);
      } else {
        await createInstitution({ id: formData.id, ...payload });
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save institution: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  const logoPreview = formData.logo_url || null;

  return html`
    <form onSubmit=${handleSubmit} className="space-y-6">
      <h3 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-2">
        ${institution ? 'Edit Institution' : 'Add New Institution'}
      </h3>

      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Logo</label>
          <div className="relative group cursor-pointer" onClick=${() => fileInputRef.current?.click()}>
            ${logoPreview ? html`
              <img src=${logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-contain border-2 border-[var(--app-border-soft)] bg-[var(--app-surface)] group-hover:border-indigo-400 transition-colors" onError=${() => setFormData(f => ({...f, logo_url: ''}))} />
            ` : html`
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-semibold border-2 border-dashed border-[var(--app-border-soft)] group-hover:border-indigo-400 transition-colors">
                ${(formData.name || 'I')[0].toUpperCase()}
              </div>
            `}
            <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            ${uploading ? html`<div className="absolute inset-0 rounded-2xl bg-[var(--app-surface)]/80 flex items-center justify-center"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>` : null}
          </div>
          <input ref=${fileInputRef} type="file" accept="image/*" className="hidden" onChange=${handleFileUpload} />
        </div>
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Logo URL</label>
            <input
              type="url"
              value=${formData.logo_url}
              onChange=${(e) => setFormData({ ...formData, logo_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
              placeholder="https://example.com/logo.png"
            />
            <p className="text-[10px] text-[var(--app-text-muted)] mt-1">Click the logo to upload, or paste a URL</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
            Institution ID
          </label>
          <input
            type="text"
            value=${formData.id}
            onChange=${(e) => setFormData({ ...formData, id: e.target.value })}
            disabled=${!!institution}
            className=${'w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ' + (errors.id ? 'border-[var(--app-danger)]' : 'border-[var(--app-border-soft)]') + (institution ? ' bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]' : '')}
            placeholder="inst1"
          />
          ${errors.id && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.id}</p>`}
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
            Tier
          </label>
          <select
            value=${formData.tier}
            onChange=${(e) => setFormData({ ...formData, tier: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="Tier 1">Tier 1</option>
            <option value="Tier 2">Tier 2</option>
            <option value="Tier 3">Tier 3</option>
            <option value="Lateral">Lateral</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Name <span className="text-[var(--app-danger)]">*</span>
        </label>
        <input
          type="text"
          value=${formData.name}
          onChange=${(e) => setFormData({ ...formData, name: e.target.value })}
          className=${'w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ' + (errors.name ? 'border-[var(--app-danger)]' : 'border-[var(--app-border-soft)]')}
          placeholder="e.g. ABC Business School"
          required
        />
        ${errors.name && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.name}</p>`}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Location <span className="text-[var(--app-danger)]">*</span>
        </label>
        <input
          type="text"
          value=${formData.location}
          onChange=${(e) => setFormData({ ...formData, location: e.target.value })}
          className=${'w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ' + (errors.location ? 'border-[var(--app-danger)]' : 'border-[var(--app-border-soft)]')}
          placeholder="Kolkata"
          required
        />
        ${errors.location && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.location}</p>`}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">About</label>
        <textarea
          value=${formData.about}
          onChange=${(e) => setFormData({ ...formData, about: e.target.value })}
          rows=${4}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
          placeholder="Brief description of the institution"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Website</label>
          <input
            type="url"
            value=${formData.website}
            onChange=${(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
            placeholder="https://example.edu"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Founding Year</label>
          <input
            type="number"
            min=${1900}
            max=${2100}
            value=${formData.founding_year}
            onChange=${(e) => setFormData({ ...formData, founding_year: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
            placeholder="1990"
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Student Count Range</label>
        <input
          type="text"
          value=${formData.student_count_range}
          onChange=${(e) => setFormData({ ...formData, student_count_range: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-sm"
          placeholder="e.g. 500-1000"
        />
      </div>

      ${isSystemAdmin ? html`
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Status</label>
          <select
            value=${formData.status || 'PENDING'}
            onChange=${(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="PENDING">PENDING (New, needs approval)</option>
            <option value="LISTED">LISTED (Full details, no placement)</option>
            <option value="PARTNER">PARTNER (Full placement access)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Allowed Roles</label>
          <p className="text-xs text-[var(--app-text-muted)] mb-3">Roles that can be assigned to users within this institution</p>
          <div className="flex flex-wrap gap-2">
            ${INSTITUTION_ROLES.map(role => {
              const checked = formData.allowed_roles?.includes(role) ?? true;
              return html`
                <label key=${role} className="flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer transition-colors ${checked ? 'border-indigo-300 bg-indigo-50' : 'border-[var(--app-border-soft)] hover:bg-[var(--app-surface-muted)]'}">
                  <input
                    type="checkbox"
                    checked=${checked}
                    onChange=${(e) => {
                      const next = e.target.checked
                        ? [...(formData.allowed_roles || []), role]
                        : (formData.allowed_roles || []).filter(r => r !== role);
                      setFormData({ ...formData, allowed_roles: next });
                    }}
                    className="rounded border-[var(--app-border-soft)] text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium">${role.replace(/_/g, ' ')}</span>
                </label>
              `;
            })}
          </div>
        </div>
      ` : null}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled=${submitting}
          className="flex-1 px-8 py-3 bg-indigo-600 text-white rounded-xl text-[11px] font-semibold uppercase tracking-widest shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          ${submitting ? 'Saving...' : (institution ? 'Update Institution' : 'Create Institution')}
        </button>
        <button
          type="button"
          onClick=${onCancel}
          className="px-8 py-3 bg-[var(--app-surface)] border border-[var(--app-border-soft)] text-[var(--app-text-secondary)] rounded-xl text-[11px] font-semibold uppercase tracking-widest hover:bg-[var(--app-surface-muted)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  `;
};

export default InstitutionForm;
