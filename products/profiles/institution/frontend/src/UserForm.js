import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { createUser } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

// UserForm - Create users of any role (Placement Team, Faculty Observer, Student, Alumni, etc.)
// For institution-based roles, institution selection is required
// For recruiters, company selection is required
const UserForm = ({ institutions, companies, preSelectedInstitution, preSelectedCompany, onSuccess, onCancel }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: preSelectedCompany ? UserRole.RECRUITER : UserRole.CANDIDATE,
    institution_id: preSelectedInstitution || '',
    company_id: preSelectedCompany || '',
    sector_preferences: []
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Update institution_id when preSelectedInstitution changes
  useEffect(() => {
    if (preSelectedInstitution) {
      setFormData(prev => {
        // Don't override role if it's already set to an institution role
        const newRole = institutionRequiredRoles.includes(prev.role) 
          ? prev.role 
          : UserRole.CANDIDATE;
        return { ...prev, institution_id: preSelectedInstitution, role: newRole };
      });
    }
  }, [preSelectedInstitution]);

  // Update company_id when preSelectedCompany changes
  useEffect(() => {
    if (preSelectedCompany) {
      setFormData(prev => ({ ...prev, company_id: preSelectedCompany, role: UserRole.RECRUITER }));
    }
  }, [preSelectedCompany]);

  const generateUserId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const rolePrefix = formData.role.toLowerCase().replace('_', '');
    return `${rolePrefix}_${timestamp}_${random}`;
  };

  const handleIdChange = (e) => {
    setFormData({ ...formData, id: e.target.value });
  };

  const handleGenerateId = () => {
    setFormData({ ...formData, id: generateUserId() });
  };

  // Roles that require an institution
  const institutionRequiredRoles = [
    UserRole.CANDIDATE,
    UserRole.PLACEMENT_TEAM,
    UserRole.PLACEMENT_ADMIN,
    UserRole.FACULTY_OBSERVER,
    UserRole.INSTITUTION_ADMIN,
    UserRole.ALUMNI
  ];

  // Roles that can have a company
  const companyRoles = [UserRole.RECRUITER];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (institutionRequiredRoles.includes(formData.role) && !formData.institution_id) {
      newErrors.institution_id = 'Institution is required for this role';
    }
    if (companyRoles.includes(formData.role) && !formData.company_id) {
      newErrors.company_id = 'Company is required for this role';
    }
    if (!formData.id.trim()) {
      newErrors.id = 'User ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await createUser({
        id: formData.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        institution_id: formData.institution_id || null,
        company_id: formData.company_id || null,
        sector_preferences: formData.sector_preferences || []
      });
      onSuccess();
    } catch (error) {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('already exists')) {
        setErrors({ email: 'A user with this email already exists' });
      } else {
        toast.error('Failed to create user: ' + errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // If institution is pre-selected, only show institution-level roles
  // If company is pre-selected, only show recruiter role
  const roleOptions = preSelectedCompany ? [
    { value: UserRole.RECRUITER, label: 'Recruiter', requiresCompany: true }
  ] : preSelectedInstitution ? [
    { value: UserRole.CANDIDATE, label: 'Student (Candidate)', requiresInstitution: true },
    { value: UserRole.PLACEMENT_TEAM, label: 'Placement Team', requiresInstitution: true },
    { value: UserRole.PLACEMENT_ADMIN, label: 'Placement Admin', requiresInstitution: true },
    { value: UserRole.FACULTY_OBSERVER, label: 'Faculty Observer', requiresInstitution: true },
    { value: UserRole.INSTITUTION_ADMIN, label: 'Institution Admin', requiresInstitution: true },
    { value: UserRole.ALUMNI, label: 'Alumni', requiresInstitution: true }
  ] : [
    { value: UserRole.CANDIDATE, label: 'Student (Candidate)', requiresInstitution: true },
    { value: UserRole.PLACEMENT_TEAM, label: 'Placement Team', requiresInstitution: true },
    { value: UserRole.PLACEMENT_ADMIN, label: 'Placement Admin', requiresInstitution: true },
    { value: UserRole.FACULTY_OBSERVER, label: 'Faculty Observer', requiresInstitution: true },
    { value: UserRole.INSTITUTION_ADMIN, label: 'Institution Admin', requiresInstitution: true },
    { value: UserRole.ALUMNI, label: 'Alumni', requiresInstitution: true }
  ];

  return html`
    <form onSubmit=${handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-6">Create New User</h3>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          User ID
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value=${formData.id}
            onChange=${handleIdChange}
            className=${`flex-1 px-4 py-3 rounded-xl border ${
              errors.id ? 'border-red-300' : 'border-[var(--app-border-soft)]'
            } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
            placeholder="user_123"
            required
          />
          <button
            type="button"
            onClick=${handleGenerateId}
            className="px-4 py-3 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl text-[10px] font-semibold uppercase hover:bg-[var(--app-border-soft)] transition-colors"
          >
            Generate
          </button>
        </div>
        ${errors.id && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.id}</p>`}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Name <span className="text-[var(--app-danger)]">*</span>
        </label>
        <input
          type="text"
          value=${formData.name}
          onChange=${(e) => setFormData({ ...formData, name: e.target.value })}
          className=${`w-full px-4 py-3 rounded-xl border ${
            errors.name ? 'border-red-300' : 'border-[var(--app-border-soft)]'
          } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
          placeholder="John Doe"
          required
        />
        ${errors.name && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.name}</p>`}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Email <span className="text-[var(--app-danger)]">*</span>
        </label>
        <input
          type="email"
          value=${formData.email}
          onChange=${(e) => setFormData({ ...formData, email: e.target.value })}
          className=${`w-full px-4 py-3 rounded-xl border ${
            errors.email ? 'border-red-300' : 'border-[var(--app-border-soft)]'
          } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
          placeholder="user@example.com"
          required
        />
        ${errors.email && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.email}</p>`}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Role <span className="text-[var(--app-danger)]">*</span>
        </label>
        <select
          value=${formData.role}
          onChange=${(e) => {
            const newRole = e.target.value;
            setFormData({
              ...formData,
              role: newRole,
              institution_id: institutionRequiredRoles.includes(newRole) ? formData.institution_id : '',
              company_id: companyRoles.includes(newRole) ? formData.company_id : ''
            });
          }}
          disabled=${preSelectedCompany}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed"
          required
        >
          ${roleOptions.map(option => html`
            <option key=${option.value} value=${option.value}>${option.label}</option>
          `)}
        </select>
        ${preSelectedCompany && html`
          <p className="text-xs text-[var(--app-text-muted)] mt-1">Role is automatically set to Recruiter for company context</p>
        `}
        ${preSelectedInstitution && !preSelectedCompany && html`
          <p className="text-xs text-[var(--app-text-muted)] mt-1">Select a role for this institution user</p>
        `}
      </div>

      ${institutionRequiredRoles.includes(formData.role) ? html`
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
            Institution <span className="text-[var(--app-danger)]">*</span>
          </label>
          <select
            value=${formData.institution_id}
            onChange=${(e) => setFormData({ ...formData, institution_id: e.target.value })}
            disabled=${preSelectedInstitution}
            className=${`w-full px-4 py-3 rounded-xl border ${
              errors.institution_id ? 'border-red-300' : 'border-[var(--app-border-soft)]'
            } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed`}
            required
          >
            <option value="">Select Institution</option>
            ${institutions.map(inst => html`
              <option key=${inst.id} value=${inst.id}>${inst.name}</option>
            `)}
          </select>
          ${preSelectedInstitution && html`<p className="text-xs text-[var(--app-text-muted)] mt-1">Institution is pre-selected</p>`}
          ${errors.institution_id && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.institution_id}</p>`}
        </div>
      ` : ''}

      ${companyRoles.includes(formData.role) ? html`
        <div>
          <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
            Company <span className="text-[var(--app-danger)]">*</span>
          </label>
          <select
            value=${formData.company_id}
            onChange=${(e) => setFormData({ ...formData, company_id: e.target.value })}
            disabled=${preSelectedCompany}
            className=${`w-full px-4 py-3 rounded-xl border ${
              errors.company_id ? 'border-red-300' : 'border-[var(--app-border-soft)]'
            } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-[var(--app-surface-muted)] disabled:cursor-not-allowed`}
            required
          >
            <option value="">Select Company</option>
            ${companies.map(comp => html`
              <option key=${comp.id} value=${comp.id}>${comp.name}</option>
            `)}
          </select>
          ${preSelectedCompany && html`<p className="text-xs text-[var(--app-text-muted)] mt-1">Company is pre-selected</p>`}
          ${errors.company_id && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.company_id}</p>`}
        </div>
      ` : ''}

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled=${submitting}
          className="flex-1 px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl font-bold hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          ${submitting ? 'Creating...' : 'Create User'}
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

export default UserForm;
