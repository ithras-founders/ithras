import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

/**
 * Component for explaining individual features
 * Shows feature details, use cases, and related information
 */
const FeatureExplanation = ({ feature }) => {
  if (!feature) return null;

  return html`
    <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-8 md:p-10">
      <div className="flex items-start gap-4 mb-6">
        ${feature.icon ? html`
          <div className="w-12 h-12 bg-[var(--app-accent-soft)] rounded-xl flex items-center justify-center flex-shrink-0">
            ${typeof feature.icon === 'string' ? html`
              <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="${feature.icon}" />
              </svg>
            ` : feature.icon}
          </div>
        ` : ''}
        <div className="flex-1">
          <h3 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-2">${feature.name || 'Feature'}</h3>
          ${feature.description ? html`
            <p className="text-[var(--app-text-secondary)] font-medium text-lg leading-relaxed">${feature.description}</p>
          ` : ''}
        </div>
      </div>

      ${feature.howItWorks ? html`
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-3">How It Works</h4>
          <div className="text-[var(--app-text-secondary)] font-medium leading-relaxed whitespace-pre-line">
            ${feature.howItWorks}
          </div>
        </div>
      ` : ''}

      ${feature.useCases && feature.useCases.length > 0 ? html`
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-3">Use Cases</h4>
          <ul className="space-y-2">
            ${feature.useCases.map((useCase, index) => html`
              <li key=${index} className="flex gap-3">
                <span className="text-[var(--app-accent)] font-semibold mt-1">•</span>
                <span className="text-[var(--app-text-secondary)] font-medium flex-1">${useCase}</span>
              </li>
            `)}
          </ul>
        </div>
      ` : ''}

      ${feature.keyPoints && feature.keyPoints.length > 0 ? html`
        <div className="bg-[var(--app-surface-muted)] rounded-2xl p-6 border border-[var(--app-border-soft)]">
          <h4 className="text-lg font-semibold text-[var(--app-text-primary)] mb-4">Key Points</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            ${feature.keyPoints.map((point, index) => html`
              <div key=${index} className="flex gap-2">
                <svg className="w-5 h-5 text-[var(--app-accent)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-[var(--app-text-secondary)] font-medium text-sm">${point}</span>
              </div>
            `)}
          </div>
        </div>
      ` : ''}

      ${feature.relatedFeatures && feature.relatedFeatures.length > 0 ? html`
        <div className="mt-6 pt-6 border-t border-[var(--app-border-soft)]">
          <h4 className="text-sm font-semibold text-[var(--app-text-muted)] uppercase tracking-widest mb-3">Related Features</h4>
          <div className="flex flex-wrap gap-2">
            ${feature.relatedFeatures.map((related, index) => html`
              <span key=${index} className="px-3 py-1.5 bg-[var(--app-accent-soft)] text-[var(--app-accent)] rounded-lg text-xs font-bold">
                ${related}
              </span>
            `)}
          </div>
        </div>
      ` : ''}
    </div>
  `;
};

export default FeatureExplanation;
