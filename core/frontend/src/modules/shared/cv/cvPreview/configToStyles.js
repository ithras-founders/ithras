/**
 * Page style, typography, design token extraction helpers
 */

export function getPageStyle(config) {
  const page = config.page || {};
  const margins = page.margins || {};
  const baseFont = (config.typography || {}).baseFont || {};

  return {
    width: page.size === 'Letter' ? '8.5in' : '210mm',
    minHeight: '297mm',
    padding: `${margins.top ?? 8}mm ${margins.right ?? 12}mm ${margins.bottom ?? 6}mm ${margins.left ?? 12}mm`,
    backgroundColor: page.backgroundColor || 'white',
    fontFamily: baseFont.family || 'Arial, Helvetica, sans-serif',
    fontSize: `${baseFont.size || 8.5}pt`,
    lineHeight: baseFont.lineHeight || 1.1,
    color: '#000',
    position: 'relative',
  };
}

/**
 * @param {object} section - Section config
 * @param {object} ctx - { headerFont, charcoal, borderStyle }
 */
export function getSectionTitleStyle(section, ctx) {
  const { headerFont = {}, charcoal = '#3A3838', borderStyle = '1px solid #000' } = ctx || {};
  const style = section?.sectionHeaderStyle || {};
  const sTypo = section?.typographyOverrides || {};
  const titleCaps = style.titleCaps !== false;
  const bg = style.backgroundColor || charcoal;

  return {
    fontSize: `${sTypo.fontSize ?? headerFont.sizes?.h2 ?? 9}pt`,
    fontWeight: sTypo.fontWeight === 'normal' ? 'normal' : (sTypo.fontWeight || headerFont.weights?.h2 || 700),
    marginTop: 0,
    marginBottom: 0,
    textTransform: titleCaps ? 'uppercase' : 'none',
    textAlign: 'left',
    letterSpacing: sTypo.letterSpacing || '0.3px',
    lineHeight: 1.3,
    backgroundColor: bg,
    color: style.textColor || '#fff',
    padding: '2px 4px',
    borderBottom: borderStyle,
  };
}

/**
 * Extract design tokens from config
 */
export function extractDesignTokens(config) {
  const tokens = config.designTokens || {};
  return {
    charcoalBar: tokens.charcoalBar || tokens.primary || '#3A3838',
    labelFill: tokens.labelFill || '#D9D9D9',
    gridLineColor: tokens.gridLineColor || '#000',
    instituteBrown: tokens.instituteBrown || '#7A4B2A',
    primary: tokens.primary,
    ...tokens,
  };
}

export function getBorderStyle(tokens) {
  const gridLine = tokens?.gridLineColor || '#000';
  return `1px solid ${gridLine}`;
}
