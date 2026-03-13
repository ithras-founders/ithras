import React from 'react';
import htm from 'htm';
import ColorPickerInput from '../ColorPickerInput.js';

const html = htm.bind(React.createElement);

const TemplatePropertyPanel = ({ element, onUpdate }) => {
  const handleChange = (field, value) => {
    if (onUpdate) onUpdate({ [field]: value });
  };

  const handleNestedChange = (path, key, value) => {
    const updates = {};
    const keys = path.split('.');
    let current = updates;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = { ...element[keys[0]], [key]: value };
    if (onUpdate) onUpdate(updates);
  };

  return html`
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Page Background</label>
        <${ColorPickerInput} value=${element.page?.backgroundColor || ''} onChange=${(v) => handleChange('page', { ...element.page, backgroundColor: v })} placeholder="white, #f5f5f5, etc." />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Page Size</label>
        <select
          value=${element.page?.size || 'A4'}
          onChange=${e => handleNestedChange('page', 'size', e.target.value)}
          className="w-full px-3 py-2 border rounded text-sm"
        >
          <option value="A4">A4</option>
          <option value="Letter">Letter</option>
          <option value="Legal">Legal</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-sm font-medium mb-1">Top Margin (mm)</label>
          <input
            type="number"
            value=${element.page?.margins?.top || 20}
            onChange=${e => {
              const margins = { ...element.page?.margins, top: parseFloat(e.target.value) || 0 };
              handleChange('page', { ...element.page, margins });
            }}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Bottom Margin (mm)</label>
          <input
            type="number"
            value=${element.page?.margins?.bottom || 20}
            onChange=${e => {
              const margins = { ...element.page?.margins, bottom: parseFloat(e.target.value) || 0 };
              handleChange('page', { ...element.page, margins });
            }}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Left Margin (mm)</label>
          <input
            type="number"
            value=${element.page?.margins?.left || 20}
            onChange=${e => {
              const margins = { ...element.page?.margins, left: parseFloat(e.target.value) || 0 };
              handleChange('page', { ...element.page, margins });
            }}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Right Margin (mm)</label>
          <input
            type="number"
            value=${element.page?.margins?.right || 20}
            onChange=${e => {
              const margins = { ...element.page?.margins, right: parseFloat(e.target.value) || 0 };
              handleChange('page', { ...element.page, margins });
            }}
            className="w-full px-2 py-1 border rounded text-sm"
          />
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold mb-2">Typography</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Base Font Family</label>
            <select
              value=${element.typography?.baseFont?.family || 'serif'}
              onChange=${e => {
                const baseFont = { ...element.typography?.baseFont, family: e.target.value };
                handleChange('typography', { ...element.typography, baseFont });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="serif">Serif</option>
              <option value="sans-serif">Sans-serif</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Base Font Size (pt)</label>
            <input
              type="number"
              step="0.1"
              value=${element.typography?.baseFont?.size || 10.5}
              onChange=${e => {
                const baseFont = { ...element.typography?.baseFont, size: parseFloat(e.target.value) || 10.5 };
                handleChange('typography', { ...element.typography, baseFont });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Line Height</label>
            <input
              type="number"
              step="0.1"
              value=${element.typography?.baseFont?.lineHeight || 1.2}
              onChange=${e => {
                const baseFont = { ...element.typography?.baseFont, lineHeight: parseFloat(e.target.value) || 1.2 };
                handleChange('typography', { ...element.typography, baseFont });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-sm font-medium mb-1">H1 Size (pt)</label>
            <input
              type="number"
              value=${element.typography?.headerFont?.sizes?.h1 ?? 14}
              onChange=${e => {
                const headerFont = { ...element.typography?.headerFont, sizes: { ...element.typography?.headerFont?.sizes, h1: parseFloat(e.target.value) || 14 } };
                handleChange('typography', { ...element.typography, headerFont });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">H2 Size (pt)</label>
            <input
              type="number"
              value=${element.typography?.headerFont?.sizes?.h2 ?? 12}
              onChange=${e => {
                const headerFont = { ...element.typography?.headerFont, sizes: { ...element.typography?.headerFont?.sizes, h2: parseFloat(e.target.value) || 12 } };
                handleChange('typography', { ...element.typography, headerFont });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">H3 Size (pt)</label>
            <input
              type="number"
              value=${element.typography?.headerFont?.sizes?.h3 ?? 10}
              onChange=${e => {
                const headerFont = { ...element.typography?.headerFont, sizes: { ...element.typography?.headerFont?.sizes, h3: parseFloat(e.target.value) || 10 } };
                handleChange('typography', { ...element.typography, headerFont });
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Style</label>
            <select
              value=${element.typography?.bulletStyle || 'disc'}
              onChange=${e => handleChange('typography', { ...element.typography, bulletStyle: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="disc">Disc</option>
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Indent (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${element.typography?.bulletIndentation ?? 4.0}
              onChange=${e => handleChange('typography', { ...element.typography, bulletIndentation: parseFloat(e.target.value) || 4.0 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold mb-2">Spacing</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Line Spacing</label>
            <input
              type="number"
              step="0.1"
              value=${element.spacing?.lineSpacing ?? 1.2}
              onChange=${e => handleChange('spacing', { ...element.spacing, lineSpacing: parseFloat(e.target.value) || 1.2 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Spacing</label>
            <input
              type="number"
              step="0.1"
              value=${element.spacing?.bulletSpacing ?? 0.5}
              onChange=${e => handleChange('spacing', { ...element.spacing, bulletSpacing: parseFloat(e.target.value) || 0.5 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Row Spacing (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${element.spacing?.rowSpacing ?? 4.0}
              onChange=${e => handleChange('spacing', { ...element.spacing, rowSpacing: parseFloat(e.target.value) || 4.0 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section Title Before (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${element.spacing?.sectionTitleBefore ?? 6.0}
              onChange=${e => handleChange('spacing', { ...element.spacing, sectionTitleBefore: parseFloat(e.target.value) || 6.0 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section Title After (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${element.spacing?.sectionTitleAfter ?? 3.0}
              onChange=${e => handleChange('spacing', { ...element.spacing, sectionTitleAfter: parseFloat(e.target.value) || 3.0 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section Spacing (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${element.spacing?.sectionSpacing ?? 8.0}
              onChange=${e => handleChange('spacing', { ...element.spacing, sectionSpacing: parseFloat(e.target.value) || 8.0 })}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold mb-2">Theme (designTokens)</h4>
        <p className="text-xs text-gray-500 mb-2">Colors propagate to section borders, underlines, and bullet accents.</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">Primary</label>
            <${ColorPickerInput}
              value=${element.designTokens?.primary || ''}
              onChange=${(v) => handleChange('designTokens', { ...element.designTokens, primary: v })}
              placeholder="#333"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Accent</label>
            <${ColorPickerInput}
              value=${element.designTokens?.accent || ''}
              onChange=${(v) => handleChange('designTokens', { ...element.designTokens, accent: v })}
              placeholder="#0066cc"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Line Color</label>
            <${ColorPickerInput}
              value=${element.designTokens?.lineColor || ''}
              onChange=${(v) => handleChange('designTokens', { ...element.designTokens, lineColor: v })}
              placeholder="#000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Color</label>
            <${ColorPickerInput}
              value=${element.designTokens?.bulletColor || ''}
              onChange=${(v) => handleChange('designTokens', { ...element.designTokens, bulletColor: v })}
              placeholder=""
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h4 className="text-sm font-semibold mb-2">Overflow Policy</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked=${element.overflowPolicy?.allowOverflow !== false}
              onChange=${e => handleChange('overflowPolicy', { ...element.overflowPolicy, allowOverflow: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Allow Overflow</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked=${element.overflowPolicy?.restrictOverflow === true}
              onChange=${e => handleChange('overflowPolicy', { ...element.overflowPolicy, restrictOverflow: e.target.checked })}
              className="w-4 h-4"
            />
            <span>Restrict Overflow</span>
          </label>
          ${element.overflowPolicy?.restrictOverflow ? html`
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Limit Type</label>
                <select
                  value=${element.overflowPolicy?.limitType || ''}
                  onChange=${e => handleChange('overflowPolicy', { ...element.overflowPolicy, limitType: e.target.value })}
                  className="w-full px-2 py-1 border rounded text-sm"
                >
                  <option value="">Select</option>
                  <option value="characters">Characters</option>
                  <option value="lines">Lines</option>
                  <option value="height">Height (mm)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Limit Value</label>
                <input
                  type="number"
                  value=${element.overflowPolicy?.limitValue || ''}
                  onChange=${e => handleChange('overflowPolicy', { ...element.overflowPolicy, limitValue: parseFloat(e.target.value) || null })}
                  className="w-full px-2 py-1 border rounded text-sm"
                />
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-2">Configure header and footer in the Header & Footer tab.</p>
    </div>
  `;
};

export default TemplatePropertyPanel;
