import React from 'react';
import htm from 'htm';

/**
 * Sanitize math/special chars for display: strip LaTeX-style $...$ to inner content,
 * replace \% with %. Prevents $28/480$, 99\%ile from breaking or rendering oddly.
 */
export function sanitizeTextForDisplay(text, options = {}) {
  if (!text || typeof text !== 'string') return '';
  let out = text;
  if (options.passthroughMath !== true) {
    out = out.replace(/\$([^$]*)\$/g, '$1');
    out = out.replace(/\\%/g, '%');
  }
  return out;
}

/**
 * Parse simple markdown in bullet text: **bold**, *italic*
 * Returns React elements for use with htm.
 * Sanitizes math/special chars before parsing unless passthroughMath is true.
 */
const html = htm.bind(React.createElement);

export function parseSimpleMarkdown(text, options = {}) {
  if (!text || typeof text !== 'string') return '';
  const sanitized = sanitizeTextForDisplay(text, options);
  const parts = [];
  let remaining = sanitized;
  // Match **bold** (greedy) and *italic* (single-char, not **)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let lastIdx = 0;
  let m;
  while ((m = regex.exec(remaining)) !== null) {
    if (m.index > lastIdx) {
      parts.push(remaining.slice(lastIdx, m.index));
    }
    if (m[1].startsWith('**')) {
      parts.push(html`<strong>${m[2]}</strong>`);
    } else {
      parts.push(html`<em>${m[3]}</em>`);
    }
    lastIdx = regex.lastIndex;
  }
  if (lastIdx < remaining.length) {
    parts.push(remaining.slice(lastIdx));
  }
  if (parts.length === 0) return sanitized;
  if (parts.length === 1 && typeof parts[0] === 'string') return parts[0];
  return React.createElement(React.Fragment, null, ...parts);
}
