import React from 'react';
import htm from 'htm';
import TextField from './fields/TextField.js';
import MultilineField from './fields/MultilineField.js';
import BulletListField from './fields/BulletListField.js';
import BucketListField from './fields/BucketListField.js';
import NumberField from './fields/NumberField.js';
import DateField from './fields/DateField.js';
import DropdownField from './fields/DropdownField.js';
import ToggleField from './fields/ToggleField.js';
import TableField from './fields/TableField.js';
import ProofField from './fields/ProofField.js';

const html = htm.bind(React.createElement);

const EntryTypeRenderer = ({ entryType, sectionId, section, data, onChange }) => {
  const entries = data.entries || (entryType.repeatable ? [] : [{}]);
  const entryData = entryType.repeatable ? entries : entries[0] || {};

  const updateEntryData = (entryIndex, fieldId, value) => {
    if (entryType.repeatable) {
      const newEntries = [...entries];
      if (!newEntries[entryIndex]) newEntries[entryIndex] = {};
      newEntries[entryIndex][fieldId] = value;
      onChange({ entries: newEntries });
    } else {
      onChange({ entries: [{ ...entryData, [fieldId]: value }] });
    }
  };

  const addEntry = () => {
    if (entryType.maxEntries && entries.length >= entryType.maxEntries) return;
    onChange({ entries: [...entries, {}] });
  };

  const removeEntry = (index) => {
    if (entryType.minEntries && entries.length <= entryType.minEntries) return;
    const newEntries = entries.filter((_, i) => i !== index);
    onChange({ entries: newEntries });
  };

  const moveEntry = (index, direction) => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === entries.length - 1)) return;
    const newEntries = [...entries];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newEntries[index], newEntries[targetIndex]] = [newEntries[targetIndex], newEntries[index]];
    onChange({ entries: newEntries });
  };

  const renderField = (field, entryIndex) => {
    const value = entryType.repeatable
      ? (entries[entryIndex] || {})[field.id]
      : entryData[field.id];
    const fieldProps = {
      field,
      value,
      onChange: (newValue) => updateEntryData(entryIndex, field.id, newValue),
      error: null
    };

    switch (field.type) {
      case 'text': return html`<${TextField} ...${fieldProps} />`;
      case 'multiline': return html`<${MultilineField} ...${fieldProps} />`;
      case 'bullet_list': return html`<${BulletListField} ...${fieldProps} />`;
      case 'bucket_list': {
        return html`<${BucketListField}
          ...${fieldProps}
          defaultBuckets=${field.id === 'achievementBuckets' ? (section?.defaultAchievementBuckets || []) : (section?.subCategories || []).map(s => s.label)}
        />`;
      }
      case 'number': return html`<${NumberField} ...${fieldProps} />`;
      case 'date':
      case 'year': return html`<${DateField} ...${fieldProps} />`;
      case 'dropdown': return html`<${DropdownField} ...${fieldProps} />`;
      case 'toggle': return html`<${ToggleField} ...${fieldProps} />`;
      case 'table': return html`<${TableField} ...${fieldProps} />`;
      case 'proof': return html`<${ProofField} ...${fieldProps} />`;
      default: return html`<div className="text-[var(--app-danger)] text-xs">Unknown: ${field.type}</div>`;
    }
  };

  const fieldLayout = entryType.layout === 'two_column' ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'space-y-3';
  const isLabelLeftContent = section?.layoutStyle === 'label_left_content_right' && (section?.useDynamicBuckets || (Array.isArray(section?.subCategories) && section.subCategories.length > 0));
  const labelWidth = section?.sectionHeaderStyle?.labelWidth || '1.5in';

  const renderFieldRow = (field, entryIndex) => {
    const content = renderField(field, entryIndex);
    if (isLabelLeftContent) {
      return html`
        <div key=${field.id} className="flex gap-4 mb-4 items-start">
          <div className="flex-shrink-0 font-semibold text-[var(--app-text-secondary)] text-sm" style=${{ minWidth: labelWidth, maxWidth: labelWidth }}>${field.label}</div>
          <div className="flex-1 min-w-0">${content}</div>
        </div>
      `;
    }
    return html`<div key=${field.id}>${content}</div>`;
  };

  if (entryType.repeatable) {
    return html`
      <div className="mt-3">
        ${entries.map((entry, entryIndex) => html`
          <div key=${entryIndex} className="relative border border-[var(--app-border-soft)] rounded-lg p-3 mb-3 bg-[var(--app-surface-muted)]/50 group">
            <!-- Entry header -->
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--app-text-muted)] uppercase tracking-wide">
                ${entryType.name || 'Entry'} ${entryIndex + 1}
              </span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                ${entryType.candidateCanReorder ? html`
                  <button
                    onClick=${() => moveEntry(entryIndex, 'up')}
                    disabled=${entryIndex === 0}
                    className="p-1 text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] disabled:opacity-30"
                    title="Move up"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 15l-6-6-6 6"/></svg>
                  </button>
                  <button
                    onClick=${() => moveEntry(entryIndex, 'down')}
                    disabled=${entryIndex === entries.length - 1}
                    className="p-1 text-[var(--app-text-muted)] hover:text-[var(--app-text-secondary)] disabled:opacity-30"
                    title="Move down"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                ` : ''}
                <button
                  onClick=${() => removeEntry(entryIndex)}
                  disabled=${entryType.minEntries && entries.length <= entryType.minEntries}
                  className="p-1 text-[var(--app-text-muted)] hover:text-[var(--app-danger)] disabled:opacity-30"
                  title="Remove"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            <div className=${isLabelLeftContent ? 'space-y-0' : fieldLayout}>
              ${entryType.fields.map(field => renderFieldRow(field, entryIndex))}
            </div>
          </div>
        `)}

        ${entries.length === 0 ? html`
          <div className="text-center py-4 text-[var(--app-text-muted)] text-sm border border-dashed border-[var(--app-border-soft)] rounded-lg">
            No entries yet
          </div>
        ` : ''}

        ${(!entryType.maxEntries || entries.length < entryType.maxEntries) ? html`
          <button
            onClick=${addEntry}
            className="w-full py-2 text-sm font-medium text-[var(--app-accent)] hover:bg-[var(--app-accent-soft)] rounded-lg border border-dashed border-[var(--app-border-soft)] transition-colors flex items-center justify-center gap-1"
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add ${entryType.name || 'Entry'}
          </button>
        ` : ''}
      </div>
    `;
  }

  return html`
    <div className="mt-3">
      <div className=${isLabelLeftContent ? 'space-y-0' : fieldLayout}>
        ${entryType.fields.map(field => renderFieldRow(field, 0))}
      </div>
    </div>
  `;
};

export default EntryTypeRenderer;
