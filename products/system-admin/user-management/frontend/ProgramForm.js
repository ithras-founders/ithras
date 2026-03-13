import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { createProgram, updateProgram } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const ProgramForm = ({ institutionId, program, onSuccess, onCancel }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    code: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (program) {
      setFormData({
        id: program.id,
        name: program.name || '',
        code: program.code || ''
      });
    } else {
      setFormData({
        id: `prog_${institutionId}_${Date.now()}`,
        name: '',
        code: ''
      });
    }
  }, [program, institutionId]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!formData.id.trim()) {
      newErrors.id = 'ID is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      if (program) {
        await updateProgram(program.id, {
          name: formData.name,
          code: formData.code || null
        });
      } else {
        await createProgram(institutionId, {
          id: formData.id,
          institution_id: institutionId,
          name: formData.name,
          code: formData.code || null
        });
      }
      onSuccess();
    } catch (error) {
      toast.error('Failed to save program: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return html`
    <form onSubmit=${handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-[var(--app-text-primary)] mb-4">
          ${program ? 'Edit Program' : 'Add New Program'}
        </h3>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Program ID
        </label>
        <input
          type="text"
          value=${formData.id}
          onChange=${(e) => setFormData({ ...formData, id: e.target.value })}
          disabled=${!!program}
          className=${`w-full px-4 py-3 rounded-xl border ${
            errors.id ? 'border-red-300' : 'border-[var(--app-border-soft)]'
          } focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200`}
          placeholder="prog_mba_1"
        />
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
          placeholder="MBA"
          required
        />
        ${errors.name && html`<p className="text-[var(--app-danger)] text-xs mt-1">${errors.name}</p>`}
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">
          Code
        </label>
        <input
          type="text"
          value=${formData.code}
          onChange=${(e) => setFormData({ ...formData, code: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          placeholder="MBA-EX"
        />
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled=${submitting}
          className="flex-1 px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-[11px] font-semibold uppercase tracking-widest shadow-lg hover:bg-[var(--app-accent-hover)] disabled:opacity-50 transition-colors"
        >
          ${submitting ? 'Saving...' : (program ? 'Update Program' : 'Create Program')}
        </button>
        <button
          type="button"
          onClick=${onCancel}
          className="px-6 py-3 bg-[var(--app-surface)] border border-[var(--app-border-soft)] text-[var(--app-text-secondary)] rounded-xl text-[11px] font-semibold uppercase tracking-widest hover:bg-[var(--app-surface-muted)] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  `;
};

export default ProgramForm;
