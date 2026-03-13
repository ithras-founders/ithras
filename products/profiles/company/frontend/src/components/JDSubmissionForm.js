import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const JDSubmissionForm = ({ workflowId, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    job_title: '',
    job_description: '',
    sector: '',
    slot: '',
    fixed_comp: '',
    variable_comp: '',
    esops_vested: '',
    joining_bonus: '',
    performance_bonus: '',
    is_top_decile: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      fixed_comp: parseFloat(formData.fixed_comp) || null,
      variable_comp: parseFloat(formData.variable_comp) || null,
      esops_vested: parseFloat(formData.esops_vested) || null,
      joining_bonus: parseFloat(formData.joining_bonus) || null,
      performance_bonus: parseFloat(formData.performance_bonus) || null
    });
  };

  return html`
    <div className="bg-[var(--app-surface)] p-8 rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)]">
      <h3 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-6">JD & Compensation Form</h3>
      
      <form onSubmit=${handleSubmit} className="space-y-6">
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Job Title *</label>
          <input
            type="text"
            value=${formData.job_title}
            onChange=${(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Job Description</label>
          <textarea
            value=${formData.job_description}
            onChange=${(e) => setFormData({ ...formData, job_description: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            rows="5"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Sector</label>
            <input
              type="text"
              value=${formData.sector}
              onChange=${(e) => setFormData({ ...formData, sector: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Slot</label>
            <select
              value=${formData.slot}
              onChange=${(e) => setFormData({ ...formData, slot: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            >
              <option value="">Select Slot</option>
              <option value="Slot 1">Slot 1</option>
              <option value="Slot 2">Slot 2</option>
            </select>
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold text-[var(--app-text-primary)] mb-4">Compensation Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Fixed Compensation</label>
              <input
                type="number"
                value=${formData.fixed_comp}
                onChange=${(e) => setFormData({ ...formData, fixed_comp: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Variable Compensation</label>
              <input
                type="number"
                value=${formData.variable_comp}
                onChange=${(e) => setFormData({ ...formData, variable_comp: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">ESOPs Vested</label>
              <input
                type="number"
                value=${formData.esops_vested}
                onChange=${(e) => setFormData({ ...formData, esops_vested: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Joining Bonus</label>
              <input
                type="number"
                value=${formData.joining_bonus}
                onChange=${(e) => setFormData({ ...formData, joining_bonus: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              />
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Performance Bonus</label>
              <input
                type="number"
                value=${formData.performance_bonus}
                onChange=${(e) => setFormData({ ...formData, performance_bonus: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="top_decile"
            checked=${formData.is_top_decile}
            onChange=${(e) => setFormData({ ...formData, is_top_decile: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--app-border-soft)]"
          />
          <label htmlFor="top_decile" className="text-sm font-bold text-[var(--app-text-secondary)]">Top Decile Position</label>
        </div>
        
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick=${onClose}
            className="flex-1 px-6 py-3 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-border-soft)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] transition-colors"
          >
            Submit for Approval
          </button>
        </div>
      </form>
    </div>
  `;
};

export default JDSubmissionForm;
