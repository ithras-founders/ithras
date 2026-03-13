import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Floating toolbar shown when a section is selected.
 * Quick controls for Line Height, Letter Spacing, Padding (section-level).
 * Wire to updateSection via onUpdate.
 */
const FloatingSectionToolbar = ({ section, onUpdate }) => {
  if (!section || !onUpdate) return null;

  const typo = section.typographyOverrides || {};
  const spacing = section.spacingOverrides || {};

  const handleTypoChange = (key, value) => {
    onUpdate({
      typographyOverrides: { ...typo, [key]: value },
    });
  };

  const handleSpacingChange = (key, value) => {
    const num = value === '' || value == null ? undefined : parseFloat(value);
    onUpdate({
      spacingOverrides: { ...spacing, [key]: num },
    });
  };

  return html`
    <div
      className="flex flex-wrap items-center gap-3 py-2 px-3 bg-white border border-gray-200 rounded-lg shadow-sm mt-2"
      onClick=${(e) => e.stopPropagation()}
    >
      <span className="text-xs font-medium text-gray-500">Quick edit</span>
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-600">Line Ht</label>
        <input
          type="number"
          step="0.1"
          min="0.8"
          max="3"
          value=${typo.lineHeight ?? ''}
          onChange=${e => handleTypoChange('lineHeight', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder="1.2"
          className="w-14 px-2 py-1 text-xs border rounded"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-600">Letter Sp</label>
        <input
          type="text"
          value=${typo.letterSpacing ?? ''}
          onChange=${e => handleTypoChange('letterSpacing', e.target.value || undefined)}
          placeholder="0"
          className="w-14 px-2 py-1 text-xs border rounded"
        />
      </div>
      <div className="flex items-center gap-1">
        <label className="text-xs text-gray-600">Padding (mm)</label>
        <input
          type="number"
          step="0.5"
          min="0"
          value=${spacing.padding ?? ''}
          onChange=${e => handleSpacingChange('padding', e.target.value)}
          placeholder="0"
          className="w-14 px-2 py-1 text-xs border rounded"
        />
      </div>
    </div>
  `;
};

export default FloatingSectionToolbar;
