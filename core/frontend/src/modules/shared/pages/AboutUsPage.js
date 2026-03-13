/**
 * Ithras About Us — Premium, investor-ready company page.
 * Sections: Hero, Mission, Why Ithras, Platform Pillars, Why Now,
 * Team, Differentiation, Trust Principles, Vision & CTA.
 */
import React from 'react';
import htm from 'htm';
import {
  FileCheck,
  Compass,
  Briefcase,
  Users,
  BarChart2,
  Calendar,
  Shield,
  Target,
  Zap,
  ChevronRight,
  Linkedin,
} from 'lucide-react';
import { PageWrapper, SectionCard } from '../primitives/index.js';
import IthrasLogo from '../components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const FOUNDERS = [
  {
    initials: 'SG',
    name: 'Shashank Gandham',
    role: 'CEO — Tech, Product & Strategy',
    linkedin: 'https://www.linkedin.com/in/shashankgandham/',
    experience: ['Engagement Manager, McKinsey', 'Software Developer, Citi', 'Placement Rep, IIM Calcutta'],
    education: ['IIM Calcutta', 'B.Tech in Computer Science, College of Engineering, Pune'],
  },
  {
    initials: 'AA',
    name: 'Abhishek Achanta',
    role: 'Co-Founder — Product & Technology',
    linkedin: 'https://www.linkedin.com/in/abhishek-achanta/',
    experience: ['Product Manager, MakeMyTrip & Pinnacle', 'B2B Sales, Javis & Pinnacle', 'Placement Rep, IIIT Jabalpur'],
    education: ['IIM Calcutta', 'IIIT Jabalpur'],
  },
  {
    initials: 'MK',
    name: 'Matthew Kallarackal',
    role: 'Co-Founder — Operations & Sales',
    linkedin: 'https://www.linkedin.com/in/matthew-kallarackal-939871124/',
    experience: ['Ex-Founder, Skaut', 'Growth & Revenue, MakeMyTrip', 'M&A, PwC', 'Software Developer, Citi'],
    education: ['IIM Lucknow', 'NIT Surathkal'],
  },
];

const PILLARS = [
  {
    title: 'Verified Professional Identity',
    desc: 'Structured CVs with institution-grade templates and verification. One portable profile that carries trust across placements and lateral hiring.',
    Icon: FileCheck,
  },
  {
    title: 'Career Discovery & Opportunity Matching',
    desc: 'Applications, dashboards, and preparation tools. Candidates find the right opportunities; recruiters reach qualified talent faster.',
    Icon: Compass,
  },
  {
    title: 'Recruitment Operations & Pipelines',
    desc: 'Job management, workflows, shortlists, and approvals—with governance built in. Built for institutional placements and recruiter teams.',
    Icon: Briefcase,
  },
  {
    title: 'Network & Reputation Layer',
    desc: 'Professional feed, connections, and outreach. A reputation layer that grows with verified activity and institutional context.',
    Icon: Users,
  },
  {
    title: 'Scheduling & Workflow Automation',
    desc: 'Calendar, availability, and interview coordination across students, recruiters, and faculty. Days of email replaced by structured workflows.',
    Icon: Calendar,
  },
  {
    title: 'Analytics & Decision Intelligence',
    desc: 'Real-time insights, cycle analytics, and benchmarks. Data that supports placement strategy, recruiter decisions, and institutional reporting.',
    Icon: BarChart2,
  },
];

const TRUST_PRINCIPLES = [
  { label: 'Verification-first', Icon: Shield },
  { label: 'User-owned professional identity', Icon: Target },
  { label: 'Recruiter efficiency', Icon: Briefcase },
  { label: 'Structured data foundations', Icon: BarChart2 },
  { label: 'Privacy and trust', Icon: Shield },
  { label: 'Scalable workflow architecture', Icon: Zap },
];

const SectionLabel = ({ text }) =>
  html`
    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--app-text-muted)] mb-3">
      ${text}
    </p>
  `;

const IconEl = (C, cls) => html`<${C} className=${cls || 'w-5 h-5'} strokeWidth=${1.5} />`;

