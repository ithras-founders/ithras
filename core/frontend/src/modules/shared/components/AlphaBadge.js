import React, { useState } from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const TOOLTIP = 'This product is in alpha and currently undergoing testing.';

/**
 * Alpha version badge with hover tooltip.
 * Use next to logo on Login page and in Layout sidebar.
 * @param {Object} props
 * @param {'light'|'dark'} props.theme - 'light' for dark backgrounds (e.g. login hero), 'dark' for light backgrounds
 * @param {'badge'|'superscript'} props.variant - 'badge' = full badge (Login), 'superscript' = tiny raised (Layout)
 */
const AlphaBadge = ({ theme = 'dark', variant = 'badge', className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const isLight = theme === 'light';
  const isSuperscript = variant === 'superscript';
  const style = isLight
    ? { backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'rgba(253, 224, 71, 0.95)', borderColor: 'rgba(253, 224, 71, 0.4)' }
    : { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: 'rgb(217, 119, 6)', borderColor: 'rgba(245, 158, 11, 0.35)' };
  const superscriptStyle = isLight
    ? { color: 'rgba(253, 224, 71, 0.95)' }
    : { color: 'rgb(217, 119, 6)' };
  const tooltipStyle = isLight
    ? { backgroundColor: 'rgba(0,0,0,0.85)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }
    : { backgroundColor: 'rgba(0,0,0,0.85)', color: 'white', borderColor: 'rgba(0,0,0,0.3)' };

  if (isSuperscript) {
    return html`
      <sup
        title=${TOOLTIP}
        className=${`relative inline-block text-[8px] font-semibold uppercase tracking-wider cursor-default select-none ${className}`}
        style=${{ ...superscriptStyle, verticalAlign: 'super', lineHeight: 0 }}
        onMouseEnter=${() => setShowTooltip(true)}
        onMouseLeave=${() => setShowTooltip(false)}
      >
        Alpha
        ${showTooltip ? html`
          <span
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap z-[100] shadow-lg border pointer-events-none"
            style=${tooltipStyle}
          >
            ${TOOLTIP}
          </span>
        ` : null}
      </sup>
    `;
  }

  return html`
    <span
      className=${`relative inline-flex ${className}`}
      onMouseEnter=${() => setShowTooltip(true)}
      onMouseLeave=${() => setShowTooltip(false)}
    >
      <span
        title=${TOOLTIP}
        className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full border shrink-0 cursor-default"
        style=${style}
      >
        Alpha
      </span>
      ${showTooltip ? html`
        <span
          className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md whitespace-nowrap z-[100] shadow-lg border pointer-events-none"
          style=${tooltipStyle}
        >
          ${TOOLTIP}
        </span>
      ` : null}
    </span>
  `;
};

export default AlphaBadge;
