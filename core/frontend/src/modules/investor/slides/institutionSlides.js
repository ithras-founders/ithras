import React from 'react';
import htm from 'htm';
import IthrasLogo from '../../shared/components/IthrasLogo.js';
import {
  StatCard,
  FeatureCard,
  SectionLabel,
  CitationCard,
  PipCallout,
} from '../PitchDeckPrimitives.js';

const html = htm.bind(React.createElement);

export const CoverSlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center relative px-8 md:px-16">
    <div className="relative z-10">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tight mb-5" style=${{ letterSpacing: '-0.03em' }}>
        <${IthrasLogo} size="xl" theme="light" className="text-5xl md:text-7xl lg:text-8xl" />
      </h1>
      <p className="text-xl md:text-2xl font-medium text-indigo-300/90 mb-10 tracking-wide">The Operating System for Campus Placements</p>
      <div className="w-20 h-0.5 bg-indigo-500/40 rounded-full mx-auto mb-10" />
      <p className="text-base md:text-lg text-white/55 max-w-xl mx-auto leading-relaxed mb-8">
        Governance you can trust. Transparency students demand. Time your placement cell gets back.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-6 text-white/35 text-sm tracking-wide">
        <span>Placement Officers</span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span>Deans & Faculty</span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span>India's Premier Institutions</span>
      </div>
    </div>
  </div>
`;

export const ChallengesSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="The Reality" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-4 tracking-tight">Placement Cells Are Drowning in Manual Work</h2>
    <div className="flex flex-col sm:flex-row gap-4 mb-10 bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex-1 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-2xl font-semibold text-red-400">2,000+</p>
        <p className="text-xs text-white/50 mt-1">Person-hours wasted per placement cycle</p>
      </div>
      <div className="flex-1 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-2xl font-semibold text-red-400">50+</p>
        <p className="text-xs text-white/50 mt-1">Spreadsheets for shortlists, tiers, slots</p>
      </div>
      <div className="flex-1 text-center">
        <p className="text-2xl font-semibold text-red-400">3–4 weeks</p>
        <p className="text-xs text-white/50 mt-1">Lost to interview scheduling email tennis</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">Spreadsheet chaos</h3>
        <p className="text-white/50 text-sm">One formula error cascades. Tier caps, company slots, student shortlists — all cross-referenced by hand. Audit? Good luck.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">Policy blowbacks</h3>
        <p className="text-white/50 text-sm">Tier overruns discovered after Slot 1 closes. "Why did they get 4 Tier-1 offers?" — no system of record to defend your process.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">Student support overload</h3>
        <p className="text-white/50 text-sm">"Where do I stand?" floods your inbox. No self-serve. Anxiety, mistrust, and late-night queries during peak recruitment.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <h3 className="text-white font-semibold text-lg mb-1">Scheduling black holes</h3>
        <p className="text-white/50 text-sm">Recruiters propose slots. Students have classes. Faculty have exams. Three-way negotiation by WhatsApp. For 200+ interviews.</p>
      </div>
    </div>
  </div>
`;

