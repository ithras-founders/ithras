import React, { useState, useEffect, useCallback } from 'react';
import htm from 'htm';
import { getInstitutions, getCompanies } from '/core/frontend/src/modules/shared/services/api.js';
import { Modal } from '/core/frontend/src/modules/shared/primitives/index.js';
import UserForm from './UserForm.js';

const html = htm.bind(React.createElement);

const AddUserModal = ({ open, onClose, preselectedContext, onSuccess, institutions: institutionsProp, companies: companiesProp, programsByInstitution }) => {
  const [step, setStep] = useState(preselectedContext ? 'form' : 'context');
  const [selectedContext, setSelectedContext] = useState(
    preselectedContext ? { type: preselectedContext.type, id: preselectedContext.id } : { type: null, id: null }
  );
  const [institutions, setInstitutions] = useState(institutionsProp || []);
  const [companies, setCompanies] = useState(companiesProp || []);

  const needsContextStep = !preselectedContext;

  const fetchOptions = useCallback(async () => {
    if (institutionsProp?.length && companiesProp?.length) return;
    try {
      const [instRes, compRes] = await Promise.all([
        getInstitutions({ limit: 500 }).catch(() => ({ items: [] })),
        getCompanies({ limit: 500 }).catch(() => ({ items: [] })),
      ]);
      setInstitutions(prev => prev.length ? prev : (instRes?.items ?? []));
      setCompanies(prev => prev.length ? prev : (compRes?.items ?? []));
    } catch {
      if (institutionsProp?.length) setInstitutions(institutionsProp);
      if (companiesProp?.length) setCompanies(companiesProp);
    }
  }, [institutionsProp, companiesProp]);

  useEffect(() => {
    if (open && needsContextStep) fetchOptions();
  }, [open, needsContextStep, fetchOptions]);

  useEffect(() => {
    if (open && preselectedContext) {
      setStep('form');
      setSelectedContext({ type: preselectedContext.type, id: preselectedContext.id });
    } else if (open && !preselectedContext) {
      setStep('context');
      setSelectedContext({ type: null, id: null });
    }
  }, [open, preselectedContext]);

  const handleClose = () => {
    setStep(needsContextStep ? 'context' : 'form');
    setSelectedContext(needsContextStep ? { type: null, id: null } : { type: preselectedContext?.type, id: preselectedContext?.id });
    onClose?.();
  };

  const handleSuccess = (createdUser) => {
    setStep(needsContextStep ? 'context' : 'form');
    setSelectedContext(needsContextStep ? { type: null, id: null } : { type: preselectedContext?.type, id: preselectedContext?.id });
    onSuccess?.(createdUser);
    handleClose();
  };

  const handleCancel = () => {
    if (step === 'form' && needsContextStep) {
      setStep('context');
      setSelectedContext({ type: null, id: null });
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    setStep('context');
    setSelectedContext({ type: null, id: null });
  };

  if (!open) return null;

  const renderContent = () => {
    if (step === 'context') {
      return html`
        <div className="space-y-6">
          <p className="text-sm text-[var(--app-text-secondary)]">
            Every user must be assigned within an institution or company. Select where this user will belong.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              className=${'rounded-2xl border-2 p-6 cursor-pointer transition-colors ' + (selectedContext.type === 'institution' ? 'border-indigo-500 bg-indigo-50/50' : 'border-[var(--app-border-soft)] hover:border-indigo-300')}
              onClick=${() => setSelectedContext({ type: 'institution', id: selectedContext.type === 'institution' ? selectedContext.id : '' })}
            >
              <h3 className="font-bold text-[var(--app-text-primary)] mb-2">Institution</h3>
              <p className="text-xs text-[var(--app-text-muted)] mb-4">Students, Placement Team, Faculty, Alumni, etc.</p>
              <select
                value=${selectedContext.type === 'institution' ? selectedContext.id : ''}
                onClick=${(e) => e.stopPropagation()}
                onChange=${(e) => setSelectedContext({ type: 'institution', id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select institution...</option>
                ${(institutions || []).map(i => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
              </select>
            </div>
            <div
              className=${'rounded-2xl border-2 p-6 cursor-pointer transition-colors ' + (selectedContext.type === 'company' ? 'border-indigo-500 bg-indigo-50/50' : 'border-[var(--app-border-soft)] hover:border-indigo-300')}
              onClick=${() => setSelectedContext({ type: 'company', id: selectedContext.type === 'company' ? selectedContext.id : '' })}
            >
              <h3 className="font-bold text-[var(--app-text-primary)] mb-2">Company</h3>
              <p className="text-xs text-[var(--app-text-muted)] mb-4">Recruiters</p>
              <select
                value=${selectedContext.type === 'company' ? selectedContext.id : ''}
                onClick=${(e) => e.stopPropagation()}
                onChange=${(e) => setSelectedContext({ type: 'company', id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-bg)] focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select company...</option>
                ${(companies || []).map(c => html`<option key=${c.id} value=${c.id}>${c.name}</option>`)}
              </select>
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button
              onClick=${() => selectedContext.type && selectedContext.id && setStep('form')}
              disabled=${!selectedContext.type || !selectedContext.id}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Continue
            </button>
            <button
              onClick=${handleClose}
              className="px-6 py-3 bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)] rounded-xl font-bold hover:bg-[var(--app-surface)]"
            >
              Cancel
            </button>
          </div>
        </div>
      `;
    }

    return html`
      <${UserForm}
        institutions=${institutions || []}
        companies=${companies || []}
        programs=${programsByInstitution || {}}
        preSelectedInstitution=${selectedContext.type === 'institution' ? selectedContext.id : null}
        preSelectedCompany=${selectedContext.type === 'company' ? selectedContext.id : null}
        onBack=${needsContextStep ? handleBack : undefined}
        onSuccess=${handleSuccess}
        onCancel=${handleCancel}
      />
    `;
  };

  return html`
    <${Modal}
      open=${open}
      onClose=${handleClose}
      title=${step === 'context' ? 'Add User — Select Context' : (selectedContext.type === 'institution' ? 'Add Staff / Student' : 'Add Recruiter')}
      size="full"
    >
      ${renderContent()}
    </${Modal}>
  `;
};

export default AddUserModal;
