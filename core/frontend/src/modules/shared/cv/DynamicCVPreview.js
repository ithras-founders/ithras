import React from 'react';
import htm from 'htm';
import { parseSimpleMarkdown, sanitizeTextForDisplay } from './utils/parseSimpleMarkdown.js';
import { getPageStyle, getSectionTitleStyle } from './cvPreview/configToStyles.js';
import { safeVar, safeString, getAutoVariable as getAutoVariableFn, interpolateVariables as interpolateVariablesFn } from './cvPreview/variables.js';
import { extractTrailingYear, trailingDateRe, trailingDateStripRe } from './cvPreview/dateFormatters.js';
import { renderHeader, renderFooter, renderSummaryBar } from './cvPreview/FixedElements.js';
import { renderLabelLeftContentRightTable, renderVerticalLabelGrouped } from './cvPreview/sectionRenderers.js';

const html = htm.bind(React.createElement);

const DynamicCVPreview = ({ template, cvData, user, renderSectionOnly }) => {
  const config = template.config || {};
  const sections = Array.isArray(config?.sections) ? config.sections : [];

  const typo = config.typography || {};
  const spacing = config.spacing || {};
  const baseFont = typo.baseFont || {};
  const headerFont = typo.headerFont || {};
  const tokens = config.designTokens || {};

  const charcoal = tokens.charcoalBar || tokens.primary || '#3A3838';
  const labelFill = tokens.labelFill || '#D9D9D9';
  const gridLine = tokens.gridLineColor || '#000';
  const instituteBrown = tokens.instituteBrown || '#7A4B2A';
  const borderStyle = `1px solid ${gridLine}`;

  const pageStyle = getPageStyle(config);
  const fontSize = baseFont.size || 8.5;

  const getSectionTitleStyleLocal = (section) =>
    getSectionTitleStyle(section, { headerFont, charcoal, borderStyle });

  const getAutoVariable = (varName) =>
    getAutoVariableFn(varName, { user, cvData });

  const interpolateVariables = (text) =>
    interpolateVariablesFn(text, getAutoVariable);

  const displayString = (v) =>
    sanitizeTextForDisplay(safeString(v), { passthroughMath: config?.passthroughMath === true });

  const markdownOpts = { passthroughMath: config?.passthroughMath === true };

  const renderBulletText = (text, richText) => {
    return richText ? parseSimpleMarkdown(text, markdownOpts) : displayString(text);
  };

  const renderBulletContent = (item, field) => {
    const isObj = typeof item === 'object' && item !== null;
    const str = isObj && item.text != null ? safeString(item.text) : safeString(item);
    const proofUrl = isObj && item.proofUrl ? item.proofUrl : null;
    const content = field.richText ? parseSimpleMarkdown(str, markdownOpts) : displayString(str);
    let textBlock;
    if (field.bulletDateFormat === 'trailing_year' && typeof str === 'string') {
      const match = str.match(trailingDateRe);
      if (match) {
        const year = match[1] || match[2] || match[3] || match[4] || match[5] || match[6];
        const text = str.replace(trailingDateStripRe, '').trim();
        const textContent = field.richText ? parseSimpleMarkdown(text, markdownOpts) : displayString(text);
        textBlock = html`<span style=${{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <span style=${{ flex: 1 }}>${textContent}</span>
          <span style=${{ flexShrink: 0, marginLeft: '8px', fontWeight: 600, whiteSpace: 'nowrap' }}>${year}</span>
        </span>`;
      } else {
        textBlock = content;
      }
    } else {
      textBlock = content;
    }
    if (!proofUrl) return textBlock;
    const base = typeof window !== 'undefined' && window.API_URL ? window.API_URL.replace('/api', '') : '';
    const fullUrl = proofUrl.startsWith('/') ? base + proofUrl : proofUrl;
    const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(proofUrl);
    const proofEl = isImg
      ? html`<div style=${{ marginTop: '1px' }}><img src=${fullUrl} alt="Proof" loading="lazy" style=${{ maxHeight: '32px', maxWidth: '60px', objectFit: 'contain', verticalAlign: 'middle' }} /></div>`
      : html`<div style=${{ marginTop: '1px', fontSize: '7pt' }}><a href=${fullUrl} target="_blank" rel="noopener noreferrer" style=${{ color: '#0066cc' }}>View proof</a></div>`;
    return html`<span><span>${textBlock}</span>${proofEl}</span>`;
  };

  const renderLeftBucketContent = (entryType, entryData) => {
    const source = entryType.leftBucketContentSource || 'fixed';
    if (source === 'fixed') return safeString(entryType.leftBucketText) || '';
    if (source === 'auto_variable') return getAutoVariable(entryType.leftBucketVariable || '');
    if (source === 'field_derived') {
      const fieldId = entryType.leftBucketFieldId;
      if (fieldId && entryData[fieldId] != null) return safeString(entryData[fieldId]);
      return '';
    }
    if (source === 'candidate_entered') return safeString(entryData._leftBucketLabel) || '';
    return '';
  };

  const wrapWithFieldStyle = (content, field) => {
    const bg = field.pdfMapping?.backgroundColor || field.backgroundColor;
    if (!bg || (typeof bg === 'string' && bg.toLowerCase() === 'transparent')) return content;
    return html`<span style=${{ backgroundColor: bg, padding: '1px 4px', borderRadius: '1px' }}>${content}</span>`;
  };

  const renderFieldValue = (field, value) => {
    if (field.type === 'proof') {
      if (!value || typeof value !== 'string') return '';
      const base = typeof window !== 'undefined' && window.API_URL ? window.API_URL.replace('/api', '') : '';
      const fullUrl = value.startsWith('/') ? base + value : value;
      const isImg = /\.(png|jpg|jpeg|gif|webp)$/i.test(value);
      return isImg
        ? html`<div style=${{ marginBottom: '2px' }}><img src=${fullUrl} alt="Proof" loading="lazy" style=${{ maxHeight: '50px', maxWidth: '100px', objectFit: 'contain' }} /></div>`
        : html`<div style=${{ marginBottom: '2px' }}><a href=${fullUrl} target="_blank" rel="noopener noreferrer" style=${{ color: '#0066cc', fontSize: '8pt' }}>View proof</a></div>`;
    }

    if (field.type === 'table') {
      const columns = field.columns || [];
      const rows = Array.isArray(value) ? value : (value && typeof value === 'object' ? [value] : []);
      if (rows.length === 0 && columns.length === 0) return '';
      const visibleColumns = columns.filter((col) => {
        if (!col.optional) return true;
        return rows.some((row) => {
          const v = row[col.id];
          return v != null && v !== '';
        });
      });
      const tableBorder = field.tableBorderStyle || borderStyle;
      const headerBg = field.tableHeaderBackground || labelFill;
      const cellBg = field.tableCellBackground || labelFill;
      const renderTableCell = (cellVal, col) => {
        const str = safeString(cellVal);
        if (field.tableRichText || col.richText) return parseSimpleMarkdown(str, markdownOpts);
        const formats = Array.isArray(col.formats) ? col.formats : [];
        const dv = displayString(str);
        if (formats.includes('uppercase')) return dv.toUpperCase();
        return dv;
      };
      return html`
        <table style=${{ width: '100%', borderCollapse: 'collapse', border: tableBorder }}>
          <thead>
            <tr style=${{ backgroundColor: headerBg }}>
              ${visibleColumns.map(col => html`
                <th key=${col.id} style=${{
                  border: tableBorder,
                  padding: '2px 4px',
                  textAlign: col.align || 'center',
                  fontSize: `${fontSize - 0.5}pt`,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  ...(col.width ? { width: col.width } : {}),
                }}>
                  ${safeString(col.label)}
                </th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${rows.map((row, i) => html`
              <tr key=${i} style=${{ backgroundColor: cellBg }}>
                ${visibleColumns.map(col => html`
                  <td key=${col.id} style=${{
                    border: tableBorder,
                    padding: '2px 4px',
                    fontSize: `${fontSize - 0.5}pt`,
                    textAlign: col.align || 'left',
                    verticalAlign: 'top',
                    ...(col.width ? { width: col.width } : {}),
                  }}>
                    ${renderTableCell(row[col.id], col)}
                  </td>
                `)}
              </tr>
            `)}
          </tbody>
        </table>
      `;
    }

    if (!value && value !== 0 && value !== false) return '';
    if (typeof value === 'object') return '';

    const prefix = field.pdfMapping?.prefix || '';
    const suffix = field.pdfMapping?.suffix || '';
    let formattedValue = String(value);
    const formats = Array.isArray(field.pdfMapping?.formats)
      ? field.pdfMapping.formats
      : (field.pdfMapping?.format && field.pdfMapping.format !== 'normal' ? [field.pdfMapping.format] : []);

    if (formats.includes('uppercase')) formattedValue = formattedValue.toUpperCase();

    const transformStyle = field.pdfMapping?.transform ? { transform: field.pdfMapping.transform, display: 'inline-block' } : {};
    const textContent = `${prefix}${formattedValue}${suffix}`;

    let content = textContent;
    formats.forEach(fmt => {
      if (fmt === 'bold') content = html`<strong>${content}</strong>`;
      else if (fmt === 'italic') content = html`<em>${content}</em>`;
      else if (fmt === 'underline') content = html`<u>${content}</u>`;
      else if (fmt === 'strikethrough') content = html`<s>${content}</s>`;
    });
    if (Object.keys(transformStyle).length) {
      content = html`<span style=${transformStyle}>${content}</span>`;
    }
    return wrapWithFieldStyle(content, field);
  };

  const bulletListStyle = {
    margin: 0,
    paddingLeft: `${typo.bulletIndentation || 3}mm`,
    listStyleType: typo.bulletStyle || 'disc',
  };
  const bulletItemStyle = { marginBottom: `${spacing.bulletSpacing || 0.1}mm` };

  const renderEntry = (entryType, entryData) => {
    const fields = Array.isArray(entryType.fields) ? entryType.fields : [];
    const entryBaseStyle = { marginBottom: `${spacing.rowSpacing || 0}mm` };
    if (entryType.backgroundColor) entryBaseStyle.backgroundColor = entryType.backgroundColor;

    if (entryType.layout === 'two_column') {
      const leftFields = fields.filter(f => f.pdfMapping?.location === 'left_bucket');
      const rightFields = fields.filter(f => f.pdfMapping?.location !== 'left_bucket' && f.pdfMapping?.location !== 'inline');
      const inlineFields = fields.filter(f => f.pdfMapping?.location === 'inline');
      const leftBucketContent = renderLeftBucketContent(entryType, entryData);

      return html`
        <div style=${{ ...entryBaseStyle, display: 'flex', alignItems: entryType.alignment === 'center' ? 'center' : 'flex-start' }}>
          <div style=${{ width: entryType.leftBucketWidth || '1in', paddingRight: '6px', flexShrink: 0 }}>
            ${leftBucketContent ? html`<div style=${{ fontWeight: 700, fontSize: `${fontSize - 0.5}pt` }}>${leftBucketContent}</div>` : ''}
            ${leftFields.map(field => html`<div key=${field.id} style=${{ marginBottom: '1px' }}>${renderFieldValue(field, entryData[field.id])}</div>`)}
          </div>
          <div style=${{ flex: 1 }}>
            ${rightFields.map(field => html`
              <div key=${field.id} style=${{ marginBottom: '1px' }}>
                ${field.type === 'bullet_list' && Array.isArray(entryData[field.id]) ? html`
                  <ul style=${bulletListStyle}>
                    ${entryData[field.id].map((item, idx) => html`<li key=${idx} style=${bulletItemStyle}>${renderBulletContent(item, field)}</li>`)}
                  </ul>
                ` : renderFieldValue(field, entryData[field.id])}
              </div>
            `)}
            ${inlineFields.map(field => html`<span key=${field.id} style=${{ marginRight: '5px' }}>${renderFieldValue(field, entryData[field.id])}</span>`)}
          </div>
        </div>
      `;
    }

    return html`
      <div style=${entryBaseStyle}>
        ${fields.map(field => html`
          <div key=${field.id} style=${{ marginBottom: '1px' }}>
            ${field.type === 'bullet_list' && Array.isArray(entryData[field.id]) ? html`
              <ul style=${bulletListStyle}>
                ${entryData[field.id].map((item, idx) => html`<li key=${idx} style=${bulletItemStyle}>${renderBulletContent(item, field)}</li>`)}
              </ul>
            ` : renderFieldValue(field, entryData[field.id])}
          </div>
        `)}
      </div>
    `;
  };

  const headerConfig = config.fixedElements?.header;
  const footerConfig = config.fixedElements?.footer;
  const summaryBarConfig = config.fixedElements?.summaryBar;
  const headerLayout = headerConfig?.layout || (headerConfig?.content ? 'simple' : null);

  const fixedElementsCtx = {
    headerFont,
    instituteBrown,
    interpolateVariables,
    getAutoVariable,
    charcoalBar: charcoal,
    displayString,
    safeString,
  };

  const sectionRenderersCtx = {
    getSectionTitleStyle: getSectionTitleStyleLocal,
    displayString,
    renderBulletText,
    borderStyle,
    labelFill,
    fontSize,
  };

  const sectionsToRender = renderSectionOnly
    ? sections.filter(s => s.id === renderSectionOnly)
    : sections;

  if (renderSectionOnly) {
    return html`
      <div style=${{ fontFamily: pageStyle.fontFamily, fontSize: pageStyle.fontSize, lineHeight: pageStyle.lineHeight, color: '#000' }}>
        ${sectionsToRender.map((section) => {
          const includedSections = cvData._includedSections || {};
          if (section.optional && includedSections[section.id] === false) return null;
          const sectionData = cvData[section.id] || {};
          const entries = sectionData.entries || [];

          if (section.layoutStyle === 'vertical_label_grouped' && section.verticalLabelFieldId) {
            return renderVerticalLabelGrouped(section, entries, sectionRenderersCtx);
          }
          if (section.layoutStyle === 'label_left_content_right' && (Array.isArray(section.subCategories) && section.subCategories.length > 0 || section.useDynamicBuckets)) {
            return renderLabelLeftContentRightTable(section, entries, sectionRenderersCtx);
          }
          const entryTypes = Array.isArray(section.entryTypes) ? section.entryTypes : [];
          const contentEls = entryTypes.flatMap((entryType, etIdx) => {
            if (entryType.repeatable) {
              return entries.map((entry, entryIndex) => html`<div key=${`${etIdx}-${entryIndex}`}>${renderEntry(entryType, entry)}</div>`);
            }
            return [html`<div key=${etIdx}>${renderEntry(entryType, entries[0] || {})}</div>`];
          });
          return html`
            <div key=${section.id}>
              <div style=${getSectionTitleStyleLocal(section)}>${displayString(section.title)}</div>
              ${contentEls}
            </div>
          `;
        })}
      </div>
    `;
  }

  return html`
    <div style=${{ backgroundColor: '#f3f4f6', padding: '12px' }}>
      <div style=${pageStyle} id="cv-preview-content">
        ${headerConfig ? renderHeader(headerConfig, config, fixedElementsCtx) : ''}
        ${summaryBarConfig ? renderSummaryBar(summaryBarConfig, fixedElementsCtx) : ''}

        ${config.autoVariables && Array.isArray(config.autoVariables) && config.autoVariables.length > 0 && headerLayout !== 'split' ? html`
          <div style=${{ marginBottom: '4mm', fontSize: `${fontSize - 0.5}pt` }}>
            ${config.autoVariables.map(varName => html`
              <div key=${typeof varName === 'string' ? varName : ''} style=${{ marginBottom: '1px' }}>
                <strong>${safeString(varName).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${getAutoVariable(typeof varName === 'string' ? varName : '')}
              </div>
            `)}
          </div>
        ` : ''}

        ${sections.map((section, index) => {
          const includedSections = cvData._includedSections || {};
          if (section.optional && includedSections[section.id] === false) return null;
          const sectionData = cvData[section.id] || {};
          const entries = sectionData.entries || [];
          const sectionTitleStyle = getSectionTitleStyleLocal(section);

          if (section.visibilityRule === 'if_has_entries' && entries.length === 0) {
            return html`
              <div key=${section.id}>
                <div style=${sectionTitleStyle}>${displayString(section.title)}</div>
                <div style=${{ fontSize: '7pt', color: '#999', fontStyle: 'italic', padding: '2px 4px', border: borderStyle, borderTop: 'none' }}>No entries yet</div>
              </div>
            `;
          }

          if (section.layoutStyle === 'vertical_label_grouped' && section.verticalLabelFieldId) {
            return renderVerticalLabelGrouped(section, entries, sectionRenderersCtx);
          }

          if (section.layoutStyle === 'label_left_content_right' && (Array.isArray(section.subCategories) && section.subCategories.length > 0 || section.useDynamicBuckets)) {
            return renderLabelLeftContentRightTable(section, entries, sectionRenderersCtx);
          }

          const columnCount = section.columnCount ?? 0;
          const isMultiColumn = section.layoutStyle === 'multi_column' && columnCount > 2;
          const entryTypes = Array.isArray(section.entryTypes) ? section.entryTypes : [];

          const contentEls = entryTypes.flatMap((entryType, etIdx) => {
            if (entryType.repeatable) {
              return entries.map((entry, entryIndex) => html`
                <div key=${`${etIdx}-${entryIndex}`}>${renderEntry(entryType, entry)}</div>
              `);
            }
            return [html`<div key=${etIdx}>${renderEntry(entryType, entries[0] || {})}</div>`];
          });

          const gridStyle = isMultiColumn
            ? { display: 'grid', gridTemplateColumns: `repeat(${columnCount}, 1fr)`, gap: '2mm', marginTop: '1mm' }
            : null;

          return html`
            <div key=${section.id}>
              <div style=${sectionTitleStyle}>${displayString(section.title)}</div>
              ${gridStyle ? html`<div style=${gridStyle}>${contentEls}</div>` : contentEls}
            </div>
          `;
        })}

        ${footerConfig ? renderFooter(footerConfig, fixedElementsCtx) : ''}
      </div>
    </div>
  `;
};

export default DynamicCVPreview;