export const EvidenceSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="The Evidence" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">The Data Doesn't Lie</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Research Reports</h3>
        <${CitationCard} href="https://www.deloitte.com/in/en/services/consulting/services/human-capital/campus-workforce-trends.html" source="Deloitte India | Campus Workforce Trends" className="bg-white/5 border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0"><span className="text-2xl font-semibold text-red-400">21%</span></div>
            <div>
              <p className="text-white font-bold text-sm mb-1">1-year MBA attrition at top-tier campuses</p>
              <p className="text-white/50 text-xs leading-relaxed">Attrition rates cited at 21%, 26%, and 28% at key tenure checkpoints, showing sustained retention stress.</p>
            </div>
          </div>
        </${CitationCard}>
        <${CitationCard} href="https://unstop.com/talent-report-2024" source="Unstop | Talent Report 2024" className="bg-white/5 border border-white/10">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0"><span className="text-2xl font-semibold text-amber-400">50%</span></div>
            <div>
              <p className="text-white font-bold text-sm mb-1">Students not optimistic about preferred job</p>
              <p className="text-white/50 text-xs leading-relaxed">Unstop's 2024 report highlights major confidence gaps among students regarding placement outcomes and role alignment.</p>
            </div>
          </div>
        </${CitationCard}>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">From the Ground</h3>
        <${CitationCard} href="https://www.telegraphindia.com/india/students-quit-placement-panel-after-iim-muddle-sparks-policy-backlash-prnt/cid/2137236" source="The Telegraph | Higher Education" className="bg-white/5 border border-white/10">
          <p className="text-white font-bold text-sm mb-2">"Placement committees at top B-schools face burnout and policy backlash"</p>
          <p className="text-white/40 text-xs leading-relaxed">Recent national coverage highlights pressure on student-led placement committees and escalating governance complexity.</p>
        </${CitationCard}>
        <${CitationCard} href="https://www.reddit.com/r/Indian_Academia/" source="Reddit | r/Indian_Academia" className="bg-white/5 border border-white/10">
          <p className="text-white font-bold text-sm mb-2">"Students regularly question placement transparency and outcomes"</p>
          <p className="text-white/40 text-xs leading-relaxed">Public student forums repeatedly surface concerns around process clarity, role fit, and published placement narratives.</p>
        </${CitationCard}>
        <${CitationCard} href="https://www.quora.com/search?q=placement%20cells%20force%20students%20accept%20offers" source="Quora | Placement Discussions" className="bg-white/5 border border-white/10">
          <p className="text-white font-bold text-sm mb-2">"Placement coercion and offer acceptance pressure are recurring concerns"</p>
          <p className="text-white/40 text-xs leading-relaxed">Question threads show repeated concerns about offer pressure, process fairness, and limited optionality in placement decisions.</p>
        </${CitationCard}>
      </div>
    </div>
  </div>
`;

export const AchieveSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="What You Achieve" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-8 tracking-tight">Outcomes That Matter</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <${StatCard} label="Time saved per cycle" value="2,000+ hrs" sub="Eliminate manual coordination" color="emerald" />
      <${StatCard} label="Spreadsheets replaced" value="50+" sub="Single source of truth" color="blue" />
      <${StatCard} label="Policy compliance" value="100%" sub="Automatic tier enforcement" color="indigo" />
      <${StatCard} label="Student transparency" value="Real-time" sub="Always know where you stand" color="violet" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <${FeatureCard} icon=${html`<svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>`} title="Tier enforcement" desc="Set caps once. The system enforces them everywhere — no manual checks." />
      <${FeatureCard} icon=${html`<svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>`} title="Full audit trail" desc="Every approval, every stage change — logged and queryable. Governance-ready." />
      <${FeatureCard} icon=${html`<svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>`} title="Student transparency" desc="Students see shortlist status, application stages, and cycle intelligence in real time." />
    </div>
  </div>
`;

