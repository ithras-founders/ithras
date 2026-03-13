import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const PreparationPortal = ({ user }) => {
  return html`
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 hover:border-[var(--app-accent)] transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[var(--app-accent-soft)] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">Interview Prep</h3>
          <p className="text-sm text-[var(--app-text-secondary)] mb-4">Practice questions, company-specific prep, and role-based material. AI-generated prep tailored to your target companies.</p>
          <span className="text-xs font-semibold text-[var(--app-accent)] uppercase tracking-wider">Coming soon</span>
        </div>

        <div className="bg-[var(--app-surface)] rounded-2xl border border-[var(--app-border-soft)] p-6 hover:border-[var(--app-accent)] transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[var(--app-accent-soft)] flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-[var(--app-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-[var(--app-text-primary)] mb-2">Career Path</h3>
          <p className="text-sm text-[var(--app-text-secondary)] mb-4">Career path recommendations from verified placement data. See what roles profiles like yours landed.</p>
          <span className="text-xs font-semibold text-[var(--app-accent)] uppercase tracking-wider">Coming soon</span>
        </div>
      </div>
    </div>
  `;
};

export default PreparationPortal;
