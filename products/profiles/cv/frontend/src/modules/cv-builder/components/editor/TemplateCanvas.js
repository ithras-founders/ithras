import React, { useState } from 'react';
import htm from 'htm';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import Droppable from '/core/frontend/src/modules/shared/dnd/Droppable.js';
import CanvasSection from './CanvasSection.js';
import FloatingSectionToolbar from './FloatingSectionToolbar.js';
import CanvasEntry from './CanvasEntry.js';
import CanvasField from './CanvasField.js';
import DropIndicator from './DropIndicator.js';
import { DRAG_TYPES } from './dragTypes.js';

const html = htm.bind(React.createElement);

/**
 * Section drop zone - allows adding new sections between or at end of list
 */
function SectionDropZone({ insertIndex }) {
  const h = htm.bind(React.createElement);
  return h`
    <${Droppable}
      id=${`section_drop_${insertIndex}`}
      accepts=${[DRAG_TYPES.BUILDING_BLOCK_SECTION]}
      className="min-h-[24px] my-1 flex items-center justify-center border-2 border-dashed border-gray-200 rounded text-gray-400 text-xs hover:border-blue-300 hover:bg-blue-50/30 transition-colors"
      data=${{ type: 'canvas_section_drop', insertIndex }}
    >
      Drop section here
    <//>
  `;
}

/**
 * Sections List Component - Renders sections with SortableContext and section drop zones between/after
 */
function SectionsList({ sections, sectionIds, selectedElement, onSelect, onDelete, onPropertyUpdate, renderEntry, renderField }) {
  const entryIdsMap = {};
  sections.forEach(section => {
    entryIdsMap[section.id] = (section.entryTypes || []).map(e => `entry_${e.id}`);
  });

  const sectionElements = sections.map((section, sectionIndex) => {
    const entryIds = entryIdsMap[section.id] || [];
    
    // Render entries - htm templates are React elements
    const entryReactElements = (section.entryTypes || []).map(entry => {
      return renderEntry(entry, section.id);
    });
    
    // Render entries wrapped in SortableContext
    const entryElements = entryIds.length > 0
      ? React.createElement(
          SortableContext,
          { items: entryIds, strategy: verticalListSortingStrategy },
          ...entryReactElements
        )
      : React.createElement('div', { className: 'text-center text-gray-400 text-sm py-4' }, 'Drop entries here');
    
    // Use htm for CanvasSection since it works fine with htm
    const isSelected = selectedElement?.type === 'section' && selectedElement?.id === section.id;
    const sectionHtm = html`
      <${CanvasSection}
        key=${section.id}
        section=${section}
        index=${sectionIndex}
        isSelected=${isSelected}
        onSelect=${onSelect}
        onDelete=${(sectionId) => onDelete && onDelete('section', { sectionId })}
        onUpdate=${isSelected && onPropertyUpdate ? (updates) => onPropertyUpdate('section', { sectionId: section.id, updates }) : null}
      >
        ${entryElements}
      <//>
    `;
    
    return sectionHtm;
  });

  // Interleave section drop zones: drop_0, section_0, drop_1, section_1, ..., drop_N
  const interleaved = [];
  for (let i = 0; i < sections.length; i++) {
    interleaved.push(React.createElement(SectionDropZone, { key: `section_drop_${i}`, insertIndex: i }));
    interleaved.push(React.createElement(React.Fragment, { key: sectionIds[i] }, sectionElements[i]));
  }
  interleaved.push(React.createElement(SectionDropZone, { key: `section_drop_${sections.length}`, insertIndex: sections.length }));

  // Wrap all sections in SortableContext
  return React.createElement(
    SortableContext,
    { items: sectionIds, strategy: verticalListSortingStrategy },
    ...interleaved
  );
}

/**
 * Template Canvas - WYSIWYG editor for template design
 */
const DUMMY_VARS = { name: 'Sample User', email: 'sample@example.com', roll_number: 'R001', college_name: 'Sample College', program: 'MBA', phone: '+1 234 567 8900' };
const getPlaceholderVar = (varName) => {
  const key = (varName || '').split('.').pop() || varName;
  return DUMMY_VARS[key] ?? `{{${key}}}`;
};