export const GovernanceSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Governance Engine" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Set it once. Enforce everywhere.</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">Policy templates with tier distribution, shortlist caps, and stage gates — automatically applied across every placement cycle.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">Policy templates</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-semibold">Tier caps</span>
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold">Approval workflows</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${['Define tiers (Tier 1, Tier 2, Tier 3) and max shortlists per student', 'Hard limits per tier — system blocks further applications when cap hit', 'JD submissions and stage progressions through approval queue', 'Full audit trail for every decision'].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] h-full flex flex-col shadow-xl" style=${{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border-b border-white/[0.06] shrink-0">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /></div>
          <span className="text-[10px] text-white/35 font-mono ml-2 truncate">app.ithras.io/placement/governance</span>
        </div>
        <div className="flex-1 p-5 md:p-6 overflow-auto relative bg-white/[0.03]">
          <${PipCallout} label="AI Policy Insight" position="top-right" accentColor="violet">
            <div className="space-y-2">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2.5">
                <p className="text-[10px] text-violet-300 font-semibold mb-1">Tier distribution</p>
                <p className="text-[9px] text-white/70 leading-relaxed">Slot 1 shows 3 Tier-1 offers/student. Consider tightening for Slot 2 to maximize coverage.</p>
              </div>
              <p className="text-[9px] text-white/40 italic">Powered by Ithras AI</p>
            </div>
          </${PipCallout}>
          <h3 className="text-lg font-semibold text-white mb-4">Policy Templates</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            ${[
              { name: 'IIM-C Standard 2025', tiers: 'T1:3 T2:4 T3:5', status: 'Active' },
              { name: 'Lateral Policy', tiers: 'T1:2 T2:3 T3:6', status: 'Draft' },
              { name: 'Slot 2 Only', tiers: 'T1:1 T2:2 T3:4', status: 'Active' },
            ].map(p => html`
              <div key=${p.name} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.06]">
                <p className="text-xs font-semibold text-white mb-1">${p.name}</p>
                <p className="text-[10px] text-white/45 font-mono mb-2">${p.tiers}</p>
                <span className=${'px-2 py-0.5 rounded-lg text-[10px] font-semibold ' + (p.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50')}>${p.status}</span>
              </div>
            `)}
          </div>
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Tier cap enforcement</h4>
          <div className="space-y-3">
            ${[
              { tier: 'Tier 1', cap: 3, used: 1, color: 'blue' },
              { tier: 'Tier 2', cap: 4, used: 2, color: 'indigo' },
              { tier: 'Tier 3', cap: 5, used: 0, color: 'purple' },
            ].map(t => html`
              <div key=${t.tier} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-white/70 w-16 shrink-0">${t.tier}</span>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className=${'h-full bg-' + t.color + '-500/60 rounded-full'} style=${{ width: (t.used / t.cap * 100) + '%' }} />
                </div>
                <span className="text-[10px] text-white/50">${t.used}/${t.cap}</span>
              </div>
            `)}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const StudentExperienceSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Student Experience" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Placement Command Center</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">Governance-aware dashboard with AI-powered company matching, real-time application tracking, and placement analytics. Every shortlist, every application, fully transparent.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI match score</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-semibold">Tier cap enforcement</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Journey funnel</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${['AI-powered company–role fit scoring (skill & sector alignment)', 'Live shortlist tracking with tier caps & policy limits', 'Company cards with CTC, role fit %, and application status', 'Multi-stage pipeline: Apply → Shortlist → Interview → Offer', 'Template-driven CV builder with AI section analysis', 'Smart calendar with conflict detection & interview reminders'].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] h-full flex flex-col shadow-xl" style=${{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border-b border-white/[0.06] shrink-0">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /></div>
          <span className="text-[10px] text-white/35 font-mono ml-2 truncate">app.ithras.io/candidate/dashboard</span>
        </div>
        <div className="flex-1 p-5 md:p-6 overflow-auto relative bg-white/[0.03]">
          <${PipCallout} label="AI Match Score" position="top-right" accentColor="violet">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2"><span className="text-[10px] text-white/60">Goldman Sachs</span><span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold">94%</span></div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2"><span className="text-[10px] text-white/60">Apex Consulting</span><span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold">87%</span></div>
              <p className="text-[9px] text-white/40 italic">Role fit based on CV & JD</p>
            </div>
          </${PipCallout}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-lg font-semibold text-white">Placement Dashboard</h3>
              <p className="text-xs text-white/45 mt-0.5">Final Placements 2024-25 | IIM Calcutta</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold">3/15 Shortlists Used</span>
              <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-semibold">Tier 1: 1/3</span>
            </div>
          </div>
          <div className="mb-4"><p className="text-[10px] text-white/40 mb-1.5">Shortlist budget</p><div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-500/60 rounded-full" style=${{ width: '20%' }} /></div></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            ${[{ l: 'Companies', v: '24', c: 'blue' }, { l: 'Open Roles', v: '156', c: 'emerald' }, { l: 'Applications', v: '12', c: 'amber' }, { l: 'Avg. CTC', v: '28.5L', c: 'indigo' }].map(s => html`
              <div key=${s.l} className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]"><p className="text-xs text-white/45">${s.l}</p><p className=${'text-xl font-semibold text-' + s.c + '-400'}>${s.v}</p></div>
            `)}
          </div>
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Recruiting Companies</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            ${[
              { n: 'Apex Consulting', s: 'Consulting', c: '35L', status: 'Applied', ai: 87 },
              { n: 'Goldman Sachs', s: 'Finance', c: '32L', status: 'Shortlisted', ai: 94 },
              { n: 'Amazon', s: 'Technology', c: '25L', status: 'Open', ai: 72 },
              { n: 'Bain & Co', s: 'Consulting', c: '34L', status: 'Applied', ai: 89 },
            ].map(co => html`
              <div key=${co.n} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-1"><p className="text-xs font-semibold text-white truncate">${co.n}</p>${co.ai ? html`<span className="text-[9px] font-semibold text-violet-400">${co.ai}%</span>` : null}</div>
                <p className="text-[10px] text-white/40">${co.s}</p>
                <div className="flex items-center justify-between mt-1.5"><p className="text-xs font-semibold text-emerald-400">${co.c}</p><span className=${'text-[9px] font-medium ' + (co.status === 'Shortlisted' ? 'text-emerald-400' : co.status === 'Applied' ? 'text-blue-400' : 'text-white/35')}>${co.status}</span></div>
              </div>
            `)}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const RecruiterCollaborationSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Recruiter Collaboration" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Multi-Institution Pipelines</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">Recruiters manage pipelines across institutions from a single portal. Governed JD submissions, multi-stage workflows, and integrated interview calendar. Full funnel visibility.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI shortlist</span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-semibold">Cross-institution</span>
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-[10px] font-semibold">Funnel analytics</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${['AI ranks candidates by JD–CV fit for faster shortlisting', 'Unified cross-institution view — IIM-C, IIM-A, IITs in one dashboard', 'Multi-stage pipeline with bulk actions (progress, shortlist, reject)', 'Governed JD submission — placement cell approval before live', 'Integrated interview calendar with slot blocks & conflict checks'].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] h-full flex flex-col shadow-xl" style=${{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border-b border-white/[0.06] shrink-0">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /></div>
          <span className="text-[10px] text-white/35 font-mono ml-2 truncate">app.ithras.io/recruiter/pipelines</span>
        </div>
        <div className="flex-1 p-5 md:p-6 overflow-auto relative bg-white/[0.03]">
          <${PipCallout} label="AI-Ranked Shortlist" position="bottom-right" accentColor="violet">
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2"><span className="text-[10px] text-white/70 truncate">Priya S.</span><span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold shrink-0">91%</span></div>
              <div className="flex items-center justify-between bg-white/5 rounded-lg p-2"><span className="text-[10px] text-white/70 truncate">Rahul M.</span><span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold shrink-0">88%</span></div>
              <p className="text-[9px] text-white/40 italic">JD–CV fit score</p>
            </div>
          </${PipCallout}>
          <h3 className="text-lg font-semibold text-white mb-1">Recruitment Command Center</h3>
          <p className="text-xs text-white/45 mb-4">Apex Consulting | IIM Calcutta, IIM Ahmedabad, Lateral</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            ${[
              { inst: 'IIM Calcutta', hires: 12, roles: 3, pending: 45, tier: 'Tier 1' },
              { inst: 'IIM Ahmedabad', hires: 8, roles: 1, pending: 22, tier: 'Tier 1' },
              { inst: 'Lateral Hiring', hires: 5, roles: 2, pending: 18, tier: 'Lateral' },
            ].map(i => html`
              <div key=${i.inst} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.06]">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-semibold text-white">${i.inst}</p><span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-semibold">${i.tier}</span></div>
                <div className="grid grid-cols-3 gap-2 text-center"><div><p className="text-lg font-semibold text-blue-400">${i.hires}</p><p className="text-[10px] text-white/40">Hires</p></div><div><p className="text-lg font-semibold text-emerald-400">${i.roles}</p><p className="text-[10px] text-white/40">Roles</p></div><div><p className="text-lg font-semibold text-amber-400">${i.pending}</p><p className="text-[10px] text-white/40">Pending</p></div></div>
              </div>
            `)}
          </div>
          <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Pipeline: Apex IIM-C Associate 2025</h4>
          <div className="flex flex-wrap md:flex-nowrap gap-2 overflow-x-auto pb-2 md:pb-0">
            ${[
              { stage: 'Application', count: 45, color: 'slate' },
              { stage: 'Shortlist', count: 18, color: 'blue' },
              { stage: 'Interview R1', count: 8, color: 'amber' },
              { stage: 'Final Interview', count: 4, color: 'indigo' },
              { stage: 'Offer', count: 2, color: 'emerald' },
            ].map((s, _idx) => html`
              <div key=${s.stage} className="flex-1 min-w-[60px]">
                <div className=${'bg-' + s.color + '-500/20 border border-' + s.color + '-500/30 rounded-xl p-3 text-center'}>
                  <p className=${'text-xl font-semibold text-' + s.color + '-400'}>${s.count}</p>
                  <p className="text-[10px] text-white/50 mt-1">${s.stage}</p>
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const PlacementControlSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Placement Control Center" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Full visibility. One dashboard.</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">Approve JDs, progress candidates, verify CVs, manage cycles — all from a single command center with real-time metrics.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI insights</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Approval queue</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-semibold">Real-time metrics</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${['JD submissions and stage progressions through approval queue', 'CV verification pipeline with AI section compliance', 'Cycle lifecycle: Draft → Applications Open → Interviews → Offers', 'Real-time metrics: students, companies, pending CVs'].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08] h-full flex flex-col shadow-xl" style=${{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border-b border-white/[0.06] shrink-0">
          <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /><div className="w-2.5 h-2.5 rounded-full bg-white/20" /></div>
          <span className="text-[10px] text-white/35 font-mono ml-2 truncate">app.ithras.io/placement/governance</span>
        </div>
        <div className="flex-1 p-5 md:p-6 overflow-auto relative bg-white/[0.03]">
          <${PipCallout} label="AI Placement Insight" position="top-right" accentColor="violet">
            <div className="space-y-2">
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg p-2.5">
                <p className="text-[10px] text-violet-300 font-semibold mb-1">Slot 2 transition</p>
                <p className="text-[9px] text-white/70 leading-relaxed">Consider advancing 4 finance roles. Compensation benchmarks suggest 15% uplift opportunity.</p>
              </div>
              <p className="text-[9px] text-white/40 italic">Powered by Ithras AI</p>
            </div>
          </${PipCallout}>
          <h3 className="text-lg font-semibold text-white mb-4">Governance Dashboard</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            ${[
              { l: 'Students', v: '120', c: 'blue' },
              { l: 'Companies', v: '24', c: 'amber' },
              { l: 'Active Jobs', v: '42', c: 'emerald' },
              { l: 'Pending CVs', v: '14', c: 'red' },
            ].map(s => html`
              <div key=${s.l} className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06] text-center">
                <p className=${'text-2xl font-semibold text-' + s.c + '-400'}>${s.v}</p>
                <p className="text-xs text-white/45 mt-1">${s.l}</p>
              </div>
            `)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Pending Approvals</h4>
              <div className="space-y-2">
                ${[
                  { type: 'JD Submission', from: 'Goldman Sachs', detail: 'IB Analyst', color: 'amber' },
                  { type: 'Stage Progression', from: '3 students', detail: 'Shortlist to Interview', color: 'blue' },
                ].map((a, i) => html`
                  <div key=${i} className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]">
                    <div className="flex items-center justify-between mb-1">
                      <span className=${'text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-' + a.color + '-500/20 text-' + a.color + '-400'}>${a.type}</span>
                      <div className="flex gap-1">
                        <button className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">Approve</button>
                        <button className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-semibold">Reject</button>
                      </div>
                    </div>
                    <p className="text-xs text-white">${a.from} — ${a.detail}</p>
                  </div>
                `)}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Active Workflows</h4>
              <div className="space-y-2">
                ${[
                  { name: 'Apex Placements 2025', status: 'Active', stages: 4 },
                  { name: 'Goldman Sachs IB 2025', status: 'Active', stages: 4 },
                  { name: 'Amazon PM Pipeline 2025', status: 'Draft', stages: 3 },
                ].map(w => html`
                  <div key=${w.name} className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">${w.name}</p>
                      <p className="text-[10px] text-white/40">${w.stages} stages</p>
                    </div>
                    <span className=${'px-2 py-0.5 rounded-lg text-[10px] font-semibold ' + (w.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-white/50')}>${w.status}</span>
                  </div>
                `)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const CalendarSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Student & Recruiter" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Smart Calendar & Conflict Detection</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">Personal timetable with AI-powered conflict checking. Interview slots are automatically validated against classes, exams, and personal blocks — no double-booking.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI Conflict Check</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-semibold">Candidates Available</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Open Slots</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${['Weekly timetable with class, exam, and personal blocks', 'AI cross-references recruiter slots with student availability', 'Candidates Available: students ready for scheduling', 'Open Slots: recruiter interview windows', 'Blocked: prevents double-booking conflicts'].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="bg-white/[0.04] rounded-2xl border border-white/[0.06] h-full p-5 md:p-6 overflow-auto relative">
        <${PipCallout} label="AI Conflict Check" position="top-right" accentColor="violet">
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5"><span className="text-[10px] text-white/60">Interview vs timetable</span><span className="px-2 py-0.5 rounded-lg bg-emerald-500/25 text-emerald-400 text-[10px] font-bold">0 conflicts</span></div>
            <p className="text-[9px] text-white/40">Slots validated in real-time</p>
          </div>
        </${PipCallout}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          ${[
            { l: 'AI Conflict Check', v: '0 conflicts', c: 'violet', sub: 'Interview vs timetable' },
            { l: 'Candidates Available', v: '42', c: 'blue', sub: 'This week' },
            { l: 'Open Slots', v: '12', c: 'emerald', sub: 'Recruiter windows' },
            { l: 'Blocked', v: '6', c: 'amber', sub: 'Classes & exams' },
          ].map(s => html`
            <div key=${s.l} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.06]"><p className="text-[10px] text-white/45 uppercase tracking-wide mb-0.5">${s.l}</p><p className=${'text-2xl font-bold text-' + s.c + '-400'}>${s.v}</p>${s.sub ? html`<p className="text-[9px] text-white/35 mt-1">${s.sub}</p>` : null}</div>
          `)}
        </div>
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Weekly Timetable</h4>
        <div className="space-y-3">
          ${[
            { day: 'Monday', blocks: [{ type: 'CLASS', time: '09:00–10:30', color: 'blue' }, { type: 'CLASS', time: '11:00–12:30', color: 'blue' }] },
            { day: 'Tuesday', blocks: [{ type: 'CLASS', time: '09:00–10:30', color: 'blue' }, { type: 'PERSONAL', time: '14:00–16:00', color: 'purple' }] },
            { day: 'Wednesday', blocks: [{ type: 'CLASS', time: '10:00–12:00', color: 'blue' }, { type: 'EXAM', time: '14:00–16:00', color: 'red' }] },
            { day: 'Thursday', blocks: [{ type: 'CLASS', time: '09:00–11:00', color: 'blue' }] },
            { day: 'Friday', blocks: [{ type: 'CLASS', time: '09:00–10:30', color: 'blue' }, { type: 'PERSONAL', time: '11:00–12:00', color: 'purple' }] },
          ].map(row => html`
            <div key=${row.day} className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/60 w-20 shrink-0">${row.day}</span>
              <div className="flex flex-wrap gap-2 flex-1">
                ${row.blocks.map(b => html`
                  <div key=${b.time} className=${'px-3 py-1.5 rounded-lg text-[10px] font-medium bg-' + b.color + '-500/20 text-' + b.color + '-400 border border-' + b.color + '-500/20'}>${b.type} · ${b.time}</div>
                `)}
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  </div>
`;

export const CVVerificationSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Placement Team" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">CV Verification Pipeline</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">AI-powered section compliance, template validation, and placement-cell approval. Every CV checked against institution rules before students can apply.</p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI section check</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Template compliance</span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-semibold">Approval flow</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${['AI validates mandatory sections (Academics, Experience, ECA)', 'Template structure compliance — format, field types', 'One-click approve or request changes with feedback', 'Verified CVs get green badge — eligible for applications'].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="bg-white/[0.04] rounded-2xl border border-white/[0.06] h-full p-5 md:p-6 overflow-auto relative">
        <${PipCallout} label="AI Section Compliance" position="top-right" accentColor="violet">
          <div className="space-y-2">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[10px]"><span className="text-white/60">Academics</span><span className="text-emerald-400 font-bold">✓</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-white/60">Experience</span><span className="text-emerald-400 font-bold">✓</span></div>
              <div className="flex justify-between text-[10px]"><span className="text-white/60">ECA</span><span className="text-amber-400 font-bold">Review</span></div>
            </div>
            <p className="text-[9px] text-white/40">Template: IIM Calcutta Standard</p>
          </div>
        </${PipCallout}>
        <h3 className="text-lg font-semibold text-white mb-4">Pending CV Reviews</h3>
        <div className="space-y-3">
          ${[
            { student: 'Priya Sharma', template: 'IIM Calcutta Standard', completeness: 96, sections: '12/12', status: 'Pending' },
            { student: 'Arjun Mehta', template: 'Consulting Format', completeness: 88, sections: '9/10', status: 'Pending' },
            { student: 'Sneha Patel', template: 'Finance Format', completeness: 72, sections: '7/10', status: 'Changes Requested' },
          ].map(cv => html`
            <div key=${cv.student} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.06]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-white">${cv.student}</p>
                  <p className="text-[10px] text-white/45">${cv.template} · ${cv.sections} sections</p>
                </div>
                <span className=${'px-2.5 py-1 rounded-lg text-[10px] font-semibold ' + (cv.status === 'Pending' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400')}>${cv.status}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500/60 rounded-full" style=${{ width: cv.completeness + '%' }} />
                  </div>
                  <p className="text-[9px] text-white/40 mt-1">AI Completeness: ${cv.completeness}%</p>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold">Approve</button>
                  <button className="px-3 py-1.5 rounded-lg bg-white/10 text-white/60 text-[10px] font-semibold">Request Changes</button>
                </div>
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  </div>
`;

export const TimeSavingsSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Time & Resource Savings" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">Before vs After Ithras</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
        <h3 className="text-red-400 font-semibold text-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          Before Ithras
        </h3>
        <ul className="space-y-2.5 text-white/60 text-sm">
          <li>• 50+ Excel/Sheets for shortlists, slots, company tracking</li>
          <li>• Manual tier-cap checks — easy to miss violations</li>
          <li>• 3–4 weeks of email tennis for interview scheduling</li>
          <li>• Hundreds of "Where do I stand?" student queries</li>
          <li>• No audit trail — policy blowbacks discovered too late</li>
        </ul>
      </div>
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
        <h3 className="text-emerald-400 font-semibold text-lg mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          With Ithras
        </h3>
        <ul className="space-y-2.5 text-white/70 text-sm">
          <li>• Single source of truth — no spreadsheet sprawl</li>
          <li>• Automatic tier enforcement — violations blocked in real time</li>
          <li>• 3–4 days scheduling with AI conflict checks</li>
          <li>• Students self-serve status — 60% fewer support tickets</li>
          <li>• Full audit trail — every decision logged and queryable</li>
        </ul>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <${StatCard} label="Person-hours saved" value="2,000+" sub="Per placement cycle" color="emerald" />
      <${StatCard} label="Spreadsheets replaced" value="50+" sub="Single source of truth" color="blue" />
      <${StatCard} label="Scheduling time" value="3–4 weeks → 3–4 days" sub="Automated conflict checks" color="indigo" />
      <${StatCard} label="Support tickets" value="60% fewer" sub="Students self-serve" color="violet" />
    </div>
  </div>
`;

export const SecuritySlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Security & Compliance" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">Enterprise-ready from day one</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-emerald-400 font-semibold text-lg mb-2">Role-based access</h3>
        <p className="text-white/50 text-sm">Placement Team, Faculty Observer, Institution Admin — granular permissions. No more shared passwords.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-blue-400 font-semibold text-lg mb-2">Full audit trail</h3>
        <p className="text-white/50 text-sm">Every approval, every stage change, every login — timestamped and queryable. Governance and accreditation ready.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-indigo-400 font-semibold text-lg mb-2">Data control</h3>
        <p className="text-white/50 text-sm">Your data stays in your tenant. On-premise and private-cloud options for regulated environments.</p>
      </div>
    </div>
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
      <h4 className="text-sm font-semibold text-white mb-3">Role Architecture</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        ${[
          { name: 'System Admin', perms: 24, color: 'indigo' },
          { name: 'Placement Admin', perms: 20, color: 'emerald' },
          { name: 'Placement Team', perms: 18, color: 'emerald' },
          { name: 'Institution Admin', perms: 14, color: 'blue' },
          { name: 'Recruiter', perms: 10, color: 'amber' },
          { name: 'Dept Coordinator', perms: 8, color: 'purple' },
          { name: 'Candidate', perms: 6, color: 'blue' },
          { name: 'Faculty Observer', perms: 4, color: 'slate' },
        ].map(r => html`
          <div key=${r.name} className="bg-white/[0.06] rounded-lg p-2.5 border border-white/[0.06] text-center">
            <p className="text-[10px] font-semibold text-white truncate">${r.name}</p>
            <p className=${'text-sm font-semibold text-' + r.color + '-400'}>${r.perms}</p>
            <p className="text-[9px] text-white/30">permissions</p>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

export const StakeholderSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Who Uses Ithras" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">Every Stakeholder. One Platform.</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${[
        { icon: '👨‍🎓', label: 'Students', desc: 'Governance-aware dashboards, AI company matching, CV builder, personal calendar' },
        { icon: '💼', label: 'Recruiters', desc: 'Multi-institution pipelines, governed JDs, interview scheduler, candidate analytics' },
        { icon: '🏫', label: 'Placement Team', desc: 'Policy engine, approval queue, CV verification, cycle management' },
        { icon: '👀', label: 'Faculty & Deans', desc: 'Observability, analytics, policy oversight without operational access' },
      ].map(s => html`
        <div key=${s.label} className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 hover:bg-white/[0.08] hover:border-white/[0.1] transition-all">
          <div className="text-3xl mb-3">${s.icon}</div>
          <h3 className="text-white font-semibold text-base mb-2">${s.label}</h3>
          <p className="text-white/50 text-xs leading-relaxed">${s.desc}</p>
        </div>
      `)}
    </div>
    <div className="mt-8 bg-indigo-500/10 rounded-2xl p-6 border border-indigo-400/20">
      <p className="text-indigo-200 text-sm font-medium">"From student applications to recruiter shortlists to placement-cell approvals — one system of record. No more version conflicts."</p>
    </div>
  </div>
`;

export const RoadmapSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-6 md:px-10 py-8 overflow-auto">
    <${SectionLabel} text="Roadmap" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">What's Next for Institutions</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">1</span><span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">Now</span></div>
        <h3 className="text-white font-semibold text-base mb-2">Placement workflow</h3>
        <ul className="space-y-1.5 text-white/50 text-xs"><li>• Governance & policy engine</li><li>• CV builder & verification</li><li>• Multi-stakeholder portals</li></ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-xs">2</span><span className="text-purple-400 font-semibold text-xs uppercase tracking-wider">2026</span></div>
        <h3 className="text-white font-semibold text-base mb-2">Case competitions</h3>
        <ul className="space-y-1.5 text-white/50 text-xs"><li>• Inter-college case comp platform</li><li>• Aptitude & assessment tests</li><li>• Judge management & scoring</li></ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-xs">3</span><span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">2027</span></div>
        <h3 className="text-white font-semibold text-base mb-2">Scale & white-label</h3>
        <ul className="space-y-1.5 text-white/50 text-xs"><li>• Multi-institution deployment</li><li>• White-label & on-premise</li><li>• Enterprise org hierarchy</li></ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3"><span className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-xs">4</span><span className="text-amber-400 font-semibold text-xs uppercase tracking-wider">2028</span></div>
        <h3 className="text-white font-semibold text-base mb-2">B2C & laterals</h3>
        <ul className="space-y-1.5 text-white/50 text-xs"><li>• B2C professional network</li><li>• Lateral recruitment marketplace</li><li>• Verified profiles & alumni</li></ul>
      </div>
    </div>
  </div>
`;

export const CTASlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center px-8">
    <div className="mb-8"><${IthrasLogo} size="lg" theme="light" /></div>
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight">Ready to transform your placement operations?</h2>
    <p className="text-xl text-white/55 mb-10 max-w-xl mx-auto">Schedule a demo and see how Ithras delivers governance, transparency, and time savings — for your students, recruiters, and placement cell.</p>
    <div className="flex flex-wrap items-center justify-center gap-4">
      <a
        href="/"
        className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--app-accent)] text-white rounded-[var(--app-radius-md)] font-semibold text-base hover:opacity-90 transition-opacity"
      >
        Start guided demo
      </a>
      <a
        href="mailto:hello@ithraslabs.in?subject=Institution%20Demo%20Request"
        className="inline-flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/20 text-white rounded-[var(--app-radius-md)] font-semibold text-base hover:bg-white/10 transition-colors"
      >
        Contact us for a custom demo
      </a>
    </div>
    <p className="text-white/35 text-sm mt-12">Powered by Ithras AI</p>
  </div>
`;
