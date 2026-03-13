import React from 'react';
import htm from 'htm';
import { SectionLabel, CitationCard, StatCard } from '../PitchDeckPrimitives.js';

const html = htm.bind(React.createElement);

// Light-theme section label (indigo on light bg)
const LightLabel = ({ text }) => html`
  <span className="inline-block px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[11px] font-semibold tracking-widest uppercase mb-5">${text}</span>
`;

export const CoverSlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center relative px-8 md:px-16">
    <div className="relative z-10">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-slate-800 tracking-tight mb-5" style=${{ letterSpacing: '-0.03em' }}>
        <span className="relative inline-block align-baseline">
          <span className="absolute left-1/2 bottom-full -translate-x-1/2 mb-0 flex items-center justify-center" style=${{ width: '0.2em', height: '0.2em', minWidth: '8px', minHeight: '8px' }}>
            <span className="w-full h-full rounded-full bg-amber-500" />
          </span>
          <span>ı</span>
        </span>thras
      </h1>
      <p className="text-xl md:text-2xl font-medium text-indigo-600 mb-10 tracking-wide">Recruitment Reimagined</p>
      <div className="w-20 h-0.5 bg-indigo-500/30 rounded-full mx-auto mb-10" />
      <p className="text-base md:text-lg text-slate-500 max-w-xl mx-auto leading-relaxed" style=${{ textWrap: 'balance' }}>
        Campus placements are broken. We're fixing the system — starting with governance, automation and AI — then building the largest verified professional network in India.
      </p>
      <div className="mt-14 flex items-center justify-center gap-6 text-slate-400 text-sm tracking-wide">
        <span>University Investor Deck</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>Confidential</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>2026</span>
      </div>
    </div>
  </div>
`;

export const CampusCrisisSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="The Crisis" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Campus Placements Are in Crisis</h2>
    <p className="text-slate-500 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>The process that determines careers for millions is run on spreadsheets, controlled by student committees with no training, and governed by zero systems. The cracks are showing.</p>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">From the Headlines</h3>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm mb-0.5">IIM Indore — Sexual Harassment</p>
              <p className="text-slate-500 text-xs leading-relaxed">Sexual harassment incidents reported during placement season. Opaque processes with no oversight mechanism.</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm mb-0.5">IIT Bombay — Accepting Unfair Methods</p>
              <p className="text-slate-500 text-xs leading-relaxed">Reports of unfair shortlisting and selection methods being tolerated by placement cells with no accountability.</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm mb-0.5">IIM Calcutta — Impeachment Motion</p>
              <p className="text-slate-500 text-xs leading-relaxed">Students filed an impeachment motion against the placement committee over governance failures and lack of transparency.</p>
            </div>
          </div>
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">The Research</h3>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-red-500">21%</span>
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm mb-0.5">1-year MBA attrition at top-tier campuses</p>
              <p className="text-slate-500 text-xs leading-relaxed">Rates reach 21%, 26%, and 28% at key tenure checkpoints. Tier 2/3 campuses: 19%, 21%, 25%.</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Deloitte India Research</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-amber-500">50%</span>
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm mb-0.5">Students not optimistic about preferred job</p>
              <p className="text-slate-500 text-xs leading-relaxed">Half of surveyed students are not confident about landing a role in their preferred field.</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Unstop Talent Report 2024</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
              <span className="text-xl font-semibold text-orange-500">67%</span>
            </div>
            <div>
              <p className="text-slate-800 font-semibold text-sm mb-0.5">University students discontent with career services</p>
              <p className="text-slate-500 text-xs leading-relaxed">Widespread dissatisfaction with career support quality and placement process transparency.</p>
              <p className="text-[10px] text-slate-400 mt-1 font-medium">Global Talent in India Report</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const HowWeSolveSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Our Solution" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Three Pillars to Fix Placements</h2>
    <p className="text-slate-500 text-base md:text-lg mb-8 max-w-2xl" style=${{ textWrap: 'balance' }}>We don't patch the process — we replace the foundation. Governance ensures fairness. Automation eliminates manual work. AI surfaces intelligence no spreadsheet can.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
        </div>
        <h3 className="text-indigo-700 font-bold text-xl mb-2">Governance</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">Policy engine with tier caps, shortlist limits, and approval workflows. Every decision auditable. No more "why did they get 4 Tier-1 offers?"</p>
        <ul className="space-y-1.5">
          ${['Policy engine with configurable rules', 'Multi-stage approval workflows', 'Full audit trail for every action', 'CV verification pipeline'].map(f => html`
            <li key=${f} className="text-slate-500 text-xs flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              ${f}
            </li>
          `)}
        </ul>
      </div>
      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
        </div>
        <h3 className="text-emerald-700 font-bold text-xl mb-2">Automation</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">Replace 50+ spreadsheets and 3-4 weeks of email scheduling with a single platform. Workflows, calendars, and pipelines — automated.</p>
        <ul className="space-y-1.5">
          ${['Multi-stage recruitment workflows', 'Smart calendar with conflict detection', 'Bulk operations and pipeline management', 'Multi-stakeholder portals'].map(f => html`
            <li key=${f} className="text-slate-500 text-xs flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              ${f}
            </li>
          `)}
        </ul>
      </div>
      <div className="bg-white border-2 border-violet-200 rounded-2xl p-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <h3 className="text-violet-700 font-bold text-xl mb-2">AI</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-4">AI-powered matching, CV analysis, and strategic insights. Students get fit scores. Placement teams get cycle intelligence. Recruiters get ranked shortlists.</p>
        <ul className="space-y-1.5">
          ${['AI candidate-company matching', 'CV section analysis and scoring', 'Predictive placement analytics', 'Strategic cycle recommendations'].map(f => html`
            <li key=${f} className="text-slate-500 text-xs flex items-start gap-2">
              <svg className="w-3.5 h-3.5 text-violet-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              ${f}
            </li>
          `)}
        </ul>
      </div>
    </div>

    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
      <p className="text-indigo-800 text-sm font-semibold text-center leading-relaxed">Governance + Automation + AI — together they replace spreadsheets, eliminate opacity, and give every stakeholder a single source of truth.</p>
    </div>
  </div>
`;

