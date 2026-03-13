import React, { useState } from 'react';
import htm from 'htm';
import { progressStudentsBulk } from '/core/frontend/src/modules/shared/services/api.js';
import { useToast } from '/core/frontend/src/modules/shared/index.js';

const html = htm.bind(React.createElement);

const StudentProgressionSelector = ({ workflowId, stageId, studentIds, requestedBy }) => {
  const toast = useToast();
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const handleToggle = (studentId) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    try {
      setSubmitting(true);
      await progressStudentsBulk(workflowId, stageId, selectedStudents, requestedBy);
      toast.success('Progression request submitted for approval');
      setSelectedStudents([]);
    } catch (error) {
      toast.error('Failed to submit progression: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return html`
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-[var(--app-text-secondary)]">Select students to progress to next stage</p>
        <span className="text-xs text-[var(--app-text-secondary)]">${selectedStudents.length} selected</span>
      </div>
      
      <div className="space-y-2 max-h-48 overflow-y-auto">
        ${studentIds.map(studentId => html`
          <label key=${studentId} className="flex items-center gap-3 p-3 bg-[var(--app-surface)] rounded-lg cursor-pointer hover:bg-[var(--app-surface-muted)]">
            <input
              type="checkbox"
              checked=${selectedStudents.includes(studentId)}
              onChange=${() => handleToggle(studentId)}
              className="w-4 h-4 rounded border-[var(--app-border-soft)] text-[var(--app-accent)]"
            />
            <span className="text-sm text-[var(--app-text-secondary)]">Student ${studentId.slice(-8)}</span>
          </label>
        `)}
      </div>
      
      <button
        onClick=${handleSubmit}
        disabled=${submitting || selectedStudents.length === 0}
        className="w-full px-4 py-2 bg-[var(--app-accent)] text-white rounded-xl text-[10px] font-semibold uppercase tracking-widest hover:bg-[var(--app-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        ${submitting ? 'Submitting...' : 'Submit for Approval'}
      </button>
    </div>
  `;
};

export default StudentProgressionSelector;
