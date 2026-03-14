/**
 * Channel visibility selector for admins - set channel to public/private/restricted.
 */
import React, { useState } from 'react';
import htm from 'htm';
import { setChannelVisibility } from '/core/frontend/src/modules/shared/services/api/feed.js';

const html = htm.bind(React.createElement);

const OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'restricted', label: 'Restricted' },
  { value: 'private', label: 'Private' },
];

const ChannelVisibilitySettings = ({ channel, onUpdated, isAdmin }) => {
  const [saving, setSaving] = useState(false);
  const currentVis = channel?.visibility || 'public';

  if (!isAdmin) return null;

  const handleChange = async (vis) => {
    if (!channel?.id && !channel?.code) return;
    setSaving(true);
    try {
      await setChannelVisibility(channel.id || channel.code, vis);
      onUpdated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return html`
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--slate-500)]">Visibility:</span>
      <select
        value=${currentVis}
        onChange=${(e) => handleChange(e.target.value)}
        disabled=${saving}
        className="text-xs px-2 py-1 rounded border border-[var(--slate-200)] bg-white text-[var(--app-text-primary)]"
      >
        ${OPTIONS.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
      </select>
      ${saving ? html`<span className="text-xs text-[var(--slate-500)]">Saving...</span>` : null}
    </div>
  `;
};

export default ChannelVisibilitySettings;
