import React from 'react';
import htm from 'htm';
import ColorPickerInput from '../ColorPickerInput.js';

const html = htm.bind(React.createElement);

const FieldPropertyPanel = ({ element, onUpdate }) => {
  const handleChange = (field, value) => {
    if (onUpdate) onUpdate({ [field]: value });
  };

  return html`
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Field Label</label>
        <input
          type="text"
          value=${element.label || ''}
          onChange=${e => handleChange('label', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          placeholder="Field label"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Field Type</label>
        <select
          value=${element.type || 'text'}
          onChange=${e => handleChange('type', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          disabled
        >
          <option value="text">Text</option>
          <option value="multiline">Multiline</option>
          <option value="bullet_list">Bullet List</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="year">Year</option>
          <option value="dropdown">Dropdown</option>
          <option value="toggle">Toggle</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked=${element.required === true}
            onChange=${e => handleChange('required', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Required</span>
        </label>
      </div>

      ${element.type === 'dropdown' ? html`
        <div>
          <label className="block text-sm font-medium mb-1">Options (comma-separated)</label>
          <input
            type="text"
            value=${element.options ? element.options.join(', ') : ''}
            onChange=${e => {
              const options = e.target.value.split(',').map(s => s.trim()).filter(s => s);
              handleChange('options', options);
            }}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      ` : ''}

      <div>
        <label className="block text-sm font-medium mb-1">Placeholder</label>
        <input
          type="text"
          value=${element.placeholder || ''}
          onChange=${e => handleChange('placeholder', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          placeholder="Placeholder text"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Background Color</label>
        <${ColorPickerInput}
          value=${element.pdfMapping?.backgroundColor || element.backgroundColor || ''}
          onChange=${(v) => {
            const pm = element.pdfMapping || {};
            handleChange('pdfMapping', { ...pm, backgroundColor: v });
          }}
          placeholder="e.g. #f0f0f0"
        />
      </div>

      ${element.pdfMapping ? html`
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-2">PDF Display</h4>
          <div>
            <label className="block text-sm font-medium mb-1">Location</label>
            <select
              value=${element.pdfMapping.location || 'right_content'}
              onChange=${e => handleChange('pdfMapping', { ...element.pdfMapping, location: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="left_bucket">Left Bucket</option>
              <option value="right_content">Right Content</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-sm font-medium mb-1">Prefix</label>
              <input
                type="text"
                value=${element.pdfMapping.prefix || ''}
                onChange=${e => handleChange('pdfMapping', { ...element.pdfMapping, prefix: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Suffix</label>
              <input
                type="text"
                value=${element.pdfMapping.suffix || ''}
                onChange=${e => handleChange('pdfMapping', { ...element.pdfMapping, suffix: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default FieldPropertyPanel;
