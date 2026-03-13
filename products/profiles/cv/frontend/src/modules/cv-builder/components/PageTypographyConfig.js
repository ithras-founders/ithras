import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PageTypographyConfig = ({ config, onChange }) => {
  const updateConfig = (path, value) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newConfig);
  };

  const updateNested = (path, key, value) => {
    const newConfig = JSON.parse(JSON.stringify(config));
    const keys = path.split('.');
    let current = newConfig;
    for (const k of keys) {
      if (!current[k]) current[k] = {};
      current = current[k];
    }
    current[key] = value;
    onChange(newConfig);
  };

  return html`
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Page Settings</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Page Size</label>
            <select
              value=${config.page?.size || 'A4'}
              onChange=${e => updateConfig('page.size', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
              <option value="Legal">Legal</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Top Margin (mm)</label>
            <input
              type="number"
              value=${config.page?.margins?.top || 20}
              onChange=${e => updateNested('page.margins', 'top', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bottom Margin (mm)</label>
            <input
              type="number"
              value=${config.page?.margins?.bottom || 20}
              onChange=${e => updateNested('page.margins', 'bottom', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Left Margin (mm)</label>
            <input
              type="number"
              value=${config.page?.margins?.left || 20}
              onChange=${e => updateNested('page.margins', 'left', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Right Margin (mm)</label>
            <input
              type="number"
              value=${config.page?.margins?.right || 20}
              onChange=${e => updateNested('page.margins', 'right', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Typography</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Base Font Family</label>
            <select
              value=${config.typography?.baseFont?.family || 'serif'}
              onChange=${e => updateNested('typography.baseFont', 'family', e.target.value)}
              className="w-full px-3 py-2 border rounded"
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
              value=${config.typography?.baseFont?.size || 10.5}
              onChange=${e => updateNested('typography.baseFont', 'size', parseFloat(e.target.value) || 10.5)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Line Height</label>
            <input
              type="number"
              step="0.1"
              value=${config.typography?.baseFont?.lineHeight || 1.2}
              onChange=${e => updateNested('typography.baseFont', 'lineHeight', parseFloat(e.target.value) || 1.2)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">H1 Size (pt)</label>
            <input
              type="number"
              value=${config.typography?.headerFont?.sizes?.h1 || 14}
              onChange=${e => {
                const newConfig = JSON.parse(JSON.stringify(config));
                if (!newConfig.typography) newConfig.typography = {};
                if (!newConfig.typography.headerFont) newConfig.typography.headerFont = {};
                if (!newConfig.typography.headerFont.sizes) newConfig.typography.headerFont.sizes = {};
                newConfig.typography.headerFont.sizes.h1 = parseFloat(e.target.value) || 14;
                onChange(newConfig);
              }}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">H2 Size (pt)</label>
            <input
              type="number"
              value=${config.typography?.headerFont?.sizes?.h2 || 12}
              onChange=${e => {
                const newConfig = JSON.parse(JSON.stringify(config));
                if (!newConfig.typography) newConfig.typography = {};
                if (!newConfig.typography.headerFont) newConfig.typography.headerFont = {};
                if (!newConfig.typography.headerFont.sizes) newConfig.typography.headerFont.sizes = {};
                newConfig.typography.headerFont.sizes.h2 = parseFloat(e.target.value) || 12;
                onChange(newConfig);
              }}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">H3 Size (pt)</label>
            <input
              type="number"
              value=${config.typography?.headerFont?.sizes?.h3 || 10}
              onChange=${e => {
                const newConfig = JSON.parse(JSON.stringify(config));
                if (!newConfig.typography) newConfig.typography = {};
                if (!newConfig.typography.headerFont) newConfig.typography.headerFont = {};
                if (!newConfig.typography.headerFont.sizes) newConfig.typography.headerFont.sizes = {};
                newConfig.typography.headerFont.sizes.h3 = parseFloat(e.target.value) || 10;
                onChange(newConfig);
              }}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Style</label>
            <select
              value=${config.typography?.bulletStyle || 'disc'}
              onChange=${e => updateConfig('typography.bulletStyle', e.target.value)}
              className="w-full px-3 py-2 border rounded"
            >
              <option value="disc">Disc</option>
              <option value="circle">Circle</option>
              <option value="square">Square</option>
              <option value="none">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Indentation (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${config.typography?.bulletIndentation || 4.0}
              onChange=${e => updateConfig('typography.bulletIndentation', parseFloat(e.target.value) || 4.0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Spacing</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Line Spacing</label>
            <input
              type="number"
              step="0.1"
              value=${config.spacing?.lineSpacing || 1.2}
              onChange=${e => updateConfig('spacing.lineSpacing', parseFloat(e.target.value) || 1.2)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bullet Spacing</label>
            <input
              type="number"
              step="0.1"
              value=${config.spacing?.bulletSpacing || 0.5}
              onChange=${e => updateConfig('spacing.bulletSpacing', parseFloat(e.target.value) || 0.5)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Row Spacing (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${config.spacing?.rowSpacing || 4.0}
              onChange=${e => updateConfig('spacing.rowSpacing', parseFloat(e.target.value) || 4.0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section Title Before (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${config.spacing?.sectionTitleBefore || 6.0}
              onChange=${e => updateConfig('spacing.sectionTitleBefore', parseFloat(e.target.value) || 6.0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section Title After (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${config.spacing?.sectionTitleAfter || 3.0}
              onChange=${e => updateConfig('spacing.sectionTitleAfter', parseFloat(e.target.value) || 3.0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section Spacing (mm)</label>
            <input
              type="number"
              step="0.1"
              value=${config.spacing?.sectionSpacing || 8.0}
              onChange=${e => updateConfig('spacing.sectionSpacing', parseFloat(e.target.value) || 8.0)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="text-xl font-bold mb-4">Overflow Policy</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked=${config.overflowPolicy?.allowOverflow !== false}
                onChange=${e => updateNested('overflowPolicy', 'allowOverflow', e.target.checked)}
                className="w-4 h-4"
              />
              <span>Allow Overflow</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked=${config.overflowPolicy?.restrictOverflow === true}
                onChange=${e => updateNested('overflowPolicy', 'restrictOverflow', e.target.checked)}
                className="w-4 h-4"
              />
              <span>Restrict Overflow</span>
            </label>
          </div>
          ${config.overflowPolicy?.restrictOverflow ? html`
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Limit Type</label>
                <select
                  value=${config.overflowPolicy?.limitType || ''}
                  onChange=${e => updateNested('overflowPolicy', 'limitType', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="">Select limit type</option>
                  <option value="characters">Characters</option>
                  <option value="lines">Lines</option>
                  <option value="height">Height (mm)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Limit Value</label>
                <input
                  type="number"
                  value=${config.overflowPolicy?.limitValue || ''}
                  onChange=${e => updateNested('overflowPolicy', 'limitValue', parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 border rounded"
                />
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
};

export default PageTypographyConfig;
