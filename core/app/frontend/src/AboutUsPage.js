/**
 * AboutUsPage — /about
 * Public page. No auth required.
 * Features of the Ithras platform + founders.
 */
import React from 'react';
import htm from 'htm';
import IthrasLogo from '/shared/components/IthrasLogo.js';

const html = htm.bind(React.createElement);

const navigate = (path) => {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new CustomEvent('ithras:path-changed'));
};

/* ── tiny icon helpers (inline SVGs, no extra deps) ───────────────── */
const ShieldIcon = () => html`
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
`;
const UsersIcon = () => html`
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
`;
const BookOpenIcon = () => html`
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
`;
const BotIcon = () => html`
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2"/>
    <circle cx="12" cy="5" r="2"/>
    <path d="M12 7v4"/>
    <line x1="8" y1="16" x2="8" y2="16"/>
    <line x1="16" y1="16" x2="16" y2="16"/>
  </svg>
`;
const StarIcon = () => html`
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
`;
const NetworkIcon = () => html`
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="2"/>
    <circle cx="5" cy="19" r="2"/>
    <circle cx="19" cy="19" r="2"/>
    <line x1="12" y1="7" x2="5" y2="17"/>
    <line x1="12" y1="7" x2="19" y2="17"/>
    <line x1="5" y1="19" x2="19" y2="19"/>
  </svg>
`;

/* ── Feature card data ────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: ShieldIcon,
    color: '#0071e3',
    bg: 'rgba(0,113,227,0.08)',
    title: 'Verified Professional Identity',
    description:
      'Strict institutional email verification (.edu, .com) creates the base layer of trust. Every profile is anchored to a real institution — no fake accounts, no anonymous noise.',
  },
  {
    icon: NetworkIcon,
    color: '#5e5ce6',
    bg: 'rgba(94,92,230,0.08)',
    title: 'Cohort-Based Discovery',
    description:
      'Target exact talent through verified intersections of alumni cohorts, institution tiers, and work history. Jobs are visible only to the specific verified cohort that matches — zero spray-and-pray.',
  },
  {
    icon: UsersIcon,
    color: '#34c759',
    bg: 'rgba(52,199,89,0.08)',
    title: 'Trusted Community Infrastructure',
    description:
      'Institution-based structured channels replace noisy WhatsApp groups. Alumni networks, batchmate groups, and industry cohorts live on a single verified platform with real data.',
  },
  {
    icon: BookOpenIcon,
    color: '#ff9f0a',
    bg: 'rgba(255,159,10,0.08)',
    title: 'Candidate Prep Suite',
    description:
      'Role-specific interview prep, standardised skill assessments, peer mock interviews with feedback rubrics, platform-hosted case competitions, and mentorship from alumni — all generating verifiable proof-of-work.',
  },
  {
    icon: BotIcon,
    color: '#ff375f',
    bg: 'rgba(255,55,95,0.08)',
    title: 'AI Recruitment OS',
    description:
      'Credential-aware smart matching filters by verified cohort and composite Trust Score. Automated screening validates proof-of-work against job requirements — saving recruiters 20+ hours per role.',
  },
  {
    icon: StarIcon,
    color: '#5ac8fa',
    bg: 'rgba(90,200,250,0.08)',
    title: 'Composite Trust Score',
    description:
      'A dynamic, evolving metric that aggregates identity verification, peer endorsements, activity consistency, and profile completeness into a single high-signal number that recruiters can act on instantly.',
  },
];

/* ── Founder data (update with real details) ─────────────────────── */
const FOUNDERS = [
  {
    initials: 'FK',
    name: 'Founder Name',
    role: 'Chief Executive Officer & Co-Founder',
    bio: 'Visionary behind the Ithras platform. Drives strategy, product direction, and institutional partnerships that power the verified professional graph.',
    accent: '#0071e3',
  },
  {
    initials: 'CF',
    name: 'Co-Founder Name',
    role: 'Chief Technology Officer & Co-Founder',
    bio: 'Architect of the trust infrastructure and AI recruitment engine. Leads engineering, data systems, and the cohort-based discovery platform.',
    accent: '#5e5ce6',
  },
];

