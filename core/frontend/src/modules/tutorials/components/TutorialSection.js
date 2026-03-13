import React from 'react';
import htm from 'htm';
import FeatureExplanation from './FeatureExplanation.js';

const html = htm.bind(React.createElement);

/**
 * Individual tutorial section display component
 * Shows step-by-step instructions, explanations, and interactive elements
 */
const TutorialSection = ({ section, subsection, role, user }) => {
  if (!subsection) {
    return html`
      <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-12 text-center">
        <p className="text-[var(--app-text-muted)] font-medium">No content available</p>
      </div>
    `;
  }

  return html`
    <div className="space-y-8 animate-in">
      <!-- Header -->
      <header className="bg-[var(--app-surface)] rounded-[var(--app-radius-lg)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-8 md:p-12">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-[var(--app-accent-soft)] rounded-[var(--app-radius-sm)] flex items-center justify-center">
                <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[var(--app-text-muted)] uppercase tracking-widest">${section.title}</p>
                <h1 className="text-3xl md:text-4xl font-semibold text-[var(--app-text-primary)] tracking-tighter mt-1">${subsection.title}</h1>
              </div>
            </div>
            ${subsection.description ? html`
              <p className="text-[var(--app-text-secondary)] font-medium text-lg leading-relaxed">${subsection.description}</p>
            ` : ''}
          </div>
        </div>
      </header>

      <!-- Content -->
      <div className="space-y-6">
        ${subsection.content ? html`
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-8 md:p-10">
            <div className="prose max-w-none">
              <div className="text-[var(--app-text-secondary)] font-medium leading-relaxed whitespace-pre-line">
                ${subsection.content}
              </div>
            </div>
          </div>
        ` : ''}

        ${subsection.steps && subsection.steps.length > 0 ? html`
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6">Step-by-Step Guide</h2>
            <div className="space-y-6">
              ${subsection.steps.map((step, index) => html`
                <div key=${index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-sm)] flex items-center justify-center font-semibold text-lg shadow-[var(--app-shadow-subtle)]">
                      ${index + 1}
                    </div>
                  </div>
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">${step.title || `Step ${index + 1}`}</h3>
                    ${step.description ? html`
                      <p className="text-[var(--app-text-secondary)] font-medium leading-relaxed mb-3">${step.description}</p>
                    ` : ''}
                    ${step.actions && step.actions.length > 0 ? html`
                      <ul className="list-disc list-inside space-y-2 text-[var(--app-text-secondary)] font-medium">
                        ${step.actions.map((action, i) => html`
                          <li key=${i}>${action}</li>
                        `)}
                      </ul>
                    ` : ''}
                    ${step.note ? html`
                      <div className="mt-4 p-4 bg-[var(--app-accent-soft)] border border-[rgba(0,113,227,0.2)] rounded-[var(--app-radius-sm)]">
                        <p className="text-sm font-medium text-[var(--app-text-primary)]">
                          <span className="font-semibold">Note:</span> ${step.note}
                        </p>
                      </div>
                    ` : ''}
                  </div>
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${subsection.features && subsection.features.length > 0 ? html`
          <div className="space-y-4">
            ${subsection.features.map((feature, index) => html`
              <${FeatureExplanation} key=${index} feature=${feature} />
            `)}
          </div>
        ` : ''}

        ${subsection.examples && subsection.examples.length > 0 ? html`
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6">Examples</h2>
            <div className="space-y-4">
              ${subsection.examples.map((example, index) => html`
                <div key=${index} className="p-6 bg-[var(--app-surface-muted)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)]">
                  ${example.title ? html`
                    <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-3">${example.title}</h3>
                  ` : ''}
                  ${example.description ? html`
                    <p className="text-[var(--app-text-secondary)] font-medium mb-3">${example.description}</p>
                  ` : ''}
                  ${example.code ? html`
                    <pre className="bg-[var(--app-text-primary)] text-[var(--app-surface)] p-4 rounded-[var(--app-radius-sm)] overflow-x-auto text-sm font-mono">
                      <code>${example.code}</code>
                    </pre>
                  ` : ''}
                </div>
              `)}
            </div>
          </div>
        ` : ''}

        ${subsection.tips && subsection.tips.length > 0 ? html`
          <div className="bg-[var(--app-accent-soft)] rounded-[var(--app-radius-md)] border border-[rgba(0,113,227,0.2)] shadow-[var(--app-shadow-subtle)] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Tips & Best Practices
            </h2>
            <ul className="space-y-3">
              ${subsection.tips.map((tip, index) => html`
                <li key=${index} className="flex gap-3">
                  <span className="text-[var(--app-accent)] font-semibold mt-1">•</span>
                  <span className="text-[var(--app-text-primary)] font-medium flex-1">${tip}</span>
                </li>
              `)}
            </ul>
          </div>
        ` : ''}

        ${subsection.faq && subsection.faq.length > 0 ? html`
          <div className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] border border-[var(--app-border-soft)] shadow-[var(--app-shadow-subtle)] p-8 md:p-10">
            <h2 className="text-xl font-semibold text-[var(--app-text-primary)] mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              ${subsection.faq.map((item, index) => html`
                <div key=${index} className="border-b border-[var(--app-border-soft)] pb-4 last:border-0">
                  <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">${item.question}</h3>
                  <p className="text-[var(--app-text-secondary)] font-medium">${item.answer}</p>
                </div>
              `)}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;
};

export default TutorialSection;
