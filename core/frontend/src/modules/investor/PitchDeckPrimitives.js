import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const StatCardBase = ({ label, value, sub, color = 'blue' }) => html`
  <div className="bg-white/[0.06] rounded-2xl p-6 border border-white/[0.08] backdrop-blur-sm">
    <p className="text-sm font-medium text-white/50 mb-1 tracking-wide">${label}</p>
    <p className=${'text-3xl font-semibold text-' + color + '-400 tracking-tight'}>${value}</p>
    ${sub ? html`<p className="text-xs text-white/40 mt-1.5">${sub}</p>` : null}
  </div>
`;

const FeatureCardBase = ({ icon, title, desc }) => html`
  <div className="bg-white/[0.05] rounded-2xl p-6 border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200">
    <div className="text-2xl mb-4">${icon}</div>
    <h4 className="text-white font-semibold text-sm mb-1.5 tracking-tight">${title}</h4>
    <p className="text-white/45 text-xs leading-relaxed">${desc}</p>
  </div>
`;

const SectionLabelBase = ({ text }) => html`
  <span className="inline-block px-3 py-1.5 rounded-full bg-indigo-500/15 text-indigo-300/90 text-[11px] font-semibold tracking-widest uppercase mb-5">${text}</span>
`;

const CitationCardBase = ({ href, source, children, className = '', linkText = 'Source ↗' }) => html`
  <a
    href=${href}
    target="_blank"
    rel="noopener noreferrer"
    className=${'group block rounded-xl p-5 border border-white/10 transition-all hover:border-white/20 ' + className}
  >
    ${children}
    <div className="mt-3 flex items-center justify-between">
      <span className="text-[10px] text-white/40 font-medium">${source}</span>
      <span className="text-[10px] text-indigo-300/80 font-bold uppercase tracking-wider">${linkText}</span>
    </div>
  </a>
`;

const MiniTableBase = ({ headers, rows }) => html`
  <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
    <div className="grid gap-0" style=${{ gridTemplateColumns: 'repeat(' + headers.length + ', 1fr)' }}>
      ${headers.map(h => html`<div key=${h} className="px-4 py-2.5 text-xs font-bold text-white/40 border-b border-white/10 bg-white/5">${h}</div>`)}
      ${rows.flatMap((row, ri) => row.map((cell, ci) => html`
        <div key=${ri + '-' + ci} className=${'px-4 py-2.5 text-sm text-white/80 ' + (ri < rows.length - 1 ? 'border-b border-white/5' : '')}>${cell}</div>
      `))}
    </div>
  </div>
`;

const PipCalloutBase = ({ label, children, position = 'bottom-right', accentColor = 'indigo' }) => html`
  <div 
    className=${'absolute z-20 overflow-hidden ' + (position === 'top-right' ? 'top-4 right-4' : position === 'bottom-right' ? 'bottom-4 right-4' : position === 'top-left' ? 'top-4 left-4' : 'bottom-4 left-4')} 
    style=${{ minWidth: '200px', maxWidth: '280px' }}
  >
    <div className="rounded-2xl bg-[var(--app-text-primary)]/90 backdrop-blur-xl border border-white/[0.08] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
      <div className=${'px-4 py-2.5 flex items-center gap-2.5 ' + (accentColor === 'violet' ? 'bg-gradient-to-r from-violet-500/15 to-fuchsia-500/10' : accentColor === 'indigo' ? 'bg-gradient-to-r from-indigo-500/15 to-blue-500/10' : 'bg-white/[0.06]')}>
        <div className=${'w-7 h-7 rounded-lg flex items-center justify-center ' + (accentColor === 'violet' ? 'bg-violet-500/25' : 'bg-indigo-500/25')}>
          <svg className="w-3.5 h-3.5 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <span className="text-[11px] font-semibold text-white/95 tracking-wide">${label}</span>
      </div>
      <div className="p-4">
        ${children}
      </div>
    </div>
  </div>
`;

export const StatCard = React.memo(StatCardBase);
export const FeatureCard = React.memo(FeatureCardBase);
export const SectionLabel = React.memo(SectionLabelBase);
export const CitationCard = React.memo(CitationCardBase);
export const MiniTable = React.memo(MiniTableBase);
export const PipCallout = React.memo(PipCalloutBase);