export const WhyUsSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Founder–Market Fit" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Why Us?</h2>
    <p className="text-slate-500 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>We didn't study this market from the outside. We ran it, broke it, fixed it, and then built the system it needed.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center mb-3">
          <span className="text-indigo-600 font-bold text-sm">SG</span>
        </div>
        <h4 className="text-slate-800 font-bold text-base mb-1">Shashank Gandham</h4>
        <p className="text-indigo-600 text-xs font-semibold mb-2">CEO — Tech, Product & Strategy</p>
        <p className="text-slate-600 text-sm leading-relaxed">Part of the <span className="font-semibold text-slate-800">highest-rated placement team in the history of IIM Calcutta</span>. Built and shipped the product from zero.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-3">
          <span className="text-blue-600 font-bold text-sm">AA</span>
        </div>
        <h4 className="text-slate-800 font-bold text-base mb-1">Abhishek Achanta</h4>
        <p className="text-blue-600 text-xs font-semibold mb-2">Co-Founder — Product & Technology</p>
        <p className="text-slate-600 text-sm leading-relaxed">Responsible for <span className="font-semibold text-slate-800">automating processes and making scheduling fairer — cutting the control team in half</span>.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-3">
          <span className="text-emerald-600 font-bold text-sm">MK</span>
        </div>
        <h4 className="text-slate-800 font-bold text-base mb-1">Matthew Kallarackal</h4>
        <p className="text-emerald-600 text-xs font-semibold mb-2">Co-Founder — Operations & Sales</p>
        <p className="text-slate-600 text-sm leading-relaxed"><span className="font-semibold text-slate-800">Ex-founder (Skaut)</span>. Brings real business-running and sales DNA. Growth at MakeMyTrip. M&A at PwC.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <div>
          <p className="text-slate-800 font-semibold text-sm">Transitioned IIM Calcutta into the cluster cohort system</p>
          <p className="text-slate-500 text-xs mt-1">The team designed and implemented the new placement structure at India's top B-school.</p>
        </div>
      </div>
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </div>
        <div>
          <p className="text-slate-800 font-semibold text-sm">Spoke with 10+ institutions, 15 years of placement teams</p>
          <p className="text-slate-500 text-xs mt-1">Deep discovery across institutions to understand how placement systems have evolved over 15+ years.</p>
        </div>
      </div>
    </div>

    <div className="bg-slate-800 rounded-2xl p-5 shadow-lg">
      <p className="text-white text-sm md:text-base font-semibold text-center leading-relaxed">
        "We are not just building a product — we want to attack the culture of institutional placements. MBA first, then engineering and other UG colleges."
      </p>
    </div>
  </div>
