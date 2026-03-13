import React from 'react';
import htm from 'htm';
import { SectionLabel, CitationCard, StatCard, PipCallout } from '../PitchDeckPrimitives.js';

const html = htm.bind(React.createElement);

export const CoverSlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center relative px-8 md:px-16">
    <div className="relative z-10">
      <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-white tracking-tight mb-5" style=${{ letterSpacing: '-0.03em' }}><span className="relative inline-block align-baseline"><span className="absolute left-1/2 bottom-full -translate-x-1/2 mb-0 flex items-center justify-center" style=${{ width: '0.2em', height: '0.2em', minWidth: '8px', minHeight: '8px' }}><span className="w-full h-full rounded-full bg-amber-400" /></span><span>ı</span></span>thras</h1>
      <p className="text-xl md:text-2xl font-medium text-indigo-300/90 mb-10 tracking-wide">Recruitment Reimagined</p>
      <div className="w-20 h-0.5 bg-indigo-500/40 rounded-full mx-auto mb-10" />
      <p className="text-base md:text-lg text-white/55 max-w-xl mx-auto leading-relaxed" style=${{ textWrap: 'balance' }}>
        One vertical for professional hiring in India. Institutional placements first. Verified profiles next. The lateral market—solved.
      </p>
      <div className="mt-14 flex items-center justify-center gap-6 text-white/35 text-sm tracking-wide">
        <span>Series Seed</span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span>Confidential</span>
        <span className="w-1 h-1 rounded-full bg-white/25" />
        <span>2026</span>
      </div>
    </div>
  </div>
`;

export const ProblemSlide1 = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="The Problem" />
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">Lateral Hiring Is a Mess</h2>
    <p className="text-white/55 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Professional and lateral hiring in India runs on chaos. No verified profiles. Fragmented pipelines. Recruiters and candidates both drown in noise. Incumbents aren't solving it.</p>
    <div className="flex flex-col sm:flex-row gap-4 mb-8 bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex-1 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-2xl font-semibold text-red-400">3–5x</p>
        <p className="text-xs text-white/50 mt-1">Lateral hiring volume vs. campus in India</p>
      </div>
      <div className="flex-1 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-2xl font-semibold text-red-400">No trust layer</p>
        <p className="text-xs text-white/50 mt-1">Anyone can claim anything—no verification</p>
      </div>
      <div className="flex-1 text-center">
        <p className="text-2xl font-semibold text-red-400">Unorganized</p>
        <p className="text-xs text-white/50 mt-1">Manual screening, no workflow, high noise</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2"><svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg></div>
        <h3 className="text-white font-semibold text-xl mb-1">No Verified Profiles</h3>
        <p className="text-white/50 text-base">Resumes are self-claimed. No institutional or recruiter verification. High fraud risk, low trust. Talent pools are contaminated.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2"><svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></div>
        <h3 className="text-white font-semibold text-xl mb-1">Zero Transparency</h3>
        <p className="text-white/50 text-base">Candidates have no visibility into where they stand. Recruiters drown in hundreds of unqualified applications. No single source of truth.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2"><svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
        <h3 className="text-white font-semibold text-xl mb-1">Massive Time Waste</h3>
        <p className="text-white/50 text-base">Endless manual screening. No workflow automation. Interview scheduling via email tennis. Thousands of hires, zero structure.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="text-3xl mb-2"><svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg></div>
        <h3 className="text-white font-semibold text-xl mb-1">Unorganized at Scale</h3>
        <p className="text-white/50 text-base">When thousands of candidates, hundreds of companies, and dozens of roles converge, manual processes collapse. Both sides lose.</p>
      </div>
    </div>
  </div>
`;

export const ProblemSlide2 = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="The Problem" />
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">Incumbents Are Failing—LinkedIn and Naukri.com</h2>
    <p className="text-white/55 text-base md:text-lg mb-8 max-w-2xl" style=${{ textWrap: 'balance' }}>The market runs on LinkedIn and Naukri.com. Neither solves institutional or lateral hiring. Both are unorganized—no governance, no workflow, no trusted talent pool.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center"><span className="text-xl font-semibold text-blue-400">in</span></div>
          <h3 className="text-white font-semibold text-xl">LinkedIn</h3>
        </div>
        <ul className="space-y-2.5 text-white/50 text-base">
          <li>• Generic professional network—not built for hiring workflows</li>
          <li>• No verification; anyone can claim anything</li>
          <li>• Poor fit for India-specific recruitment and institutional pipelines</li>
          <li>• No governance, no placement-cell trust layer</li>
        </ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center"><span className="text-xl font-semibold text-purple-400">N</span></div>
          <h3 className="text-white font-semibold text-xl">Naukri.com</h3>
        </div>
        <ul className="space-y-2.5 text-white/50 text-base">
          <li>• Job board model—post and pray, high noise</li>
          <li>• No institutional pipeline or verified profiles</li>
          <li>• No placement workflow, no governance, no trust layer</li>
          <li>• Lateral hiring is just as chaotic—unorganized at scale</li>
        </ul>
      </div>
    </div>
    <div className="bg-red-500/15 border-2 border-red-500/40 rounded-2xl p-6 md:p-8 shadow-lg shadow-red-500/10">
      <p className="text-red-100 text-base md:text-lg font-semibold leading-relaxed">The gap: no platform that combines institutional placement workflow, verified profiles, and lateral market reach. That's what we're building.</p>
    </div>
  </div>
