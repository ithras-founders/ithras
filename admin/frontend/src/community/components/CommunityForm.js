/**
 * Community create/edit form - name, type, description, parent entity, channel support.
 */
import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const COMMUNITY_TYPES = [
  { value: 'institution', label: 'Institution' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'function', label: 'Function' },
  { value: 'public', label: 'Public' },
];

const CommunityForm = ({
  community,
  institutions = [],
  organisations = [],
  onSubmit,
  onCancel,
}) => {
  const [name, setName] = useState(community?.name || '');
  const [type, setType] = useState(community?.type || 'public');
  const [description, setDescription] = useState(community?.description || '');
  const [institutionId, setInstitutionId] = useState(community?.institution_id ?? '');
  const [organisationId, setOrganisationId] = useState(community?.organisation_id ?? '');
  const [functionKey, setFunctionKey] = useState(community?.function_key || '');
  const [hasChannels] = useState(true); // All communities have at least a General channel
  const [channels, setChannels] = useState([]);

  const showInstitution = type === 'institution';
  const showOrganisation = type === 'organisation';
  const showFunction = type === 'function';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      type,
      description: description.trim() || null,
      has_channels: hasChannels,
      institution_id: showInstitution && institutionId ? parseInt(institutionId, 10) : null,
      organisation_id: showOrganisation && organisationId ? parseInt(organisationId, 10) : null,
      function_key: showFunction && functionKey ? functionKey.trim() : null,
    };
    if (hasChannels && channels.length > 0) {
      payload.channels = channels.filter((c) => c.name?.trim()).map((c) => ({ name: c.name.trim(), description: c.description?.trim() || '' }));
    }
    onSubmit?.(payload);
  };

  const addChannelRow = () => setChannels([...channels, { name: '', description: '' }]);
  const removeChannelRow = (i) => setChannels(channels.filter((_, idx) => idx !== i));
  const updateChannelRow = (i, key, val) => {
    const next = [...channels];
    next[i] = { ...(next[i] || {}), [key]: val };
    setChannels(next);
  };

  return html`
    <div className="max-w-xl space-y-6">
      <h2 className="text-xl font-bold" style=${{ color: 'var(--app-text-primary)' }}>${community ? 'Edit Community' : 'Create Community'}</h2>
      <form onSubmit=${handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Name *</label>
          <input
            type="text"
            value=${name}
            onChange=${(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style=${{ borderColor: 'var(--app-border-soft)' }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Type</label>
          <select
            value=${type}
            onChange=${(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style=${{ borderColor: 'var(--app-border-soft)' }}
          >
            ${COMMUNITY_TYPES.map((t) => html`<option key=${t.value} value=${t.value}>${t.label}</option>`)}
          </select>
        </div>
        ${showInstitution ? html`
          <div>
            <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Institution</label>
            <select
              value=${institutionId}
              onChange=${(e) => setInstitutionId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style=${{ borderColor: 'var(--app-border-soft)' }}
            >
              <option value="">Select institution</option>
              ${(institutions || []).map((i) => html`<option key=${i.id} value=${i.id}>${i.name}</option>`)}
            </select>
          </div>
        ` : null}
        ${showOrganisation ? html`
          <div>
            <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Organisation</label>
            <select
              value=${organisationId}
              onChange=${(e) => setOrganisationId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style=${{ borderColor: 'var(--app-border-soft)' }}
            >
              <option value="">Select organisation</option>
              ${(organisations || []).map((o) => html`<option key=${o.id} value=${o.id}>${o.name}</option>`)}
            </select>
          </div>
        ` : null}
        ${showFunction ? html`
          <div>
            <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Function key</label>
            <input
              type="text"
              value=${functionKey}
              onChange=${(e) => setFunctionKey(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style=${{ borderColor: 'var(--app-border-soft)' }}
              placeholder="e.g. engineering"
            />
          </div>
        ` : null}
        <div>
          <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Description</label>
          <textarea
            value=${description}
            onChange=${(e) => setDescription(e.target.value)}
            rows=${4}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            style=${{ borderColor: 'var(--app-border-soft)' }}
          />
        </div>
        <p className="text-sm" style=${{ color: 'var(--app-text-muted)' }}>All communities include a General channel. You can add more channels after creation.</p>
        ${!community ? html`
          <div>
            <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Channels (optional)</label>
            <p className="text-xs mb-2" style=${{ color: 'var(--app-text-muted)' }}>Add channels during setup</p>
            ${channels.map((ch, i) => html`
              <div key=${i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value=${ch.name || ''}
                  onChange=${(e) => updateChannelRow(i, 'name', e.target.value)}
                  placeholder="Channel name"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                />
                <input
                  type="text"
                  value=${ch.description || ''}
                  onChange=${(e) => updateChannelRow(i, 'description', e.target.value)}
                  placeholder="Description"
                  className="flex-1 px-3 py-2 border rounded-lg text-sm"
                  style=${{ borderColor: 'var(--app-border-soft)' }}
                />
                <button type="button" onClick=${() => removeChannelRow(i)} className="px-2 py-1 rounded text-sm" style=${{ color: 'var(--app-danger)' }}>Remove</button>
              </div>
            `)}
            <button type="button" onClick=${addChannelRow} className="text-sm" style=${{ color: 'var(--app-accent)' }}>+ Add channel</button>
          </div>
        ` : null}
        <div className="flex gap-2 pt-4">
          ${onCancel ? html`<button type="button" onClick=${onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}>Cancel</button>` : null}
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style=${{ background: 'var(--app-accent)' }}>${community ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  `;
};

export default CommunityForm;