`;

export const VisionFlywheelSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Overall Vision" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">The Flywheel: Campus to Lateral</h2>
    <p className="text-slate-500 text-base mb-6 max-w-xl" style=${{ textWrap: 'balance' }}>Each step unlocks the next. We start where trust exists, then build the largest verified professional network in India.</p>

    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-6">
      ${[
        { step: '1', label: 'Institutional Placements', desc: 'Campus workflow, governance, policy engine. Only incumbent is EdTex (which glitches).', color: 'indigo', tag: 'Wedge' },
        { step: '2', label: 'Verified Profiles', desc: 'Placement-cell verified CVs create a trust layer no competitor can replicate.', color: 'emerald', tag: 'Trust' },
        { step: '3', label: 'Alumni Onboarding', desc: 'Alumni join the network. Job postings flow through verified institutional channels.', color: 'blue', tag: 'Network' },
        { step: '4', label: 'Recruiter Onboarding', desc: 'Recruiters are onboarded through institutions — governed JDs, pipelines, calendar.', color: 'amber', tag: 'Demand' },
        { step: '5', label: 'Lateral Jobs Portal', desc: 'B2C professional network. Verified profiles + recruiter demand = lateral marketplace.', color: 'purple', tag: 'Scale' },
      ].map(s => html`
        <div key=${s.step} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <div className=${'w-7 h-7 rounded-lg flex items-center justify-center bg-' + s.color + '-100'}>
              <span className=${'text-' + s.color + '-600 font-bold text-xs'}>${s.step}</span>
            </div>
            <span className=${'text-[9px] font-bold uppercase tracking-wider text-' + s.color + '-500'}>${s.tag}</span>
          </div>
          <h4 className="text-slate-800 font-semibold text-sm mb-1">${s.label}</h4>
          <p className="text-slate-500 text-[11px] leading-relaxed flex-1">${s.desc}</p>
        </div>
      `)}
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
        </div>
        <div>
          <p className="text-slate-800 font-semibold text-sm">Driven by social media engagement</p>
          <p className="text-slate-500 text-xs mt-1">Once alumni are onboarded, engagement loops through content, referrals, and community — creating organic network effects.</p>
        </div>
      </div>
    </div>

    <div className="bg-slate-100 border border-slate-200 rounded-2xl px-5 py-3">
      <p className="text-slate-700 text-xs sm:text-sm text-center font-semibold leading-relaxed">
        But this, once done well, opens up the wider market — verified profiles across institutions give access to the larger problem of lateral hiring through a verified network.
      </p>
    </div>
  </div>
`;

export const IncumbentsFailingSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="The Problem" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-4 tracking-tight">LinkedIn and Naukri Can't Solve This</h2>
    <p className="text-slate-500 text-base md:text-lg mb-8 max-w-2xl" style=${{ textWrap: 'balance' }}>The market runs on LinkedIn and Naukri.com. Neither was built for institutional placements. Neither has governance, workflows, or a verified trust layer.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><span className="text-xl font-semibold text-blue-600">in</span></div>
          <h3 className="text-slate-800 font-semibold text-xl">LinkedIn</h3>
        </div>
        <ul className="space-y-2.5 text-slate-600 text-sm">
          <li>• Generic professional network — not built for hiring workflows</li>
          <li>• No verification; anyone can claim anything</li>
          <li>• Poor fit for India-specific recruitment and institutional pipelines</li>
          <li>• No governance, no placement-cell trust layer</li>
        </ul>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center"><span className="text-xl font-semibold text-purple-600">N</span></div>
          <h3 className="text-slate-800 font-semibold text-xl">Naukri.com</h3>
        </div>
        <ul className="space-y-2.5 text-slate-600 text-sm">
          <li>• Job board model — post and pray, high noise</li>
          <li>• No institutional pipeline or verified profiles</li>
          <li>• No placement workflow, no governance, no trust layer</li>
          <li>• Lateral hiring is just as chaotic — unorganized at scale</li>
        </ul>
      </div>
    </div>

    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 shadow-sm">
      <p className="text-red-800 text-sm md:text-base font-semibold leading-relaxed text-center">The gap: no platform combines institutional placement workflow, verified profiles, and lateral market reach. That's what we're building.</p>
    </div>
  </div>
