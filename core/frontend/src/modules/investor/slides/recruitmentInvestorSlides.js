import React from 'react';
import htm from 'htm';

const html = htm.bind(React.createElement);

const LightLabel = ({ text }) => html`
  <span className="inline-block px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-600 text-[11px] font-semibold tracking-widest uppercase mb-5">${text}</span>
`;

const Check = ({ color }) => html`
  <svg className=${'w-3.5 h-3.5 mt-0.5 shrink-0 text-' + color + '-500'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
`;

const AlertIcon = () => html`
  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
`;

/* ─── 1. COVER ─── */
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
      <p className="text-xl md:text-2xl font-medium text-indigo-600 mb-10 tracking-wide">Recruitment, Reimagined</p>
      <div className="w-20 h-0.5 bg-indigo-500/30 rounded-full mx-auto mb-10" />
      <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed" style=${{ textWrap: 'balance' }}>
        The one-stop place for everything recruitment: your Digital CV and profile at the centre. AI-first, verified, network-native. One profile. One network. One workflow. Replacing the fragmented, unverified job-board era.
      </p>
      <div className="mt-14 flex items-center justify-center gap-6 text-slate-400 text-sm tracking-wide">
        <span>Recruitment Investor Deck</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>Confidential</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>2026</span>
      </div>
    </div>
  </div>
