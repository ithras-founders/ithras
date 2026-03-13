import React, { useState } from 'react';
import htm from 'htm';
import { uploadProof } from '/core/frontend/src/modules/shared/services/api/cv.js';
import ColorPickerInput from './ColorPickerInput.js';

const html = htm.bind(React.createElement);

const AUTO_VARIABLE_OPTIONS = [
  { id: 'name', label: 'Name' },
  { id: 'email', label: 'Email' },
  { id: 'roll_number', label: 'Roll Number' },
  { id: 'college_name', label: 'College Name' },
  { id: 'program', label: 'Program' },
  { id: 'profile_photo', label: 'Profile Photo' },
  { id: 'phone', label: 'Phone' },
  { id: 'linkedin_url', label: 'LinkedIn' },
  { id: 'portfolio_url', label: 'Portfolio' },
];

const HeaderFooterConfig = ({ config, onChange }) => {
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState('');
  const fixedElements = config.fixedElements || {};
  const header = fixedElements.header || {};
  const footer = fixedElements.footer || {};
  const headerContent = header.content ?? '';
  const footerContent = footer.content ?? '';
  const headerLayout = header.layout || (header.content ? 'simple' : 'simple');
  const logoUrl = header.logoUrl ?? '';
  const leftContent = typeof header.leftContent === 'string' ? header.leftContent : (header.leftContent?.value ?? '');
  const rightVariables = Array.isArray(header.rightVariables) ? header.rightVariables : [];
  const centerContent = header.centerContent ?? '';
  const footerVariables = Array.isArray(footer.variables) ? footer.variables : [];
  const autoVariables = Array.isArray(config.autoVariables) ? config.autoVariables : [];

  const updateHeader = (updates) => {
    onChange({
      ...config,
      fixedElements: {
        ...fixedElements,
        header: { ...header, ...updates },
      },
    });
  };

  const updateFooter = (updates) => {
    onChange({
      ...config,
      fixedElements: {
        ...fixedElements,
        footer: { ...footer, ...updates },
      },
    });
  };

  const setHeader = (content) => updateHeader({ content });
  const setFooterContent = (content) => updateFooter({ content });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !/\.(png|jpg|jpeg|gif|webp)$/i.test(file.name)) return;
    setLogoUploading(true);
    setLogoError('');
    try {
      const url = await uploadProof(file);
      updateHeader({ logoUrl: url });
      setLogoError('');
    } catch (err) {
      setLogoError(err.message || 'Upload failed');
      console.error('Logo upload failed:', err);
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const toggleRightVariable = (varId) => {
    const next = rightVariables.includes(varId)
      ? rightVariables.filter((v) => v !== varId)
      : [...rightVariables, varId];
    updateHeader({ rightVariables: next });
  };

  const toggleFooterVariable = (varId) => {
    const next = footerVariables.includes(varId)
      ? footerVariables.filter((v) => v !== varId)
      : [...footerVariables, varId];
    updateFooter({ variables: next });
  };

  const toggleAutoVariable = (varId) => {
    const next = autoVariables.includes(varId)
      ? autoVariables.filter((v) => v !== varId)
      : [...autoVariables, varId];
    onChange({ ...config, autoVariables: next });
  };

  const headerHeight = header.height ?? 15;
  const footerHeight = footer.height ?? 12;
  const headerBg = header.backgroundColor ?? '';
  const footerBg = footer.backgroundColor ?? '';

  return html`
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Header Height (mm)</label>
          <input
            type="number"
            min="0"
            step="1"
            value=${headerHeight}
            onChange=${(e) => updateHeader({ height: parseFloat(e.target.value) || 15 })}
            className="w-full px-3 py-2 border rounded"
            placeholder="15"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Footer Height (mm)</label>
          <input
            type="number"
            min="0"
            step="1"
            value=${footerHeight}
            onChange=${(e) => updateFooter({ height: parseFloat(e.target.value) || 12 })}
            className="w-full px-3 py-2 border rounded"
            placeholder="12"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Header Background (optional)</label>
          <${ColorPickerInput} value=${headerBg} onChange=${(v) => updateHeader({ backgroundColor: v })} placeholder="e.g. #f5f5f5 or transparent" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Footer Background (optional)</label>
          <${ColorPickerInput} value=${footerBg} onChange=${(v) => updateFooter({ backgroundColor: v })} placeholder="e.g. #f5f5f5 or transparent" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Header Layout</label>
        <select
          value=${headerLayout}
          onChange=${(e) => updateHeader({ layout: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="simple">Simple (centered)</option>
          <option value="split">Split (logo left, name/roll right)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Logo</label>
        ${logoUrl ? html`
          <div className="flex items-center gap-3 mb-2">
            <img src=${logoUrl.startsWith('/') ? (window.API_URL || '/api').replace('/api', '') + logoUrl : logoUrl} alt="Logo" className="h-12 object-contain rounded border" />
            <button
              type="button"
              onClick=${() => updateHeader({ logoUrl: '' })}
              className="text-xs text-red-600 hover:underline"
            >Remove</button>
          </div>
        ` : ''}
        <label className=${`inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border rounded cursor-pointer hover:bg-gray-100 ${logoUploading ? 'opacity-60' : ''}`}>
          <input type="file" accept="image/*" onChange=${handleLogoUpload} disabled=${logoUploading} className="hidden" />
          ${logoUploading ? 'Uploading...' : 'Upload logo (PNG, JPG)'}
        </label>
        ${logoError ? html`<p className="mt-2 text-sm text-red-600">${logoError}</p>` : ''}
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Logo position</label>
            <select
              value=${header.logoPosition || 'left'}
              onChange=${(e) => updateHeader({ logoPosition: e.target.value })}
              className="w-full px-2 py-1 border rounded text-sm"
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
              <option value="center">Center</option>
              <option value="above">Above (simple layout)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Logo max height (px)</label>
            <input
              type="number"
              min="20"
              max="120"
              value=${header.logoSize?.height ?? ''}
              onChange=${(e) => updateHeader({ logoSize: { ...header.logoSize, height: e.target.value ? parseInt(e.target.value) : null } })}
              className="w-full px-2 py-1 border rounded text-sm"
              placeholder="40"
            />
          </div>
        </div>
      </div>
      ${headerLayout === 'split' ? html`
        <div>
          <label className="block text-sm font-medium mb-2">Left content (institution name, etc.)</label>
          <input
            type="text"
            value=${leftContent}
            onChange=${(e) => updateHeader({ leftContent: { type: 'text', value: e.target.value } })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., Indian Institute of Management Calcutta"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Right variables (name, roll no.)</label>
          <div className="flex flex-wrap gap-2">
            ${AUTO_VARIABLE_OPTIONS.filter(o => ['name', 'roll_number', 'program'].includes(o.id)).map((opt) => html`
              <label key=${opt.id} className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked=${rightVariables.includes(opt.id)} onChange=${() => toggleRightVariable(opt.id)} className="w-4 h-4" />
                <span className="text-sm">${opt.label}</span>
              </label>
            `)}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Center badge bar (use {{name}} for variables)</label>
          <input
            type="text"
            value=${centerContent}
            onChange=${(e) => updateHeader({ centerContent: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., IIM CALCUTTA TOP 6% • ABG INTERN"
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bar background</label>
              <${ColorPickerInput} value=${header.centerContentBackgroundColor || ''} onChange=${(v) => updateHeader({ centerContentBackgroundColor: v })} placeholder="e.g. #334155" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Bar text color</label>
              <${ColorPickerInput} value=${header.centerContentTextColor || ''} onChange=${(v) => updateHeader({ centerContentTextColor: v })} placeholder="e.g. #fff" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Padding (mm)</label>
              <input
                type="text"
                value=${header.centerContentPadding || ''}
                onChange=${(e) => updateHeader({ centerContentPadding: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="3mm 6mm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Font size (pt)</label>
              <input
                type="text"
                value=${header.centerContentFontSize || ''}
                onChange=${(e) => updateHeader({ centerContentFontSize: e.target.value })}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="9"
              />
            </div>
          </div>
        </div>
      ` : html`
        <div>
          <label className="block text-sm font-medium mb-2">Header (use {{name}}, {{roll_number}}, {{email}}, {{college_name}})</label>
          <textarea
            value=${headerContent}
            onChange=${(e) => setHeader(e.target.value)}
            className="w-full px-3 py-2 border rounded min-h-[60px]"
            placeholder="e.g., Curriculum Vitae or {{name}}"
          />
        </div>
      `}
      <div>
        <label className="block text-sm font-medium mb-2">Footer layout</label>
        <select
          value=${footer.layout || 'single'}
          onChange=${(e) => updateFooter({ layout: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        >
          <option value="single">Single block</option>
          <option value="two_column">Two columns (left + right)</option>
        </select>
      </div>
      ${footer.layout === 'two_column' ? html`
        <div>
          <label className="block text-sm font-medium mb-2">Footer left content</label>
          <input
            type="text"
            value=${footer.leftContent || ''}
            onChange=${(e) => updateFooter({ leftContent: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., {{email}}"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Footer right content</label>
          <input
            type="text"
            value=${footer.rightContent || ''}
            onChange=${(e) => updateFooter({ rightContent: e.target.value })}
            className="w-full px-3 py-2 border rounded"
            placeholder="e.g., {{college_name}}"
          />
        </div>
      ` : html`
        <div>
          <label className="block text-sm font-medium mb-2">Footer (use {{email}}, {{college_name}} for variables)</label>
          <textarea
            value=${footerContent}
            onChange=${(e) => setFooterContent(e.target.value)}
            className="w-full px-3 py-2 border rounded min-h-[60px]"
            placeholder="e.g., {{email}} • {{college_name}}"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Footer alignment</label>
          <select
            value=${footer.alignment || 'center'}
            onChange=${(e) => updateFooter({ alignment: e.target.value })}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Footer variables (shown below content)</label>
        <div className="flex flex-wrap gap-2">
          ${AUTO_VARIABLE_OPTIONS.filter(o => ['email', 'college_name', 'phone', 'linkedin_url', 'portfolio_url'].includes(o.id)).map((opt) => html`
            <label key=${opt.id} className="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" checked=${footerVariables.includes(opt.id)} onChange=${() => toggleFooterVariable(opt.id)} className="w-4 h-4" />
              <span className="text-sm">${opt.label}</span>
            </label>
          `)}
        </div>
        </div>
      `}
      <div>
        <label className="block text-sm font-medium mb-2">Legacy: Auto Variables (simple layout only)</label>
        <p className="text-xs text-gray-500 mb-2">List of variables shown below header</p>
        <div className="flex flex-wrap gap-3">
          ${AUTO_VARIABLE_OPTIONS.map((opt) => html`
            <label key=${opt.id} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked=${autoVariables.includes(opt.id)} onChange=${() => toggleAutoVariable(opt.id)} className="w-4 h-4 rounded border-gray-300" />
              <span className="text-sm">${opt.label}</span>
            </label>
          `)}
        </div>
      </div>
    </div>
  `;
};

export default HeaderFooterConfig;