const FounderCard = ({ initials, name, role, linkedin, experience, education }) => html`
  <div className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-6 shadow-[var(--app-shadow-subtle)] hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-card)] transition-all duration-200">
    <div className="flex items-start gap-4">
      <div className="w-14 h-14 rounded-lg bg-[var(--app-surface-muted)] text-[var(--app-text-muted)] flex items-center justify-center font-semibold text-base shrink-0 border border-[var(--app-border-soft)]">
        ${initials}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-[var(--app-text-primary)]">${name}</h3>
        <p className="text-sm text-[var(--app-text-secondary)] mt-0.5">${role}</p>
        ${linkedin
          ? html`
              <a
                href=${linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-sm text-[var(--app-accent)] hover:underline"
              >
                <${Linkedin} className="w-4 h-4" strokeWidth={1.5} />
                LinkedIn
              </a>
            `
          : null}
      </div>
    </div>
    <div className="mt-5 pt-5 border-t border-[var(--app-border-soft)] space-y-4">
      ${experience?.length
        ? html`
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-1.5">Experience</p>
              <ul className="space-y-1">
                ${experience.map((e, i) =>
                  html`<li key=${i} className="text-sm text-[var(--app-text-secondary)] leading-relaxed">${e}</li>`
                )}
              </ul>
            </div>
          `
        : null}
      ${education?.length
        ? html`
            <div>
              <p className="text-xs font-semibold text-[var(--app-text-muted)] uppercase tracking-wider mb-1.5">Education</p>
              <ul className="space-y-1">
                ${education.map((e, i) =>
                  html`<li key=${i} className="text-sm text-[var(--app-text-secondary)] leading-relaxed">${e}</li>`
                )}
              </ul>
            </div>
          `
        : null}
    </div>
  </div>
`;

const AboutUsPage = () => html`
  <${PageWrapper} className="!space-y-0">
    ${/* 1. Hero */''}
    <section className="relative w-full min-h-[75vh] flex items-center overflow-hidden bg-[var(--app-surface)]">
      <div
        className="absolute inset-0 opacity-[0.02]"
        style=${{ backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}
      />
      <div className="relative w-full max-w-3xl mx-auto px-4 md:px-6 py-20 md:py-28 text-center">
        <${IthrasLogo} size="xl" theme="dark" className="mb-8" />
        <h1 className="text-3xl md:text-4xl font-semibold text-[var(--app-text-primary)] tracking-tight leading-tight mb-4" style=${{ maxWidth: '42ch', margin: '0 auto 1rem' }}>
          Infrastructure for professional identity, hiring, and career intelligence
        </h1>
        <p className="text-lg text-[var(--app-text-secondary)] leading-relaxed mb-2" style=${{ maxWidth: '38rem', margin: '0 auto' }}>
          One platform that unifies verified profiles, recruitment workflows, and talent discovery—for institutions, recruiters, and candidates.
        </p>
        <p className="text-sm text-[var(--app-text-muted)] mb-10">
          Built for the future of verified careers and modern recruitment.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--app-accent)] text-white font-medium rounded-xl hover:bg-[var(--app-accent-hover)] transition-colors"
          >
            Sign in
          </a>
          <a
            href="mailto:hello@ithras.io"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--app-border-strong)] bg-[var(--app-surface)] text-[var(--app-text-primary)] font-medium rounded-xl hover:bg-[var(--app-surface-muted)] transition-colors"
          >
            Contact us
            <${ChevronRight} className="w-4 h-4" strokeWidth={2} />
          </a>
        </div>
      </div>
    </section>

    ${/* 2. Mission */''}
    <section className="py-16 md:py-24 bg-[var(--app-bg)]">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="Mission" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-4">
          Our mission
        </h2>
        <p className="text-base md:text-lg text-[var(--app-text-secondary)] leading-relaxed mb-6" style=${{ maxWidth: '65ch' }}>
          Ithras exists to build the trusted infrastructure layer for careers and hiring. We unify professional identity, opportunity matching, and recruitment operations so that candidates, institutions, and employers operate on a single, verified system of record.
        </p>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed" style=${{ maxWidth: '65ch' }}>
          The long-term vision: a professional graph where identity is portable, verification is built-in, and opportunity flows through structured workflows—replacing fragmented resumes, scattered tools, and broken signal.
        </p>
      </div>
    </section>

    ${/* 3. Why Ithras Exists */''}
    <section className="py-16 md:py-24 bg-[var(--app-surface)] border-t border-[var(--app-border-soft)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="Why we exist" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-6">
          The market is fragmented
        </h2>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed mb-8" style=${{ maxWidth: '60ch' }}>
          Today, professional identity is scattered across PDFs, templates, and unverified claims. Hiring runs on spreadsheets, email, and tools that don’t connect. Candidates and employers lack a shared source of truth.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${[
            'Fragmented resumes with weak verification',
            'Inefficient hiring workflows and manual coordination',
            'Poor candidate–employer signal and discovery',
            'Broken career visibility outside institutional silos',
          ].map(
            (item, i) =>
              html`
                <div
                  key=${i}
                  className="rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)] p-4 md:p-5"
                >
                  <p className="text-sm font-medium text-[var(--app-text-primary)]">${item}</p>
                </div>
              `
          )}
        </div>
        <p className="mt-6 text-base text-[var(--app-text-secondary)] leading-relaxed" style=${{ maxWidth: '60ch' }}>
          Unified infrastructure—one identity, one workflow, one source of truth—changes how talent and opportunity connect.
        </p>
      </div>
    </section>

    ${/* 4. Platform Pillars */''}
    <section className="py-16 md:py-24 bg-[var(--app-bg)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="What we build" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-4">
          Platform pillars
        </h2>
        <p className="text-base text-[var(--app-text-secondary)] mb-10 leading-relaxed" style=${{ maxWidth: '55ch' }}>
          Six pillars that form the foundation of Ithras—designed for institutional placement, recruiter operations, and candidate outcomes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          ${PILLARS.map(
            (p, i) =>
              html`
                <div
                  key=${p.title}
                  className="rounded-xl border border-[var(--app-border-soft)] p-6 bg-[var(--app-surface)] hover:border-[var(--app-border-strong)] hover:shadow-[var(--app-shadow-card)] transition-all duration-200"
                >
                  <div className="w-11 h-11 rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center mb-4">
                    ${IconEl(p.Icon, 'w-5 h-5')}
                  </div>
                  <h3 className="text-base font-semibold text-[var(--app-text-primary)] mb-2">${p.title}</h3>
                  <p className="text-sm text-[var(--app-text-secondary)] leading-relaxed">${p.desc}</p>
                </div>
              `
          )}
        </div>
      </div>
    </section>

    ${/* 5. Why Now */''}
    <section className="py-16 md:py-24 bg-[var(--app-surface)] border-t border-[var(--app-border-soft)]">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="Why now" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-6">
          The timing is right
        </h2>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed mb-4" style=${{ maxWidth: '65ch' }}>
          AI and structured data are raising the bar for verification and employability signal. Recruiting efficiency matters more as hiring scales. Employers and institutions need trust at the edges—verified profiles, clear workflows, and decision-ready analytics.
        </p>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed" style=${{ maxWidth: '65ch' }}>
          The talent ecosystem is ready for a unified layer that reduces fragmentation and improves outcomes—for candidates, recruiters, and institutions.
        </p>
      </div>
    </section>

    ${/* 6. Team / Founder Credibility */''}
    <section className="py-16 md:py-24 bg-[var(--app-bg)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="Team" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-4">
          Leadership
        </h2>
        <p className="text-base text-[var(--app-text-secondary)] mb-10 leading-relaxed" style=${{ maxWidth: '60ch' }}>
          Operators from McKinsey, MakeMyTrip, Citi, and PwC—with placement experience at IIM Calcutta, IIIT Jabalpur, and IIM Lucknow. This team combines product execution, institutional understanding, and recruitment domain expertise.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          ${FOUNDERS.map((f) =>
            html`
              <${FounderCard}
                initials=${f.initials}
                name=${f.name}
                role=${f.role}
                linkedin=${f.linkedin}
                experience=${f.experience}
                education=${f.education}
              />
            `
          )}
        </div>
      </div>
    </section>

    ${/* 7. Differentiation */''}
    <section className="py-16 md:py-24 bg-[var(--app-surface)] border-t border-[var(--app-border-soft)]">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="Differentiation" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-6">
          Why Ithras is different
        </h2>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed mb-4" style=${{ maxWidth: '65ch' }}>
          Most solutions tackle one piece: resumes, job boards, or scheduling. Identity lives in one system; opportunities in another; workflows somewhere else.
        </p>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed" style=${{ maxWidth: '65ch' }}>
          Ithras combines identity, opportunity, workflow, and intelligence in one platform. One profile. One system of record. Built for institutional governance and recruiter efficiency from the start.
        </p>
      </div>
    </section>

    ${/* 8. Trust Principles */''}
    <section className="py-16 md:py-24 bg-[var(--app-bg)]">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <${SectionLabel} text="Product principles" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-8">
          How we build
        </h2>
        <div className="flex flex-wrap gap-4">
          ${TRUST_PRINCIPLES.map(
            (p, i) =>
              html`
                <div
                  key=${i}
                  className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-[var(--app-border-soft)] bg-[var(--app-surface)]"
                >
                  <div className="w-8 h-8 rounded-lg bg-[var(--app-accent-soft)] text-[var(--app-accent)] flex items-center justify-center shrink-0">
                    ${IconEl(p.Icon, 'w-4 h-4')}
                  </div>
                  <span className="text-sm font-medium text-[var(--app-text-primary)]">${p.label}</span>
                </div>
              `
          )}
        </div>
      </div>
    </section>

    ${/* 9. Vision & CTA */''}
    <section className="py-16 md:py-24 bg-[var(--app-surface)] border-t border-[var(--app-border-soft)]">
      <div className="max-w-2xl mx-auto px-4 md:px-6 text-center">
        <${SectionLabel} text="Vision" />
        <h2 className="text-2xl md:text-3xl font-semibold text-[var(--app-text-primary)] tracking-tight mb-4">
          The trusted professional graph
        </h2>
        <p className="text-base text-[var(--app-text-secondary)] leading-relaxed mb-8" style=${{ maxWidth: '55ch', marginLeft: 'auto', marginRight: 'auto' }}>
          We are building toward the infrastructure layer for careers and hiring—where identity is verified, opportunity is discoverable, and workflows scale. For partners, early adopters, and investors: we are ready to show the product and discuss the roadmap.
        </p>
        <a
          href="mailto:hello@ithras.io"
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--app-accent)] text-white font-medium rounded-xl hover:bg-[var(--app-accent-hover)] transition-colors"
        >
          Get in touch
          <${ChevronRight} className="w-4 h-4" strokeWidth={2} />
        </a>
      </div>
    </section>
  <//>
`;

export default AboutUsPage;