`;

/* ─── 2. HR PROBLEMS — 50+ HR PROFESSIONALS ─── */
export const HRProblemsSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Research" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">We Spoke with 50+ HR Professionals</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl">Here are the problems they face — in their words and backed by ecosystem data.</p>

    <div className="space-y-3 mb-5">
      ${[
        { quote: 'We\'re drowning in resumes — 22,000 added daily, 645,000 modified daily on Naukri alone. Most are noise. Signal-to-noise is the biggest problem.', source: 'Naukri: 106M resume database, FY25 metrics' },
        { quote: 'Employment verification discrepancies are through the roof. We waste interview cycles only to find out later. Verification happens too late.', source: 'Background-check data: 5%+ discrepancy rates, higher on employment checks' },
        { quote: 'We juggle Naukri, LinkedIn, Indeed — each has different taxonomies and messaging. ATS integration is marketed everywhere but implemented unevenly.', source: 'LinkedIn, Indeed, Shine ATS integration research' },
        { quote: 'We pay for view-based packs because longer products are too expensive. Then we hit the quota. ROI attribution is weak.', source: 'TimesJobs: view-based packs for cost-sensitive recruiters' },
        { quote: 'Fake candidates, forged resumes — they slip through. LinkedIn removed 80.6M fake accounts in H2 2024. The arms race never stops.', source: 'LinkedIn transparency reporting' },
      ].map((q, i) => html`
        <div key=${i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-700 text-sm leading-relaxed italic mb-2">"${q.quote}"</p>
          <p className="text-slate-400 text-[10px]">— ${q.source}</p>
        </div>
      `)}
    </div>

    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
      <p className="text-red-800 text-xs font-semibold">Recruiters pay $340M/year (Naukri) for a broken product. They need verified signal, unified workflow, and outcomes — not volume.</p>
    </div>
  </div>
`;

/* ─── 3. CANDIDATE PROBLEMS — 100+ CANDIDATES ─── */
export const CandidateProblemsSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Research" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">We Spoke with 100+ Candidates</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl">Job seekers face scams, ghost jobs, and a system that offers no feedback or protection.</p>

    <div className="space-y-3 mb-5">
      ${[
        { quote: 'The few callbacks I got — they asked for Rs 50K for "processing". Turned out to be scams. NCS warns about impersonation; it happens every day.', source: 'NCS fraud warnings; Kroll: 20% fake LinkedIn postings' },
        { quote: 'I applied to hundreds of jobs. I never hear back. Ghost jobs, outdated listings — I\'m applying into a void.', source: 'Business reporting on ghost jobs' },
        { quote: 'They took my contact from a job portal and sold it. Now I get spam calls all day. PII exposure is a real risk.', source: 'Indeed/Glassdoor data misuse reports' },
        { quote: 'The forms are all in English. I use a shared phone — OTPs, personal data, it\'s risky. The UX wasn\'t built for us.', source: 'Rural internet > urban; Indic-language usage near-universal' },
        { quote: 'I have no way to tell which posting is real. No feedback, no visibility into the process. Apply and pray.', source: 'Platform opacity; matching algorithms unclear to candidates' },
      ].map((q, i) => html`
        <div key=${i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-slate-700 text-sm leading-relaxed italic mb-2">"${q.quote}"</p>
          <p className="text-slate-400 text-[10px]">— ${q.source}</p>
        </div>
      `)}
    </div>

    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
      <p className="text-red-800 text-xs font-semibold">167M LinkedIn users in India; 6.02 crore on NCS. The demand exists. The trust is broken. Candidates need verification, scam protection, and real feedback.</p>
    </div>
  </div>
`;

/* ─── 4. PROBLEM SUMMARY — XX RECRUITER, YY CANDIDATE ─── */
export const ProblemSummarySlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Synthesis" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Broadly: 7 Recruiter Problems, 7 Candidate Problems</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Our research across India's recruitment ecosystem surfaces a clear pattern. These map directly to systemic failures in the portal landscape.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-amber-700 font-bold text-base mb-3 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">7</span>
          Recruiter Problems
        </h3>
        <ul className="space-y-1.5">
          ${[
            'Low signal-to-noise sourcing (volume over quality)',
            'Fake candidates and credential discrepancies',
            'Verification happens too late in the funnel',
            'ATS and workflow fragmentation across portals',
            'Pricing/value misalignment, quota-driven usage',
            'Ghost jobs and non-committal postings',
            'Contact-channel exposure increases spam surface',
          ].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${AlertIcon} /><span>${f}</span></li>
          `)}
        </ul>
      </div>
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-indigo-700 font-bold text-base mb-3 flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">7</span>
          Candidate Problems
        </h3>
        <ul className="space-y-1.5">
          ${[
            'Advance-fee and impersonation scams',
            'Ghost jobs — apply to hundreds, hear back from none',
            'Spam, fake profiles, and scam messaging',
            'No feedback, no visibility into process',
            'Vernacular and mobile-first UX mismatch',
            'Shared-device risks and PII exposure',
            'Resume data misused and sold without consent',
          ].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${AlertIcon} /><span>${f}</span></li>
          `)}
        </ul>
      </div>
    </div>

    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-white text-sm font-semibold text-center">The same root causes: no verification, no process control, no structured data, no trust. Both sides lose. The market pays billions for a broken system.</p>
    </div>
  </div>
`;

/* ─── 5. COMPETITOR PROBLEMS — ZZ COMPETITORS ─── */
export const CompetitorProblemsSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Landscape" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">We Analysed 12+ Competitors</h2>
    <p className="text-slate-500 text-base mb-5 max-w-2xl">Every portal type has predictable failure modes. Trust, verification, and workflow remain unsolved.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
      ${[
        { name: 'Naukri', scale: '106M resumes, 22k daily adds', problems: 'High noise, 2.0 Trustpilot, 41% unresolved complaints, no verification' },
        { name: 'LinkedIn', scale: '167M India, 1.2B global', problems: '80.6M fake accounts removed H2 2024, 20% fake postings, no hiring workflow' },
        { name: 'Indeed', scale: '615M global profiles, 13.1M India visits', problems: 'Ghost jobs, fake listings, 2.4 Trustpilot, aggregator fragmentation' },
        { name: 'Shine', scale: '50M+ candidates', problems: 'Fake postings/scams, high fraud exposure, ATS integration partial' },
        { name: 'TimesJobs', scale: '2.3Cr job seekers', problems: 'View-based packs, cost-value tension, duplicate outreach' },
        { name: 'Freshersworld', scale: '1 Cr+ resumes', problems: 'Credential verification gaps, fake offers, low signal' },
        { name: 'Wellfound', scale: '10M+ startup candidates', problems: 'Spray-and-pray, free posting = high noise' },
        { name: 'NCS (Govt)', scale: '6.02Cr jobseekers', problems: 'Impersonation scams, final hires not mandatory to report' },
        { name: 'IIMJobs', scale: '4M+ jobseekers', problems: 'Smaller funnel, verification gaps persist' },
        { name: 'foundit', scale: 'Monster India legacy', problems: 'Brand transition confusion, SEO/redirect issues' },
        { name: 'Upwork', scale: '785k active clients', problems: 'Fake job listings, off-platform contact, scam pressure' },
      ].map(c => html`
        <div key=${c.name} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="text-slate-800 font-bold text-sm">${c.name}</h4>
          </div>
          <p className="text-slate-500 text-[10px] mb-1.5">${c.scale}</p>
          <p className="text-red-600 text-[10px] leading-snug">${c.problems}</p>
        </div>
      `)}
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <p className="text-amber-800 text-sm font-semibold">Portal types: general boards, professional networks, niche/campus, freelance, aggregators, government. All share the same systemic failures: trust collapse, low signal, workflow fragmentation.</p>
    </div>
  </div>
`;

/* ─── 6. UNIFIED PILLARS ─── */
export const UnifiedPillarsSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Synthesis" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">Unified: Five Pillars to Solve</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Recruiter problems + candidate problems + competitor gaps converge on five pillars. Solve these, and you replace the category.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
      ${[
        { num: '1', title: 'Trust & Verification', desc: 'Scams, fake profiles, credential discrepancies. Enforce recruiter/employer verification; move verification earlier; verified education/employment tiers.', color: 'red' },
        { num: '2', title: 'Signal over Noise', desc: 'Recruiter sourcing quality. Structured skills profiles, richer job schema, quality scoring, de-dupe across sources.', color: 'amber' },
        { num: '3', title: 'Workflow Unification', desc: 'ATS fragmentation. Common job/applicant schema; full-funnel stage sync; unified candidate identity; analytics parity.', color: 'indigo' },
        { num: '4', title: 'Candidate Protection', desc: 'Ghost jobs, scam literacy, PII exposure. Job status truth; on-platform messaging default; contact gating; scam nudge patterns.', color: 'emerald' },
        { num: '5', title: 'Inclusive Access', desc: 'Vernacular, mobile-first, shared device. Lightweight flows; voice support; privacy mode; education prompts.', color: 'violet' },
      ].map(p => html`
        <div key=${p.num} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className=${'w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-' + p.color + '-100'}>
            <span className=${'text-' + p.color + '-600 font-bold text-lg'}>${p.num}</span>
          </div>
          <h4 className="text-slate-800 font-bold text-sm mb-1.5">${p.title}</h4>
          <p className="text-slate-500 text-xs leading-relaxed">${p.desc}</p>
        </div>
      `)}
    </div>

    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4">
      <p className="text-indigo-800 text-sm font-semibold text-center">Here is how we propose to solve it. One profile. One network. One workflow. Verified. AI-powered. Control the flow; data never spills.</p>
    </div>
  </div>
`;

/* ─── 7. THE PROBLEM — BROKEN HIRING (legacy, kept for reference) ─── */
export const BrokenHiringSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="The Problem" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Hiring in India Is Fundamentally Broken</h2>
    <p className="text-slate-500 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>90 million applications chasing 1.4 million jobs. No verification. Rampant fraud. The system is failing everyone — candidates, recruiters, and institutions.</p>

    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      ${[
        { value: '64:1', label: 'Application-to-job ratio', sub: '90M apps for 1.4M jobs in 2025', color: 'red' },
        { value: '47M+', label: 'Fake CVs in India', sub: '10%+ of all resumes contain discrepancies', color: 'red' },
        { value: '56%', label: 'Hiring managers detect fraud', sub: 'Record high in 2024 — Nasscom', color: 'amber' },
        { value: '83%', label: 'Eng grads jobless (2024)', sub: '50% of MBA grads also without offers', color: 'orange' },
        { value: '⅓', label: 'Cost of a bad hire', sub: 'Up to one-third of first-year salary', color: 'red' },
      ].map(s => html`
        <div key=${s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
          <p className=${'text-2xl md:text-3xl font-bold text-' + s.color + '-500 mb-1'}>${s.value}</p>
          <p className="text-slate-800 font-semibold text-xs mb-0.5">${s.label}</p>
          <p className="text-slate-400 text-[10px] leading-snug">${s.sub}</p>
        </div>
      `)}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      ${[
        { title: 'For Candidates', desc: 'Apply to hundreds of jobs, hear back from none. No prep tools, no feedback, no visibility into process.' },
        { title: 'For Recruiters', desc: 'Drowning in unverified resumes. 17% resume mismatch rate. No way to distinguish signal from noise.' },
        { title: 'For Institutions', desc: 'Placement cells run on spreadsheets with zero governance. Scandals at IIM Indore, IIT Bombay, IIM Calcutta.' },
      ].map(c => html`
        <div key=${c.title} className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-slate-800 font-semibold text-sm mb-1">${c.title}</p>
          <p className="text-slate-500 text-xs leading-relaxed">${c.desc}</p>
        </div>
      `)}
    </div>
  </div>
`;

/* ─── 3. INCUMBENTS FAILING — NAUKRI ─── */
export const NaukriFailingSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Incumbent #1" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Naukri.com — 75% Market Share, Broken Product</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl">India's dominant job portal generates Rs 2,850 Cr ($340M) in annual revenue. But users are furious — and the product hasn't evolved.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <div className="space-y-3">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0"><span className="text-2xl font-bold text-purple-600">N</span></div>
          <div>
            <h3 className="text-slate-800 font-semibold text-lg">User Ratings</h3>
            <p className="text-slate-400 text-xs">Across consumer review platforms</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          ${[
            { platform: 'Trustpilot', score: '2.0/5', color: 'red' },
            { platform: 'ComplaintsBoard', score: '1.4/5', color: 'red' },
            { platform: 'PissedConsumer', score: '1.5/5', color: 'red' },
          ].map(r => html`
            <div key=${r.platform} className="bg-white border border-slate-200 rounded-lg p-3 text-center">
              <p className=${'text-xl font-bold text-' + r.color + '-500'}>${r.score}</p>
              <p className="text-slate-500 text-[10px]">${r.platform}</p>
            </div>
          `)}
        </div>
      </div>
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Key Failures</h3>
        ${[
          { text: 'Premium services (Rs 20K+) deliver zero results — profile views drop to 0 after payment', icon: true },
          { text: '41% of consumer complaints remain unresolved (1,125 of 2,744)', icon: true },
          { text: 'Security bug exposed recruiter email addresses (May 2025)', icon: true },
          { text: 'No profile verification — anyone can claim anything', icon: true },
          { text: 'Pure "post and pray" model — no workflow, no structured data, no intelligence', icon: true },
        ].map(f => html`
          <div key=${f.text} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-red-100 flex items-center justify-center shrink-0 mt-0.5"><${AlertIcon} /></div>
            <p className="text-slate-700 text-xs leading-relaxed">${f.text}</p>
          </div>
        `)}
      </div>
    </div>

    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-white text-sm font-semibold text-center">Naukri proves the market pays $340M/year for a broken product. Imagine what a platform that actually works can capture.</p>
    </div>
  </div>
`;

/* ─── 4. INCUMBENTS FAILING — LINKEDIN & INDEED ─── */
export const LinkedInIndeedFailingSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Incumbents #2 & #3" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">LinkedIn and Indeed — Trust Deficit at Scale</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl">167M Indian users on LinkedIn. Billions in global revenue. Yet the platforms are overrun with scams, fake listings, and zero hiring workflow.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><span className="text-lg font-bold text-blue-600">in</span></div>
          <h3 className="text-slate-800 font-semibold text-lg">LinkedIn</h3>
        </div>
        <ul className="space-y-2 text-slate-600 text-xs">
          <li className="flex items-start gap-2"><${AlertIcon} /><span><strong>20% of job postings are fake</strong> — candidates pressured to pay Rs 50K-1L (Kroll)</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span><strong>80.6M fake accounts</strong> removed in H2 2024 alone</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>Sophisticated scams: fake interview links, company impersonation (Nestle India targeted)</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>No hiring workflow — professional network, not a recruitment platform</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>Endorsements are meaningless — no real verification layer</span></li>
        </ul>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center"><span className="text-lg font-bold text-violet-600">iD</span></div>
          <h3 className="text-slate-800 font-semibold text-lg">Indeed</h3>
        </div>
        <ul className="space-y-2 text-slate-600 text-xs">
          <li className="flex items-start gap-2"><${AlertIcon} /><span><strong>2.4/5 on Trustpilot</strong> (12,400+ reviews) — 1.8/5 on Sitejabber</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>Fake listings with demands for upfront payments, forged offer letters</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>Outdated/inactive postings remain live — candidates apply to ghost jobs</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>Resume data misused and sold to third parties without consent</span></li>
          <li className="flex items-start gap-2"><${AlertIcon} /><span>No structured recruitment workflow — pure aggregator model</span></li>
        </ul>
      </div>
    </div>

    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
      <p className="text-red-800 text-sm font-semibold text-center leading-relaxed">The common thread: no verification, no process control, no structured data, no trust. The market needs a fundamentally different approach.</p>
    </div>
  </div>
`;

/* ─── 5. THE INSIGHT — UNIVERSITY EFFECT ─── */
export const UniversityInsightSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="The Insight" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Every Job Seeker Starts at a University</h2>
    <p className="text-slate-500 text-base md:text-lg mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>8.5 lakh+ engineering and 1.7 lakh+ MBA graduates enter the job market every year. They all need the same things before they even apply.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      ${[
        { icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', title: 'CV Preparation', desc: 'Before applying anywhere, every graduate needs a structured, compelling CV. This is where they enter our funnel.', color: 'indigo' },
        { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: 'Interview Prep', desc: 'AI-powered prep agents generate practice material tailored to target companies and roles. A magnet for engagement.', color: 'emerald' },
        { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', title: 'Verified Profile', desc: 'Institutional email verification creates a trust layer. This verified identity carries forward into lateral hiring forever.', color: 'amber' },
      ].map(c => html`
        <div key=${c.title} className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className=${'w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-' + c.color + '-100'}>
            <svg className=${'w-5 h-5 text-' + c.color + '-600'} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d=${c.icon} /></svg>
          </div>
          <h4 className="text-slate-800 font-bold text-base mb-1">${c.title}</h4>
          <p className="text-slate-500 text-sm leading-relaxed">${c.desc}</p>
        </div>
      `)}
    </div>

    <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-5">
      <p className="text-indigo-800 text-sm md:text-base font-semibold text-center leading-relaxed">This is the funnel. Capture them with free AI career tools at university, and they stay for lateral hiring. Every graduate becomes a lifelong verified profile on the platform.</p>
    </div>
  </div>
`;

/* ─── 8. OUR SOLUTION — HERE IS HOW WE PROPOSE TO SOLVE IT ─── */
export const SolutionSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Our Solution" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">Here Is How We Propose to Solve It</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>The One-Stop Place: Digital CV and profile at the centre. Jobs, prep, network, verification — scheduling, calendar, interviews — all on one platform. Control the flow; data doesn't spill out.</p>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center"><span className="text-indigo-600 font-bold text-sm">1</span></div>
          <h3 className="text-indigo-700 font-bold text-base">AI Career Tools</h3>
          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Top of Funnel</span>
        </div>
        <ul className="space-y-1">
          ${['AI agents build your Digital CV and profile — one place for recruitment', 'Interview prep material generator', 'Career path recommendations from batch data'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="indigo" />${f}</li>
          `)}
        </ul>
      </div>
      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center"><span className="text-emerald-600 font-bold text-sm">2</span></div>
          <h3 className="text-emerald-700 font-bold text-base">Verified Network + Trust Score</h3>
          <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Data Moat</span>
        </div>
        <ul className="space-y-1">
          ${['Institutional email verification', 'Trust Score: verified connections, social activity, profile completeness', 'Building the network: profile clustering, batchmate tracking', 'Indian Glassdoor + LinkedIn + Naukri with a real trust layer'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="emerald" />${f}</li>
          `)}
        </ul>
      </div>
      <div className="bg-white border-2 border-violet-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center"><span className="text-violet-600 font-bold text-sm">3</span></div>
          <h3 className="text-violet-700 font-bold text-base">Structured Recruitment</h3>
          <span className="text-[9px] font-bold text-violet-400 uppercase tracking-wider">Recruiter Value</span>
        </div>
        <ul className="space-y-1">
          ${['AI-ranked shortlists from Digital profiles', 'Scheduling, calendar, interviews — all on-platform. Control the flow; data stays in.', 'Contact info gated behind shortlisting — candidates notified instantly', 'Full tracking: profiles viewed, shortlisted, interview stages, outcomes'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="violet" />${f}</li>
          `)}
        </ul>
      </div>
      <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center"><span className="text-amber-600 font-bold text-sm">4</span></div>
          <h3 className="text-amber-700 font-bold text-base">Intelligence Layer</h3>
          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Network Effects</span>
        </div>
        <ul className="space-y-1">
          ${['"Profiles like yours got into these roles"', 'Recruiter analytics: which profiles enter which jobs', 'Salary benchmarking from verified data', 'Profile-to-job matching from real placement outcomes'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="amber" />${f}</li>
          `)}
        </ul>
      </div>
    </div>

    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4">
      <h4 className="text-amber-800 font-bold text-sm mb-2">Engagement & Incentives — What Drives Updates</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-slate-700 font-semibold mb-1">For Candidates</p>
          <ul className="space-y-0.5 text-slate-600">
            <li>• Update profile → Higher Trust Score → More recruiter visibility</li>
            <li>• Complete profile → Unlock premium AI prep tools</li>
            <li>• Apply through profile → Get feedback (views, shortlist status)</li>
          </ul>
        </div>
        <div>
          <p className="text-slate-700 font-semibold mb-1">For Recruiters</p>
          <ul className="space-y-0.5 text-slate-600">
            <li>• Verified shortlists save time — pay for signal, not noise</li>
            <li>• Profile freshness badge — fresh profiles ranked higher</li>
            <li>• Contact unlock gated — candidates know shortlist = real interest</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
`;

/* ─── 7. HOW AI POWERS EVERYTHING ─── */
export const AISlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="AI-First" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">AI at Every Layer</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Not AI bolted on. AI as the foundation. Because the Digital profile is the central object — structured, updateable, network-connected — our AI has clean, trusted data no incumbent has.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
        </div>
        <h3 className="text-indigo-700 font-bold text-base mb-2">For Candidates</h3>
        <ul className="space-y-1.5">
          ${['AI CV builder agents', 'Interview prep material generation', 'Job-fit scoring', '"Profiles like yours" matching', 'Career path recommendations'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="indigo" />${f}</li>
          `)}
        </ul>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
        </div>
        <h3 className="text-emerald-700 font-bold text-base mb-2">For Recruiters</h3>
        <ul className="space-y-1.5">
          ${['AI noise filter on applications', 'Ranked shortlists from structured data', 'Auto-scheduling and calendar', 'Structured interview tools on-platform', 'Candidate quality scoring'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="emerald" />${f}</li>
          `)}
        </ul>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-3">
          <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
        </div>
        <h3 className="text-violet-700 font-bold text-base mb-2">For the Platform</h3>
        <ul className="space-y-1.5">
          ${['Profile clustering and trend detection', 'Trust score from connection graphs', 'Fraud detection on profiles and CVs', 'Engagement algorithms for retention', 'Network-wide intelligence layer'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="violet" />${f}</li>
          `)}
        </ul>
      </div>
    </div>

    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-white text-sm font-semibold text-center leading-relaxed">The moat: Profile as recruitment hub (not social like LinkedIn) + verified + trust scores + full on-platform workflow. Scheduling, calendar, interviews — we control the flow; data never spills to email or external tools.</p>
    </div>
  </div>
