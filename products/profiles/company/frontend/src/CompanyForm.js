import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { createCompany, updateCompany, uploadFile } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const COMPANY_ROLES = ['RECRUITER'];
const DEFAULT_COMPANY_ROLES = ['RECRUITER'];

const CompanyForm = ({ company, onSuccess, onCancel, isSystemAdmin }) => {
  const toast = useToast();
  const isEditing = !!company;
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    logo_url: '',
    description: '',
    headquarters: '',
    founding_year: '',
    allowed_roles: [...DEFAULT_COMPANY_ROLES],
    status: 'PENDING',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [fetchingLogo, setFetchingLogo] = useState(false);
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
    if (company) {
      const roles = Array.isArray(company.allowed_roles) && company.allowed_roles.length > 0
        ? company.allowed_roles
        : [...DEFAULT_COMPANY_ROLES];
      setFormData({
        id: company.id,
        name: company.name || '',
        logo_url: company.logo_url || '',
        description: company.description || '',
        headquarters: company.headquarters || '',
        founding_year: company.founding_year ? String(company.founding_year) : '',
        allowed_roles: roles,
      });
    } else {
      setFormData({
        id: `comp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: '',
        logo_url: '',
        description: '',
        headquarters: '',
        founding_year: '',
        allowed_roles: [...DEFAULT_COMPANY_ROLES],
        status: 'PENDING',
      });
    }
  }, [company]);

  const fetchCompanyLogo = async (companyName) => {
    if (!companyName || companyName.length < 3) return;
    setFetchingLogo(true);
    try {
      const cleanName = companyName.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '');
      const domains = [`${cleanName}.com`, `${cleanName}.io`, `${cleanName}.co`];
      for (const domain of domains) {
        const logoApiUrl = `https://logo.clearbit.com/${domain}`;
        const found = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(logoApiUrl);
          img.onerror = () => resolve(null);
          img.src = logoApiUrl;
          setTimeout(() => resolve(null), 1000);
        });
        if (found) {
          setFormData(f => ({ ...f, logo_url: found }));
          setFetchingLogo(false);
          return;
        }
      }
      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=random`;
      setFormData(f => ({ ...f, logo_url: fallback }));
    } catch {
      const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(companyName)}&size=128&background=random`;
      setFormData(f => ({ ...f, logo_url: fallback }));
    } finally {
      setFetchingLogo(false);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    if (!formData.id.trim()) newErrors.id = 'Company ID is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      let finalLogoUrl = formData.logo_url;
      if (!finalLogoUrl && formData.name) {
        finalLogoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&size=128&background=random`;
      }

      const payload = {
        name: formData.name,
        logo_url: finalLogoUrl || null,
        description: formData.description?.trim() || null,
        headquarters: formData.headquarters?.trim() || null,
        founding_year: formData.founding_year ? parseInt(formData.founding_year, 10) : null,
      };
      if (isSystemAdmin && formData.allowed_roles) {
        payload.allowed_roles = formData.allowed_roles;
      }
      if (isEditing) {
        await updateCompany(company.id, payload);
      } else {
        await createCompany({ id: formData.id, ...payload });
      }
      onSuccess();
    } catch (error) {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('already exists')) {
        setErrors({ name: 'A company with this name already exists' });
      } else {
        toast.error(`Failed to ${isEditing ? 'update' : 'create'} company: ` + errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const logoPreview = formData.logo_url || null;

  return html`
    <form onSubmit=${handleSubmit} className="space-y-6">
      <h3 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-2">
        ${isEditing ? 'Edit Company' : 'Create New Company'}
      </h3>

      <div className="flex items-start gap-6">
        <div className="shrink-0">
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Logo</label>
          <div className="relative group cursor-pointer" onClick=${() => fileInputRef.current?.click()}>
            ${logoPreview ? html`
              <img src=${logoPreview} alt="Logo" className="w-20 h-20 rounded-2xl object-contain border-2 border-[var(--app-border-soft)] bg-[var(--app-surface)] group-hover:border-indigo-400 transition-colors"
                onError=${() => setFormData(f => ({...f, logo_url: ''}))} />
            ` : html`
              <div className="w-20 h-20 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-2xl font-semibold border-2 border-dashed border-[var(--app-border-soft)] group-hover:border-indigo-400 transition-colors">
                ${(formData.name || 'C')[0].toUpperCase()}
              </div>
            `}
            <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
              <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            ${(uploading || fetchingLogo) ? html`<div className="absolute inset-0 rounded-2xl bg-[var(--app-surface)]/80 flex items-center justify-center"><div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" /></div>` : null}
          </div>
          <input ref=${fileInputRef} type="file" accept="image/*" className="hidden" onChange=${handleFileUpload} />
        </div>
        <div className="flex-1 space-y-3">
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
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Company ID</label>
          <input
            type="text"
            value=${formData.id}
            onChange=${(e) => setFormData({ ...formData, id: e.target.value })}
            disabled=${isEditing}
            className=${'w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ' + (errors.id ? 'border-[var(--app-danger)]' : 'border-[var(--app-border-soft)]') + (isEditing ? ' bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]' : '')}
            placeholder="comp_123"
            required
          />
          ${errors.id && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.id}</p>`}
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
            Company Name <span className="text-[var(--app-danger)]">*</span>
          </label>
          <input
            type="text"
            value=${formData.name}
            onChange=${(e) => setFormData({ ...formData, name: e.target.value })}
            onBlur=${() => { if (!isEditing && formData.name.length > 3 && !formData.logo_url) fetchCompanyLogo(formData.name); }}
            className=${'w-full px-4 py-3 rounded-xl border focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 ' + (errors.name ? 'border-[var(--app-danger)]' : 'border-[var(--app-border-soft)]')}
            placeholder="McKinsey & Company"
            required
          />
          ${errors.name && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.name}</p>`}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Headquarters</label>
          <input
            type="text"
            value=${formData.headquarters}
            onChange=${(e) => setFormData({ ...formData, headquarters: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="e.g. New York, USA"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Founding Year</label>
          <input
            type="number"
            min="1800"
            max="2100"
            value=${formData.founding_year}
            onChange=${(e) => setFormData({ ...formData, founding_year: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            placeholder="e.g. 1926"
          />
        </div>
      </div>
      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Description</label>
        <textarea
          value=${formData.description}
          onChange=${(e) => setFormData({ ...formData, description: e.target.value })}
          rows=${4}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="Company overview (no salary details)"
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
            <option value="LISTED">LISTED (Full details, no recruitment)</option>
            <option value="PARTNER">PARTNER (Full recruitment access)</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Allowed Roles</label>
          <p className="text-xs text-[var(--app-text-muted)] mb-3">Roles that can be assigned to users within this company</p>
          <div className="flex flex-wrap gap-2">
            ${COMPANY_ROLES.map(role => {
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
                  <span className="text-sm font-medium">${role}</span>
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
          className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          ${submitting ? 'Saving...' : (isEditing ? 'Update Company' : 'Create Company')}
        </button>
        <button
          type="button"
          onClick=${onCancel}
          className="px-6 py-3 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl font-bold hover:bg-[var(--app-border-soft)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  `;
};

export default CompanyForm;
