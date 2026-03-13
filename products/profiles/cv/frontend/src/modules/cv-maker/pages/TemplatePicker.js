import React from 'react';
import htm from 'htm';
import { DynamicCVPreview, getDummyCVDataForTemplate } from '/core/frontend/src/modules/shared/cv/index.js';

const html = htm.bind(React.createElement);

const TemplatePreview = ({ template }) => {
  if (template.preview_url) {
    return html`<img src=${template.preview_url} alt=${template.name || 'Preview'} className="w-full h-full object-cover object-top" />`;
  }
  const cvData = getDummyCVDataForTemplate(template);
  const dummyUser = { name: 'Preview User', email: 'preview@example.com', roll_number: 'MBA/2024' };
  const scale = 0.22;
  const scalePct = Math.round(100 / scale);
  return html`
    <div style=${{ transform: `scale(${scale})`, transformOrigin: 'top left', width: `${scalePct}%`, height: `${scalePct}%`, minHeight: '400px' }}>
      <${DynamicCVPreview}
        template=${template}
        cvData=${cvData}
        user=${dummyUser}
      />
    </div>
  `;
};

const TemplatePicker = ({ templates, user, onPick, onBack }) => {
  return html`
    <div className="p-6">
      <button
        onClick=${onBack}
        className="mb-4 text-[var(--app-accent)] hover:underline"
      >
        ← Back
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${templates.map(tpl => html`
          <div key=${tpl.id} className="border rounded-[var(--app-radius-sm)] overflow-hidden shadow-[var(--app-shadow-subtle)] hover:shadow-[var(--app-shadow-card)] bg-[var(--app-surface)]">
            <div className="h-44 bg-[var(--app-bg-elevated)] flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 overflow-hidden" style=${{ width: '100%', height: '100%' }}>
                <${TemplatePreview} template=${tpl} />
              </div>
            </div>
            <div className="p-4 border-t border-[var(--app-border-soft)]">
              <h3 className="font-semibold mb-2">${tpl.name || 'Unnamed template'}</h3>
              <button
                onClick=${() => onPick(tpl)}
                className="w-full px-4 py-2 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] hover:bg-[var(--app-accent-hover)] transition-colors"
              >
                Use this template
              </button>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
};

export default TemplatePicker;