`;

/* ─── 8. DATA MOAT ─── */
export const DataMoatSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Data Moat" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Why This Compounds</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Each step feeds the next. The data moat deepens with every profile, every connection, every hiring outcome.</p>

    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mb-5">
      ${[
        { step: '1', label: 'University Funnel', desc: 'Free AI career tools bring 10-20K verified students from partner institutions.', color: 'indigo', tag: 'Acquire' },
        { step: '2', label: 'AI Engagement', desc: 'Profile updates, career content, prep tools keep users active. Social media-like retention.', color: 'emerald', tag: 'Retain' },
        { step: '3', label: 'Verified Profiles', desc: 'Institutional email + Digital profiles + trust scores. Data quality no competitor has.', color: 'blue', tag: 'Trust' },
        { step: '4', label: 'Recruiter Demand', desc: 'Signal-rich, verified talent attracts recruiters. On-platform workflow locks them in.', color: 'amber', tag: 'Monetize' },
        { step: '5', label: 'Network Effects', desc: 'More profiles attract more recruiters. More recruiters attract more profiles. Flywheel spins.', color: 'purple', tag: 'Compound' },
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

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <h4 className="text-indigo-700 font-bold text-sm mb-1">Digital Profile as the Central Object</h4>
        <p className="text-slate-600 text-xs leading-relaxed">The Digital CV and profile are structured, updateable, network-connected — not static PDFs. We own the data. Contact info is only revealed after shortlisting.</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <h4 className="text-emerald-700 font-bold text-sm mb-1">Trust Score > LinkedIn Endorsements</h4>
        <p className="text-slate-600 text-xs leading-relaxed">Trust score is backed by verified institutional ties, real professional connections who stake their own score, and actual hiring outcomes. LinkedIn endorsements are gameable and meaningless.</p>
      </div>
    </div>

    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-white text-sm font-semibold text-center leading-relaxed">We're not fixing recruitment. We're replacing it. One profile. One network. One workflow. Verified. AI-powered. Network effects that compound. The next decade of professional identity will look nothing like the last.</p>
    </div>
  </div>
`;

