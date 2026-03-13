import React from 'react';
import htm from 'htm';
import PropertyEditor from './PropertyEditor.js';

const html = htm.bind(React.createElement);

/**
 * Properties Panel - Right sidebar for editing selected element properties
 */
const PropertiesPanel = ({ selectedElement, config, onUpdate }) => {
  if (!selectedElement) {
    return html`
      <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Properties</h3>
          <div className="text-sm text-gray-500 text-center py-8">
            Select an element to edit its properties
          </div>
        </div>
      </div>
    `;
  }

  const { type, id, section, entry, field } = selectedElement;

  // Build breadcrumb
  const breadcrumb = [];
  breadcrumb.push({ label: 'Template', type: 'template' });
  if (type === 'section' || type === 'entry' || type === 'field') {
    const sectionData = config.sections?.find(s => s.id === (section?.id || id));
    breadcrumb.push({ label: sectionData?.title || section?.title || 'Section', type: 'section', id: sectionData?.id || section?.id || id });
  }
  if (type === 'entry' || type === 'field') {
    const sectionData = config.sections?.find(s => s.id === (section?.id || id));
    const entryData = sectionData?.entryTypes?.find(e => e.id === (entry?.id || id));
    breadcrumb.push({ label: entryData?.name || entry?.name || 'Entry', type: 'entry', id: entryData?.id || entry?.id || id });
  }
  if (type === 'field') {
    breadcrumb.push({ label: field?.label || 'Field', type: 'field', id: field?.id || id });
  }

  return html`
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Properties</h3>
        <div className="text-xs text-gray-500 flex items-center gap-1">
          ${breadcrumb.map((crumb, idx) => html`
            <span key=${idx}>
              ${idx > 0 ? html`<span className="mx-1">›</span>` : ''}
              <span className=${crumb.type === type ? 'font-semibold text-gray-700' : 'text-gray-500'}>
                ${crumb.label}
              </span>
            </span>
          `)}
        </div>
      </div>

      <div className="p-4">
        ${type === 'template' ? html`
          <${PropertyEditor}
            elementType="template"
            element=${config}
            onUpdate=${(updates) => onUpdate && onUpdate('template', updates)}
          />
        ` : type === 'section' ? html`
          <${PropertyEditor}
            elementType="section"
            element=${config.sections?.find(s => s.id === id) || section}
            onUpdate=${(updates) => onUpdate && onUpdate('section', { sectionId: id, updates })}
          />
        ` : type === 'entry' ? html`
          <${PropertyEditor}
            elementType="entry"
            element=${(() => {
              const effectiveSectionId = section?.id ?? selectedElement.sectionId;
              const sectionData = config.sections?.find(s => s.id === effectiveSectionId);
              return sectionData?.entryTypes?.find(e => e.id === id) || entry;
            })()}
            sectionId=${section?.id ?? selectedElement.sectionId}
            onUpdate=${(updates) => {
              const effectiveSectionId = section?.id ?? selectedElement.sectionId;
              return onUpdate && onUpdate('entry', { sectionId: effectiveSectionId, entryId: id, updates });
            }}
          />
        ` : type === 'field' ? html`
          <${PropertyEditor}
            elementType="field"
            element=${(() => {
              const effectiveSectionId = section?.id ?? selectedElement.sectionId;
              const effectiveEntryId = entry?.id ?? selectedElement.entryId;
              const sectionData = config.sections?.find(s => s.id === effectiveSectionId);
              const entryData = sectionData?.entryTypes?.find(e => e.id === effectiveEntryId);
              return entryData?.fields?.find(f => f.id === id) || field;
            })()}
            sectionId=${section?.id ?? selectedElement.sectionId}
            entryId=${entry?.id ?? selectedElement.entryId}
            onUpdate=${(updates) => {
              const effectiveSectionId = section?.id ?? selectedElement.sectionId;
              const effectiveEntryId = entry?.id ?? selectedElement.entryId;
              return onUpdate && onUpdate('field', { sectionId: effectiveSectionId, entryId: effectiveEntryId, fieldId: id, updates });
            }}
          />
        ` : ''}
      </div>
    </div>
  `;
};

export default PropertiesPanel;
