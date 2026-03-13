import React from 'react';
import htm from 'htm';
import LeftBucketConfig from './LeftBucketConfig.js';
import ColorPickerInput from '../ColorPickerInput.js';

const html = htm.bind(React.createElement);

const EntryPropertyPanel = ({ element, onUpdate }) => {
  const handleChange = (field, value) => {
    if (onUpdate) onUpdate({ [field]: value });
  };

  return html`
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Background Color</label>
        <${ColorPickerInput} value=${element.backgroundColor || ''} onChange=${(v) => handleChange('backgroundColor', v)} placeholder="e.g. #f9f9f9" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Entry Name</label>
        <input
          type="text"
          value=${element.name || ''}
          onChange=${e => handleChange('name', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          placeholder="Entry name"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked=${element.repeatable === true}
            onChange=${e => handleChange('repeatable', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Repeatable</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked=${element.candidateCanReorder === true}
            onChange=${e => handleChange('candidateCanReorder', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Candidate Can Reorder</span>
        </label>
      </div>

      ${element.repeatable ? html`
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Min Entries</label>
            <input
              type="number"
              min="0"
              value=${element.minEntries || 0}
              onChange=${e => handleChange('minEntries', parseInt(e.target.value) || 0)}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Max Entries</label>
            <input
              type="number"
              min="0"
              value=${element.maxEntries || ''}
              onChange=${e => handleChange('maxEntries', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="Unlimited"
            />
          </div>
        </div>
      ` : ''}

      <div>
        <label className="block text-sm font-medium mb-1">Layout</label>
        <select
          value=${element.layout || 'two_column'}
          onChange=${e => handleChange('layout', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        >
          <option value="two_column">Two Column</option>
          <option value="full_width">Full Width</option>
        </select>
      </div>

      ${element.layout === 'two_column' ? html`
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Left Bucket Width</label>
            <input
              type="text"
              value=${element.leftBucketWidth || '1.2in'}
              onChange=${e => handleChange('leftBucketWidth', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="1.2in"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Alignment</label>
            <select
              value=${element.alignment || 'top'}
              onChange=${e => handleChange('alignment', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>

        <${LeftBucketConfig}
          entry=${element}
          onUpdate=${handleChange}
        />
      ` : ''}
    </div>
  `;
};

export default EntryPropertyPanel;