`;

export const IndustryCrisisSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Industry Evidence" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">The Data Doesn't Lie</h2>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">Research Reports</h3>
        <${CitationCard}
          href="https://www.deloitte.com/in/en/services/consulting/services/human-capital/campus-workforce-trends.html"
          source="Deloitte India | Campus Workforce Trends"
          className="bg-white/5 border border-white/10"
          linkText="Open source ↗"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-semibold text-red-400">21%</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-1">1-year MBA attrition at top-tier campuses</p>
              <p className="text-white/50 text-xs leading-relaxed">Attrition rates are cited at 21%, 26%, and 28% at key tenure checkpoints for top-tier campuses in India, showing sustained retention stress.</p>
            </div>
          </div>
        </${CitationCard}>
        <${CitationCard}
          href="https://unstop.com/talent-report-2024"
          source="Unstop | Talent Report 2024"
          className="bg-white/5 border border-white/10"
          linkText="Open source ↗"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-semibold text-amber-400">50%</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-1">Students not optimistic about preferred job</p>
              <p className="text-white/50 text-xs leading-relaxed">Unstop's 2024 report highlights major confidence gaps among students regarding placement outcomes and role alignment.</p>
            </div>
          </div>
        </${CitationCard}>
        <${CitationCard}
          href="https://issuu.com/globalbu/docs/global_talent_in_india_online_versi"
          source="Global Talent in India Report"
          className="bg-white/5 border border-white/10"
          linkText="Open source ↗"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <span className="text-2xl font-semibold text-orange-400">67%</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm mb-1">University students discontent with career services</p>
              <p className="text-white/50 text-xs leading-relaxed">Higher-education studies flag widespread dissatisfaction with career support quality and placement process transparency.</p>
            </div>
          </div>
        </${CitationCard}>
      </div>
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3">From the Ground</h3>
        <${CitationCard}
          href="https://www.telegraphindia.com/india/students-quit-placement-panel-after-iim-muddle-sparks-policy-backlash-prnt/cid/2137236"
          source="The Telegraph | Higher Education"
          className="bg-white/5 border border-white/10"
          linkText="Open source ↗"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-[var(--app-text-secondary)] flex items-center justify-center"><span className="text-[10px] font-bold text-white/60">N</span></div>
            <span className="text-[10px] text-white/40 font-medium">National Media | Placements</span>
          </div>
          <p className="text-white font-bold text-sm mb-2">"Placement committees at top B-schools face burnout and policy backlash"</p>
          <p className="text-white/40 text-xs leading-relaxed">Recent national coverage highlights pressure on student-led placement committees and escalating governance complexity.</p>
        </${CitationCard}>
        <${CitationCard}
          href="https://www.reddit.com/r/Indian_Academia/"
          source="Reddit | r/Indian_Academia"
          className="bg-white/5 border border-white/10"
          linkText="Open source ↗"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-orange-700 flex items-center justify-center"><span className="text-[10px] font-bold text-white">r/</span></div>
            <span className="text-[10px] text-white/40 font-medium">Community Discussions</span>
          </div>
          <p className="text-white font-bold text-sm mb-2">"Students regularly question placement transparency and outcomes"</p>
          <p className="text-white/40 text-xs leading-relaxed">Public student forums repeatedly surface concerns around process clarity, role fit, and published placement narratives.</p>
        </${CitationCard}>
        <${CitationCard}
          href="https://www.quora.com/search?q=placement%20cells%20force%20students%20accept%20offers"
          source="Quora | Placement Discussions"
          className="bg-white/5 border border-white/10"
          linkText="Open source ↗"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-red-800 flex items-center justify-center"><span className="text-[10px] font-bold text-white">Q</span></div>
            <span className="text-[10px] text-white/40 font-medium">Quora | Indian MBA Placements</span>
          </div>
          <p className="text-white font-bold text-sm mb-2">"Placement coercion and offer acceptance pressure are recurring concerns"</p>
          <p className="text-white/40 text-xs leading-relaxed">Question threads show repeated concerns from students about offer pressure, process fairness, and limited optionality in placement decisions.</p>
        </${CitationCard}>
      </div>
    </div>
  </div>
`;

export const VisionSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Our Vision" />
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-2 sm:mb-3 tracking-tight">Bottom-Up: Institutional First, Lateral Next</h2>
    <p className="text-white/55 text-sm md:text-base mb-4 max-w-xl" style=${{ textWrap: 'balance' }}>We start where trust exists. Verified profiles. Lateral market. That's how we win.</p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      <div className="flex flex-col justify-center items-center text-center bg-indigo-500/15 border border-indigo-500/30 rounded-2xl p-4 min-w-0">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/30 flex items-center justify-center shrink-0"><span className="text-indigo-300 font-bold text-xs">1</span></div>
          <h3 className="text-indigo-300 font-semibold text-sm">Institutional Placements</h3>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-1">Campus workflow—governance, policy engine, verified CVs. Trust built-in.</p>
        <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Bottom-up wedge</p>
      </div>
      <div className="flex flex-col justify-center items-center text-center bg-emerald-500/15 border border-emerald-500/30 rounded-2xl p-4 min-w-0">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/30 flex items-center justify-center shrink-0"><span className="text-emerald-300 font-bold text-xs">2</span></div>
          <h3 className="text-emerald-300 font-semibold text-sm">Verified Profiles</h3>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-1">Placement-cell verified CVs. Trust layer LinkedIn and Naukri cannot replicate.</p>
        <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Trust layer</p>
      </div>
      <div className="flex flex-col justify-center items-center text-center bg-blue-500/15 border border-blue-500/30 rounded-2xl p-4 min-w-0">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-blue-500/30 flex items-center justify-center shrink-0"><span className="text-blue-300 font-bold text-xs">3</span></div>
          <h3 className="text-blue-300 font-semibold text-sm">Recruiter Onboarding</h3>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-1">Institutions onboard recruiters. Governed JDs, pipelines, interview calendar—one interface.</p>
        <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Network effect</p>
      </div>
      <div className="flex flex-col justify-center items-center text-center bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 min-w-0">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/30 flex items-center justify-center shrink-0"><span className="text-amber-300 font-bold text-xs">4</span></div>
          <h3 className="text-amber-300 font-semibold text-sm">Lateral Market</h3>
        </div>
        <p className="text-white/70 text-xs leading-relaxed mb-1">B2C professional network. Lateral marketplace. Better than LinkedIn for India.</p>
        <p className="text-[9px] text-white/40 uppercase tracking-wider font-semibold">Scale</p>
      </div>
    </div>
    <div className="bg-white/[0.08] border border-white/[0.12] rounded-2xl px-4 py-3 sm:px-6 sm:py-4 mt-3">
      <p className="text-white/80 text-xs sm:text-sm text-center font-semibold leading-relaxed">Institutional placements → Verified profiles → Recruiter onboarding → Lateral market. One wedge.</p>
    </div>
  </div>
`;

export const CampusSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Our Wedge" />
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight">Institutional Campus Placements—What We're Solving</h2>
    <p className="text-white/55 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>We start with campus placements at IIMs and IITs. Same chaos—spreadsheets, policy violations, scheduling nightmares. Ithras fixes it and builds the verified profile base that feeds lateral.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold text-xl mb-2">Spreadsheet chaos</h3>
        <p className="text-white/50 text-base">50+ Excel/Sheets for shortlists, tiers, slots. One formula error cascades. No governance, no audit trail.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold text-xl mb-2">Policy blowbacks</h3>
        <p className="text-white/50 text-base">Tier overruns discovered after Slot 1 closes. "Why did they get 4 Tier-1 offers?"—no system of record to defend.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold text-xl mb-2">Scheduling black holes</h3>
        <p className="text-white/50 text-base">3–4 weeks of email tennis for 200+ interviews. Recruiters propose, students have classes, faculty have exams.</p>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
        <h3 className="text-white font-semibold text-xl mb-2">Student opacity</h3>
        <p className="text-white/50 text-base">"Where do I stand?" floods the inbox. No self-serve. Anxiety, mistrust, late-night queries during peak recruitment.</p>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row gap-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
      <div className="flex-1 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-2xl font-semibold text-indigo-400">2,000+ hrs</p>
        <p className="text-xs text-white/50 mt-1">Wasted per placement cycle</p>
      </div>
      <div className="flex-1 text-center border-b sm:border-b-0 sm:border-r border-white/10 pb-4 sm:pb-0 sm:pr-6">
        <p className="text-2xl font-semibold text-indigo-400">50+</p>
        <p className="text-xs text-white/50 mt-1">Spreadsheets replaced by one platform</p>
      </div>
      <div className="flex-1 text-center">
        <p className="text-2xl font-semibold text-indigo-400">3–4 weeks</p>
        <p className="text-xs text-white/50 mt-1">Scheduling time → 3–4 days with Ithras</p>
      </div>
    </div>
  </div>
`;