/* ─── 9. GTM STRATEGY ─── */
export const GTMSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Go-To-Market" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">From University Wedge to Lateral Marketplace</h2>
    <p className="text-slate-500 text-base mb-6 max-w-xl" style=${{ textWrap: 'balance' }}>Three phases. Each builds on the last. University acquisition is the wedge — lateral marketplace is the prize.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
      <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center"><span className="text-indigo-600 font-bold text-xs">P1</span></div>
          <span className="text-indigo-600 font-semibold text-sm">University Wedge</span>
        </div>
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Months 1–6</p>
        <ul className="space-y-1.5 mb-3">
          ${['Partner with 5-10 MBA/engineering institutions', 'Free AI career tools for students', 'CV builder + prep agents as acquisition magnet', 'Target: 10,000-20,000 verified students'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="indigo" />${f}</li>
          `)}
        </ul>
        <div className="bg-indigo-50 rounded-lg p-2.5"><p className="text-indigo-700 text-[11px] font-semibold text-center">Unit economics: $0 CAC (free tools)</p></div>
      </div>
      <div className="bg-white border-2 border-emerald-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><span className="text-emerald-600 font-bold text-xs">P2</span></div>
          <span className="text-emerald-600 font-semibold text-sm">Lateral Expansion</span>
        </div>
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Months 6–12</p>
        <ul className="space-y-1.5 mb-3">
          ${['Alumni networks bring lateral job seekers organically', 'Social media engagement keeps profiles updated', 'Recruiter onboarding via institutional relationships', 'Target: 50,000+ profiles, 100+ recruiters'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="emerald" />${f}</li>
          `)}
        </ul>
        <div className="bg-emerald-50 rounded-lg p-2.5"><p className="text-emerald-700 text-[11px] font-semibold text-center">Revenue starts: recruiter subscriptions</p></div>
      </div>
      <div className="bg-white border-2 border-amber-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center"><span className="text-amber-600 font-bold text-xs">P3</span></div>
          <span className="text-amber-600 font-semibold text-sm">Marketplace</span>
        </div>
        <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider mb-2">Year 2+</p>
        <ul className="space-y-1.5 mb-3">
          ${['Full lateral jobs portal with on-platform workflow', 'Glassdoor-style reviews from verified employees', 'Enterprise recruiter tools (ATS, bulk scheduling)', 'Target: 500K+ profiles, 1,000+ recruiters'].map(f => html`
            <li key=${f} className="text-slate-600 text-xs flex items-start gap-2"><${Check} color="amber" />${f}</li>
          `)}
        </ul>
        <div className="bg-amber-50 rounded-lg p-2.5"><p className="text-amber-700 text-[11px] font-semibold text-center">Full monetization: all streams active</p></div>
      </div>
    </div>
  </div>
