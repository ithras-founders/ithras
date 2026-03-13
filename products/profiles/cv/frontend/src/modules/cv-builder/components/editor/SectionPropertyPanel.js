import React from 'react';
import htm from 'htm';
import ColorPickerInput from '../ColorPickerInput.js';

const html = htm.bind(React.createElement);

const SectionPropertyPanel = ({ element, onUpdate }) => {
  const handleChange = (field, value) => {
    if (onUpdate) onUpdate({ [field]: value });
  };

  return html`
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Section Title</label>
        <input
          type="text"
          value=${element.title || ''}
          onChange=${e => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
          placeholder="Section title"
        />
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked=${element.mandatory === true}
            onChange=${e => handleChange('mandatory', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Mandatory</span>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked=${element.lockOrder === true}
            onChange=${e => handleChange('lockOrder', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Lock Order</span>
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
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked=${element.candidateCanEditTitle === true}
            onChange=${e => handleChange('candidateCanEditTitle', e.target.checked)}
            className="w-4 h-4"
          />
          <span>Candidate Can Edit Title</span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Background Color</label>
        <${ColorPickerInput} value=${element.backgroundColor || ''} onChange=${(v) => handleChange('backgroundColor', v)} placeholder="e.g. #f9f9f9" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Visibility Rule</label>
        <select
          value=${element.visibilityRule || 'always'}
          onChange=${e => handleChange('visibilityRule', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        >
          <option value="always">Always Show</option>
          <option value="if_has_entries">Show if has entries</option>
          <option value="never">Never Show</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Layout Style</label>
        <select
          value=${element.layoutStyle || 'two_column'}
          onChange=${e => handleChange('layoutStyle', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        >
          <option value="two_column">Two Column</option>
          <option value="full_width">Full Width</option>
          <option value="label_left_content_right">Label Left, Content Right</option>
          <option value="vertical_label_grouped">Vertical Label Grouped</option>
          <option value="multi_column">Multi Column</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>
      ${element.layoutStyle === 'multi_column' ? html`
        <div className="mt-2">
          <label className="block text-sm font-medium mb-1">Column Count</label>
          <input
            type="number"
            min="2"
            max="6"
            value=${element.columnCount ?? 3}
            onChange=${e => handleChange('columnCount', parseInt(e.target.value) || 3)}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      ` : ''}
      ${element.layoutStyle === 'vertical_label_grouped' ? html`
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-2">Vertical Label Grouping</h4>
          <p className="text-xs text-gray-500 mb-2">Entries with the same value in this field are grouped under a vertical label (e.g. Full Time, Intern)</p>
          <input
            type="text"
            value=${element.verticalLabelFieldId || ''}
            onChange=${e => handleChange('verticalLabelFieldId', e.target.value)}
            className="w-full px-3 py-2 border rounded text-sm"
            placeholder="Field ID (e.g. employment_type)"
          />
        </div>
      ` : ''}
      ${element.layoutStyle === 'label_left_content_right' ? html`
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-semibold mb-2">Entry header fields</h4>
          <p className="text-xs text-gray-500 mb-2">Field IDs shown as bold header per entry (e.g. company, role, dates)</p>
          <input
            type="text"
            value=${Array.isArray(element.headerFields) ? element.headerFields.join(', ') : ''}
            onChange=${e => handleChange('headerFields', e.target.value.split(',').map(s => s.trim()).filter(s => s))}
            className="w-full px-3 py-2 border rounded text-sm mb-4"
            placeholder="company, role, dates"
          />
          <h4 className="text-sm font-semibold mb-2">Sub-categories (label + field)</h4>
          <p className="text-xs text-gray-500 mb-2">Each row: label on left, field value on right</p>
          ${(element.subCategories || []).map((sub, i) => html`
            <div key=${i} className="flex flex-wrap gap-2 mb-2 items-center">
              <input
                type="text"
                value=${sub.label || ''}
                onChange=${e => {
                  const next = [...(element.subCategories || [])];
                  next[i] = { ...next[i], label: e.target.value };
                  handleChange('subCategories', next);
                }}
                className="flex-1 min-w-[80px] px-2 py-1 border rounded text-sm"
                placeholder="Label"
              />
              <input
                type="text"
                value=${sub.fieldId || ''}
                onChange=${e => {
                  const next = [...(element.subCategories || [])];
                  next[i] = { ...next[i], fieldId: e.target.value };
                  handleChange('subCategories', next);
                }}
                className="flex-1 min-w-[80px] px-2 py-1 border rounded text-sm"
                placeholder="Field ID"
              />
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked=${sub.richText || false}
                  onChange=${e => {
                    const next = [...(element.subCategories || [])];
                    next[i] = { ...next[i], richText: e.target.checked };
                    handleChange('subCategories', next);
                  }}
                />
                Rich text
              </label>
              <button
                type="button"
                onClick=${() => handleChange('subCategories', (element.subCategories || []).filter((_, j) => j !== i))}
                className="text-red-500 text-sm"
              >Remove</button>
            </div>
          `)}
          <button
            type="button"
            onClick=${() => handleChange('subCategories', [...(element.subCategories || []), { label: '', fieldId: '' }])}
            className="text-sm text-blue-600 hover:underline"
          >+ Add sub-category</button>
        </div>
      ` : ''}
      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold mb-2">Section Title Style</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium mb-1">Title Align</label>
            <select
              value=${element.sectionHeaderStyle?.titleAlign || 'left'}
              onChange=${e => handleChange('sectionHeaderStyle', { ...element.sectionHeaderStyle, titleAlign: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked=${element.sectionHeaderStyle?.titleCaps !== false}
              onChange=${e => handleChange('sectionHeaderStyle', { ...element.sectionHeaderStyle, titleCaps: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Uppercase title</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked=${element.sectionHeaderStyle?.titleDivider !== false}
              onChange=${e => handleChange('sectionHeaderStyle', { ...element.sectionHeaderStyle, titleDivider: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Border under title</span>
          </label>
        </div>
      </div>
    </div>
  `;
};

export default SectionPropertyPanel;
