import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TimetableBlockEditor = ({ block, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    day_of_week: block?.day_of_week ?? 0,
    start_time: block?.start_time ?? '09:00',
    end_time: block?.end_time ?? '10:00',
    block_type: block?.block_type ?? 'CLASS',
    recurring: block?.recurring !== undefined ? block.recurring : true,
    start_date: block?.start_date ? new Date(block.start_date).toISOString().split('T')[0] : '',
    end_date: block?.end_date ? new Date(block.end_date).toISOString().split('T')[0] : ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      day_of_week: parseInt(formData.day_of_week),
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null
    });
  };

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return html`
    <form onSubmit=${handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Day of Week</label>
        <select
          value=${formData.day_of_week}
          onChange=${(e) => setFormData({ ...formData, day_of_week: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
          required
        >
          ${days.map((day, idx) => html`
            <option key=${idx} value=${idx}>${day}</option>
          `)}
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Start Time</label>
          <input
            type="time"
            value=${formData.start_time}
            onChange=${(e) => setFormData({ ...formData, start_time: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            required
          />
        </div>
        
        <div>
          <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">End Time</label>
          <input
            type="time"
            value=${formData.end_time}
            onChange=${(e) => setFormData({ ...formData, end_time: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            required
          />
        </div>
      </div>
      
      <div>
        <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Block Type</label>
        <select
          value=${formData.block_type}
          onChange=${(e) => setFormData({ ...formData, block_type: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
        >
          <option value="CLASS">Class</option>
          <option value="EXAM">Exam</option>
          <option value="PERSONAL">Personal</option>
        </select>
      </div>
      
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="recurring"
          checked=${formData.recurring}
          onChange=${(e) => setFormData({ ...formData, recurring: e.target.checked })}
          className="w-4 h-4 rounded border-[var(--app-border-soft)]"
        />
        <label htmlFor="recurring" className="text-sm font-bold text-[var(--app-text-secondary)]">Recurring</label>
      </div>
      
      ${formData.recurring && html`
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">Start Date</label>
            <input
              type="date"
              value=${formData.start_date}
              onChange=${(e) => setFormData({ ...formData, start_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-2">End Date</label>
            <input
              type="date"
              value=${formData.end_date}
              onChange=${(e) => setFormData({ ...formData, end_date: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)]"
            />
          </div>
        </div>
      `}
      
      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick=${onCancel}
          className="flex-1 px-6 py-3 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-border-soft)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-[var(--app-accent)] text-white rounded-xl text-sm font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          ${block ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  `;
};

export default TimetableBlockEditor;
