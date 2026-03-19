import React, { useState } from 'react';
import htm from 'htm';
import { login } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
import { Input } from '/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const BLUE_PANEL = '#0C6DFD';

const CommunityIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="9" cy="7" r="4"/>
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    <path d="M21 21v-2a4 4 0 0 0-3-3.85"/>
  </svg>
`;

const CvIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="3"/>
    <circle cx="9" cy="9" r="2"/>
    <path d="M15 8h2M15 12h2M7 16h10"/>
  </svg>
`;

const PrepIcon = () => html`
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4"/>
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
  </svg>
`;

const FEATURES = [
  {
    Icon: CommunityIcon,
    label: 'Community',
    sub: 'Connect with peers & professionals',
  },
  {
    Icon: CvIcon,
    label: 'Digital CV',
    sub: 'Your living career profile',
  },
  {
    Icon: PrepIcon,
    label: 'Preparation',
    sub: 'Practice, prep, and placement-ready',
  },
];

const Login = ({ onLogin, onShowRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [alphaHovered, setAlphaHovered] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!identifier.trim() || !password) {
      setError('Please enter your username or email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await login(identifier.trim(), password);
      onLogin(res);
    } catch (err) {
      setError(err.serverDetail || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAbout = (e) => {
    e.preventDefault();
    window.history.pushState(null, '', '/about');
    window.dispatchEvent(new CustomEvent('ithras:path-changed'));
  };

  return html`
    <div className="min-h-screen flex bg-[var(--app-bg)]" style=${{ position: 'relative' }}>
      <a
        href="/about"
        onClick=${handleAbout}
        style=${{
          position: 'absolute',
          top: '18px',
          right: '24px',
          zIndex: 10,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '6px 14px',
          borderRadius: '8px',
          background: 'rgba(12,109,253,0.08)',
          color: '#0C6DFD',
          fontSize: '13px',
          fontWeight: 600,
          textDecoration: 'none',
          border: '1px solid rgba(12,109,253,0.18)',
          transition: 'background 160ms',
        }}
        onMouseEnter=${(e) => { e.currentTarget.style.background = 'rgba(12,109,253,0.14)'; }}
        onMouseLeave=${(e) => { e.currentTarget.style.background = 'rgba(12,109,253,0.08)'; }}
      >
        About Us
      </a>

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center p-16" style=${{ background: BLUE_PANEL }}>
        <div className="max-w-md text-center">

          <div className="mb-10 inline-flex items-center gap-3">
            <${IthrasLogo} size="lg" theme="light" />
            <div
              className="relative"
              style=${{ alignSelf: 'flex-end', marginBottom: '4px' }}
              onMouseEnter=${() => setAlphaHovered(true)}
              onMouseLeave=${() => setAlphaHovered(false)}
            >
              <span
                style=${{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'default',
                  userSelect: 'none',
                }}
              >
                α alpha
              </span>
              <div
                style=${{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(0,0,0,0.82)',
                  color: '#fff',
                  fontSize: '12px',
                  fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  opacity: alphaHovered ? 1 : 0,
                  transition: 'opacity 160ms ease',
                  zIndex: 20,
                }}
              >
                Early access · For internal use only
                <div style=${{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgba(0,0,0,0.82)',
                }} />
              </div>
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-[1.15] mb-10">
            Infrastructure for trusted professional networks
          </h1>

          <div className="flex items-stretch gap-px rounded-2xl overflow-hidden" style=${{ background: 'rgba(255,255,255,0.08)' }}>
            ${FEATURES.map(({ Icon, label, sub }, i) => html`
              <div
                key=${label}
                className="flex-1 flex flex-col items-center gap-2 px-4 py-5"
                style=${{
                  borderRight: i < FEATURES.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                }}
              >
                <span style=${{ color: 'rgba(255,255,255,0.75)' }}>
                  <${Icon} />
                </span>
                <span style=${{ color: '#fff', fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>
                  ${label}
                </span>
                <span style=${{ color: 'rgba(255,255,255,0.55)', fontSize: '11px', lineHeight: '1.4', textAlign: 'center' }}>
                  ${sub}
                </span>
              </div>
            `)}
          </div>

        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-white">
        <div className="lg:hidden flex items-center gap-3 mb-12">
          <${IthrasLogo} size="md" theme="dark" />
        </div>

        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">Sign in</h2>
          <p className="text-gray-600 text-[15px] mb-8">Enter your username or email and password.</p>

          <form onSubmit=${handleSubmit} className="space-y-5">
            ${error ? html`
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600 border border-red-100">
                ${error}
              </div>
            ` : null}
            <${Input}
              id="identifier"
              type="text"
              label="Username or email"
              value=${identifier}
              onChange=${(e) => setIdentifier(e.target.value)}
              placeholder="username or you@example.com"
              autoComplete="username"
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
            <button
              type="submit"
              disabled=${loading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg bg-[#0C6DFD] hover:bg-[#0A5AD4] active:bg-[#0849B0]"
            >
              ${loading ? 'Signing in...' : 'Sign in'}
            </button>
            ${onShowRegister ? html`
              <p className="text-center text-[15px] text-gray-600">
                Don't have an account?
                <button
                  type="button"
                  onClick=${onShowRegister}
                  className="ml-1 font-medium text-[#0C6DFD] hover:underline"
                >
                  Sign up
                </button>
              </p>
            ` : null}
          </form>
        </div>
      </div>
    </div>
  `;
};

export default Login;