export const HowSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="How" />
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-3 tracking-tight">Today: Institutional. Tomorrow: Lateral.</h2>
    <p className="text-white/55 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Today we solve institutional placements with governance, workflow, and verified CVs. The same verified profiles and workflows power lateral hiring next—one platform, one wedge.</p>
    <div className="bg-white/5 rounded-2xl border border-white/10 p-4 md:p-6 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        ${[
          { color: 'blue', label: 'Student Portal', items: ['Company Intelligence', 'Application Tracker', 'CV Builder', 'Calendar'] },
          { color: 'amber', label: 'Recruiter Portal', items: ['Multi-Institution View', 'Workflow Pipeline', 'Interview Scheduler'] },
          { color: 'emerald', label: 'Placement Governance', items: ['Policy Engine', 'Approval Workflows', 'CV Verification'] },
          { color: 'indigo', label: 'Platform Admin', items: ['User Management', 'RBAC Engine', 'Org Hierarchy'] },
        ].map(col => html`
          <div key=${col.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h4 className=${'text-' + col.color + '-400 font-bold text-sm mb-2'}>${col.label}</h4>
            <div className="space-y-1">
              ${col.items.map(item => html`<div key=${item} className="flex items-center gap-2 text-xs text-white/60"><div className=${'w-1.5 h-1.5 rounded-full bg-' + col.color + '-400'} />${item}</div>`)}
            </div>
          </div>
        `)}
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/10">
        <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Path to lateral:</span>
        <span className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-semibold">Institutional placements</span>
        <span className="text-white/30">→</span>
        <span className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-semibold">Verified profiles</span>
        <span className="text-white/30">→</span>
        <span className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-semibold">Lateral marketplace</span>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${[
        { label: '2026', title: 'Recruitment OS', items: ['Campus workflow', 'Governance engine', 'Verified CVs'] },
        { label: '2027', title: 'Case Comps & Tests', items: ['Inter-college platform', 'Aptitude tests', 'Talent discovery'] },
        { label: '2028', title: 'Scale-Up', items: ['Multi-institution', 'White-label', 'Enterprise hierarchy'] },
        { label: '2029', title: 'B2C & Laterals', items: ['Professional network', 'Lateral marketplace', 'Better than LinkedIn'] },
      ].map(r => html`
        <div key=${r.label} className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4">
          <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">${r.label}</span>
          <h4 className="text-white font-semibold text-sm mt-1 mb-2">${r.title}</h4>
          <ul className="space-y-0.5">${r.items.map(i => html`<li key=${i} className="text-white/45 text-[11px]">• ${i}</li>`)}</ul>
        </div>
      `)}
    </div>
  </div>
`;

export const StudentDemoSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Student Experience" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Placement Command Center</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        Governance-aware dashboard with AI-powered company matching, real-time application tracking, and placement analytics. Every shortlist, every application, fully transparent.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI match score</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-semibold">Tier cap enforcement</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Journey funnel</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'AI-powered company–role fit scoring (skill & sector alignment)',
          'Live shortlist tracking with tier caps & policy limits',
          'Company cards with CTC, role fit %, and application status',
          'Multi-stage pipeline: Apply → Shortlist → Interview → Offer',
          'Template-driven CV builder with AI section analysis',
          'Smart calendar with conflict detection & interview reminders',
        ].map(f => html`
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
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          </div>
          <span className="text-[10px] text-white/35 font-mono ml-2 truncate">app.ithras.io/candidate/dashboard</span>
        </div>
        <div className="flex-1 p-5 md:p-6 overflow-auto relative bg-white/[0.03]">
        <${PipCallout} label="AI Match Score" position="top-right" accentColor="violet">
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-white/60">Goldman Sachs</span>
              <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold">94%</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-white/60">Apex Consulting</span>
              <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold">87%</span>
            </div>
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
        <div className="mb-4">
          <p className="text-[10px] text-white/40 mb-1.5">Shortlist budget</p>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500/60 rounded-full" style=${{ width: '20%' }} />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          ${[
            { l: 'Companies', v: '24', c: 'blue' },
            { l: 'Open Roles', v: '156', c: 'emerald' },
            { l: 'Applications', v: '12', c: 'amber' },
            { l: 'Avg. CTC', v: '28.5L', c: 'indigo' },
          ].map(s => html`
            <div key=${s.l} className="bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]">
              <p className="text-xs text-white/45">${s.l}</p>
              <p className=${'text-xl font-semibold text-' + s.c + '-400'}>${s.v}</p>
            </div>
          `)}
        </div>
        <h4 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Recruiting Companies</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          ${[
            { n: 'Apex Consulting', s: 'Consulting', c: '35L', status: 'Applied', ai: 87 },
            { n: 'Goldman Sachs', s: 'Finance', c: '32L', status: 'Shortlisted', ai: 94 },
            { n: 'Amazon', s: 'Technology', c: '25L', status: 'Open', ai: 72 },
            { n: 'Bain & Co', s: 'Consulting', c: '34L', status: 'Applied', ai: 89 },
            { n: 'Microsoft', s: 'Technology', c: '26L', status: 'Open', ai: 78 },
            { n: 'JP Morgan', s: 'Finance', c: '20L', status: 'Open', ai: 65 },
            { n: 'HUL', s: 'FMCG', c: '22L', status: 'Open', ai: 71 },
            { n: 'Flipkart', s: 'E-Commerce', c: '24L', status: 'Open', ai: 82 },
          ].map(co => html`
            <div key=${co.n} className="bg-white/[0.04] rounded-xl p-3 border border-white/[0.06] hover:border-blue-500/25 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-white truncate">${co.n}</p>
                ${co.ai ? html`<span className="text-[9px] font-semibold text-violet-400">${co.ai}%</span>` : null}
              </div>
              <p className="text-[10px] text-white/40">${co.s}</p>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-xs font-semibold text-emerald-400">${co.c}</p>
                <span className=${'text-[9px] font-medium ' + (co.status === 'Shortlisted' ? 'text-emerald-400' : co.status === 'Applied' ? 'text-blue-400' : 'text-white/35')}>${co.status}</span>
              </div>
            </div>
          `)}
        </div>
        </div>
      </div>
    </div>
  </div>
`;

export const StudentCalendarSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Student Experience" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Smart Calendar & Conflict Detection</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        Personal timetable with AI-powered conflict checking. Interview slots are automatically validated against classes, exams, and personal blocks — no double-booking.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI Conflict Check</span>
        <span className="px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-300 text-[10px] font-semibold">Candidates Available</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Open Slots</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'Weekly timetable with class, exam, and personal blocks',
          'AI cross-references recruiter slots with your availability',
          'Candidates Available: students ready for scheduling',
          'Open Slots: recruiter interview windows',
          'Blocked: prevents double-booking conflicts',
          'Color-coded blocks: blue (classes), red (exams), purple (personal)',
        ].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="bg-white/[0.04] rounded-2xl border border-white/[0.06] h-full p-5 md:p-6 overflow-auto relative shadow-inner" style=${{ boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.03)' }}>
        <${PipCallout} label="AI Conflict Check" position="top-right" accentColor="violet">
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2.5">
              <span className="text-[10px] text-white/60">Interview vs timetable</span>
              <span className="px-2 py-0.5 rounded-lg bg-emerald-500/25 text-emerald-400 text-[10px] font-bold">0 conflicts</span>
            </div>
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
            <div key=${s.l} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-[10px] text-white/45 uppercase tracking-wide mb-0.5">${s.l}</p>
              <p className=${'text-2xl font-bold text-' + s.c + '-400'}>${s.v}</p>
              ${s.sub ? html`<p className="text-[9px] text-white/35 mt-1">${s.sub}</p>` : null}
            </div>
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
                  <div key=${b.time} className=${'px-3 py-1.5 rounded-lg text-[10px] font-medium bg-' + b.color + '-500/20 text-' + b.color + '-400 border border-' + b.color + '-500/20'}>
                    ${b.type} · ${b.time}
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  </div>
`;