`;

/* ─── 10. BUSINESS MODEL ─── */
export const BusinessModelSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Business Model" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">Five Revenue Streams. Better Unit Economics.</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>Every layer of the platform monetizes. Unlike incumbents, we charge for real outcomes — verified shortlists, not empty "visibility."</p>

    <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-5">
      ${[
        { stream: 'Recruiter SaaS', who: 'Companies', price: 'Per-seat subscription', desc: 'Shortlist access, scheduling, analytics, on-platform interviews', color: 'indigo' },
        { stream: 'Job Posting', who: 'Recruiters', price: 'Per-listing or unlimited', desc: 'Verified, structured listings — no ghost jobs, no scams', color: 'blue' },
        { stream: 'Premium Tools', who: 'Job Seekers', price: 'Freemium', desc: 'AI prep, priority visibility, advanced career insights. Basic tools free forever.', color: 'emerald' },
        { stream: 'Profile Access', who: 'Recruiters', price: 'Pay-per-unlock', desc: 'Contact info gated behind shortlisting. Real value exchange.', color: 'amber' },
        { stream: 'Enterprise ATS', who: 'Large Cos', price: 'Annual contract', desc: 'Full ATS integration, bulk scheduling, compliance, dedicated support.', color: 'purple' },
      ].map(s => html`
        <div key=${s.stream} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col">
          <div className=${'w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-' + s.color + '-100'}>
            <span className=${'text-' + s.color + '-600 font-bold text-xs'}>$${'$'}</span>
          </div>
          <h4 className="text-slate-800 font-bold text-sm mb-0.5">${s.stream}</h4>
          <p className=${'text-[10px] font-semibold mb-1.5 text-' + s.color + '-600'}>${s.price}</p>
          <p className="text-slate-500 text-[11px] leading-relaxed flex-1">${s.desc}</p>
          <p className="text-slate-400 text-[9px] mt-2 font-medium">${s.who} pay</p>
        </div>
      `)}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      ${[
        { vs: 'vs Naukri', insight: 'Naukri charges for "visibility" that delivers zero results. We charge for verified shortlists with structured data and real signal.' },
        { vs: 'vs LinkedIn', insight: 'LinkedIn monetizes recruiter seat licenses. We monetize the entire workflow — from discovery to interview to hire.' },
        { vs: 'vs Indeed', insight: 'Indeed is a pure aggregator. We gate contact info and control the process end-to-end. Pay for outcomes, not noise.' },
      ].map(c => html`
        <div key=${c.vs} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <p className="text-slate-800 font-bold text-xs mb-1">${c.vs}</p>
          <p className="text-slate-500 text-[11px] leading-relaxed">${c.insight}</p>
        </div>
      `)}
    </div>
  </div>
`;

