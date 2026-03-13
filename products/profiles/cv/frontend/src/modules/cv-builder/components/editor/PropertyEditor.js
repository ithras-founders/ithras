import React from 'react';
import htm from 'htm';
import TemplatePropertyPanel from './TemplatePropertyPanel.js';
import SectionPropertyPanel from './SectionPropertyPanel.js';
import EntryPropertyPanel from './EntryPropertyPanel.js';
import FieldPropertyPanel from './FieldPropertyPanel.js';

const html = htm.bind(React.createElement);

/**
 * Generic property editor component
 * Handles different input types and validates inputs
 * Delegates to specialized panels based on elementType
 */
const PropertyEditor = ({ elementType, element, sectionId, entryId, onUpdate }) => {
  if (!element) return null;

  if (elementType === 'template') {
    return html`<${TemplatePropertyPanel} element=${element} onUpdate=${onUpdate} />`;
  }
  if (elementType === 'section') {
    return html`<${SectionPropertyPanel} element=${element} onUpdate=${onUpdate} />`;
  }
  if (elementType === 'entry') {
    return html`<${EntryPropertyPanel} element=${element} onUpdate=${onUpdate} />`;
  }
  if (elementType === 'field') {
    return html`<${FieldPropertyPanel} element=${element} onUpdate=${onUpdate} />`;
  }

  return null;
};

export default PropertyEditor;
