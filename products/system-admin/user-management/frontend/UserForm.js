import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { createUser, getAssignableRoles } from '/core/frontend/src/modules/shared/services/api.js';
import { UserRole } from '/core/frontend/src/modules/shared/types.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const ROLE_LABELS = {
  [UserRole.CANDIDATE]: 'Student (Candidate)',
  [UserRole.PLACEMENT_TEAM]: 'Placement Team',
  [UserRole.PLACEMENT_ADMIN]: 'Placement Admin',
  [UserRole.FACULTY_OBSERVER]: 'Faculty Observer',
  [UserRole.INSTITUTION_ADMIN]: 'Institution Admin',
  [UserRole.ALUMNI]: 'Alumni',
  [UserRole.RECRUITER]: 'Recruiter',
};

// UserForm - Create users of any role (Placement Team, Faculty Observer, Student, Alumni, etc.)
// For institution-based roles, institution selection is required
// For recruiters, company selection is required
const UserForm = ({ institutions, companies, programs = {}, preSelectedInstitution, preSelectedCompany, onSuccess, onCancel, onBack }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: preSelectedCompany ? UserRole.RECRUITER : UserRole.CANDIDATE,
    institution_id: preSelectedInstitution || '',
    company_id: preSelectedCompany || '',
    program_id: '',
    sector_preferences: []
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [assignableRoles, setAssignableRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // Fetch assignable roles when context is pre-selected
  useEffect(() => {
    if (preSelectedInstitution) {
      setLoadingRoles(true);
      getAssignableRoles({ institution_id: preSelectedInstitution })
        .then((roles) => {
          const ids = Array.isArray(roles) ? roles.map(r => r.id) : [];
          setAssignableRoles(ids);
          setFormData(prev => {
            if (ids.length > 0 && !ids.includes(prev.role)) {
              return { ...prev, role: ids[0] };
            }
            return prev;
          });
        })
        .catch(() => setAssignableRoles([]))
        .finally(() => setLoadingRoles(false));
    } else if (preSelectedCompany) {
      setLoadingRoles(true);
      getAssignableRoles({ company_id: preSelectedCompany })
        .then((roles) => {
          const ids = Array.isArray(roles) ? roles.map(r => r.id) : [];
          setAssignableRoles(ids);
          setFormData(prev => {
            if (ids.length > 0 && !ids.includes(prev.role)) {
              return { ...prev, role: ids[0] };
            }
            return prev;
          });
        })
        .catch(() => setAssignableRoles([]))
        .finally(() => setLoadingRoles(false));
    } else {
      setAssignableRoles([]);
    }
  }, [preSelectedInstitution, preSelectedCompany]);

  // Update institution_id when preSelectedInstitution changes
  useEffect(() => {
    if (preSelectedInstitution) {
      setFormData(prev => {
        const newRole = institutionRequiredRoles.includes(prev.role)
          ? prev.role
          : UserRole.CANDIDATE;
        return { ...prev, institution_id: preSelectedInstitution, role: newRole, program_id: '' };
      });
    }
  }, [preSelectedInstitution]);

  const institutionPrograms = (preSelectedInstitution && programs[preSelectedInstitution]) || [];

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
    if (formData.role === UserRole.CANDIDATE && !formData.program_id) {
      newErrors.program_id = 'Program is required for students';
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
      const createdUser = await createUser({
        id: formData.id,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        institution_id: formData.institution_id || null,
        company_id: formData.company_id || null,
        program_id: formData.program_id || null,
        sector_preferences: formData.sector_preferences || []
      });
      onSuccess(createdUser);
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

  // If context pre-selected, use assignable roles from API; otherwise fallback to full list
  const roleOptions = (preSelectedInstitution || preSelectedCompany) && assignableRoles.length > 0
    ? assignableRoles.map(roleId => ({
        value: roleId,
        label: ROLE_LABELS[roleId] || roleId.replace(/_/g, ' '),
        requiresCompany: roleId === UserRole.RECRUITER,
        requiresInstitution: institutionRequiredRoles.includes(roleId),
      }))
    : preSelectedCompany ? [
        { value: UserRole.RECRUITER, label: 'Recruiter', requiresCompany: true }
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
      <div className="flex items-center gap-3 mb-6">
        ${onBack ? html`
          <button type="button" onClick=${onBack} className="p-2 hover:bg-[var(--app-surface-muted)] rounded-lg transition-colors">
            <svg className="w-5 h-5 text-[var(--app-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
        ` : null}
        <h3 className="text-2xl font-semibold text-[var(--app-text-primary)]">Create New User</h3>
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
        ${loadingRoles ? html`
          <div className="flex items-center gap-2 py-3 text-sm text-[var(--app-text-muted)]">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            Loading roles...
          </div>
        ` : html`
        <select
          value=${formData.role}
          onChange=${(e) => {
            const newRole = e.target.value;
            setFormData({
              ...formData,
              role: newRole,
              institution_id: institutionRequiredRoles.includes(newRole) ? formData.institution_id : '',
              company_id: companyRoles.includes(newRole) ? formData.company_id : '',
              program_id: newRole === UserRole.CANDIDATE ? formData.program_id : ''
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
        `}
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
        ${formData.role === UserRole.CANDIDATE && formData.institution_id && institutionPrograms.length > 0 ? html`
          <div>
            <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
              Program <span className="text-[var(--app-danger)]">*</span>
            </label>
            <select
              value=${formData.program_id}
              onChange=${(e) => setFormData({ ...formData, program_id: e.target.value })}
              className=${`w-full px-4 py-3 rounded-xl border ${
                errors.program_id ? 'border-red-300' : 'border-[var(--app-border-soft)]'
              } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
              required
            >
              <option value="">Select Program</option>
              ${institutionPrograms.map(prog => html`
                <option key=${prog.id} value=${prog.id}>${prog.name}${prog.code ? ` (${prog.code})` : ''}</option>
              `)}
            </select>
            <p className="text-xs text-[var(--app-text-muted)] mt-1">Students must belong to a program within the institution</p>
            ${errors.program_id && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.program_id}</p>`}
          </div>
        ` : formData.role === UserRole.CANDIDATE && formData.institution_id && institutionPrograms.length === 0 ? html`
          <p className="text-amber-600 text-xs">No programs in this institution. Add a program first in the institution card.</p>
        ` : ''}
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
