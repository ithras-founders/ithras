import React, { useState } from 'react';
import htm from 'htm';
import { register } from '/shared/services/index.js';
import IthrasLogo from '/shared/components/IthrasLogo.js';
import { Input } from '/shared/primitives/index.js';
import { AUTH_HERO_PANEL_STYLE, AUTH_HERO_COLUMN_CLASS } from '/shared/styles/authHeroPanel.js';

const html = htm.bind(React.createElement);

const ACCENT_GOLD = '#FFD700';

const Register = ({ onRegister, onShowLogin }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim() || !email.trim() || !username.trim() || !password || !dateOfBirth) {
      setError('Please fill in all fields.');
      return;
    }
    const normalizedUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(normalizedUsername)) {
      setError('Username must be lowercase letters and numbers only, no spaces.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);
    try {
      const res = await register({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        username: normalizedUsername,
        password,
        date_of_birth: dateOfBirth,
      });
      onRegister(res);
    } catch (err) {
      const detail = err.serverDetail;
      const msg = typeof detail === 'string' ? detail : detail?.message || err.message || 'Registration failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div className="min-h-screen flex bg-[var(--app-bg)]">
      <div className=${AUTH_HERO_COLUMN_CLASS} style=${AUTH_HERO_PANEL_STYLE}>
        <div className="max-w-md text-center relative z-[1]">
          <div className="mb-12">
            <${IthrasLogo} size="lg" theme="light" />
          </div>
          <p
            className="text-[10px] md:text-xs font-semibold tracking-[0.12em] uppercase leading-relaxed mb-6"
            style=${{ color: ACCENT_GOLD }}
          >
            Intelligent Talent Hiring & Recruitment Automation System
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-[1.15]" style=${{ fontFamily: 'var(--font-display)' }}>
            Join the trusted professional network
          </h1>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-[var(--app-surface)] overflow-y-auto custom-scrollbar border-l border-[var(--app-border-soft)]">
        <div className="lg:hidden flex items-center gap-3 mb-8">
          <${IthrasLogo} size="md" theme="dark" />
        </div>

        <div className="max-w-sm w-full mx-auto">
          <h2 className="text-2xl font-semibold text-[var(--app-text-primary)] mb-1 tracking-tight">Create account</h2>
          <p className="text-[var(--app-text-secondary)] text-[15px] mb-8">Enter your details to get started.</p>

          <form onSubmit=${handleSubmit} className="space-y-4">
            ${error ? html`
              <div className="p-3 bg-red-50 rounded-lg text-sm text-red-600 border border-red-100">
                ${error}
              </div>
            ` : null}
            <${Input}
              id="fullName"
              type="text"
              label="Full name"
              value=${fullName}
              onChange=${(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              autoComplete="name"
              disabled=${loading}
            />
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
              id="username"
              type="text"
              label="Username"
              value=${username}
              onChange=${(e) => setUsername(e.target.value)}
              placeholder="johndoe (letters and numbers only)"
              autoComplete="username"
              disabled=${loading}
            />
            <${Input}
              id="password"
              type="password"
              label="Password"
              value=${password}
              onChange=${(e) => setPassword(e.target.value)}
              placeholder="•••••••• (min 8 characters)"
              autoComplete="new-password"
              disabled=${loading}
            />
            <${Input}
              id="dateOfBirth"
              type="date"
              label="Date of birth"
              value=${dateOfBirth}
              onChange=${(e) => setDateOfBirth(e.target.value)}
              disabled=${loading}
            />
            <button
              type="submit"
              disabled=${loading}
              className="w-full py-3 px-6 rounded-xl font-semibold text-white text-[15px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style=${{ background: 'var(--app-accent)', boxShadow: 'var(--app-shadow-primary)' }}
            >
              ${loading ? 'Creating account...' : 'Create account'}
            </button>
            ${onShowLogin ? html`
              <p className="text-center text-[15px] text-gray-600">
                Already have an account?
                <button
                  type="button"
                  onClick=${onShowLogin}
                  className="ml-1 font-medium text-[var(--app-accent)] hover:underline"
                >
                  Sign in
                </button>
              </p>
            ` : null}
          </form>
        </div>
      </div>
    </div>
  `;
};

export default Register;