/* ─── 11. MARKET OPPORTUNITY ─── */
export const MarketSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Market Size" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">A Market Already Paying Billions</h2>
    <p className="text-slate-500 text-base mb-6 max-w-2xl" style=${{ textWrap: 'balance' }}>We're not in the $89M recruitment software box. We're building the professional identity layer that recruitment runs on — like LinkedIn for jobs, but verified and workflow-native.</p>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
        <h3 className="text-indigo-700 font-bold text-sm mb-2">TAM</h3>
        <p className="text-indigo-600 font-bold text-2xl mb-1">$20B+</p>
        <p className="text-slate-500 text-xs leading-relaxed">India recruitment + professional identity (staffing, job boards, ATS, networks) — addressable over 5–10 years. $18B (2022) → $48.5B (2030) staffing alone.</p>
      </div>
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <h3 className="text-emerald-700 font-bold text-sm mb-2">SAM</h3>
        <p className="text-emerald-600 font-bold text-2xl mb-1">$2–5B</p>
        <p className="text-slate-500 text-xs leading-relaxed">Recruitment SaaS + verified profile marketplace + premium tools + enterprise ATS. Professional identity + recruitment subsumes job boards and staffing tech.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <h3 className="text-amber-700 font-bold text-sm mb-2">SOM (Year 3–5)</h3>
        <p className="text-amber-600 font-bold text-2xl mb-1">$50–100M</p>
        <p className="text-slate-500 text-xs leading-relaxed">1–2% of SAM with university wedge + lateral expansion. Naukri proves $340M from a broken product; we capture with a better one.</p>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-slate-800 font-bold text-sm mb-1">167M LinkedIn users in India</h4>
        <p className="text-slate-500 text-xs leading-relaxed">India is LinkedIn's fastest-growing and 2nd-largest market. Proves massive demand for professional identity — but LinkedIn isn't solving recruitment.</p>
      </div>
      <div className="bg-white border-2 border-indigo-200 rounded-xl p-4 shadow-sm">
        <h4 className="text-indigo-700 font-bold text-sm mb-1">Proven willingness to pay</h4>
        <p className="text-slate-600 text-xs leading-relaxed">Info Edge (Naukri) $340M/year. LinkedIn $16.4B globally. The market pays. We deliver verified profiles, AI tools, and on-platform workflow they can't.</p>
      </div>
    </div>
  </div>
