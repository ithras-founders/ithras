import React, { useState } from 'react';
import htm from 'htm';
import { login } from '../../shared/services/api.js';
import IthrasLogo from '../../shared/components/IthrasLogo.js';
import AlphaBadge from '../../shared/components/AlphaBadge.js';
import { Input, Button } from '../../shared/primitives/index.js';

const html = htm.bind(React.createElement);

const DEMO_CREDENTIALS = [
  { email: 'demo_student@ithras.com', role: 'Student / Candidate', password: 'password' },
  { email: 'demo_recruiter@ithras.com', role: 'Recruiter', password: 'password' },
  { email: 'demo_placement_team@ithras.com', role: 'Placement Team', password: 'password' },
  { email: 'demo_placement_admin@ithras.com', role: 'Placement Admin', password: 'password' },
  { email: 'demo_institution_admin@ithras.com', role: 'Institution Admin', password: 'password' },
  { email: 'demo_faculty@ithras.com', role: 'Faculty Observer', password: 'password' },
  { email: 'demo_professional@ithras.com', role: 'Professional (Lateral)', password: 'password' },
  { email: 'founders@ithras.com', role: 'System Admin', password: 'password' },
];

const Login = ({ onLogin, onGoToRegister, onGoToAboutUs }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemoCreds, setShowDemoCreds] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email.trim().toLowerCase(), password);
      onLogin(user);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen flex bg-[var(--app-bg)] relative">
      ${onGoToAboutUs ? html`
        <a
          href="/about-us"
          onClick=${(e) => { e.preventDefault(); onGoToAboutUs(); }}
          className="absolute top-4 right-4 z-[60] text-sm font-medium text-[var(--app-text-secondary)] hover:text-[var(--app-text-primary)] transition-colors"
        >
          About Us
        </a>
      ` : null}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16" style=${{ background: 'linear-gradient(145deg, #0071e3 0%, #0058b0 50%, #003d7a 100%)' }}>
        ${/* Decorative elements */''}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-[0.08]" style=${{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute bottom-20 -left-16 w-72 h-72 rounded-full opacity-[0.06]" style=${{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 right-12 w-48 h-48 rounded-full opacity-[0.04]" style=${{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

          ${/* Grid pattern overlay */''}
          <div className="absolute inset-0 opacity-[0.03]" style=${{ backgroundImage: 'linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        </div>

        <div className="max-w-md relative z-10 animate-in">
          <div className="flex items-center gap-3 mb-16">
            <${IthrasLogo} size="md" theme="light" />
            <${AlphaBadge} theme="light" />
          </div>

          <h1 className="text-[42px] font-semibold text-white tracking-tight leading-[1.08] mb-5">
            One Platform. All Career Stakeholders.
          </h1>
          <p className="text-white/55 text-[16px] leading-relaxed mb-14 max-w-sm">
            Students, professionals, and recruiters—connected on a single end-to-end professional platform. Build your identity. Grow your network. Find talent.
          </p>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-[var(--app-radius-sm)] bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
              </div>
              <div>
                <p className="text-white/90 text-[14px] font-medium">Students & Professionals</p>
                <p className="text-white/40 text-[13px] mt-0.5">Verified profiles, career discovery, and a network that grows with you</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-[var(--app-radius-sm)] bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-white/90 text-[14px] font-medium">Verified Professional Identity</p>
                <p className="text-white/40 text-[13px] mt-0.5">Structured profiles with verification—trust built in</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-[var(--app-radius-sm)] bg-white/10 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/10">
                <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <p className="text-white/90 text-[14px] font-medium">Recruiters</p>
                <p className="text-white/40 text-[13px] mt-0.5">Find verified talent, manage pipelines, and close hires—all in one place</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16">
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <${IthrasLogo} size="md" theme="dark" />
          <${AlphaBadge} theme="dark" />
        </div>

        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-1 tracking-tight">Sign in</h2>
          <p className="text-[var(--app-text-secondary)] text-[15px] mb-8">Enter your credentials to continue.</p>

          <form onSubmit=${handleSubmit} className="space-y-[var(--app-space-5)]">
            ${error ? html`
              <div className="p-[var(--app-space-3)] bg-[var(--app-danger-soft)] rounded-[var(--app-radius-sm)] text-[var(--app-text-sm)] text-[var(--app-danger)]">
                ${error}
              </div>
            ` : null}
            <${Input}
              id="email"
              type="email"
              label="Email"
              value=${email}
              onChange=${(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              disabled=${loading}
            />
            <${Input}
              id="password"
              type="password"
              label="Password"
              value=${password}
              onChange=${(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              disabled=${loading}
            />
            <${Button} type="submit" variant="primary" disabled=${loading} className="w-full py-3">
              ${loading ? html`
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Signing in...
                </span>
              ` : 'Sign in'}
            <//>
          </form>

          <div className="mt-[var(--app-space-8)] pt-[var(--app-space-6)] border-t border-[var(--app-border-soft)] space-y-[var(--app-space-3)]">
            <button
              type="button"
              onClick=${() => setShowDemoCreds(!showDemoCreds)}
              className="w-full text-left text-[var(--app-text-secondary)] text-sm hover:text-[var(--app-text-primary)] transition-colors"
            >
              ${showDemoCreds ? 'Hide' : 'Show'} demo credentials
            </button>
            ${showDemoCreds ? html`
              <div className="rounded-[var(--app-radius-sm)] bg-[var(--app-bg-soft)] p-3 space-y-2 max-h-48 overflow-y-auto">
                ${DEMO_CREDENTIALS.map((c) => html`
                  <button
                    type="button"
                    key=${c.email}
                    onClick=${() => { setEmail(c.email); setPassword(c.password); setError(''); }}
                    className="w-full text-left text-xs p-2 rounded hover:bg-[var(--app-bg)] transition-colors"
                  >
                    <span className="font-medium text-[var(--app-text-primary)]">${c.role}</span>
                    <br />
                    <span className="text-[var(--app-text-secondary)]">${c.email}</span>
                    <span className="text-[var(--app-text-muted)]"> / ${c.password}</span>
                  </button>
                `)}
              </div>
            ` : null}
            ${onGoToRegister ? html`
              <${Button} variant="ghost" className="w-full" onClick=${onGoToRegister}>
                Create account
              <//>
            ` : null}
          </div>
        </div>
      </div>
    </div>
  `;
};

export default Login;
