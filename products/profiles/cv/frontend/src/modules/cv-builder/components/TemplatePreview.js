import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TemplatePreview = ({ config }) => {
  const pageStyle = {
    width: config.page?.size === 'Letter' ? '8.5in' : '210mm',
    minHeight: '297mm',
    margin: `${config.page?.margins?.top || 20}mm ${config.page?.margins?.right || 20}mm ${config.page?.margins?.bottom || 20}mm ${config.page?.margins?.left || 20}mm`,
    padding: '20px',
    backgroundColor: 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    fontFamily: config.typography?.baseFont?.family || 'serif',
    fontSize: `${config.typography?.baseFont?.size || 10.5}pt`,
    lineHeight: config.typography?.baseFont?.lineHeight || 1.2,
    color: '#000'
  };

  const sectionTitleStyle = {
    fontSize: `${config.typography?.headerFont?.sizes?.h2 || 12}pt`,
    fontWeight: config.typography?.headerFont?.weights?.h2 || 700,
    marginTop: `${config.spacing?.sectionTitleBefore || 6}mm`,
    marginBottom: `${config.spacing?.sectionTitleAfter || 3}mm`,
    textTransform: 'uppercase',
    borderBottom: '1px solid #000',
    paddingBottom: '2px'
  };

  const renderField = (field, mockValue = 'Sample Data') => {
    const formats = Array.isArray(field.pdfMapping?.formats)
      ? field.pdfMapping.formats
      : (field.pdfMapping?.format && field.pdfMapping.format !== 'normal' ? [field.pdfMapping.format] : []);
    let val = String(mockValue);
    if (formats.includes('uppercase')) val = val.toUpperCase();
    let content = `${field.pdfMapping?.prefix || ''}${val}${field.pdfMapping?.suffix || ''}`;
    formats.forEach(fmt => {
      if (fmt === 'bold') content = html`<strong>${content}</strong>`;
      else if (fmt === 'italic') content = html`<em>${content}</em>`;
      else if (fmt === 'underline') content = html`<u>${content}</u>`;
      else if (fmt === 'strikethrough') content = html`<s>${content}</s>`;
    });
    return html`<span>${content}</span>`;
  };

  const renderEntryType = (entryType) => {
    if (entryType.layout === 'two_column') {
      return html`
        <div style=${{ display: 'flex', marginBottom: `${config.spacing?.rowSpacing || 4}mm` }}>
          <div style=${{ width: entryType.leftBucketWidth || '1.2in', paddingRight: '10px' }}>
            ${entryType.fields.filter(f => f.pdfMapping?.location === 'left_bucket').map(field => html`
              <div key=${field.id}>${renderField(field, '2020-2024')}</div>
            `)}
          </div>
          <div style=${{ flex: 1 }}>
            ${entryType.fields.filter(f => f.pdfMapping?.location === 'right_content' || !f.pdfMapping?.location).map(field => html`
              <div key=${field.id} style=${{ marginBottom: '2px' }}>${renderField(field)}</div>
            `)}
          </div>
        </div>
      `;
    } else {
      return html`
        <div style=${{ marginBottom: `${config.spacing?.rowSpacing || 4}mm` }}>
          ${entryType.fields.map(field => html`
            <div key=${field.id} style=${{ marginBottom: '2px' }}>${renderField(field)}</div>
          `)}
        </div>
      `;
    }
  };

  return html`
    <div className="p-4 bg-gray-100">
      <h2 className="text-xl font-bold mb-4">Template Preview</h2>
      <div style=${pageStyle}>
        ${config.sections && config.sections.length > 0 ? config.sections.map((section, index) => html`
          <div key=${section.id} style=${{ marginBottom: `${config.spacing?.sectionSpacing || 8}mm` }}>
            <div style=${sectionTitleStyle}>
              ${section.title}
              ${section.mandatory ? html`<span style=${{ color: 'red', marginLeft: '5px' }}>*</span>` : ''}
            </div>
            ${section.entryTypes && section.entryTypes.length > 0 ? section.entryTypes.map(entryType => html`
              <div key=${entryType.id} style=${{ marginBottom: '8px' }}>
                ${entryType.repeatable ? html`
                  <div style=${{ fontStyle: 'italic', fontSize: '9pt', color: '#666', marginBottom: '4px' }}>
                    (Repeatable Entry - showing 1 of ${entryType.minEntries || 0}+)
                  </div>
                ` : ''}
                ${renderEntryType(entryType)}
              </div>
            `) : html`
              <div style=${{ color: '#999', fontStyle: 'italic' }}>No entry types configured</div>
            `}
          </div>
        `) : html`
          <div style=${{ color: '#999', textAlign: 'center', padding: '40px' }}>
            No sections configured. Add sections to see preview.
          </div>
        `}
      </div>
    </div>
  `;
};

export default TemplatePreview;