`;

/* ─── 12. COMPETITIVE LANDSCAPE ─── */
export const CompetitiveLandscapeSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-4 sm:px-6 md:px-8 py-6 overflow-auto">
    <${LightLabel} text="Competitive Landscape" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-3 tracking-tight">We Replace the Category</h2>
    <p className="text-slate-500 text-base mb-3 max-w-2xl">Ithras: One profile, one network, one workflow. Verified. Incumbents: Fragmented, unverified, post-and-pray.</p>

    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-4">
      <div className="grid grid-cols-6 text-center text-xs font-bold border-b border-slate-100">
        <div className="p-2.5 text-left text-slate-500">Capability</div>
        <div className="p-2.5 text-indigo-600 bg-indigo-50">Ithras</div>
        <div className="p-2.5 text-slate-600">Naukri</div>
        <div className="p-2.5 text-slate-600">LinkedIn</div>
        <div className="p-2.5 text-slate-600">Indeed</div>
        <div className="p-2.5 text-slate-600">IIMJobs</div>
      </div>
      ${[
        { cap: 'Profile as recruitment hub (not social)', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'One-Stop Recruitment Platform', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Verified Profiles', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Trust Score (connection-backed)', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Scheduling + calendar + interviews on-platform', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Data flow control (no spill to email/external)', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Engagement-Driven Updates', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'AI Career Tools', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Contact Gating', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: false },
        { cap: 'Institutional Trust Layer', ithras: true, naukri: false, linkedin: false, indeed: false, iimjobs: 'partial' },
        { cap: 'Job Posting', ithras: true, naukri: true, linkedin: true, indeed: true, iimjobs: true },
        { cap: 'Recruiter ATS / Workflow', ithras: true, naukri: false, linkedin: true, indeed: false, iimjobs: 'partial' },
        { cap: 'Salary Benchmarking', ithras: true, naukri: false, linkedin: true, indeed: false, iimjobs: true },
        { cap: 'Built for recruitment', ithras: true, naukri: true, linkedin: false, indeed: false, iimjobs: true },
      ].map((r, i) => html`
        <div key=${r.cap} className=${'grid grid-cols-6 text-center text-xs ' + (i % 2 === 0 ? 'bg-slate-50/50' : '')}>
          <div className="p-2 text-left text-slate-700 font-medium">${r.cap}</div>
          <div className="p-2 bg-indigo-50/50">${r.ithras ? html`<span className="text-emerald-500 font-bold">Yes</span>` : html`<span className="text-slate-300">—</span>`}</div>
          <div className="p-2">${r.naukri ? html`<span className="text-emerald-500 font-bold">Yes</span>` : html`<span className="text-slate-300">—</span>`}</div>
          <div className="p-2">${r.linkedin ? html`<span className="text-emerald-500 font-bold">Yes</span>` : html`<span className="text-slate-300">—</span>`}</div>
          <div className="p-2">${r.indeed ? html`<span className="text-emerald-500 font-bold">Yes</span>` : html`<span className="text-slate-300">—</span>`}</div>
          <div className="p-2">${r.iimjobs === true ? html`<span className="text-emerald-500 font-bold">Yes</span>` : r.iimjobs === 'partial' ? html`<span className="text-amber-500 font-bold">Partial</span>` : html`<span className="text-slate-300">—</span>`}</div>
        </div>
      `)}
    </div>

    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
      <p className="text-indigo-800 text-sm font-semibold text-center">LinkedIn has living profiles — but for social, not recruitment. We have profile as recruitment hub: apply, shortlist, schedule, interview, all on one platform. Control the flow; data never spills. IIMJobs has the segment; we have the architecture.</p>
    </div>
  </div>
`;

