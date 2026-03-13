import React from 'react';
import htm from 'htm';
import Modal from '../primitives/Modal.js';
import Button from '../primitives/Button.js';

const html = htm.bind(React.createElement);

const AlertDialog = ({ open, title = 'Notice', message, onClose }) => {
  return html`
    <${Modal} open=${open} onClose=${onClose} title=${title}>
      <p className="text-[var(--app-text-secondary)] mb-[var(--app-space-6)]">${message}</p>
      <div className="flex justify-end">
        <${Button} variant="primary" onClick=${onClose}>OK<//>
      </div>
    <//>
  `;
};

export default AlertDialog;
