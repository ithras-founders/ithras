import React from 'react';
import htm from 'htm';
import { safeString } from './variables.js';

const html = htm.bind(React.createElement);

function getLogoUrl(url) {
  if (!url || typeof url !== 'string') return null;
  const base = typeof window !== 'undefined' && window.API_URL ? window.API_URL.replace('/api', '') : '';
  return url.startsWith('/') ? base + url : url;
}

export function renderHeader(headerConfig, config, ctx) {
  if (!headerConfig) return null;
  const { headerFont = {}, instituteBrown = '#7A4B2A', interpolateVariables, getAutoVariable } = ctx || {};
  const headerLayout = headerConfig.layout || (headerConfig.content ? 'simple' : null);
  const hdrTextColor = headerConfig.textColor || instituteBrown;
  const dividerAfter = headerConfig.dividerAfter !== false;

  const getLogoImgStyle = (defaultMaxHeight = 40) => {
    const h = headerConfig.logoSize?.height;
    return { objectFit: 'contain', maxHeight: h ? `${h}px` : `${defaultMaxHeight}px`, maxWidth: '100px' };
  };

  if (headerLayout === 'split') {
    const logoUrl = headerConfig.logoUrl ? getLogoUrl(headerConfig.logoUrl) : null;
    const leftContent = typeof headerConfig.leftContent === 'string'
      ? headerConfig.leftContent
      : (headerConfig.leftContent?.value || (logoUrl ? '' : headerConfig.content || ''));
    const rightVars = Array.isArray(headerConfig.rightVariables) ? headerConfig.rightVariables : (config?.autoVariables || []);
    const logoPos = headerConfig.logoPosition || 'left';
    const headerHeightMm = headerConfig.height ?? 4;

    const headerStyle = {
      paddingBottom: `${headerHeightMm}mm`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: '6mm',
      ...(dividerAfter ? { borderBottom: '1px solid #000', marginBottom: '1mm' } : { marginBottom: `${headerHeightMm}mm` }),
    };
    if (headerConfig.backgroundColor) headerStyle.backgroundColor = headerConfig.backgroundColor;

    const logoImg = logoUrl ? html`<img src=${logoUrl} alt="" style=${getLogoImgStyle(36)} />` : null;

    const leftBlock = html`
      <div style=${{ flex: '0 0 auto', textAlign: 'left' }}>
        ${(logoPos === 'left' && logoImg) || ''}
        ${leftContent ? html`
          <div style=${{ fontSize: `${headerFont.sizes?.h3 || 8}pt`, marginTop: (logoPos === 'left' && logoImg) ? '3px' : 0, lineHeight: 1.2, color: hdrTextColor }}>
            ${interpolateVariables(safeString(leftContent))}
          </div>
        ` : ''}
      </div>
    `;

    const rightBlock = html`
      <div style=${{ textAlign: 'right' }}>
        ${(logoPos === 'right' && logoImg) ? html`<div style=${{ marginBottom: '3px' }}>${logoImg}</div>` : ''}
        ${rightVars.map((v, i) => html`
          <div key=${v} style=${{
            fontSize: i === 0 ? `${headerFont.sizes?.h1 || 13}pt` : `${headerFont.sizes?.h3 || 8}pt`,
            fontWeight: 700,
            lineHeight: 1.3,
            textTransform: i === 0 ? 'uppercase' : 'none',
          }}>
            ${getAutoVariable(v)}
          </div>
        `)}
      </div>
    `;

    const centerLogo = (logoPos === 'center' && logoImg)
      ? html`<div style=${{ flex: '0 0 auto', display: 'flex', alignItems: 'center' }}>${logoImg}</div>`
      : null;

    return html`
      <div>
        <div style=${headerStyle}>
          ${logoPos === 'center' ? html`
            <div style=${{ flex: '0 0 auto' }}>
              ${leftContent ? html`<div style=${{ fontSize: `${headerFont.sizes?.h3 || 8}pt`, color: hdrTextColor }}>${interpolateVariables(safeString(leftContent))}</div>` : null}
            </div>
          ` : leftBlock}
          ${centerLogo}
          ${rightBlock}
        </div>
      </div>
    `;
  }

  const headerHeightMm = headerConfig.height ?? 4;
  const logoPosSimple = headerConfig.logoPosition || 'above';
  const simpleHeaderStyle = {
    marginBottom: `${headerHeightMm}mm`,
    textAlign: 'center',
    fontSize: `${headerFont.sizes?.h1 || 13}pt`,
    fontWeight: headerFont.weights?.h1 || 900,
  };
  if (headerConfig.backgroundColor) simpleHeaderStyle.backgroundColor = headerConfig.backgroundColor;
  const simpleLogoImg = headerConfig.logoUrl ? html`<img src=${getLogoUrl(headerConfig.logoUrl)} alt="" style=${getLogoImgStyle(32)} />` : null;
  const simpleContent = interpolateVariables(safeString(headerConfig.content || ''));

  if (logoPosSimple === 'above' || logoPosSimple === 'center' || !simpleLogoImg) {
    return html`
      <div style=${simpleHeaderStyle}>
        ${simpleLogoImg ? html`<div style=${{ marginBottom: '3px' }}>${simpleLogoImg}</div>` : ''}
        ${simpleContent}
      </div>
    `;
  }

  simpleHeaderStyle.display = 'flex';
  simpleHeaderStyle.alignItems = 'center';
  simpleHeaderStyle.gap = '6mm';
  simpleHeaderStyle.justifyContent = 'space-between';
  return html`
    <div style=${simpleHeaderStyle}>
      ${logoPosSimple === 'left'
        ? [html`<span key="logo">${simpleLogoImg}</span>`, html`<span key="content" style=${{ flex: 1, textAlign: 'right' }}>${simpleContent}</span>`]
        : [html`<span key="content" style=${{ flex: 1, textAlign: 'left' }}>${simpleContent}</span>`, html`<span key="logo">${simpleLogoImg}</span>`]}
    </div>
  `;
}

