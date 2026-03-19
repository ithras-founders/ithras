/** Reusable form for add/edit other achievement (sports, dance, music, arts, etc.) */
import React, { useState } from 'react';
import htm from 'htm';
import { Input } from '/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const CATEGORIES = [
  { value: 'sports', label: 'Sports' },
  { value: 'dance', label: 'Dance' },
  { value: 'music', label: 'Music' },
  { value: 'arts', label: 'Arts' },
  { value: 'other', label: 'Other' },
];

const OtherAchievementForm = ({ entry, onSubmit, onCancel, disabled = false }) => {
  const [category, setCategory] = useState(entry?.category || 'other');
  const [title, setTitle] = useState(entry?.title || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await onSubmit({
        category: category || 'other',
        title: title.trim(),
        description: description.trim() || null,
      });
      onCancel?.();
    } catch (err) {
      setError(err.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  return html`
    <form onSubmit=${handleSubmit} className="rounded-2xl border p-5 space-y-4" style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}>
      ${error ? html`<div className="p-3 bg-red-50 rounded-lg text-sm text-red-600">${error}</div>` : null}
      <div>
        <label className="block text-sm font-medium text-[var(--app-text-primary)] mb-1">Category</label>
        <select
          value=${category}
          onChange=${(e) => setCategory(e.target.value)}
          disabled=${disabled || saving}
          className="w-full px-4 py-2 app-input text-[var(--app-text-primary)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          ${CATEGORIES.map((c) => html`<option key=${c.value} value=${c.value}>${c.label}</option>`)}
        </select>
      </div>
      <${Input}
        label="Title *"
        value=${title}
        onChange=${(e) => setTitle(e.target.value)}
        placeholder="e.g. State Championship, Lead Role in..."
        disabled=${disabled || saving}
      />
      <div>
        <label className="block text-sm font-medium text-[var(--app-text-primary)] mb-1">Description</label>
        <textarea
          value=${description}
          onChange=${(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          disabled=${disabled || saving}
          rows=${3}
          className="w-full px-4 py-2 app-input text-[var(--app-text-primary)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      <div className="flex gap-2 pt-2">
        <button type="button" onClick=${onCancel} disabled=${saving} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled=${saving} className="px-4 py-2 rounded-lg text-white" style=${{ background: 'var(--app-accent)' }}>${saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  `;
};

export default OtherAchievementForm;
