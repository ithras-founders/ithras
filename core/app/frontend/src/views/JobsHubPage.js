/**
 * Full-page hub: Jobs product (Coming Soon) — matches Prepare hub visuals.
 */
import React from 'react';
import htm from 'htm';
import { Briefcase, ShieldCheck, Bell, Users, Sparkles, ArrowRight } from 'lucide-react';

const html = htm.bind(React.createElement);

const FEATURES = [
  {
    title: 'Verified, cohort-aware listings',
    body: 'Roles surfaced with context from your program, institution, and network—so you spend time on opportunities that actually fit your stage and goals.',
    icon: ShieldCheck,
  },
  {
    title: 'Smart saved searches',
    body: 'Define filters once and get nudges when new matches land, without drowning in noise from generic job boards.',
    icon: Bell,
  },
  {
    title: 'Application pipeline',
    body: 'A lightweight view of where you applied, what’s in progress, and what needs a follow-up—built for busy semesters and job hunts.',
    icon: Briefcase,
  },
  {
    title: 'Warm paths through your network',
    body: 'See who you’re already connected to at target companies so introductions feel natural, not cold.',
    icon: Users,
  },
  {
    title: 'Program & alumni workflows',
    body: 'Tools shaped for placement teams and returning alumni—shared norms, fewer duplicate spreadsheets, clearer handoffs.',
    icon: Sparkles,
  },
];

const JobsHubPage = () => html`
  <div className="pb-16">
    <section className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
      <span
        className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4"
        style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
      >
        Coming soon
      </span>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style=${{ color: 'var(--app-text-primary)' }}>
        Jobs that fit how you move
      </h1>
      <p className="text-base md:text-lg leading-relaxed" style=${{ color: 'var(--app-text-secondary)' }}>
        Verified, cohort-aware job discovery is on the way—so you can explore roles with the same trust and context you get
        everywhere else on Ithras.
      </p>
    </section>

    <div className="grid sm:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto">
      ${FEATURES.map(
        (f) => html`
          <article
            key=${f.title}
            className="rounded-2xl border p-6 md:p-7 text-left relative overflow-hidden group transition-shadow hover:shadow-lg"
            style=${{ borderColor: 'var(--app-border-soft)', background: 'var(--app-surface)' }}
          >
            <div
              className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-[0.07] pointer-events-none -translate-y-1/2 translate-x-1/2"
              style=${{ background: 'var(--app-accent)' }}
            />
            <div
              className="inline-flex items-center justify-center w-11 h-11 rounded-xl mb-4"
              style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
            >
              <${f.icon} size=${22} strokeWidth=${2} />
            </div>
            <h2 className="text-lg font-semibold mb-2 pr-16" style=${{ color: 'var(--app-text-primary)' }}>${f.title}</h2>
            <p className="text-sm leading-relaxed mb-5" style=${{ color: 'var(--app-text-secondary)' }}>${f.body}</p>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style=${{ color: 'var(--app-text-muted)' }}>
              <span>Coming soon</span>
              <${ArrowRight} size=${14} className="opacity-60" aria-hidden="true" />
            </div>
          </article>
        `,
      )}
    </div>

    <p className="text-center text-sm mt-12 max-w-xl mx-auto" style=${{ color: 'var(--app-text-muted)' }}>
      We’re building Jobs alongside placement partners and alumni programs. Check back soon—or keep networking in the meantime
      from your feed and network tabs.
    </p>
  </div>
`;

export default JobsHubPage;