const TemplateCanvas = ({ 
  config, 
  selectedElement, 
  onSelect, 
  onDelete,
  onDragEnd,
  onPropertyUpdate,
}) => {
  const [dropIndicator, setDropIndicator] = useState(null);

  const headerConfig = config.fixedElements?.header;
  const footerConfig = config.fixedElements?.footer;
  const summaryBarConfig = config.fixedElements?.summaryBar;
  const headerLayout = headerConfig?.layout || (headerConfig?.content ? 'simple' : null);
  const getLogoUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    const base = typeof window !== 'undefined' && window.API_URL ? window.API_URL.replace('/api', '') : '';
    return url.startsWith('/') ? base + url : url;
  };
  const getLogoImgStyle = (defaultMaxHeight = 40) => {
    const h = headerConfig?.logoSize?.height;
    const style = { objectFit: 'contain' };
    if (h) style.maxHeight = `${h}px`;
    else style.maxHeight = `${defaultMaxHeight}px`;
    style.maxWidth = '120px';
    return style;
  };
  const interpolate = (text) => {
    if (!text || typeof text !== 'string') return '';
    return text.replace(/\{\{(\w+)\}\}/g, (_, v) => getPlaceholderVar(v));
  };
  const safeStr = (v) => (v == null ? '' : String(v));

  const renderCanvasHeader = () => {
    if (!headerConfig) return null;
    if (headerLayout === 'split') {
      const logoUrl = headerConfig.logoUrl ? getLogoUrl(headerConfig.logoUrl) : null;
      const leftContent = typeof headerConfig.leftContent === 'string' ? headerConfig.leftContent : (headerConfig.leftContent?.value ?? (logoUrl ? '' : headerConfig.content || ''));
      const rightVars = Array.isArray(headerConfig.rightVariables) ? headerConfig.rightVariables : [];
      const logoPos = headerConfig.logoPosition || 'left';
      const headerHeightMm = headerConfig.height ?? 15;
      const headerStyle = { marginBottom: `${headerHeightMm}mm`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10mm' };
      if (headerConfig.backgroundColor) headerStyle.backgroundColor = headerConfig.backgroundColor;
      const logoImg = logoUrl ? html`<img src=${logoUrl} alt="" style=${getLogoImgStyle(40)} />` : null;
      const leftBlock = html`<div style=${{ flex: '0 0 auto', textAlign: 'left' }}>
        ${(logoPos === 'left' && logoImg) || ''}
        ${leftContent ? html`<div style=${{ fontSize: `${config.typography?.headerFont?.sizes?.h3 || 10}pt`, marginTop: (logoPos === 'left' && logoImg) ? '4px' : 0 }}>${safeStr(leftContent)}</div>` : ''}
      </div>`;
      const rightBlock = html`<div style=${{ textAlign: 'right', fontSize: `${config.typography?.headerFont?.sizes?.h1 || 14}pt`, fontWeight: config.typography?.headerFont?.weights?.h1 || 900 }}>
        ${(logoPos === 'right' && logoImg) ? html`<div style=${{ marginBottom: '4px' }}>${logoImg}</div>` : ''}
        ${rightVars.map(v => html`<div key=${v}>${getPlaceholderVar(v)}</div>`)}
      </div>`;
      const centerLogo = (logoPos === 'center' && logoImg) ? html`<div style=${{ flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>${logoImg}</div>` : null;
      return html`
        <div style=${headerStyle} className="relative z-10">
          ${logoPos === 'center' ? html`<div style=${{ flex: '0 0 auto' }}>${leftContent ? html`<div style=${{ fontSize: `${config.typography?.headerFont?.sizes?.h3 || 10}pt` }}>${safeStr(leftContent)}</div>` : null}</div>` : leftBlock}
          ${centerLogo}
          ${rightBlock}
        </div>
        ${headerConfig.centerContent ? html`
          <div style=${{ marginTop: '4mm', marginBottom: '4mm', fontSize: headerConfig.centerContentFontSize || '9pt', fontWeight: 700, textAlign: 'center', padding: headerConfig.centerContentPadding || '3mm 6mm', backgroundColor: headerConfig.centerContentBackgroundColor || 'transparent', color: headerConfig.centerContentTextColor || '#000' }} className="relative z-10">
            ${interpolate(safeStr(headerConfig.centerContent))}
          </div>
        ` : ''}
      `;
    }
    const headerHeightMm = headerConfig.height ?? 15;
    const logoPosSimple = headerConfig.logoPosition || 'above';
    const simpleHeaderStyle = { marginBottom: `${headerHeightMm}mm`, textAlign: 'center', fontSize: `${config.typography?.headerFont?.sizes?.h1 || 14}pt`, fontWeight: config.typography?.headerFont?.weights?.h1 || 900 };
    if (headerConfig.backgroundColor) simpleHeaderStyle.backgroundColor = headerConfig.backgroundColor;
    const simpleLogoImg = headerConfig.logoUrl ? html`<img src=${getLogoUrl(headerConfig.logoUrl)} alt="" style=${getLogoImgStyle(36)} />` : null;
    const simpleContent = interpolate(safeStr(headerConfig.content || ''));
    if (logoPosSimple === 'above' || logoPosSimple === 'center' || !simpleLogoImg) {
      return html`
        <div style=${simpleHeaderStyle} className="relative z-10">
          ${simpleLogoImg ? html`<div style=${{ marginBottom: '4px' }}>${simpleLogoImg}</div>` : ''}
          ${simpleContent}
        </div>
      `;
    }
    simpleHeaderStyle.display = 'flex';
    simpleHeaderStyle.alignItems = 'center';
    simpleHeaderStyle.gap = '10mm';
    simpleHeaderStyle.justifyContent = 'space-between';
    return html`
      <div style=${simpleHeaderStyle} className="relative z-10">
        ${logoPosSimple === 'left' ? [html`<span>${simpleLogoImg}</span>`, html`<span style=${{ flex: 1, textAlign: 'right' }}>${simpleContent}</span>`] : [html`<span style=${{ flex: 1, textAlign: 'left' }}>${simpleContent}</span>`, html`<span>${simpleLogoImg}</span>`]}
      </div>
    `;
  };

  const renderCanvasFooter = () => {
    if (!footerConfig) return null;
    const content = footerConfig.content || '';
    const vars = Array.isArray(footerConfig.variables) ? footerConfig.variables : [];
    const interpolated = interpolate(safeStr(content));
    const hasVars = vars.length > 0;
    const footerHeightMm = footerConfig.height ?? 12;
    const alignment = footerConfig.alignment || 'center';
    const footerStyle = { marginTop: `${footerHeightMm}mm`, fontSize: '9pt', color: '#666', textAlign: alignment };
    if (footerConfig.backgroundColor) footerStyle.backgroundColor = footerConfig.backgroundColor;
    if (footerConfig.layout === 'two_column') {
      footerStyle.display = 'flex';
      footerStyle.justifyContent = 'space-between';
      footerStyle.gap = '10mm';
      const leftContent = footerConfig.leftContent ?? content;
      const rightContent = footerConfig.rightContent ?? (hasVars ? vars.map(v => getPlaceholderVar(v)).filter(Boolean).join(' • ') : '');
      return html`
        <div style=${footerStyle} className="relative z-10">
          <div style=${{ textAlign: 'left' }}>${interpolate(safeStr(leftContent))}</div>
          <div style=${{ textAlign: 'right' }}>${interpolate(safeStr(rightContent))}</div>
        </div>
      `;
    }
    return html`
      <div style=${footerStyle} className="relative z-10">
        ${interpolated}
        ${hasVars ? html`<div style=${{ marginTop: '2px' }}>${vars.map(v => getPlaceholderVar(v)).filter(Boolean).join(' • ')}</div>` : ''}
      </div>
    `;
  };

  const renderCanvasSummaryBar = () => {
    if (!summaryBarConfig || !Array.isArray(summaryBarConfig.items) || summaryBarConfig.items.length === 0) return null;
    const items = summaryBarConfig.items.map(i => (typeof i === 'string' ? i : safeStr(i)));
    const barStyle = {
      marginTop: '4mm',
      marginBottom: '6mm',
      padding: '3mm 6mm',
      display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6mm',
      fontSize: '9pt',
      fontWeight: 700,
      textTransform: 'uppercase',
      backgroundColor: summaryBarConfig.backgroundColor || '#333',
      color: summaryBarConfig.textColor || '#fff',
    };
    return html`
      <div style=${barStyle} className="relative z-10">
        ${items.map((item, idx) => html`<span key=${idx}>${interpolate(safeStr(item))}</span>`)}
      </div>
    `;
  };

  const pageStyle = {
    width: config.page?.size === 'Letter' ? '8.5in' : '210mm',
    minHeight: '297mm',
    margin: `${config.page?.margins?.top || 20}mm ${config.page?.margins?.right || 20}mm ${config.page?.margins?.bottom || 20}mm ${config.page?.margins?.left || 20}mm`,
    padding: '20px',
    backgroundColor: config.page?.backgroundColor || 'white',
    boxShadow: '0 0 10px rgba(0,0,0,0.1)',
    fontFamily: config.typography?.baseFont?.family || 'serif',
    fontSize: `${config.typography?.baseFont?.size || 10.5}pt`,
    lineHeight: config.typography?.baseFont?.lineHeight || 1.2,
    color: '#000',
    position: 'relative',
  };

  const sections = config.sections || [];
  const sectionIds = sections.map(s => `section_${s.id}`);

  const renderField = (field, sectionId, entryId, area) => {
    const entry = sections
      .find(s => s.id === sectionId)
      ?.entryTypes?.find(e => e.id === entryId);
    const fieldIndex = entry?.fields?.findIndex(f => f.id === field.id) || 0;

    return html`
      <${CanvasField}
        key=${field.id}
        field=${field}
        sectionId=${sectionId}
        entryId=${entryId}
        index=${fieldIndex}
        currentArea=${area}
        isSelected=${selectedElement?.type === 'field' && selectedElement?.id === field.id}
        onSelect=${onSelect}
        onDelete=${(fieldId) => onDelete && onDelete('field', { sectionId, entryId, fieldId })}
      />
    `;
  };

  const renderEntry = (entry, sectionId) => {
    const entryIndex = sections
      .find(s => s.id === sectionId)
      ?.entryTypes?.findIndex(e => e.id === entry.id) || 0;

    const leftBucketFields = (entry.fields || []).filter(f => f.pdfMapping?.location === 'left_bucket');
    const rightContentFields = (entry.fields || []).filter(f => f.pdfMapping?.location !== 'left_bucket');

    return html`
      <${CanvasEntry}
        key=${entry.id}
        entry=${entry}
        sectionId=${sectionId}
        index=${entryIndex}
        isSelected=${selectedElement?.type === 'entry' && selectedElement?.id === entry.id}
        onSelect=${onSelect}
        onDelete=${(entryId) => onDelete && onDelete('entry', { sectionId, entryId })}
      >
        ${{
          leftBucket: leftBucketFields.map(field => renderField(field, sectionId, entry.id, 'left_bucket')),
          rightContent: rightContentFields.map(field => renderField(field, sectionId, entry.id, 'right_content')),
          fullWidth: (entry.fields || []).map(field => renderField(field, sectionId, entry.id, 'right_content')),
        }}
      <//>
    `;
  };

  return html`
    <div className="flex-1 overflow-auto bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div 
          style=${pageStyle} 
          className="relative ${selectedElement?.type === 'template' ? 'ring-2 ring-blue-500' : ''}"
          onClick=${(e) => {
            // Click on page background (not on sections/entries) selects template
            if (e.target === e.currentTarget || e.target.closest('.page-background')) {
              onSelect && onSelect({ type: 'template' });
            }
          }}
        >
          <div className="page-background absolute inset-0" style=${{ pointerEvents: 'none' }}></div>
          ${headerConfig ? renderCanvasHeader() : ''}
          ${summaryBarConfig ? renderCanvasSummaryBar() : ''}
          ${sections.length === 0 ? html`
            <${Droppable}
              id="canvas_root"
              accepts=${[DRAG_TYPES.BUILDING_BLOCK_SECTION]}
              className="min-h-[400px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded relative z-10"
              data=${{ type: 'canvas_root', insertIndex: 0 }}
            >
              <div className="text-center text-gray-400">
                <div className="text-lg mb-2">Drop a Section here to get started</div>
                <div className="text-sm">Or drag sections from the Building Blocks panel</div>
                <div className="text-xs mt-4 text-gray-500">Click here to edit template properties</div>
              </div>
            <//>
          ` : React.createElement('div', { className: 'relative z-10' },
            React.createElement('div', { className: 'mb-2 text-xs text-gray-500 text-center' },
              'Click page background to edit template properties'
            ),
            React.createElement(SectionsList, {
              sections,
              sectionIds,
              selectedElement,
              onSelect,
              onDelete,
              onPropertyUpdate,
              renderEntry,
              renderField
            })
          )}
          ${footerConfig ? renderCanvasFooter() : ''}
          
          ${dropIndicator && html`
            <${DropIndicator} position=${dropIndicator.position} isVisible=${true} />
          `}
        </div>
      </div>
    </div>
  `;
};

export default TemplateCanvas;