`;

export const MarketSizeSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Market Sizing" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-4 tracking-tight">Campus and Lateral — Separate and Massive</h2>
    <p className="text-slate-500 text-base md:text-lg mb-8 max-w-2xl" style=${{ textWrap: 'balance' }}>India's professional hiring market splits into campus (institutional wedge) and lateral (scale opportunity). Both are underserved.</p>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6">
        <h3 className="text-indigo-700 font-semibold text-xl mb-4">Campus Placements</h3>
        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-baseline"><span className="text-slate-600 text-sm">5,500+</span><span className="text-slate-400 text-xs">MBA & Engineering institutions (AICTE)</span></div>
          <div className="flex justify-between items-baseline"><span className="text-indigo-600 font-semibold text-xl">$340M</span><span className="text-slate-400 text-xs">Serviceable (top-tier MBA, engineering)</span></div>
          <div className="flex justify-between items-baseline"><span className="text-indigo-600 font-semibold text-xl">$2.1B</span><span className="text-slate-400 text-xs">TAM (placement management SaaS)</span></div>
        </div>
        <p className="text-slate-500 text-xs">Our wedge. Institutional trust, verified CVs, governance. NEP 2020 + NIRF push adoption.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
        <h3 className="text-amber-700 font-semibold text-xl mb-4">Lateral Hiring</h3>
        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-baseline"><span className="text-slate-600 text-sm">3-5x</span><span className="text-slate-400 text-xs">Volume vs. campus hiring in India</span></div>
          <div className="flex justify-between items-baseline"><span className="text-amber-600 font-semibold text-xl">$1.5B+</span><span className="text-slate-400 text-xs">Recruitment tech TAM (India)</span></div>
          <div className="flex justify-between items-baseline"><span className="text-amber-600 font-semibold text-xl">$8B+</span><span className="text-slate-400 text-xs">Professional network / job board TAM</span></div>
        </div>
        <p className="text-slate-500 text-xs">Our expansion. Same verified profiles, workflows. LinkedIn and Naukri aren't solving it.</p>
      </div>
    </div>

    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-slate-800 font-semibold text-base mb-2">Combined Opportunity</h3>
      <p className="text-slate-600 text-sm">Campus first (wedge + verified profiles), lateral next (marketplace). One vertical stack addressing both. Total addressable: billions in India alone.</p>
    </div>
  </div>
`;

