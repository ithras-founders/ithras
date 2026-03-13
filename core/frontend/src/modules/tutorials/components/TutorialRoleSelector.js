import React from 'react';
import htm from 'htm';
import { ROLES_WITH_TUTORIALS } from '../context/tutorialSteps.js';

const html = htm.bind(React.createElement);

const ROLE_ICONS = {
  shield: html`<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`,
  clipboard: html`<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>`,
  briefcase: html`<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>`,
  user: html`<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`,
  settings: html`<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>`,
};

const ROLE_COLORS = {
  shield: { bg: 'bg-indigo-100', text: 'text-indigo-600', border: 'border-indigo-200', hover: 'hover:border-indigo-400 hover:bg-indigo-50/50' },
  clipboard: { bg: 'bg-emerald-100', text: 'text-emerald-600', border: 'border-emerald-200', hover: 'hover:border-emerald-400 hover:bg-emerald-50/50' },
  briefcase: { bg: 'bg-amber-100', text: 'text-amber-600', border: 'border-amber-200', hover: 'hover:border-amber-400 hover:bg-amber-50/50' },
  user: { bg: 'bg-[var(--app-accent-soft)]', text: 'text-[var(--app-accent)]', border: 'border-[var(--app-border-soft)]', hover: 'hover:border-[var(--app-accent)] hover:bg-[var(--app-accent-soft)]/50' },
  settings: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', hover: 'hover:border-slate-400 hover:bg-slate-50/50' },
};

const TutorialRoleSelector = ({ onSelect, onClose, roles = ROLES_WITH_TUTORIALS }) => html`
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick=${onClose}>
    <div 
      className="bg-[var(--app-surface)] rounded-[var(--app-radius-md)] shadow-[var(--app-shadow-floating)] border border-[var(--app-border-soft)] p-10 max-w-lg w-full mx-4 animate-in fade-in zoom-in-95 duration-200"
      onClick=${(e) => e.stopPropagation()}
    >
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight">Guided Demo</h2>
        <p className="text-[var(--app-text-secondary)] text-sm mt-2 max-w-sm mx-auto">Experience the platform through any role. Each tour showcases real features with realistic data.</p>
      </div>
      <div className="space-y-3">
        ${roles.map((role) => {
          const icon = role.icon || 'user';
          const colors = ROLE_COLORS[icon] || ROLE_COLORS.user;
          return html`
            <button
              key=${role.id}
              onClick=${() => onSelect(role.id)}
              className=${'w-full p-5 text-left rounded-2xl border transition-all group flex items-center gap-4 ' + colors.border + ' ' + colors.hover}
            >
              <div className=${'w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ' + colors.bg + ' ' + colors.text}>
                ${ROLE_ICONS[icon] || ROLE_ICONS.user}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[var(--app-text-primary)] text-base">${role.label}</p>
                <p className="text-xs text-[var(--app-text-secondary)] mt-0.5 leading-relaxed">${role.description}</p>
              </div>
              <svg className="w-5 h-5 text-[var(--app-text-muted)] group-hover:text-[var(--app-text-secondary)] transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          `;
        })}
      </div>
      <button
        onClick=${onClose}
        className="mt-8 w-full py-3 text-[var(--app-text-muted)] text-sm font-bold hover:text-[var(--app-text-secondary)] transition-colors"
      >
        Cancel
      </button>
    </div>
  </div>
`;

export default TutorialRoleSelector;
