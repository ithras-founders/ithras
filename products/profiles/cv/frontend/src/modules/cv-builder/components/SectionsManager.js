import React, { useState } from 'react';
import htm from 'htm';
import { useDialog } from '/core/frontend/src/modules/shared/index.js';
import FieldConfig from './FieldConfig.js';
import ColorPickerInput from './ColorPickerInput.js';

const html = htm.bind(React.createElement);

const SectionsManager = ({ sections = [], onChange }) => {
  const { confirm } = useDialog();
  const [expandedSection, setExpandedSection] = useState(null);
  const [expandedEntryType, setExpandedEntryType] = useState(null);
  
  // Ensure sections is always an array
  const safeSections = Array.isArray(sections) ? sections : [];

  const addSection = () => {
    const newSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      mandatory: false,
      lockOrder: true,
      visibilityRule: 'always',
      layoutStyle: 'two_column',
      entryTypes: [],
      order: safeSections.length
    };
    onChange([...safeSections, newSection]);
  };

  const updateSection = (index, updates) => {
    const newSections = [...safeSections];
    newSections[index] = { ...newSections[index], ...updates };
    onChange(newSections);
  };

  const deleteSection = async (index) => {
    if (await confirm({ message: 'Delete this section?' })) {
      const newSections = safeSections.filter((_, i) => i !== index);
      onChange(newSections.map((s, i) => ({ ...s, order: i })));
    }
  };

  const moveSection = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === safeSections.length - 1)) {
      return;
    }
    const newSections = [...safeSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    newSections[index].order = index;
    newSections[targetIndex].order = targetIndex;
    onChange(newSections);
  };

  const addEntryType = (sectionIndex) => {
    const newEntryType = {
      id: `entry_${Date.now()}`,
      name: 'New Entry Type',
      repeatable: false,
      minEntries: 0,
      maxEntries: null,
      layout: 'two_column',
      leftBucketWidth: '1.2in',
      rightContentWidth: 'auto',
      alignment: 'top',
      fields: []
    };
    const newSections = [...safeSections];
    newSections[sectionIndex].entryTypes = [...newSections[sectionIndex].entryTypes, newEntryType];
    onChange(newSections);
  };

  const updateEntryType = (sectionIndex, entryIndex, updates) => {
    const newSections = [...safeSections];
    newSections[sectionIndex].entryTypes[entryIndex] = {
      ...newSections[sectionIndex].entryTypes[entryIndex],
      ...updates
    };
    onChange(newSections);
  };

  const deleteEntryType = async (sectionIndex, entryIndex) => {
    if (await confirm({ message: 'Delete this entry type?' })) {
      const newSections = [...safeSections];
      newSections[sectionIndex].entryTypes = newSections[sectionIndex].entryTypes.filter((_, i) => i !== entryIndex);
      onChange(newSections);
    }
  };

  const addField = (sectionIndex, entryIndex) => {
    const newField = {
      id: `field_${Date.now()}`,
      label: 'New Field',
      type: 'text',
      required: false,
      validation: null,
      overflowRule: null,
      pdfMapping: {},
      options: null
    };
    const newSections = [...safeSections];
    newSections[sectionIndex].entryTypes[entryIndex].fields = [
      ...newSections[sectionIndex].entryTypes[entryIndex].fields,
      newField
    ];
    onChange(newSections);
  };

  const updateField = (sectionIndex, entryIndex, fieldIndex, updates) => {
    const newSections = [...safeSections];
    newSections[sectionIndex].entryTypes[entryIndex].fields[fieldIndex] = {
      ...newSections[sectionIndex].entryTypes[entryIndex].fields[fieldIndex],
      ...updates
    };
    onChange(newSections);
  };

  const deleteField = (sectionIndex, entryIndex, fieldIndex) => {
    const newSections = [...safeSections];
    newSections[sectionIndex].entryTypes[entryIndex].fields = newSections[sectionIndex].entryTypes[entryIndex].fields.filter((_, i) => i !== fieldIndex);
    onChange(newSections);
  };

  return html`
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Sections</h2>
        <button
          onClick=${addSection}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Add Section
        </button>
      </div>

      ${safeSections.length === 0 ? html`
        <div className="text-center py-8 text-gray-500">
          <p className="mb-4">No sections yet. Click "Add Section" to get started.</p>
        </div>
      ` : safeSections.map((section, sectionIndex) => html`
        <div key=${section.id} className="border rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <button
                onClick=${() => moveSection(sectionIndex, 'up')}
                disabled=${sectionIndex === 0}
                className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                ↑
              </button>
              <button
                onClick=${() => moveSection(sectionIndex, 'down')}
                disabled=${sectionIndex === safeSections.length - 1}
                className="px-2 py-1 bg-gray-200 rounded disabled:opacity-50"
              >
                ↓
              </button>
              <input
                type="text"
                value=${section.title}
                onChange=${e => updateSection(sectionIndex, { title: e.target.value })}
                className="font-bold text-lg border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                placeholder="Section Title"
              />
            </div>
            <button
              onClick=${() => deleteSection(sectionIndex)}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Delete
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked=${section.mandatory}
                  onChange=${e => updateSection(sectionIndex, { mandatory: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Mandatory</span>
              </label>
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked=${section.lockOrder}
                  onChange=${e => updateSection(sectionIndex, { lockOrder: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Lock Order</span>
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Visibility Rule</label>
              <select
                value=${section.visibilityRule}
                onChange=${e => updateSection(sectionIndex, { visibilityRule: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="always">Always</option>
                <option value="if_has_entries">If Has Entries</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Layout Style</label>
              <select
                value=${section.layoutStyle}
                onChange=${e => updateSection(sectionIndex, { layoutStyle: e.target.value })}
                className="w-full px-3 py-2 border rounded"
              >
                <option value="two_column">Two Column</option>
                <option value="full_width">Full Width</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Entry Types</h3>
              <button
                onClick=${() => addEntryType(sectionIndex)}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Add Entry Type
              </button>
            </div>

            ${section.entryTypes.map((entryType, entryIndex) => html`
              <div key=${entryType.id} className="border rounded p-3 mb-2">
                <div className="flex justify-between items-center mb-2">
                  <input
                    type="text"
                    value=${entryType.name}
                    onChange=${e => updateEntryType(sectionIndex, entryIndex, { name: e.target.value })}
                    className="font-semibold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                    placeholder="Entry Type Name"
                  />
                  <button
                    onClick=${() => {
                      const newSections = [...safeSections];
                      newSections[sectionIndex].entryTypes = newSections[sectionIndex].entryTypes.filter((_, i) => i !== entryIndex);
                      onChange(newSections);
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium mb-1">Background Color</label>
                  <${ColorPickerInput}
                    value=${entryType.backgroundColor || ''}
                    onChange=${(v) => updateEntryType(sectionIndex, entryIndex, { backgroundColor: v })}
                    placeholder="e.g. #f9f9f9 or transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked=${entryType.repeatable}
                        onChange=${e => updateEntryType(sectionIndex, entryIndex, { repeatable: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span>Repeatable</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Layout</label>
                    <select
                      value=${entryType.layout}
                      onChange=${e => updateEntryType(sectionIndex, entryIndex, { layout: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm"
                    >
                      <option value="two_column">Two Column</option>
                      <option value="full_width">Full Width</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                  ${entryType.repeatable ? html`
                    <div>
                      <label className="block text-sm font-medium mb-1">Min Entries</label>
                      <input
                        type="number"
                        value=${entryType.minEntries || 0}
                        onChange=${e => updateEntryType(sectionIndex, entryIndex, { minEntries: parseInt(e.target.value) || 0 })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Max Entries</label>
                      <input
                        type="number"
                        value=${entryType.maxEntries || ''}
                        onChange=${e => updateEntryType(sectionIndex, entryIndex, { maxEntries: e.target.value ? parseInt(e.target.value) : null })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="Unlimited"
                      />
                    </div>
                  ` : ''}
                  ${entryType.layout === 'two_column' ? html`
                    <div>
                      <label className="block text-sm font-medium mb-1">Left Bucket Width</label>
                      <input
                        type="text"
                        value=${entryType.leftBucketWidth || ''}
                        onChange=${e => updateEntryType(sectionIndex, entryIndex, { leftBucketWidth: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                        placeholder="1.2in or 30%"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Alignment</label>
                      <select
                        value=${entryType.alignment}
                        onChange=${e => updateEntryType(sectionIndex, entryIndex, { alignment: e.target.value })}
                        className="w-full px-2 py-1 border rounded text-sm"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                      </select>
                    </div>
                  ` : ''}
                </div>

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Fields</h4>
                    <button
                      onClick=${() => addField(sectionIndex, entryIndex)}
                      className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
                    >
                      Add Field
                    </button>
                  </div>
                  ${entryType.fields.map((field, fieldIndex) => html`
                    <div key=${field.id} className="bg-gray-50 p-2 mb-2 rounded">
                      <${FieldConfig}
                        field=${field}
                        onChange=${(updates) => updateField(sectionIndex, entryIndex, fieldIndex, updates)}
                        onDelete=${() => deleteField(sectionIndex, entryIndex, fieldIndex)}
                      />
                    </div>
                  `)}
                </div>
              </div>
            `)}
          </div>
        </div>
      `)}
    </div>
  `;
};

export default SectionsManager;