export const FoundersSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-6 md:px-10 py-6 overflow-auto">
    <${LightLabel} text="The Team" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">Why Us? Built by Insiders.</h2>
    <p className="text-sm text-slate-500 mb-5 max-w-xl" style=${{ textWrap: 'balance' }}>Domain expertise from the trenches, business acumen, and engineering depth.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      ${[
        {
          initials: 'SG', name: 'Shashank Gandham', role: 'CEO — Tech, Product & Strategy', accent: 'indigo',
          linkedin: 'https://www.linkedin.com/in/shashankgandham/',
          credentials: ['Highest-rated placement team, IIM Calcutta', 'Transitioned IIM-C to cluster cohort system', 'Engagement Manager, McKinsey', 'Software Developer, Citi'],
          education: 'IIM Calcutta | B.Tech CS, COEP',
        },
        {
          initials: 'AA', name: 'Abhishek Achanta', role: 'Co-Founder — Product & Technology', accent: 'blue',
          linkedin: 'https://www.linkedin.com/in/abhishek-achanta/',
          credentials: ['Automated placement processes, halved control team', 'Product Manager, MakeMyTrip & Pinnacle', 'B2B Sales, Javis & Pinnacle', 'Placement Rep, IIIT Jabalpur'],
          education: 'IIM Calcutta | IIIT Jabalpur',
        },
        {
          initials: 'MK', name: 'Matthew Kallarackal', role: 'Co-Founder — Operations & Sales', accent: 'emerald',
          linkedin: 'https://www.linkedin.com/in/matthew-kallarackal-939871124/',
          credentials: ['Ex-Founder, Skaut — business & sales DNA', 'Growth & Revenue, MakeMyTrip', 'M&A, PwC', 'Software Developer, Citi'],
          education: 'IIM Lucknow | NIT Surathkal',
        },
      ].map(f => html`
        <div key=${f.name} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <div className=${'h-1 bg-' + f.accent + '-500'} />
          <div className="p-5 flex flex-col flex-1">
            <div className="flex flex-col items-center text-center mb-3 pb-3 border-b border-slate-100">
              <div className=${'w-12 h-12 rounded-xl grid place-items-center border mb-2 bg-' + f.accent + '-50 border-' + f.accent + '-200'}>
                <span className=${'text-base font-semibold text-' + f.accent + '-600'}>${f.initials}</span>
              </div>
              <h3 className="text-base font-semibold text-slate-800 leading-tight">${f.name}</h3>
              <p className=${'text-xs font-medium text-' + f.accent + '-600'}>${f.role}</p>
            </div>
            <a href=${f.linkedin} target="_blank" rel="noopener noreferrer"
               className="text-center text-blue-500 hover:text-blue-600 text-[10px] font-medium mb-3 block break-all"
               onClick=${(e) => { e.stopPropagation(); e.preventDefault(); window.open(f.linkedin, '_blank', 'noopener,noreferrer'); }}>
              ${f.linkedin}
            </a>
            <div className="mb-2">
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Credentials</p>
              <ul className="space-y-0.5">
                ${f.credentials.map((c, i) => html`<li key=${i} className="text-slate-600 text-[11px] leading-snug">• ${c}</li>`)}
              </ul>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Education</p>
              <p className="text-slate-600 text-[11px]">${f.education}</p>
            </div>
          </div>
        </div>
      `)}
    </div>

    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 md:p-5">
      <h3 className="text-indigo-700 font-bold text-sm mb-3">Unfair Advantages</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[
          { title: 'Domain Insiders', desc: 'First-hand placement experience at India\'s top institutions — we ran the process.' },
          { title: 'Institutional Access', desc: 'Direct relationships with placement committees across MBA and engineering colleges.' },
          { title: 'Technical Moat', desc: 'Governance + AI pipeline — 18+ months to replicate. No competitor has both.' },
        ].map(a => html`
          <div key=${a.title}>
            <p className="text-slate-800 font-bold text-sm mb-1">${a.title}</p>
            <p className="text-slate-500 text-xs leading-relaxed">${a.desc}</p>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

export const CloseSlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center relative px-4 md:px-8 py-6 min-h-0">
    <div className="relative z-10 max-w-3xl w-full overflow-auto flex flex-col items-center">
      <${LightLabel} text="What's Next" />
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-slate-800 mb-4 tracking-tight">Let's Build the Future of<br /><span className="text-indigo-600">Campus Recruitment</span></h2>
      <p className="text-sm md:text-lg text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed">
        We're pre-launch and building the team to bring Ithras to institutions across India. The product is built. The market is waiting. The insiders are ready.
      </p>
      <div className="w-20 h-0.5 bg-indigo-500/30 rounded-full mx-auto mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-center w-full max-w-lg">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-semibold text-indigo-600 mb-1">Pre-Launch</p>
          <p className="text-slate-500 text-sm">Pilot-ready product</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-semibold text-emerald-600 mb-1">IIM-C</p>
          <p className="text-slate-500 text-sm">Anchor institution</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-semibold text-amber-600 mb-1">MBA → Eng</p>
          <p className="text-slate-500 text-sm">Expansion path</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
        <span>shashank@ithraslabs.in</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>ithraslabs.in</span>
      </div>
    </div>
  </div>
`;