export const StudentDemo2Slide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Student Tools" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">CV Builder & Applications</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        AI-analyzed CV templates, one-click applications with verified CVs, and a personal calendar that prevents interview conflicts. Full audit trail for every application.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI structure analysis</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Placement-cell verified</span>
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold">Multi-template</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'AI parses PDF/CV to extract sections & auto-fill template',
          'Multi-template CV portfolio per institution rules',
          'Mandatory section compliance (Academics, Experience, ECA, POR)',
          'Auto-verified by placement cell — green badge to apply',
          'AI scoring for role fit & completeness before submit',
          'PDF export & preview inline before submission',
        ].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="grid grid-rows-auto lg:grid-rows-2 gap-4 h-full min-h-0 relative">
        <${PipCallout} label="AI CV Analysis" position="top-right" accentColor="violet">
          <div className="space-y-2">
            <div className="bg-white/5 rounded-lg p-2 border border-violet-500/20">
              <p className="text-[10px] text-white/50 mb-1">Completeness</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500/60 rounded-full" style=${{ width: '92%' }} />
                </div>
                <span className="text-[10px] font-semibold text-violet-300">92%</span>
              </div>
            </div>
            <p className="text-[9px] text-white/40">AI validates sections & format</p>
          </div>
        </${PipCallout}>
        <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] p-5">
          <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            My CVs
            <span className="text-[10px] font-medium text-white/40">(3 templates)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            ${[
              { name: 'IIM Calcutta Standard', status: 'Verified', color: 'emerald', sections: '12 sections', ai: '96%' },
              { name: 'Consulting Format', status: 'Verified', color: 'emerald', sections: '10 sections', ai: '94%' },
              { name: 'Finance Format', status: 'Draft', color: 'slate', sections: '8 sections', ai: '78%' },
            ].map(cv => html`
              <div key=${cv.name} className="bg-white/[0.06] rounded-xl p-4 border border-white/[0.06]">
                <div className="w-full h-14 bg-white/[0.08] rounded-lg mb-2 flex items-center justify-center border border-white/[0.06] relative">
                  <svg className="w-5 h-5 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  ${cv.ai ? html`<span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-violet-500/30 text-[9px] font-semibold text-violet-300">${cv.ai}</span>` : null}
                </div>
                <p className="text-xs font-semibold text-white truncate">${cv.name}</p>
                <p className="text-[10px] text-white/40 mt-0.5">${cv.sections}</p>
                <span className=${'inline-block mt-2 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-' + cv.color + '-500/20 text-' + cv.color + '-400'}>${cv.status}</span>
              </div>
            `)}
          </div>
        </div>
        <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] p-5">
          <h4 className="text-sm font-semibold text-white mb-3">Active Applications</h4>
          <div className="space-y-2">
            ${[
              { wf: 'Apex Associate Consultant 2025', status: 'Shortlisted', color: 'emerald', stage: 'Interview R1' },
              { wf: 'Goldman Sachs IB Analyst', status: 'Submitted', color: 'blue', stage: 'Under review' },
              { wf: 'Amazon Product Manager', status: 'Submitted', color: 'blue', stage: 'Under review' },
            ].map(app => html`
              <div key=${app.wf} className="flex items-center justify-between bg-white/[0.06] rounded-xl p-3 border border-white/[0.06]">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">${app.wf}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">${app.stage}</p>
                </div>
                <span className=${'px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-' + app.color + '-500/20 text-' + app.color + '-400 shrink-0'}>${app.status}</span>
              </div>
            `)}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const RecruiterDemoSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Recruiter Experience" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Multi-Institution Pipelines</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        AI-powered candidate shortlisting, unified view across IIMs & IITs, governed JD submissions, and integrated scheduling. Full funnel visibility.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI shortlist</span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-semibold">Cross-institution</span>
        <span className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 text-[10px] font-semibold">Funnel analytics</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'AI ranks candidates by JD–CV fit for faster shortlisting',
          'Unified cross-institution view — IIM-C, IIM-A, IITs in one dashboard',
          'Multi-stage pipeline with bulk actions (progress, shortlist, reject)',
          'Governed JD submission — placement cell approval before live',
          'Integrated interview calendar with slot blocks & conflict checks',
          'Real-time candidate tracking & CV download at each stage',
        ].map(f => html`
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
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
          </div>
          <span className="text-[10px] text-white/35 font-mono ml-2 truncate">app.ithras.io/recruiter/pipelines</span>
        </div>
        <div className="flex-1 p-5 md:p-6 overflow-auto relative bg-white/[0.03]">
        <${PipCallout} label="AI-Ranked Shortlist" position="bottom-right" accentColor="violet">
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-white/70 truncate">Priya S.</span>
              <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold shrink-0">91%</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-white/70 truncate">Rahul M.</span>
              <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold shrink-0">88%</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 rounded-lg p-2">
              <span className="text-[10px] text-white/70 truncate">Anita K.</span>
              <span className="px-2 py-0.5 rounded bg-violet-500/30 text-violet-300 text-[10px] font-semibold shrink-0">85%</span>
            </div>
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-white">${i.inst}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-400 font-semibold">${i.tier}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div><p className="text-lg font-semibold text-blue-400">${i.hires}</p><p className="text-[10px] text-white/40">Hires</p></div>
                <div><p className="text-lg font-semibold text-emerald-400">${i.roles}</p><p className="text-[10px] text-white/40">Roles</p></div>
                <div><p className="text-lg font-semibold text-amber-400">${i.pending}</p><p className="text-[10px] text-white/40">Pending</p></div>
              </div>
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
          ].map((s, idx) => html`
            <div key=${s.stage} className="flex-1 min-w-[60px] relative">
              <div className=${'bg-' + s.color + '-500/20 border border-' + s.color + '-500/30 rounded-xl p-3 text-center'}>
                <p className=${'text-xl font-semibold text-' + s.color + '-400'}>${s.count}</p>
                <p className="text-[10px] text-white/50 mt-1">${s.stage}</p>
              </div>
              ${idx < 4 ? html`<div className="absolute top-1/2 -right-1.5 w-3 text-white/20 -translate-y-1/2 z-10">
                <svg viewBox="0 0 8 12" fill="currentColor"><path d="M0 0l8 6-8 6z" /></svg>
              </div>` : null}
            </div>
          `)}
        </div>
        </div>
      </div>
    </div>
  </div>
