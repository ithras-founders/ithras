/**
 * Full-page hub: AI prep features (Coming Soon).
 */
import React from 'react';
import htm from 'htm';
import { Mic, ClipboardCheck, FileText, Layers, Sparkles, ArrowRight } from 'lucide-react';

const html = htm.bind(React.createElement);

const FEATURES = [
  {
    title: 'AI-led mock interviews',
    body: 'Practice behavioral and role-specific interviews with adaptive follow-ups, pacing cues, and structured feedback—built for campus hiring and mid-career pivots.',
    icon: Mic,
  },
  {
    title: 'Mock tests for your career',
    body: 'Timed assessments across aptitude, domain knowledge, and case-style prompts so you can benchmark readiness before the real screen.',
    icon: ClipboardCheck,
  },
  {
    title: 'Resume & story studio',
    body: 'Turn experience into tight bullets and narratives aligned to job descriptions, with guardrails for clarity and impact.',
    icon: FileText,
  },
  {
    title: 'Industry question banks',
    body: 'Curated prompts by function—product, finance, consulting, engineering—and by stage, from intern to leadership.',
    icon: Layers,
  },
  {
    title: 'Peer study circles',
    body: 'Optional small groups with shared goals, accountability nudges, and moderated practice sessions.',
    icon: Sparkles,
  },
];

const PreparationHubPage = () => html`
  <div className="pb-16">
    <section className="text-center max-w-3xl mx-auto mb-14 md:mb-20">
      <span
        className="inline-block text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4"
        style=${{ background: 'var(--app-accent-soft)', color: 'var(--app-accent)' }}
      >
        Coming soon
      </span>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4" style=${{ color: 'var(--app-text-primary)' }}>
        Prepare with purpose
      </h1>
      <p className="text-base md:text-lg leading-relaxed" style=${{ color: 'var(--app-text-secondary)' }}>
        Everything in one place to rehearse interviews, stress-test your knowledge, and sharpen how you show up—before you
        step into the room or the video call.
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
      We’re building this surface carefully with real placement and alumni workflows in mind. Want early access? Watch this
      space—or nudge your program admin when pilots open.
    </p>
  </div>
`;

export default PreparationHubPage;
