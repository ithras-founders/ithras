import React from 'react';
import htm from 'htm';
import Modal from '../primitives/Modal.js';
import Button from '../primitives/Button.js';

const html = htm.bind(React.createElement);

const ConfirmDialog = ({ open, title = 'Confirm', message, onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Cancel' }) => {
  return html`
    <${Modal} open=${open} onClose=${onCancel} title=${title}>
      <p className="text-[var(--app-text-secondary)] mb-[var(--app-space-6)]">${message}</p>
      <div className="flex gap-[var(--app-space-3)] justify-end">
        <${Button} variant="secondary" onClick=${onCancel}>${cancelLabel}<//>
        <${Button} variant="primary" onClick=${onConfirm}>${confirmLabel}<//>
      </div>
    <//>
  `;
};

export default ConfirmDialog;