export function renderFooter(footerConfig, ctx) {
  if (!footerConfig) return null;
  const { interpolateVariables } = ctx || {};
  const content = footerConfig.content || '';
  const interpolated = interpolateVariables ? interpolateVariables(content) : content;
  const footerStyle = { marginTop: '4mm', fontSize: '7pt', color: '#333', textAlign: 'center', lineHeight: 1.3 };

  return html`
    <div style=${footerStyle}>
      ${interpolated}
    </div>
  `;
}

export function renderSummaryBar(summaryBarConfig, ctx) {
  if (!summaryBarConfig || !Array.isArray(summaryBarConfig.items) || summaryBarConfig.items.length === 0) return null;
  const { charcoalBar = '#3A3838', interpolateVariables, displayString } = ctx || {};
  const items = summaryBarConfig.items.map(i => (typeof i === 'string' ? i : (ctx?.safeString || (v => String(v ?? '')))(i)));
  const barBg = summaryBarConfig.backgroundColor || charcoalBar;
  const barStyle = {
    marginTop: '1mm',
    marginBottom: '1mm',
    display: 'grid',
    gridTemplateColumns: `repeat(${items.length}, 1fr)`,
    fontSize: '7.5pt',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    backgroundColor: barBg,
    color: summaryBarConfig.textColor || '#fff',
  };
  return html`
    <div style=${barStyle}>
      ${items.map((item, idx) => html`<div key=${idx} style=${{
        textAlign: 'center',
        padding: '2mm 2mm',
        ...(idx > 0 ? { borderLeft: '1px solid #fff' } : {}),
      }}>
        ${interpolateVariables && displayString ? interpolateVariables(displayString(item)) : item}
      </div>`)}
    </div>
  `;
}
