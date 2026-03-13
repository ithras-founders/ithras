import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import Modal from '../primitives/Modal.js';
import Button from '../primitives/Button.js';

const html = htm.bind(React.createElement);

const PromptDialog = ({ open, title = 'Input', promptMessage, defaultValue = '', onSubmit, onCancel }) => {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setValue(defaultValue);
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, defaultValue]);

  const handleSubmit = (e) => {
    e?.preventDefault?.();
    onSubmit(value);
  };

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onCancel} title=${title}>
      <p className="text-[var(--app-text-secondary)] text-[var(--app-text-base)] mb-[var(--app-space-6)]">
        ${promptMessage}
      </p>
      <form onSubmit=${handleSubmit}>
        <input
          ref=${inputRef}
          type="text"
          value=${value}
          onChange=${(e) => setValue(e.target.value)}
          className="w-full px-4 py-2 app-input app-focus-ring rounded-[var(--app-radius-sm)] mb-[var(--app-space-6)]"
        />
        <div className="flex gap-3 justify-end">
          <${Button} type="button" variant="secondary" onClick=${onCancel}>
            Cancel
          <//>
          <${Button} type="submit" variant="primary">
            OK
          <//>
        </div>
      </form>
    <//>
  `;
};

export default PromptDialog;
