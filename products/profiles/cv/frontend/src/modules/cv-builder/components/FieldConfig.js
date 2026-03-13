import React from 'react';
import htm from 'htm';
import ColorPickerInput from './ColorPickerInput.js';

const html = htm.bind(React.createElement);

const FieldConfig = ({ field, onChange, onDelete }) => {
  const updateField = (updates) => {
    onChange({ ...field, ...updates });
  };

  const updateNested = (key, subKey, value) => {
    const newField = { ...field };
    if (!newField[key]) newField[key] = {};
    newField[key][subKey] = value;
    onChange(newField);
  };

  return html`
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <input
          type="text"
          value=${field.label}
          onChange=${e => updateField({ label: e.target.value })}
          className="font-medium border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
          placeholder="Field Label"
        />
        <button
          onClick=${onDelete}
          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
        >
          Delete
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium mb-1">Field Type</label>
          <select
            value=${field.type}
            onChange=${e => {
              const newField = { ...field, type: e.target.value };
              // Reset options for non-dropdown types
              if (e.target.value !== 'dropdown') {
                newField.options = null;
              } else if (!newField.options) {
                newField.options = [];
              }
              onChange(newField);
            }}
            className="w-full px-2 py-1 border rounded text-sm"
          >
            <option value="text">Text</option>
            <option value="multiline">Multiline</option>
            <option value="bullet_list">Bullet List</option>
            <option value="number">Number</option>
            <option value="date">Date</option>
            <option value="dropdown">Dropdown</option>
            <option value="toggle">Toggle</option>
            <option value="table">Table</option>
            <option value="proof">Proof/File</option>
          </select>
        </div>
        <div>
          <label className="flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              checked=${field.required}
              onChange=${e => updateField({ required: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Required</span>
          </label>
        </div>
      </div>

      ${field.type === 'table' ? html`
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked=${field.repeatableRows !== false}
              onChange=${e => updateField({ repeatableRows: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Repeatable rows</span>
          </label>
          <div>
            <label className="block text-xs font-medium mb-1">Columns (label:type or label:type:align, one per line)</label>
            <p className="text-xs text-gray-500 mb-1">align: left|center|right. Add :right for Rank/Year columns.</p>
            <textarea
              value=${(field.columns || []).map(c => {
                const base = (c.label || '') + ':' + (c.type || 'text');
                return c.align ? base + ':' + c.align : base;
              }).join('\n')}
              onChange=${e => {
                const lines = e.target.value.split('\n').filter(s => s.trim());
                const columns = lines.map((line, i) => {
                  const parts = line.split(':').map(s => s.trim());
                  const [label, type, align] = parts;
                  const col = { id: `col_${i}`, label: label || `Col ${i + 1}`, type: type || 'text' };
                  if (align && ['left', 'center', 'right'].includes(align)) col.align = align;
                  return col;
                });
                updateField({ columns: columns.length ? columns : [{ id: 'col1', label: 'Column 1', type: 'text' }] });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="Degree:text&#10;Institute:text&#10;%:text:right&#10;Rank:number:right&#10;Year:year:right"
              rows="5"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked=${field.tableRichText || false}
                onChange=${e => updateField({ tableRichText: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm">Rich text in cells (use **bold**, *italic*)</span>
            </label>
          </div>
        </div>
      ` : ''}
      ${field.type === 'bullet_list' ? html`
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked=${field.richText || false}
              onChange=${e => updateField({ richText: e.target.checked })}
              className="w-4 h-4"
            />
            <span className="text-sm">Rich text (use **bold** and *italic* in bullets)</span>
          </label>
          <div>
            <label className="block text-xs font-medium mb-1">Trailing year format</label>
            <select
              value=${field.bulletDateFormat || 'none'}
              onChange=${e => updateField({ bulletDateFormat: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="none">None</option>
              <option value="trailing_year">Right-align trailing year (2023) or | 2023</option>
            </select>
          </div>
        </div>
      ` : ''}
      ${field.type === 'dropdown' ? html`
        <div>
          <label className="block text-xs font-medium mb-1">Options (comma-separated)</label>
          <input
            type="text"
            value=${field.options ? field.options.join(', ') : ''}
            onChange=${e => {
              const options = e.target.value.split(',').map(s => s.trim()).filter(s => s);
              updateField({ options: options.length > 0 ? options : null });
            }}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Option 1, Option 2, Option 3"
          />
        </div>
      ` : ''}

      <div className="border-t pt-2">
        <h5 className="text-xs font-semibold mb-2">Validation Rules</h5>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">Max Characters</label>
            <input
              type="number"
              value=${field.validation?.maxChars || ''}
              onChange=${e => {
                const validation = { ...(field.validation || {}), maxChars: e.target.value ? parseInt(e.target.value) : null };
                updateField({ validation: Object.keys(validation).length > 0 ? validation : null });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Max Lines</label>
            <input
              type="number"
              value=${field.validation?.maxLines || ''}
              onChange=${e => {
                const validation = { ...(field.validation || {}), maxLines: e.target.value ? parseInt(e.target.value) : null };
                updateField({ validation: Object.keys(validation).length > 0 ? validation : null });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-2">
        <h5 className="text-xs font-semibold mb-2">PDF Display Mapping</h5>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1">Location</label>
            <select
              value=${field.pdfMapping?.location || 'right_content'}
              onChange=${e => updateNested('pdfMapping', 'location', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="left_bucket">Left Bucket</option>
              <option value="right_content">Right Content</option>
              <option value="inline">Inline</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium mb-1">Text Format</label>
            <div className="flex flex-wrap gap-3">
              ${['bold', 'italic', 'underline', 'strikethrough', 'uppercase'].map(fmt => {
                const formats = Array.isArray(field.pdfMapping?.formats)
                  ? field.pdfMapping.formats
                  : (field.pdfMapping?.format && field.pdfMapping.format !== 'normal'
                      ? [field.pdfMapping.format]
                      : []);
                const checked = formats.includes(fmt);
                return html`
                  <label key=${fmt} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked=${checked}
                      onChange=${() => {
                        const next = checked ? formats.filter(f => f !== fmt) : [...formats, fmt];
                        const newPm = { ...(field.pdfMapping || {}), formats: next.length ? next : [] };
                        onChange({ ...field, pdfMapping: newPm });
                      }}
                      className="w-4 h-4"
                    />
                    <span className="text-xs capitalize">${fmt.replace('_', ' ')}</span>
                  </label>
                `;
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Prefix</label>
            <input
              type="text"
              value=${field.pdfMapping?.prefix || ''}
              onChange=${e => updateNested('pdfMapping', 'prefix', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="e.g., 'Year: '"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Suffix</label>
            <input
              type="text"
              value=${field.pdfMapping?.suffix || ''}
              onChange=${e => updateNested('pdfMapping', 'suffix', e.target.value)}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="e.g., ' years'"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Background</label>
            <${ColorPickerInput} value=${field.pdfMapping?.backgroundColor || field.backgroundColor || ''} onChange=${(v) => updateNested('pdfMapping', 'backgroundColor', v)} placeholder="e.g. #f0f0f0" />
          </div>
        </div>
      </div>
    </div>
  `;
};

export default FieldConfig;