`;

export const PlacementCVVerificationSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Placement Team" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">CV Verification Pipeline</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        AI-powered section compliance, template validation, and placement-cell approval. Every CV is checked against institution rules before students can apply.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI section check</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Template compliance</span>
        <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-semibold">Approval flow</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'AI validates mandatory sections (Academics, Experience, ECA)',
          'Template structure compliance — format, field types',
          'One-click approve or request changes with feedback',
          'Verified CVs get green badge — eligible for applications',
          'Full audit trail for placement cell compliance',
        ].map(f => html`
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

export const PlacementDemoSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Placement Team" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">Governance & Compliance</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        AI-powered cycle insights, policy engine, workflow manager, and approval queue. Every decision governed, every action auditable.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI insights</span>
        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">Approval queue</span>
        <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-300 text-[10px] font-semibold">Audit trail</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'AI strategic recommendations for Slot 2 transition & role diversity',
          'Reusable policy templates (tier caps, shortlist limits, cohort rules)',
          'Multi-stage approval workflows for JD submissions & stage progressions',
          'CV verification pipeline with AI section compliance checks',
          'Real-time placement metrics — students, companies, applications',
          'Cycle lifecycle management — draft, active, archive',
        ].map(f => html`
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
                { type: 'JD Submission', from: 'Amazon', detail: 'Product Manager', color: 'amber' },
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
                  <span className=${'px-2 py-0.5 rounded-lg text-[10px] font-semibold ' + (w.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-[var(--app-surface-muted)] text-[var(--app-text-muted)]')}>${w.status}</span>
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

export const AdminDemoSlide = () => html`
  <div className="flex flex-col lg:flex-row h-full overflow-auto">
    <div className="w-full lg:w-[360px] lg:shrink-0 flex flex-col justify-center p-5 md:p-8">
      <${SectionLabel} text="Platform Administration" />
      <h2 className="text-2xl md:text-3xl font-semibold text-white mb-3 tracking-tight">RBAC & Telemetry</h2>
      <p className="text-white/55 text-sm leading-relaxed mb-5">
        Full user management, granular RBAC, organizational hierarchy, and enterprise telemetry with AI anomaly detection. One observability layer for audit, sessions, and alerts.
      </p>
      <div className="flex flex-wrap gap-2 mb-5">
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/20 text-violet-300 text-[10px] font-semibold">AI anomaly detection</span>
        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 text-indigo-300 text-[10px] font-semibold">Audit logs</span>
        <span className="px-2.5 py-1 rounded-lg bg-violet-500/15 text-violet-300 text-[10px] font-semibold">Funnels & sessions</span>
      </div>
      <div className="space-y-2.5 text-sm">
        ${[
          'AI anomaly detection — 5xx spikes, latency drift, outlier alerts',
          'Granular permission system — 24+ permissions, custom roles',
          'Custom role creation & assignment per institution/org',
          'Multi-tenant org hierarchy — institutions, companies, programs',
          'Real-time system monitoring — requests, latency, success rate',
          'Audit logs, session timelines, funnel analytics & alerts',
        ].map(f => html`
          <div key=${f} className="flex items-start gap-2 text-white/65">
            <svg className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            ${f}
          </div>
        `)}
      </div>
    </div>
    <div className="flex-1 p-4 md:p-6 overflow-hidden min-h-0 relative">
      <div className="grid grid-rows-auto lg:grid-rows-2 gap-4 h-full min-h-0 relative">
        <${PipCallout} label="AI Anomaly Alert" position="top-right" accentColor="violet">
          <div className="space-y-2">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2.5">
              <p className="text-[10px] text-red-400 font-bold mb-1">5xx spike detected</p>
              <p className="text-[9px] text-white/70">12:34 — /api/submit increased 3.2× vs baseline. Check DB connection pool.</p>
            </div>
            <p className="text-[9px] text-white/40 italic">Auto-triggered by AI</p>
          </div>
        </${PipCallout}>
        <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] p-5">
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
        <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] p-5">
          <h4 className="text-sm font-semibold text-white mb-3">System Telemetry</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            ${[
              { l: 'Requests', v: '45,892', c: 'blue' },
              { l: 'Success', v: '98.7%', c: 'emerald' },
              { l: 'Avg Latency', v: '42ms', c: 'amber' },
              { l: 'Active Users', v: '34', c: 'indigo' },
            ].map(s => html`
              <div key=${s.l} className="bg-white/[0.06] rounded-lg p-2.5 border border-white/[0.06]">
                <p className="text-[10px] text-white/40">${s.l}</p>
                <p className=${'text-lg font-semibold text-' + s.c + '-400'}>${s.v}</p>
              </div>
            `)}
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 min-w-0 bg-white/5 rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-white/40 mb-2">Latency Distribution</p>
              <div className="flex items-end gap-1 h-10">
                ${[65, 45, 80, 35, 55, 70, 40, 60, 50, 75, 45, 55].map((h, i) => html`
                  <div key=${i} className="flex-1 bg-indigo-500/40 rounded-t" style=${{ height: h + '%' }} />
                `)}
              </div>
            </div>
            <div className="flex-1 min-w-0 bg-white/5 rounded-lg p-2.5 border border-white/5">
              <p className="text-[10px] text-white/40 mb-2">Status Breakdown</p>
              <div className="flex items-center gap-3 mt-1">
                <div className="flex-1">
                  <div className="flex h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500" style=${{ width: '95%' }} />
                    <div className="bg-amber-500" style=${{ width: '3.5%' }} />
                    <div className="bg-red-500" style=${{ width: '1.5%' }} />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <span className="text-[10px] text-emerald-400">2xx: 95%</span>
                <span className="text-[10px] text-amber-400">4xx: 3.5%</span>
                <span className="text-[10px] text-red-400">5xx: 1.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

export const COMPETITOR_ROWS = [
  ['Placement Workflow Engine', true, false, false, false, false, true],
  ['Governance & Policy Engine', true, false, false, false, false, false],
  ['Multi-stakeholder Portals', true, false, false, false, false, true],
  ['CV Builder & Verification', true, false, false, true, false, true],
  ['Case Competition Platform', true, true, false, false, false, true],
  ['AI Candidate Matching', true, false, true, true, false, false],
  ['Verified Professional Network', true, false, true, false, false, false],
  ['Campus-specific Analytics', true, false, false, false, true, true],
  ['Recruiter Portal', true, true, true, true, false, true],
  ['White-label / On-premise', true, false, false, false, true, false],
  ['Unified Data Platform', true, false, false, false, true, false],
];