/* ─── 13. FOUNDERS ─── */
export const FoundersSlide = () => html`
  <div className="flex flex-col justify-center h-full max-w-5xl mx-auto px-6 md:px-10 py-6 overflow-auto">
    <${LightLabel} text="The Team" />
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-slate-800 mb-2 tracking-tight">Built by Insiders. Proven Operators.</h2>
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
                ${f.credentials.map((c, i) => html`<li key=${i} className="text-slate-600 text-[11px] leading-snug">${'\u2022'} ${c}</li>`)}
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
          { title: 'Domain Insiders', desc: 'First-hand placement experience at India\'s top institutions — we ran the process, broke it, and rebuilt it.' },
          { title: 'Institutional Access', desc: 'Direct relationships with placement committees. Spoke with 10+ institutions and 15 years of placement teams.' },
          { title: 'Technical Moat', desc: 'Governance + AI pipeline with structured data architecture — 18+ months to replicate. No competitor has both.' },
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

/* ─── 14. CLOSE ─── */
export const CloseSlide = () => html`
  <div className="flex flex-col items-center justify-center h-full text-center relative px-4 md:px-8 py-6 min-h-0">
    <div className="relative z-10 max-w-3xl w-full overflow-auto flex flex-col items-center">
      <${LightLabel} text="Let's Build Together" />
      <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-slate-800 mb-4 tracking-tight">Let's Build India's Verified<br /><span className="text-indigo-600">Professional Network</span></h2>
      <p className="text-sm md:text-lg text-slate-500 mb-8 max-w-xl mx-auto leading-relaxed">
        The one-stop place for everything recruitment: Digital CV and profile at the centre. One profile. One network. One workflow. We're not fixing recruitment — we're replacing it. India first; then the world.
      </p>
      <div className="w-20 h-0.5 bg-indigo-500/30 rounded-full mx-auto mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-center w-full max-w-lg">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-semibold text-indigo-600 mb-1">AI-First</p>
          <p className="text-slate-500 text-sm">Every layer powered by AI</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-semibold text-emerald-600 mb-1">Verified</p>
          <p className="text-slate-500 text-sm">Trust score + institutional proof</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-2xl font-semibold text-amber-600 mb-1">$2–5B</p>
          <p className="text-slate-500 text-sm">SAM in India alone</p>
        </div>
      </div>
      <div className="flex items-center justify-center gap-6 text-slate-400 text-sm">
        <span>founders@ithras.com</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span>ithraslabs.in</span>
      </div>
    </div>
  </div>
`;
