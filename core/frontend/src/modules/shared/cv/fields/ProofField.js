import React, { useState } from 'react';
import htm from 'htm';
import { uploadProof } from '../../services/api/cv.js';

const html = htm.bind(React.createElement);

const ProofField = ({ field, value, onChange, error }) => {
  const [uploading, setUploading] = useState(false);
  const accept = field.proofAcceptedTypes?.length
    ? field.proofAcceptedTypes.join(',')
    : 'image/*,.pdf';

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadProof(file);
      onChange(url);
    } catch (err) {
      console.error('Proof upload failed:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const isImage = value && /\.(png|jpg|jpeg|gif|webp)$/i.test(value);

  return html`
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">
        ${field.label}
        ${field.required ? html`<span className="text-[var(--app-danger)]">*</span>` : ''}
      </label>
      ${value ? html`
        <div className="flex items-center gap-3 p-3 border rounded bg-[var(--app-surface-muted)]">
          ${isImage ? html`
            <img src=${value.startsWith('/') ? (window.API_URL || '/api').replace('/api', '') + value : value} alt="Proof" loading="lazy" className="h-16 w-auto object-contain rounded" />
          ` : html`
            <span className="text-sm text-[var(--app-accent)]">📎 PDF</span>
          `}
          <a href=${value.startsWith('/') ? (window.API_URL || '/api').replace('/api', '') + value : value} target="_blank" rel="noopener noreferrer" className="text-sm text-[var(--app-accent)] hover:underline">
            View
          </a>
          <button
            type="button"
            onClick=${() => onChange('')}
            className="text-sm text-[var(--app-danger)] hover:underline"
          >
            Remove
          </button>
        </div>
      ` : html`
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)] rounded cursor-pointer hover:bg-[var(--app-accent-soft)]">
          <input
            type="file"
            accept=${accept}
            onChange=${handleFile}
            disabled=${uploading}
            className="hidden"
          />
          ${uploading ? 'Uploading...' : 'Upload proof (image or PDF)'}
        </label>
      `}
      ${error ? html`<div className="text-xs text-[var(--app-danger)] mt-1">${error}</div>` : ''}
    </div>
  `;
};

export default ProofField;