export const CompetitiveLandscapeSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-6 md:px-10 py-8 overflow-auto">
    <${SectionLabel} text="Competitive Landscape" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">Why <span className="text-[0.6em] align-top">I</span>thras Wins</h2>
    <div className="overflow-x-auto -mx-2 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="border-b border-white/[0.08]">
            <th className="text-left py-4 pl-5 pr-3 text-white/45 font-semibold text-xs uppercase tracking-wider">Capability</th>
            <th className="text-center py-4 px-3 text-indigo-400 font-semibold text-xs uppercase tracking-wider"><span className="text-[0.7em] align-top normal-case">I</span>thras</th>
            <th className="text-center py-4 px-2 text-white/35 font-medium text-xs">Unstop</th>
            <th className="text-center py-4 px-2 text-white/35 font-medium text-xs">LinkedIn</th>
            <th className="text-center py-4 px-2 text-white/35 font-medium text-xs">Naukri</th>
            <th className="text-center py-4 px-2 text-white/35 font-medium text-xs">Superset</th>
            <th className="text-center py-4 px-2 text-white/35 font-medium text-xs">EdTex</th>
          </tr>
        </thead>
        <tbody>
          ${COMPETITOR_ROWS.map(([feature, ...checks]) => html`
            <tr className="border-b border-white/[0.04] last:border-0">
              <td className="py-3.5 pl-5 pr-3 text-white/65 text-xs">${feature}</td>
              ${checks.map((v, i) => html`
                <td key=${i} className="py-3.5 px-2 text-center">
                  ${v ? html`<span className=${i === 0 ? 'text-emerald-400 font-semibold' : 'text-emerald-400/60'}>✓</span>` : html`<span className="text-white/15">—</span>`}
                </td>
              `)}
            </tr>
          `)}
        </tbody>
      </table>
    </div>
    <p className="text-white/35 text-xs text-center mt-6 max-w-2xl mx-auto"><span className="text-[0.75em] align-top">I</span>thras is the only platform combining placement operations, competitions, analytics, and professional networking in a single vertical stack. Superset offers BI only; EdTex lacks governance depth.</p>
  </div>
`;

export const MarketSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Market Sizing" />
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 tracking-tight">Campus and Lateral—Separate and Massive</h2>
    <p className="text-white/55 text-base md:text-lg mb-8 max-w-2xl" style=${{ textWrap: 'balance' }}>India's professional hiring market splits into campus (institutional wedge) and lateral (scale opportunity). Both are underserved.</p>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6">
        <h3 className="text-indigo-300 font-semibold text-xl mb-4">Campus Placements</h3>
        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-baseline"><span className="text-white/60 text-sm">5,500+</span><span className="text-white/40 text-xs">MBA & Engineering institutions (AICTE)</span></div>
          <div className="flex justify-between items-baseline"><span className="text-indigo-400 font-semibold text-xl">$340M</span><span className="text-white/40 text-xs">Serviceable (top-tier MBA, engineering)</span></div>
          <div className="flex justify-between items-baseline"><span className="text-indigo-400 font-semibold text-xl">$2.1B</span><span className="text-white/40 text-xs">TAM (placement management SaaS)</span></div>
        </div>
        <p className="text-white/45 text-xs">Our wedge. Institutional trust, verified CVs, governance. NEP 2020 + NIRF push adoption.</p>
      </div>
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6">
        <h3 className="text-amber-300 font-semibold text-xl mb-4">Lateral Hiring</h3>
        <div className="space-y-4 mb-4">
          <div className="flex justify-between items-baseline"><span className="text-white/60 text-sm">3–5x</span><span className="text-white/40 text-xs">Volume vs. campus hiring in India</span></div>
          <div className="flex justify-between items-baseline"><span className="text-amber-400 font-semibold text-xl">$1.5B+</span><span className="text-white/40 text-xs">Recruitment tech TAM (India)</span></div>
          <div className="flex justify-between items-baseline"><span className="text-amber-400 font-semibold text-xl">$8B+</span><span className="text-white/40 text-xs">Professional network / job board TAM</span></div>
        </div>
        <p className="text-white/45 text-xs">Our expansion. Same verified profiles, workflows. LinkedIn and Naukri aren't solving it.</p>
      </div>
    </div>
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-6">
      <h3 className="text-white font-semibold text-base mb-3">Combined Opportunity</h3>
      <p className="text-white/55 text-base">Campus first (wedge + verified profiles), lateral next (marketplace). One vertical stack addressing both. Total addressable: billions in India alone.</p>
    </div>
  </div>
`;

