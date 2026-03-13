import React, { useState } from 'react';
import htm from 'htm';
import ProgramForm from './ProgramForm.js';
import ProgramPolicyConfig from './ProgramPolicyConfig.js';

const html = htm.bind(React.createElement);

const ProgramList = ({
  institutionId,
  programs,
  onProgramCreated,
  onProgramDeleted,
  onEditProgram,
  deleteProgram,
  confirm,
  toast
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);

  const handleDelete = async (prog) => {
    if (!(await confirm({ message: `Delete program "${prog.name}"? Users and policies must be moved first.` }))) return;
    try {
      await deleteProgram(prog.id);
      onProgramDeleted();
    } catch (error) {
      toast.error('Failed to delete program: ' + (error.message || 'Unknown error'));
    }
  };

  return html`
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-semibold text-[var(--app-text-secondary)] uppercase tracking-wider">Programs</h5>
        <button
          onClick=${() => { setEditingProgram(null); setShowForm(true); }}
          className="px-4 py-2 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-lg text-[10px] font-semibold uppercase hover:bg-[var(--app-border-soft)] transition-colors"
        >
          + Add Program
        </button>
      </div>
      ${showForm ? html`
        <div className="p-4 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]">
          <${ProgramForm}
            institutionId=${institutionId}
            program=${editingProgram}
            onSuccess=${() => { setShowForm(false); setEditingProgram(null); onProgramCreated(); }}
            onCancel=${() => { setShowForm(false); setEditingProgram(null); }}
          />
        </div>
      ` : programs.length === 0 ? html`
        <p className="text-xs text-[var(--app-text-muted)] italic py-3">No programs yet. Add a program to assign students and policies.</p>
      ` : html`
        <div className="space-y-2">
          ${programs.map(prog => html`
            <div key=${prog.id} className="flex items-center justify-between p-3 bg-[var(--app-surface-muted)] rounded-xl border border-[var(--app-border-soft)]">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--app-text-primary)]">${prog.name}</span>
                  ${prog.code ? html`<span className="text-xs text-[var(--app-text-secondary)]">(${prog.code})</span>` : ''}
                </div>
                <${ProgramPolicyConfig}
                  program=${prog}
                  institutionId=${institutionId}
                  onPolicyUpdated=${onProgramCreated}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick=${() => { setEditingProgram(prog); setShowForm(true); }}
                  className="px-3 py-1 text-[10px] font-semibold uppercase text-[var(--app-text-secondary)] hover:bg-[var(--app-border-soft)] rounded-lg transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick=${() => handleDelete(prog)}
                  className="px-3 py-1 text-[10px] font-semibold uppercase text-[var(--app-danger)] hover:bg-[rgba(255,59,48,0.08)] rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          `)}
        </div>
      `}
    </div>
  `;
};

export default ProgramList;