/* ── Sub-components ───────────────────────────────────────────────── */
const FeatureCard = ({ icon: Icon, color, bg, title, description }) => html`
  <div
    style=${{
      background: 'var(--app-surface)',
      border: '1px solid var(--app-border-soft)',
      borderRadius: '16px',
      padding: '28px 24px',
      boxShadow: 'var(--app-shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'box-shadow 200ms, transform 200ms',
    }}
    onMouseEnter=${(e) => {
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.10)';
      e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave=${(e) => {
      e.currentTarget.style.boxShadow = 'var(--app-shadow-card)';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div
      style=${{
        width: '52px',
        height: '52px',
        borderRadius: '14px',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0,
      }}
    >
      <${Icon} />
    </div>
    <div>
      <h3 style=${{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: 'var(--app-text-primary)', lineHeight: 1.3 }}>
        ${title}
      </h3>
      <p style=${{ margin: 0, fontSize: '14px', color: 'var(--app-text-secondary)', lineHeight: 1.6 }}>
        ${description}
      </p>
    </div>
  </div>
`;

const FounderCard = ({ initials, name, role, bio, accent }) => html`
  <div
    style=${{
      background: 'var(--app-surface)',
      border: '1px solid var(--app-border-soft)',
      borderRadius: '20px',
      padding: '32px 28px',
      boxShadow: 'var(--app-shadow-card)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: '16px',
    }}
  >
    <div
      style=${{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${accent}22, ${accent}44)`,
        border: `2px solid ${accent}33`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '26px',
        fontWeight: 700,
        color: accent,
        letterSpacing: '-0.01em',
      }}
    >
      ${initials}
    </div>
    <div>
      <div style=${{ fontSize: '18px', fontWeight: 700, color: 'var(--app-text-primary)', marginBottom: '4px' }}>
        ${name}
      </div>
      <div style=${{ fontSize: '13px', fontWeight: 500, color: accent, marginBottom: '12px' }}>
        ${role}
      </div>
      <p style=${{ margin: 0, fontSize: '14px', color: 'var(--app-text-secondary)', lineHeight: 1.6 }}>
        ${bio}
      </p>
    </div>
  </div>
