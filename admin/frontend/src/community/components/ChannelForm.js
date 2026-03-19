/**
 * Channel create/edit form - modal or inline.
 */
import React, { useState, useEffect } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const ChannelForm = ({ channel, onSubmit, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (channel) {
      setName(channel.name || '');
      setDescription(channel.description || '');
    } else {
      setName('');
      setDescription('');
    }
  }, [channel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit?.({ name: name.trim(), description: description.trim() });
  };

  return html`
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style=${{ background: 'rgba(0,0,0,0.4)' }} onClick=${onCancel}>
      <div className="rounded-xl border bg-white shadow-xl max-w-md w-full p-6" style=${{ borderColor: 'var(--app-border-soft)' }} onClick=${(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4" style=${{ color: 'var(--app-text-primary)' }}>
          ${channel ? 'Edit Channel' : 'Add Channel'}
        </h3>
        <form onSubmit=${handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Name</label>
            <input
              type="text"
              value=${name}
              onChange=${(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style=${{ borderColor: 'var(--app-border-soft)' }}
              placeholder="Channel name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style=${{ color: 'var(--app-text-primary)' }}>Description</label>
            <textarea
              value=${description}
              onChange=${(e) => setDescription(e.target.value)}
              rows=${3}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style=${{ borderColor: 'var(--app-border-soft)' }}
              placeholder="Optional description"
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick=${onCancel} className="px-4 py-2 rounded-lg text-sm font-medium border" style=${{ borderColor: 'var(--app-border-soft)', color: 'var(--app-text-secondary)' }}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white" style=${{ background: 'var(--app-accent)' }}>
              ${channel ? 'Save' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  `;
};

export default ChannelForm;
