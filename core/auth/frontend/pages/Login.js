import React, { useState } from 'react';
import htm from 'htm';
import { login } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
import { Input } from '/shared/primitives/index.js';

const html = htm.bind(React.createElement);

const BLUE_PANEL = '#0C6DFD';
const ACCENT_GOLD = '#FFD700';

const Login = ({ onLogin, onShowRegister }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          <div className="mb-12">
            <${IthrasLogo} size="lg" theme="light" />
          </div>
          <p
            className="text-[10px] md:text-xs font-semibold tracking-[0.12em] uppercase leading-relaxed mb-6"
            style=${{ color: ACCENT_GOLD }}
          >
            Intelligent Talent Hiring & Recruitment Automation System
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-[1.15]">
            Infrastructure for trusted professional networks
          </h1>
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