`;

/* ── Main page ────────────────────────────────────────────────────── */
const AboutUsPage = ({ user, onLogout }) => {
  const handleNavHome = (e) => {
    e.preventDefault();
    navigate(user ? '/feed' : '/');
  };

  return html`
    <div style=${{ minHeight: '100vh', background: 'var(--app-bg)', fontFamily: 'var(--font-sans)' }}>

      <!-- Minimal top bar -->
      <header style=${{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        background: 'var(--app-surface)',
        borderBottom: '1px solid var(--app-border-soft)',
        boxShadow: 'var(--app-shadow-subtle)',
      }}>
        <a href=${user ? '/feed' : '/'} onClick=${handleNavHome} style=${{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <${IthrasLogo} size="sm" theme="dark" />
        </a>
        <div style=${{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          ${user
            ? html`
                <button
                  onClick=${() => navigate('/feed')}
                  style=${{
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: 'none',
                    background: 'var(--app-accent)',
                    color: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  Go to Feed
                </button>
              `
            : html`
                <button
                  onClick=${() => navigate('/')}
                  style=${{
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: '1px solid var(--app-border-strong)',
                    background: 'transparent',
                    color: 'var(--app-text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  Sign In
                </button>
              `}
        </div>
      </header>

      <!-- Hero -->
      <section style=${{
        padding: '72px 24px 56px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, rgba(0,113,227,0.04) 0%, transparent 100%)',
        borderBottom: '1px solid var(--app-border-soft)',
      }}>
        <div style=${{ maxWidth: '680px', margin: '0 auto' }}>
          <div style=${{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: '999px',
            background: 'rgba(0,113,227,0.08)',
            color: 'var(--app-accent)',
            fontSize: '12px',
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '20px',
          }}>
            About Ithras
          </div>
          <h1 style=${{
            margin: '0 0 16px',
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 700,
            color: 'var(--app-text-primary)',
            lineHeight: 1.2,
            letterSpacing: '-0.03em',
          }}>
            Infrastructure for Trusted Professional Networks
          </h1>
          <p style=${{
            margin: '0 auto',
            fontSize: '17px',
            color: 'var(--app-text-secondary)',
            lineHeight: 1.65,
            maxWidth: '560px',
          }}>
            Ithras is the operating system for verified professional trust — connecting students,
            institutions, and organisations through cohort-based discovery, AI-powered hiring, and
            structured candidate preparation.
          </p>
        </div>
      </section>

      <!-- What We Build -->
      <section style=${{ padding: '64px 24px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style=${{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style=${{
            margin: '0 0 10px',
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 700,
            color: 'var(--app-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Platform Features
          </h2>
          <p style=${{ margin: 0, fontSize: '15px', color: 'var(--app-text-muted)' }}>
            Three integrated layers — verified communities, candidate prep, and AI recruitment.
          </p>
        </div>
        <div style=${{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          ${FEATURES.map((f) => html`<${FeatureCard} key=${f.title} ...${f} />`)}
        </div>
      </section>

      <!-- How It Works (3 layers) -->
      <section style=${{
        padding: '64px 24px',
        background: 'var(--app-surface)',
        borderTop: '1px solid var(--app-border-soft)',
        borderBottom: '1px solid var(--app-border-soft)',
      }}>
        <div style=${{ maxWidth: '880px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style=${{
            margin: '0 0 10px',
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 700,
            color: 'var(--app-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            The Three-Layer OS
          </h2>
          <p style=${{ margin: '0 0 48px', fontSize: '15px', color: 'var(--app-text-muted)' }}>
            From fragmented private groups to a structured professional intelligence platform.
          </p>
          <div style=${{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            ${[
              {
                layer: 'Layer 1',
                title: 'Verified Communities',
                desc: 'Institution-based cohorts and structured channels replace WhatsApp groups. The foundation of trust.',
                color: '#34c759',
              },
              {
                layer: 'Layer 2',
                title: 'Candidate Prep Suite',
                desc: 'Resume optimisation, AI interview prep, skill assessments, and role-specific modules. Increasing candidate signal.',
                color: '#0071e3',
              },
              {
                layer: 'Layer 3',
                title: 'AI Recruitment OS',
                desc: 'Credential-aware screening, cohort targeting, and pipeline analytics. Monetising the trust.',
                color: '#5e5ce6',
              },
            ].map(({ layer, title, desc, color }) => html`
              <div
                key=${layer}
                style=${{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '20px',
                  padding: '24px',
                  borderRadius: '14px',
                  background: 'var(--app-bg)',
                  border: '1px solid var(--app-border-soft)',
                  textAlign: 'left',
                }}
              >
                <div
                  style=${{
                    flexShrink: 0,
                    padding: '5px 12px',
                    borderRadius: '999px',
                    background: `${color}18`,
                    color,
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    whiteSpace: 'nowrap',
                    marginTop: '2px',
                  }}
                >
                  ${layer}
                </div>
                <div>
                  <div style=${{ fontSize: '15px', fontWeight: 600, color: 'var(--app-text-primary)', marginBottom: '4px' }}>
                    ${title}
                  </div>
                  <div style=${{ fontSize: '14px', color: 'var(--app-text-secondary)', lineHeight: 1.6 }}>
                    ${desc}
                  </div>
                </div>
              </div>
            `)}
          </div>
        </div>
      </section>

      <!-- Founders -->
      <section style=${{ padding: '64px 24px', maxWidth: '800px', margin: '0 auto' }}>
        <div style=${{ textAlign: 'center', marginBottom: '48px' }}>
          <h2 style=${{
            margin: '0 0 10px',
            fontSize: 'clamp(22px, 3vw, 30px)',
            fontWeight: 700,
            color: 'var(--app-text-primary)',
            letterSpacing: '-0.02em',
          }}>
            Our Founders
          </h2>
          <p style=${{ margin: 0, fontSize: '15px', color: 'var(--app-text-muted)' }}>
            The team building infrastructure for the next generation of professional trust.
          </p>
        </div>
        <div style=${{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
        }}>
          ${FOUNDERS.map((f) => html`<${FounderCard} key=${f.name} ...${f} />`)}
        </div>
      </section>

      <!-- Footer strip -->
      <footer style=${{
        padding: '28px 24px',
        textAlign: 'center',
        borderTop: '1px solid var(--app-border-soft)',
        background: 'var(--app-surface)',
        fontSize: '13px',
        color: 'var(--app-text-faint)',
      }}>
        © ${new Date().getFullYear()} Ithras · Intelligent Talent Hiring and Recruitment Automation System
      </footer>
    </div>
  `;
};

export default AboutUsPage;