export const BusinessModelSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Business Model" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4 tracking-tight">SaaS-First, Per-User Pricing</h2>
    <p className="text-sm text-white/50 mb-6 max-w-2xl">
      Per-seat licensing. Land with placement teams, expand across the institution.
    </p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
      ${[
        { tier: 'Starter', price: '₹8,000/user/yr', tag: 'Foundation', features: [
          'Full placement workflow engine',
          'Multi-stakeholder portals',
          'CV builder with unlimited templates',
          'Governance policy engine',
          'Approval workflows & queues',
          'CV verification pipeline',
          'Interview scheduling & calendar',
          'Real-time analytics dashboard',
          'RBAC with standard roles',
          'Email + chat support',
        ], color: 'blue' },
        { tier: 'Pro', price: '₹18,000/user/yr', tag: 'AI-Powered', features: [
          'Everything in Starter',
          'AI candidate-company matching',
          'Predictive placement analytics',
          'Smart shortlist recommendations',
          'AI CV review & scoring',
          'Auto interview scheduling optimization',
          'Natural language policy creation',
          'AI-driven insights dashboard',
          'Priority support + dedicated CSM',
        ], color: 'indigo', highlight: true },
        { tier: 'Custom Enterprise', price: 'Custom', tag: 'Full Control', features: [
          'Everything in Pro',
          'Multi-institution deployment',
          'Custom RBAC policies & roles',
          'Dedicated infra / on-premise option',
          'API access & integrations',
          'White-labeling',
          '24/7 SLA + dedicated engineering',
          'Custom AI model training',
        ], color: 'emerald' },
      ].map(t => html`
        <div key=${t.tier} className=${'rounded-2xl p-6 border transition-all flex flex-col ' + (t.highlight ? 'bg-indigo-500/15 border-indigo-400/25 shadow-lg shadow-indigo-500/5' : 'bg-white/[0.05] border-white/[0.08]')}>
          <div className="flex items-center gap-2 mb-1">
            <p className=${'text-sm font-bold text-' + t.color + '-400'}>${t.tier}</p>
            ${t.highlight ? html`<span className="text-[9px] bg-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-full font-bold uppercase">Popular</span>` : null}
          </div>
          <p className="text-2xl font-semibold text-white mb-0.5">${t.price}</p>
          <p className="text-[10px] text-white/30 mb-3">${t.tag}</p>
          <div className="space-y-1.5 flex-1">
            ${t.features.map(f => html`
              <div key=${f} className="flex items-start gap-1.5 text-[11px] text-white/60">
                <svg className=${'w-3 h-3 mt-0.5 text-' + t.color + '-400 shrink-0'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                ${f}
              </div>
            `)}
          </div>
        </div>
      `)}
    </div>
    <div className="bg-white/[0.05] rounded-2xl border border-white/[0.08] p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-center">
        ${[
          { metric: 'ACV', value: '₹8k–18k', desc: 'Per user/year' },
          { metric: 'Net Retention', value: '130%+', desc: 'Expand within institution' },
          { metric: 'Gross Margin', value: '85%+', desc: 'Pure SaaS delivery' },
          { metric: 'Payback', value: '<6 mo', desc: 'Customer acquisition' },
        ].map(m => html`
          <div key=${m.metric}>
            <p className="text-2xl font-semibold text-indigo-400">${m.value}</p>
            <p className="text-xs text-white font-bold mt-1">${m.metric}</p>
            <p className="text-[10px] text-white/40">${m.desc}</p>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

export const TractionSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${SectionLabel} text="Traction" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 tracking-tight">Pre-Launch Readiness</h2>
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5">
      <div className="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
        <span className="text-xl font-semibold text-blue-400">IIM-C</span>
      </div>
      <div>
        <p className="text-white font-bold text-lg">In advanced conversations with IIM Calcutta</p>
        <p className="text-white/50 text-sm">India's #1 B-school as anchor institution for platform validation and go-to-market.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <${StatCard} label="Platform Status" value="Pre-Launch" sub="Pilot-ready product stack" color="emerald" />
      <${StatCard} label="Anchor Institution" value="IIM-C" sub="Advanced conversations" color="blue" />
      <${StatCard} label="Pilot Window" value="Q1 2026" sub="Target first launch cohort" color="amber" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-sm mb-4">Build Status</h3>
        <div className="space-y-3">
          ${[
            { feature: 'Multi-stakeholder RBAC', status: 'Built' },
            { feature: 'Governance policy engine', status: 'Built' },
            { feature: 'Template-driven CV workflows', status: 'Built' },
            { feature: 'Multi-stage workflow manager', status: 'Built' },
            { feature: 'Enterprise telemetry', status: 'Built' },
            { feature: 'AI-powered insights', status: 'Pilot' },
            { feature: 'Calendar / interview scheduling', status: 'Built' },
          ].map(f => html`
            <div key=${f.feature} className="flex items-center justify-between">
              <span className="text-sm text-white/70">${f.feature}</span>
              <span className=${'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (f.status === 'Built' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400')}>${f.status}</span>
            </div>
          `)}
        </div>
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <h3 className="text-white font-bold text-sm mb-4">Launch Execution Plan</h3>
        <div className="space-y-4">
          ${[
            { quarter: 'Q2 FY26', milestone: 'IIM Calcutta Pilot', status: 'active' },
            { quarter: 'Q2 FY26', milestone: 'Founders go full-time', status: 'active' },
            { quarter: 'Q3 FY26', milestone: 'MBA School scale up', status: 'upcoming' },
            { quarter: 'Q1 FY27', milestone: 'Expand to Engineering Colleges in parallel', status: 'upcoming' },
          ].map(m => html`
            <div key=${m.quarter} className="flex items-start gap-3">
              <div className=${'w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ' + (m.status === 'active' ? 'bg-emerald-400 ring-4 ring-emerald-400/20' : 'bg-white/20')} />
              <div>
                <p className="text-xs font-bold text-white/40">${m.quarter}</p>
                <p className="text-sm text-white/70">${m.milestone}</p>
              </div>
            </div>
          `)}
        </div>
      </div>
    </div>
  </div>
`;

export const ACCENT_STYLES = {
  indigo: { bar: 'bg-indigo-500/25', avatar: 'border-indigo-400/25 bg-indigo-500/15', text: 'text-indigo-400' },
  blue: { bar: 'bg-blue-500/25', avatar: 'border-blue-400/25 bg-blue-500/15', text: 'text-blue-400' },
  emerald: { bar: 'bg-emerald-500/25', avatar: 'border-emerald-400/25 bg-emerald-500/15', text: 'text-emerald-400' },
};

export const FounderCard = ({ initials, name, role, experience, education, other, accent, linkedin }) => {
  const s = ACCENT_STYLES[accent] || ACCENT_STYLES.indigo;
  const roleLines = Array.isArray(role) ? role : [role];
  return html`
  <div className="flex flex-col bg-white/[0.05] rounded-xl border border-white/[0.08] overflow-hidden hover:bg-white/[0.07] transition-all duration-200 h-full">
    <div className=${'h-0.5 shrink-0 ' + s.bar} />
    <div className="flex-1 p-4 flex flex-col min-h-0">
      <div className="flex flex-col items-center text-center mb-4 pb-4 border-b border-white/[0.06] relative z-10 shrink-0">
        <div className=${'w-12 h-12 rounded-xl grid place-items-center shrink-0 border mb-2 ' + s.avatar}>
          <span className=${'text-base font-semibold leading-none ' + s.text} style=${{ lineHeight: 1 }}>${initials}</span>
        </div>
        <h3 className="text-base font-semibold text-white leading-tight">${name}</h3>
        <div className="space-y-0.5">
          ${roleLines.map((line, i) => html`<p key=${i} className=${'text-xs font-medium ' + s.text}>${line}</p>`)}
        </div>
      </div>
      ${linkedin ? html`
        <div className="w-full flex justify-center mb-3 shrink-0 relative z-0">
          <a
            href=${linkedin}
            target="_blank"
            rel="noopener noreferrer"
            onClick=${(e) => { e.stopPropagation(); e.preventDefault(); window.open(linkedin, '_blank', 'noopener,noreferrer'); }}
            className="text-center text-blue-400 hover:text-blue-300 text-[10px] font-medium transition-colors cursor-pointer no-underline break-all max-w-full"
          >
            ${linkedin}
          </a>
        </div>
      ` : null}
      ${experience && experience.length ? html`
        <div className="mb-1.5">
          <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Experience</p>
          <ul className="space-y-0">
            ${experience.map((e, i) => html`<li key=${i} className="text-white/55 text-[11px] leading-snug">• ${e}</li>`)}
          </ul>
        </div>
      ` : null}
      ${education && education.length ? html`
        <div className="mb-1.5">
          <p className="text-[9px] font-semibold text-white/40 uppercase tracking-wider mb-0.5">Education</p>
          <ul className="space-y-0">
            ${education.map((e, i) => html`<li key=${i} className="text-white/55 text-[11px] leading-snug">• ${e}</li>`)}
          </ul>
        </div>
      ` : null}
      ${other ? html`
        <div>
          <p className="text-white/50 text-[11px] leading-snug">${other}</p>
        </div>
      ` : null}
    </div>
  </div>
`;
};

export const FoundersSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-6 md:px-10 py-6 overflow-auto">
    <${SectionLabel} text="Founders" />
    <h2 className="text-4xl md:text-5xl font-semibold text-white mb-2 tracking-tight">Built by Insiders</h2>
    <p className="text-sm text-white/50 mb-5 max-w-xl" style=${{ textWrap: 'balance' }}>Domain expertise, business acumen, and engineering.</p>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      <${FounderCard}
        initials="SG"
        name="Shashank Gandham"
        role=${['CEO — Tech, Product & Strategy']}
        linkedin="https://www.linkedin.com/in/shashankgandham/"
        experience=${['Engagement Manager, McKinsey', 'Software Developer, Citi', 'Placement Rep, IIM Calcutta']}
        education=${['IIM Calcutta', 'B.Tech in Computer Science, College of Engineering, Pune']}
        accent=${'indigo'}
      />
      <${FounderCard}
        initials="AA"
        name="Abhishek Achanta"
        role=${['Co-Founder — Product & Technology']}
        linkedin="https://www.linkedin.com/in/abhishek-achanta/"
        experience=${['Product Manager, MakeMyTrip & Pinnacle', 'B2B Sales, Javis & Pinnacle', 'Placement Rep, IIIT Jabalpur']}
        education=${['IIM Calcutta', 'IIIT Jabalpur']}
        accent=${'blue'}
      />
      <${FounderCard}
        initials="MK"
        name="Matthew Kallarackal"
        role=${['Co-Founder — Operations & Sales']}
        linkedin="https://www.linkedin.com/in/matthew-kallarackal-939871124/"
        experience=${['Ex-Founder, Skaut', 'Growth & Revenue, MakeMyTrip', 'M&A, PwC', 'Software Developer, Citi']}
        education=${['IIM Lucknow', 'NIT Surathkal']}
        accent=${'emerald'}
      />
    </div>
    <div className="bg-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl p-4 md:p-6">
      <h3 className="text-indigo-300 font-bold text-base mb-4">Unfair Advantages</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${[
          { title: 'Domain Insiders', desc: 'First-hand placement experience at India\'s top institutions' },
          { title: 'Institutional Access', desc: 'Direct relationships with placement committees' },
          { title: 'Technical Moat', desc: 'Governance + AI pipeline—18+ months to replicate' },
        ].map(a => html`
          <div key=${a.title}>
            <p className="text-white font-bold text-sm mb-1">${a.title}</p>
            <p className="text-white/50 text-xs leading-relaxed">${a.desc}</p>
          </div>
        `)}
      </div>
    </div>
  </div>
`;

export const AskSlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center relative px-4 md:px-8 py-6 min-h-0">
    <div className="relative z-10 max-w-3xl w-full overflow-auto flex flex-col items-center">
      <${SectionLabel} text="The Ask" />
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-white mb-4 tracking-tight">Join Us in Building the Future of<br /><span className="text-indigo-400">Recruitment Reimagined</span></h2>
      <p className="text-sm md:text-lg text-white/50 mb-6 max-w-xl mx-auto">
        We are pre-launch and raising capital to bring the founding team full-time, launch institutional pilots, and scale toward the lateral market.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-2xl font-semibold text-indigo-400 mb-1">$1M</p>
          <p className="text-white/60 text-sm">Fundraise</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-2xl font-semibold text-blue-400 mb-1">$10M</p>
          <p className="text-white/60 text-sm">Post-Money Valuation</p>
        </div>
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-2xl font-semibold text-emerald-400 mb-1">Pre-Launch</p>
          <p className="text-white/60 text-sm">Current Stage</p>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 p-4 mb-6">
        <h3 className="text-white font-bold text-sm mb-3">Use of Funds</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          ${[
            { label: 'Founders Full-Time', pct: '30%', color: 'indigo' },
            { label: 'Server Costs', pct: '20%', color: 'blue' },
            { label: 'Hiring Costs', pct: '25%', color: 'emerald' },
            { label: 'Marketing', pct: '15%', color: 'amber' },
            { label: 'Day-to-Day Ops', pct: '10%', color: 'purple' },
          ].map(u => html`
            <div key=${u.label} className="text-center">
              <p className=${'text-xl font-semibold text-' + u.color + '-400'}>${u.pct}</p>
              <p className="text-xs text-white/50 mt-1">${u.label}</p>
            </div>
          `)}
        </div>
      </div>
    </div>
  </div>
`;

export const RoadmapSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-6xl mx-auto px-6 md:px-10 py-8 overflow-auto">
    <${SectionLabel} text="Product Roadmap" />
    <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6 tracking-tight">Vertical Integration Strategy</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">1</span>
          <span className="text-blue-400 font-semibold text-xs uppercase tracking-wider">2026</span>
        </div>
        <h3 className="text-white font-semibold text-base mb-2">Recruitment OS</h3>
        <ul className="space-y-1.5">
          <li className="text-white/50 text-xs">• Campus placement workflow</li>
          <li className="text-white/50 text-xs">• Governance & policy engine</li>
          <li className="text-white/50 text-xs">• CV builder & verification</li>
          <li className="text-white/50 text-xs">• Multi-stakeholder portals</li>
        </ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-purple-500 flex items-center justify-center text-white font-semibold text-xs">2</span>
          <span className="text-purple-400 font-semibold text-xs uppercase tracking-wider">2027</span>
        </div>
        <h3 className="text-white font-semibold text-base mb-2">Case Competitions & Tests</h3>
        <ul className="space-y-1.5">
          <li className="text-white/50 text-xs">• Inter-college case comp platform</li>
          <li className="text-white/50 text-xs">• Aptitude & assessment tests</li>
          <li className="text-white/50 text-xs">• Judge management & scoring</li>
          <li className="text-white/50 text-xs">• Recruiter talent discovery</li>
        </ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold text-xs">3</span>
          <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">2028</span>
        </div>
        <h3 className="text-white font-semibold text-base mb-2">Scale Up of Institutions</h3>
        <ul className="space-y-1.5">
          <li className="text-white/50 text-xs">• Multi-institution deployment</li>
          <li className="text-white/50 text-xs">• MBA & engineering scale-up</li>
          <li className="text-white/50 text-xs">• Enterprise org hierarchy</li>
          <li className="text-white/50 text-xs">• White-label & on-premise</li>
        </ul>
      </div>
      <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white font-semibold text-xs">4</span>
          <span className="text-amber-400 font-semibold text-xs uppercase tracking-wider">2029</span>
        </div>
        <h3 className="text-white font-semibold text-base mb-2">B2C & Laterals</h3>
        <ul className="space-y-1.5">
          <li className="text-white/50 text-xs">• B2C professional network</li>
          <li className="text-white/50 text-xs">• Lateral recruitment marketplace</li>
          <li className="text-white/50 text-xs">• Verified profiles & alumni</li>
          <li className="text-white/50 text-xs">• Better than LinkedIn for India</li>
        </ul>
      </div>
    </div>
    <div className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-5">
      <h4 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-4">Vertical Integration: Disrupting Incumbents</h4>
      <div className="flex flex-wrap items-center justify-around gap-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 mx-auto">
            <span className="text-red-400 font-semibold text-sm">U</span>
          </div>
          <p className="text-white/50 text-xs font-medium">Unstop</p>
          <p className="text-white/30 text-[10px]">Case comps only</p>
        </div>
        <div className="text-white/20 text-lg">+</div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 mx-auto">
            <span className="text-blue-400 font-semibold text-sm">in</span>
          </div>
          <p className="text-white/50 text-xs font-medium">LinkedIn</p>
          <p className="text-white/30 text-[10px]">Generic network</p>
        </div>
        <div className="text-white/20 text-lg">+</div>
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-2 mx-auto">
            <span className="text-purple-400 font-semibold text-sm">N</span>
          </div>
          <p className="text-white/50 text-xs font-medium">Naukri.com</p>
          <p className="text-white/30 text-[10px]">Job board</p>
        </div>
        <div className="text-white/20 text-2xl">=</div>
        <div className="text-center">
          <p className="text-white font-bold text-xs mb-1"><span className="text-[0.7em] align-top">I</span>thras</p>
          <p className="text-blue-400/70 text-[10px]">Full-stack career OS</p>
        </div>
      </div>
    </div>
  </div>
`;
