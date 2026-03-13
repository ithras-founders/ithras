import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { updateMe } from '../services/api.js';
import Modal from '../primitives/Modal.js';
import Input from '../primitives/Input.js';
import Button from '../primitives/Button.js';
import { toDisplayString } from '../utils/displayUtils.js';

const html = htm.bind(React.createElement);

const AccountSettingsModal = ({ open, user, onClose, onSaved }) => {
  const [name, setName] = useState(() => toDisplayString(user?.name) || '');
  const [email, setEmail] = useState(() => toDisplayString(user?.email) || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && user) {
      setName(toDisplayString(user.name) || '');
      setEmail(toDisplayString(user.email) || '');
      setError(null);
    }
  }, [open, user]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!user) return;
    setError(null);
    setSaving(true);
    try {
      const payload = {};
      if (name.trim() !== (user.name || '')) payload.name = name.trim();
      if (email.trim() !== (user.email || '')) payload.email = email.trim().toLowerCase();
      if (Object.keys(payload).length === 0) {
        onClose?.();
        return;
      }
      const res = await updateMe(payload);
      const updatedUser = res?.user;
      if (updatedUser) onSaved?.(updatedUser);
      onClose?.();
    } catch (err) {
      setError(err?.message || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return html`
    <${Modal} open=${open} onClose=${onClose} title="Settings">
      <p className="text-[var(--app-text-secondary)] text-[var(--app-text-sm)] mb-[var(--app-space-4)]">
        Update your display name or email. Email must be unique and is used to sign in.
      </p>
      <form onSubmit=${handleSubmit}>
        <div className="space-y-4">
          <${Input}
            label="Display name"
            id="account-name"
            type="text"
            value=${name}
            onChange=${(e) => setName(e.target.value)}
            placeholder="Your name"
          />
          <${Input}
            label="Email"
            id="account-email"
            type="email"
            value=${email}
            onChange=${(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        ${error ? html`
          <div className="mt-4 p-3 bg-[var(--app-danger-soft)] rounded-[var(--app-radius-sm)] text-[var(--app-text-sm)] text-[var(--app-danger)]">
            ${error}
          </div>
        ` : null}
        <div className="flex gap-3 justify-end mt-6">
          <${Button} type="button" variant="secondary" onClick=${onClose}>
            Cancel
          <//>
          <${Button} type="submit" variant="primary" disabled=${saving}>
            ${saving ? 'Saving...' : 'Save'}
          <//>
        </div>
      </form>
    <//>
  `;
};

export default AccountSettingsModal;
